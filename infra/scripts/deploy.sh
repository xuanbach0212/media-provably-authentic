#!/bin/bash
#
# Quick deploy script for Nautilus infrastructure
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

cd "$INFRA_DIR"

echo "🚀 Deploying Nautilus Nitro Enclave Infrastructure"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not installed. Install from: https://www.terraform.io/downloads"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed. Install from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run: aws configure"
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Check terraform.tfvars
if [ ! -f terraform.tfvars ]; then
    echo "⚠️  terraform.tfvars not found!"
    echo ""
    echo "Creating from example..."
    cp terraform.tfvars.example terraform.tfvars

    echo ""
    echo "📝 Please edit terraform.tfvars and add your SSH public key:"
    echo ""
    echo "  1. Generate SSH key (if you don't have one):"
    echo "     ssh-keygen -t rsa -b 4096 -f ~/.ssh/nautilus-key"
    echo ""
    echo "  2. Copy public key:"
    echo "     cat ~/.ssh/nautilus-key.pub"
    echo ""
    echo "  3. Paste into terraform.tfvars:"
    echo "     ssh_public_key = \"ssh-rsa AAAAB3...\""
    echo ""
    echo "  4. Re-run this script"
    echo ""
    exit 1
fi

# Check if SSH key is configured
if grep -q "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAA" terraform.tfvars; then
    echo "⚠️  Default SSH key detected in terraform.tfvars"
    echo "Please replace with your actual public key"
    exit 1
fi

echo "✅ Configuration OK"
echo ""

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

echo ""
echo "📋 Planning deployment..."
terraform plan -out=tfplan

echo ""
read -p "🚀 Deploy infrastructure? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Apply
echo ""
echo "🚀 Deploying infrastructure..."
terraform apply tfplan

# Clean up plan file
rm -f tfplan

echo ""
echo "✅ Deployment complete!"
echo ""

# Show outputs
echo "📊 Deployment Info:"
terraform output

echo ""
echo "📝 Next steps:"
echo ""
echo "1. Test enclave connection:"
echo "   curl \$(terraform output -raw enclave_api_endpoint)/health"
echo ""
echo "2. SSH into instance:"
echo "   \$(terraform output -raw ssh_command)"
echo ""
echo "3. Update backend .env:"
echo "   terraform output -json env_variables | jq -r 'to_entries[] | \"\\(.key)=\\(.value)\"' >> ../backend/.env"
echo ""
echo "💰 Estimated cost: \$(terraform output -raw estimated_monthly_cost)"
echo ""
