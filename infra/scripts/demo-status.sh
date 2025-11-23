#!/bin/bash
#
# Check demo instance status
#

INSTANCE_ID="i-0844022e8ea065ce3"
REGION="us-east-1"

echo "📊 Checking instance status..."
echo ""

STATE=$(AWS_PROFILE=tyler aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --query 'Reservations[0].Instances[0].State.Name' \
  --output text)

IP=$(AWS_PROFILE=tyler aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text 2>/dev/null || echo "N/A")

INSTANCE_TYPE=$(AWS_PROFILE=tyler aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --query 'Reservations[0].Instances[0].InstanceType' \
  --output text)

echo "Instance ID:   $INSTANCE_ID"
echo "State:         $STATE"
echo "IP Address:    $IP"
echo "Instance Type: $INSTANCE_TYPE"
echo ""

if [ "$STATE" = "running" ]; then
    echo "💰 Current cost: ~\$0.15/hour"
    echo "🛑 Stop to save: ./scripts/demo-stop.sh"
elif [ "$STATE" = "stopped" ]; then
    echo "💰 Current cost: ~\$2/month (storage only)"
    echo "🚀 Start for demo: ./scripts/demo-start.sh"
else
    echo "⏳ Instance is $STATE"
fi
echo ""
