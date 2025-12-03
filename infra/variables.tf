variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1" # Cheapest region
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "hackathon"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "media-auth"
}

variable "instance_type" {
  description = "EC2 instance type for Nitro Enclave"
  type        = string
  default     = "c6a.xlarge" # 4 vCPU, 8GB RAM, cheapest Nitro-enabled
  # Alternatives: c6i.xlarge, c6a.large (smaller but sufficient)
}

variable "use_spot_instance" {
  description = "Use spot instances to save cost (70% discount)"
  type        = bool
  default     = true
}

variable "spot_max_price" {
  description = "Maximum price for spot instances ($/hour)"
  type        = string
  default     = "0.10" # c6a.xlarge on-demand is ~$0.17/hr
}

variable "allocate_elastic_ip" {
  description = "Allocate Elastic IP for stable endpoint"
  type        = bool
  default     = true # Enable for stable endpoint (cost: $3.60/month)
}

variable "enclave_memory_mb" {
  description = "Memory allocated to Nitro Enclave (MB)"
  type        = number
  default     = 6144 # 6GB (leave 2GB for parent instance)
}

variable "enclave_cpu_count" {
  description = "CPU cores allocated to Nitro Enclave"
  type        = number
  default     = 2 # (leave 2 cores for parent instance)
}

variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
  # Generate with: ssh-keygen -t rsa -b 4096 -f ~/.ssh/nautilus-key
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed to SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"] # WARNING: Restrict this in production
}

variable "allowed_api_cidr" {
  description = "CIDR blocks allowed to access enclave API"
  type        = list(string)
  default     = ["0.0.0.0/0"] # WARNING: Restrict this in production
}

variable "enable_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = false # Save cost for hackathon
}

variable "auto_shutdown_enabled" {
  description = "Auto-shutdown instance when not in use (cost saving)"
  type        = bool
  default     = false
}

variable "auto_shutdown_cron" {
  description = "Cron schedule for auto-shutdown (e.g., '0 2 * * *' = 2 AM daily)"
  type        = string
  default     = "0 2 * * *"
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
