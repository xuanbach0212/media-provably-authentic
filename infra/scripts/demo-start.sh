#!/bin/bash
#
# Start instance for demo
#

set -e

INSTANCE_ID="i-0844022e8ea065ce3"
REGION="us-east-1"

echo "🚀 Starting demo instance..."

# Start instance
AWS_PROFILE=tyler aws ec2 start-instances \
  --instance-ids $INSTANCE_ID \
  --region $REGION

echo "⏳ Waiting for instance to be running..."
AWS_PROFILE=tyler aws ec2 wait instance-running \
  --instance-ids $INSTANCE_ID \
  --region $REGION

echo "⏳ Waiting for instance initialization (60s)..."
sleep 60

# Get new IP
NEW_IP=$(AWS_PROFILE=tyler terraform -chdir="$(dirname "$0")/.." output -raw instance_public_ip)

echo ""
echo "✅ Instance started!"
echo ""
echo "📍 IP Address: $NEW_IP"
echo "🔑 SSH: ssh -i ~/.ssh/nautilus-key ec2-user@$NEW_IP"
echo ""
echo "⚠️  RECOMMENDED: Use mock mode instead"
echo "   cd backend && USE_REAL_NAUTILUS=false npm run dev"
echo ""
echo "💰 Remember to stop after demo:"
echo "   ./scripts/demo-stop.sh"
echo ""
