/**
 * Nautilus Nitro Enclave Infrastructure
 * Provisions 1 minimal AWS Nitro Enclave for hackathon demo
 * Estimated cost: $25-40/month with spot instances
 */

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "media-provably-authentic"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "nitro_enclave" {
  name        = "${var.project_name}-nitro-enclave-sg"
  description = "Security group for Nautilus Nitro Enclave"
  vpc_id      = aws_vpc.main.id

  # SSH access
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # Nautilus Enclave API (port 3000)
  ingress {
    description = "Nautilus Enclave API"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = var.allowed_api_cidr
  }

  # Legacy API port (if needed)
  ingress {
    description = "Legacy Enclave API"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = var.allowed_api_cidr
  }

  # Health check
  ingress {
    description = "Health check"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = var.allowed_api_cidr
  }

  # Outbound
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-nitro-enclave-sg"
  }
}

# IAM Role for EC2
resource "aws_iam_role" "nitro_enclave" {
  name = "${var.project_name}-nitro-enclave-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-nitro-enclave-role"
  }
}

# IAM Policy for Nitro Enclaves
resource "aws_iam_role_policy" "nitro_enclave" {
  name = "${var.project_name}-nitro-enclave-policy"
  role = aws_iam_role.nitro_enclave.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceAttribute",
          "ec2:DescribeVolumes",
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "arn:aws:s3:::${var.project_name}-enclave-storage/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "nitro_enclave" {
  name = "${var.project_name}-nitro-enclave-profile"
  role = aws_iam_role.nitro_enclave.name
}

# SSH Key Pair
resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-deployer-key"
  public_key = var.ssh_public_key

  tags = {
    Name = "${var.project_name}-deployer-key"
  }
}

# Launch Template for Spot Instances
resource "aws_launch_template" "nitro_enclave" {
  name_prefix   = "${var.project_name}-nitro-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.deployer.key_name

  iam_instance_profile {
    name = aws_iam_instance_profile.nitro_enclave.name
  }

  enclave_options {
    enabled = true
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.nitro_enclave.id]
    delete_on_termination       = true
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  user_data = base64encode(templatefile("${path.module}/scripts/setup-nautilus-proper.sh", {
    enclave_memory_mb = var.enclave_memory_mb
    enclave_cpu_count = var.enclave_cpu_count
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-nitro-enclave"
      Type = "enclave-worker"
    }
  }

  tag_specifications {
    resource_type = "volume"
    tags = {
      Name = "${var.project_name}-nitro-enclave-volume"
    }
  }
}

# EC2 Instance with Spot Market Options
resource "aws_instance" "nitro_enclave" {
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.deployer.key_name
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.nitro_enclave.id]
  iam_instance_profile        = aws_iam_instance_profile.nitro_enclave.name
  associate_public_ip_address = true

  enclave_options {
    enabled = true
  }

  dynamic "instance_market_options" {
    for_each = var.use_spot_instance ? [1] : []
    content {
      market_type = "spot"
      spot_options {
        max_price                      = var.spot_max_price
        spot_instance_type             = "persistent"
        instance_interruption_behavior = "stop"
      }
    }
  }

  user_data = base64encode(templatefile("${path.module}/scripts/setup-nautilus-proper.sh", {
    enclave_memory_mb = var.enclave_memory_mb
    enclave_cpu_count = var.enclave_cpu_count
  }))

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    delete_on_termination = true
    encrypted             = true
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-nitro-enclave${var.use_spot_instance ? "-spot" : ""}"
      Environment = var.environment
      Type        = "enclave-worker"
    }
  )
}

# Elastic IP (optional, for stable endpoint)
resource "aws_eip" "nitro_enclave" {
  count    = var.allocate_elastic_ip ? 1 : 0
  domain   = "vpc"
  instance = aws_instance.nitro_enclave.id

  tags = {
    Name = "${var.project_name}-nitro-enclave-eip"
  }

  depends_on = [aws_internet_gateway.main]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "nitro_enclave" {
  name              = "/aws/ec2/${var.project_name}-nitro-enclave"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-nitro-enclave-logs"
  }
}
