#!/bin/bash
#
# Stop instance after demo to save money
#

set -e

INSTANCE_ID="i-0844022e8ea065ce3"
REGION="us-east-1"

echo "🛑 Stopping demo instance..."

# Stop instance
AWS_PROFILE=tyler aws ec2 stop-instances \
  --instance-ids $INSTANCE_ID \
  --region $REGION

echo "⏳ Waiting for instance to stop..."
AWS_PROFILE=tyler aws ec2 wait instance-stopped \
  --instance-ids $INSTANCE_ID \
  --region $REGION

echo ""
echo "✅ Instance stopped!"
echo ""
echo "💰 Cost savings:"
echo "   - Running: ~$0.15/hour"
echo "   - Stopped: ~$0.07/day (storage only)"
echo ""
echo "📊 To check status:"
echo "   ./scripts/demo-status.sh"
echo ""
