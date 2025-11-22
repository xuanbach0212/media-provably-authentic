#!/bin/bash
#
# Management script for Nautilus infrastructure
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

cd "$INFRA_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_usage {
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  status    - Show instance status and cost"
    echo "  start     - Start stopped instance"
    echo "  stop      - Stop running instance (save cost)"
    echo "  restart   - Restart instance"
    echo "  ssh       - SSH into instance"
    echo "  logs      - View enclave logs"
    echo "  health    - Check enclave health"
    echo "  cost      - Estimate current month cost"
    echo "  destroy   - Destroy all infrastructure"
    echo ""
}

function get_instance_id {
    terraform output -raw instance_id 2>/dev/null || echo ""
}

function get_instance_ip {
    terraform output -raw instance_public_ip 2>/dev/null || echo ""
}

function get_instance_state {
    INSTANCE_ID=$(get_instance_id)
    if [ -z "$INSTANCE_ID" ]; then
        echo "not_deployed"
        return
    fi

    aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].State.Name' \
        --output text 2>/dev/null || echo "unknown"
}

function cmd_status {
    echo "📊 Nautilus Infrastructure Status"
    echo ""

    INSTANCE_ID=$(get_instance_id)
    if [ -z "$INSTANCE_ID" ]; then
        echo -e "${RED}❌ Not deployed${NC}"
        echo ""
        echo "Run: ./scripts/deploy.sh"
        return 1
    fi

    STATE=$(get_instance_state)
    IP=$(get_instance_ip)

    echo "Instance ID: $INSTANCE_ID"
    echo "Public IP:   $IP"

    case $STATE in
        running)
            echo -e "State:       ${GREEN}●${NC} Running"
            ;;
        stopped)
            echo -e "State:       ${YELLOW}●${NC} Stopped"
            ;;
        *)
            echo -e "State:       ${RED}●${NC} $STATE"
            ;;
    esac

    echo ""

    if [ "$STATE" = "running" ]; then
        echo "🔗 Endpoints:"
        echo "  API:    http://$IP:5000"
        echo "  Health: http://$IP:8080/health"
        echo ""

        echo "🏥 Health Check:"
        if curl -s -m 5 "http://$IP:8080/health" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Enclave is healthy"
        else
            echo -e "  ${RED}✗${NC} Enclave is not responding"
        fi
    fi

    echo ""
    echo "💰 Estimated Cost:"
    terraform output -raw estimated_monthly_cost
    echo ""
}

function cmd_start {
    echo "🚀 Starting instance..."

    INSTANCE_ID=$(get_instance_id)
    if [ -z "$INSTANCE_ID" ]; then
        echo -e "${RED}❌ Not deployed${NC}"
        return 1
    fi

    STATE=$(get_instance_state)
    if [ "$STATE" = "running" ]; then
        echo -e "${GREEN}✓${NC} Instance already running"
        return 0
    fi

    aws ec2 start-instances --instance-ids "$INSTANCE_ID"

    echo "⏳ Waiting for instance to start..."
    aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"

    echo -e "${GREEN}✓${NC} Instance started"
    echo ""

    # Wait for enclave to be ready
    echo "⏳ Waiting for enclave to start (30s)..."
    sleep 30

    cmd_status
}

function cmd_stop {
    echo "🛑 Stopping instance..."

    INSTANCE_ID=$(get_instance_id)
    if [ -z "$INSTANCE_ID" ]; then
        echo -e "${RED}❌ Not deployed${NC}"
        return 1
    fi

    STATE=$(get_instance_state)
    if [ "$STATE" = "stopped" ]; then
        echo -e "${GREEN}✓${NC} Instance already stopped"
        return 0
    fi

    read -p "Stop instance to save cost? (y/N) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        return 0
    fi

    aws ec2 stop-instances --instance-ids "$INSTANCE_ID"

    echo "⏳ Waiting for instance to stop..."
    aws ec2 wait instance-stopped --instance-ids "$INSTANCE_ID"

    echo -e "${GREEN}✓${NC} Instance stopped"
    echo ""
    echo "💰 Cost while stopped: ~$2/month (EBS storage only)"
}

function cmd_restart {
    cmd_stop
    sleep 5
    cmd_start
}

function cmd_ssh {
    INSTANCE_ID=$(get_instance_id)
    if [ -z "$INSTANCE_ID" ]; then
        echo -e "${RED}❌ Not deployed${NC}"
        return 1
    fi

    STATE=$(get_instance_state)
    if [ "$STATE" != "running" ]; then
        echo -e "${YELLOW}⚠${NC}  Instance is $STATE"
        read -p "Start instance first? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cmd_start
        else
            return 1
        fi
    fi

    IP=$(get_instance_ip)
    echo "🔐 Connecting to $IP..."
    ssh -i ~/.ssh/nautilus-key ec2-user@"$IP"
}

function cmd_logs {
    INSTANCE_ID=$(get_instance_id)
    if [ -z "$INSTANCE_ID" ]; then
        echo -e "${RED}❌ Not deployed${NC}"
        return 1
    fi

    STATE=$(get_instance_state)
    if [ "$STATE" != "running" ]; then
        echo -e "${RED}❌ Instance is not running${NC}"
        return 1
    fi

    IP=$(get_instance_ip)
    echo "📜 Viewing enclave logs (Ctrl+C to exit)..."
    echo ""

    ssh -i ~/.ssh/nautilus-key ec2-user@"$IP" \
        "sudo nitro-cli console --enclave-id \$(sudo nitro-cli describe-enclaves | jq -r '.[0].EnclaveID')"
}

function cmd_health {
    IP=$(get_instance_ip)
    if [ -z "$IP" ]; then
        echo -e "${RED}❌ Not deployed${NC}"
        return 1
    fi

    echo "🏥 Checking enclave health..."
    echo ""

    if ! curl -s -m 5 "http://$IP:8080/health"; then
        echo ""
        echo -e "${RED}✗${NC} Health check failed"
        return 1
    fi

    echo ""
    echo -e "${GREEN}✓${NC} Enclave is healthy"
}

function cmd_cost {
    echo "💰 Cost Estimation"
    echo ""

    INSTANCE_ID=$(get_instance_id)
    if [ -z "$INSTANCE_ID" ]; then
        echo -e "${RED}❌ Not deployed${NC}"
        return 1
    fi

    STATE=$(get_instance_state)

    echo "Configuration:"
    terraform output estimated_monthly_cost

    echo ""
    echo "Current state: $STATE"

    if [ "$STATE" = "running" ]; then
        UPTIME=$(aws ec2 describe-instances \
            --instance-ids "$INSTANCE_ID" \
            --query 'Reservations[0].Instances[0].LaunchTime' \
            --output text)

        echo "Running since: $UPTIME"
        echo ""
        echo "💡 Tip: Stop instance when not needed to save ~90% cost"
        echo "   ./scripts/manage.sh stop"
    elif [ "$STATE" = "stopped" ]; then
        echo ""
        echo "💰 Cost while stopped: ~$2/month (storage only)"
    fi
}

function cmd_destroy {
    echo -e "${RED}⚠️  WARNING: This will destroy all infrastructure!${NC}"
    echo ""
    echo "This will delete:"
    echo "  - EC2 instance"
    echo "  - Security groups"
    echo "  - VPC and networking"
    echo "  - All data"
    echo ""

    read -p "Are you SURE? Type 'yes' to confirm: " -r
    echo ""

    if [ "$REPLY" != "yes" ]; then
        echo "Cancelled"
        return 0
    fi

    echo "🗑️  Destroying infrastructure..."
    terraform destroy

    echo ""
    echo -e "${GREEN}✓${NC} Infrastructure destroyed"
}

# Main
if [ $# -eq 0 ]; then
    print_usage
    exit 1
fi

COMMAND=$1

case $COMMAND in
    status)
        cmd_status
        ;;
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    ssh)
        cmd_ssh
        ;;
    logs)
        cmd_logs
        ;;
    health)
        cmd_health
        ;;
    cost)
        cmd_cost
        ;;
    destroy)
        cmd_destroy
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo ""
        print_usage
        exit 1
        ;;
esac
