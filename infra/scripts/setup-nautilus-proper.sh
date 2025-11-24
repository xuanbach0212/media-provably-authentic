#!/bin/bash
#
# Setup Nautilus Enclave - Using Official Mysten Labs Framework
# This script clones and builds the official Nautilus repository
#

set -e

echo "🚀 Setting up Official Nautilus Framework..."

# Update system
echo "📦 Updating system packages..."
sudo yum update -y

# Install dependencies
echo "📦 Installing dependencies..."
sudo yum install -y \
  docker \
  git \
  jq \
  tmux \
  htop \
  gcc \
  openssl-devel

# Install Rust
echo "🦀 Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install Nitro Enclaves CLI
echo "🔧 Installing AWS Nitro Enclaves CLI..."
sudo amazon-linux-extras install aws-nitro-enclaves-cli -y
sudo yum install aws-nitro-enclaves-cli-devel -y

# Start Docker
echo "🐳 Starting Docker..."
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user
sudo usermod -aG ne ec2-user

# Configure Nitro Enclaves allocator
echo "⚙️  Configuring Nitro Enclaves..."
sudo systemctl start nitro-enclaves-allocator.service
sudo systemctl enable nitro-enclaves-allocator.service

# Set enclave resources (from Terraform variables)
ENCLAVE_MEMORY_MB=${enclave_memory_mb}
ENCLAVE_CPU_COUNT=${enclave_cpu_count}

echo "📊 Allocating resources: $${ENCLAVE_MEMORY_MB}MB RAM, $${ENCLAVE_CPU_COUNT} CPUs"

sudo sed -i "s/memory_mib:.*/memory_mib: $${ENCLAVE_MEMORY_MB}/" /etc/nitro_enclaves/allocator.yaml
sudo sed -i "s/cpu_count:.*/cpu_count: $${ENCLAVE_CPU_COUNT}/" /etc/nitro_enclaves/allocator.yaml

# Restart allocator to apply changes
sudo systemctl restart nitro-enclaves-allocator.service

# Clone official Nautilus repository
echo "📥 Cloning Nautilus repository..."
cd /opt
sudo git clone https://github.com/MystenLabs/nautilus.git
sudo chown -R ec2-user:ec2-user nautilus
cd nautilus

# Create custom app for media authentication
echo "📝 Creating media-auth app..."
mkdir -p src/nautilus-server/src/apps/media_auth
mkdir -p move/media_auth

# Create basic Rust app
cat > src/nautilus-server/src/apps/media_auth/mod.rs <<'EOF'
use crate::common::{get_attestation, AppResponse};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct MediaRequest {
    pub image_hash: String,
    pub metadata: Option<String>,
}

#[derive(Serialize)]
pub struct MediaResponse {
    pub verified: bool,
    pub timestamp: u64,
    pub signature: String,
}

pub async fn process_media_verification(
    payload: MediaRequest,
) -> Result<AppResponse<MediaResponse>, String> {
    // Get enclave attestation
    let attestation = get_attestation().await?;

    // Simple verification logic (customize this)
    let verified = !payload.image_hash.is_empty();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Sign the response
    let response = MediaResponse {
        verified,
        timestamp,
        signature: format!("signed_{}", payload.image_hash),
    };

    Ok(AppResponse {
        response,
        signature: attestation,
    })
}
EOF

# Update allowed endpoints
cat > allowed_endpoints.yaml <<'EOF'
endpoints:
  - https://api.openai.com/*
  - https://www.google.com/search*
EOF

# Build enclave image using official Makefile
echo "🔨 Building Nautilus enclave..."
# Note: This requires AWS credentials to be configured
# For now, we'll prepare but not build
echo "⚠️  Enclave build requires AWS credentials"
echo "    Run manually: cd /opt/nautilus && make ENCLAVE_APP=media_auth"

# Create systemd service for enclave
echo "🔧 Creating systemd service..."
cat > /tmp/nautilus-enclave.service <<'EOF'
[Unit]
Description=Nautilus Nitro Enclave
After=docker.service nitro-enclaves-allocator.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nautilus
ExecStart=/usr/bin/nitro-cli run-enclave --eif-path /opt/nautilus/enclave.eif --memory 6144 --cpu-count 2 --enclave-cid 16
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/nautilus-enclave.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nautilus-enclave.service

# Setup health check endpoint
echo "🏥 Setting up health check endpoint..."
cat > /opt/nautilus/health-server.js <<'EOF'
const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    exec('nitro-cli describe-enclaves', (error, stdout, stderr) => {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: error.message }));
        return;
      }

      try {
        const enclaves = JSON.parse(stdout);
        if (enclaves.length > 0 && enclaves[0].State === 'RUNNING') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'healthy',
            enclave: enclaves[0],
            timestamp: new Date().toISOString()
          }));
        } else {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'unhealthy', message: 'Enclave not running' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Health check server listening on port 8080');
});
EOF

# Note: Node.js needed for health server only, not enclave
echo "📦 Installing Node.js 16 for health server..."
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

sudo nohup node /opt/nautilus/health-server.js > /opt/nautilus/health.log 2>&1 &

echo ""
echo "✅ Nautilus setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Configure AWS credentials"
echo "  2. cd /opt/nautilus"
echo "  3. make ENCLAVE_APP=media_auth  # Build enclave"
echo "  4. sudo systemctl start nautilus-enclave  # Start enclave"
echo ""
echo "🔍 Useful commands:"
echo "  - Check status: sudo nitro-cli describe-enclaves"
echo "  - View console: sudo nitro-cli console --enclave-id \$ENCLAVE_ID"
echo "  - Health check: curl http://localhost:8080/health"
echo ""
