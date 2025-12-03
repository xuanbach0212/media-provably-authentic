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

# Download and setup auto-start scripts from GitHub
echo "🔧 Setting up auto-start systemd service..."
cd /opt/nautilus

# Create start script
cat > /opt/nautilus/start-enclave.sh <<'STARTSCRIPT'
#!/bin/bash
# Auto-start script for Nautilus Enclave
set -e

ENCLAVE_CID=16
EIF_PATH="/opt/nautilus/out/nitro.eif"
LOG_FILE="/var/log/nautilus-enclave.log"

echo "$(date): Starting Nautilus enclave..." | tee -a "$LOG_FILE"

# Terminate any existing enclaves
nitro-cli terminate-enclave --all 2>&1 | tee -a "$LOG_FILE" || true
pkill -f "python3.*3000" || true
sleep 5

# Start enclave
echo "$(date): Launching enclave..." | tee -a "$LOG_FILE"
nitro-cli run-enclave \
  --eif-path "$EIF_PATH" \
  --memory ${enclave_memory_mb} \
  --cpu-count ${enclave_cpu_count} \
  --enclave-cid "$ENCLAVE_CID" \
  --debug-mode 2>&1 | tee -a "$LOG_FILE"

echo "$(date): Waiting for enclave to boot (15s)..." | tee -a "$LOG_FILE"
sleep 15

# Send secrets via vsock
echo "$(date): Sending secrets to enclave..." | tee -a "$LOG_FILE"
python3 <<'PYSECRETS' 2>&1 | tee -a "$LOG_FILE"
import socket
import json
AF_VSOCK = 40
try:
    sock = socket.socket(AF_VSOCK, socket.SOCK_STREAM)
    sock.connect((16, 7777))
    sock.send(json.dumps({}).encode())
    sock.close()
    print("✅ Secrets sent successfully")
except Exception as e:
    print(f"❌ Failed to send secrets: {e}")
    exit(1)
PYSECRETS

sleep 3

# Start TCP-to-VSOCK proxy in background
echo "$(date): Starting TCP-to-VSOCK proxy on port 3000..." | tee -a "$LOG_FILE"
nohup python3 <<'PYPROXY' >> "$LOG_FILE" 2>&1 &
import socket
import threading
import sys

AF_VSOCK = 40
ENCLAVE_CID = 16
ENCLAVE_PORT = 3000
TCP_PORT = 3000

def proxy_connection(client_sock):
    try:
        vsock = socket.socket(AF_VSOCK, socket.SOCK_STREAM)
        vsock.connect((ENCLAVE_CID, ENCLAVE_PORT))

        def forward(src, dst, name):
            try:
                while True:
                    data = src.recv(4096)
                    if not data:
                        break
                    dst.sendall(data)
            except:
                pass
            finally:
                try:
                    src.close()
                    dst.close()
                except:
                    pass

        t1 = threading.Thread(target=forward, args=(client_sock, vsock, "c->e"))
        t2 = threading.Thread(target=forward, args=(vsock, client_sock, "e->c"))
        t1.daemon = True
        t2.daemon = True
        t1.start()
        t2.start()
        t1.join()
        t2.join()
    except Exception as e:
        try:
            client_sock.close()
        except:
            pass

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('0.0.0.0', TCP_PORT))
server.listen(10)
print(f"✅ Proxy listening on 0.0.0.0:{TCP_PORT}")
sys.stdout.flush()

while True:
    try:
        client, addr = server.accept()
        t = threading.Thread(target=proxy_connection, args=(client,))
        t.daemon = True
        t.start()
    except Exception as e:
        pass
PYPROXY

sleep 2
curl -s --connect-timeout 3 http://localhost:3000/ | grep -q "Pong" && \
  echo "$(date): ✅ Enclave is responding!" | tee -a "$LOG_FILE" || \
  echo "$(date): ⚠️ Enclave not responding yet" | tee -a "$LOG_FILE"

echo "$(date): Enclave startup complete" | tee -a "$LOG_FILE"
STARTSCRIPT

sudo chmod +x /opt/nautilus/start-enclave.sh

# Create systemd service
cat > /tmp/nautilus-enclave.service <<'EOF'
[Unit]
Description=Nautilus Nitro Enclave Service
After=network.target nitro-enclaves-allocator.service
Requires=nitro-enclaves-allocator.service

[Service]
Type=forking
User=root
WorkingDirectory=/opt/nautilus
ExecStart=/opt/nautilus/start-enclave.sh
ExecStop=/usr/bin/nitro-cli terminate-enclave --all
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

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
