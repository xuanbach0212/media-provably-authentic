#!/bin/bash
#
# Nautilus Nitro Enclave Setup Script
# Runs on instance launch via user_data
#

set -e

echo "🚀 Starting Nautilus Nitro Enclave setup..."

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
  htop

# Install Nitro Enclaves CLI
echo "🔧 Installing AWS Nitro Enclaves CLI..."
sudo amazon-linux-extras install aws-nitro-enclaves-cli -y
sudo yum install aws-nitro-enclaves-cli-devel -y

# Install Node.js (for enclave application)
# Using Node 16 for Amazon Linux 2 compatibility (GLIBC 2.26)
echo "📦 Installing Node.js 16..."
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

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

# Create working directory
echo "📁 Creating working directory..."
sudo mkdir -p /opt/nautilus
sudo chown ec2-user:ec2-user /opt/nautilus
cd /opt/nautilus

# Create enclave application
echo "📝 Creating enclave application..."
cat > /opt/nautilus/package.json <<'EOF'
{
  "name": "nautilus-enclave",
  "version": "1.0.0",
  "description": "Nautilus Nitro Enclave for Media Authentication",
  "main": "enclave-server.js",
  "scripts": {
    "start": "node enclave-server.js"
  },
  "dependencies": {
    "axios": "^1.6.0"
  }
}
EOF

# Create enclave server
cat > /opt/nautilus/enclave-server.js <<'EOF'
const net = require('net');
const crypto = require('crypto');
const fs = require('fs');

const VSOCK_PORT = 5000;

console.log('[Enclave] Starting Nautilus server...');

// Create vsock server
const server = net.createServer((socket) => {
  console.log('[Enclave] Client connected');

  let buffer = '';

  socket.on('data', async (data) => {
    buffer += data.toString();

    // Check if we have complete JSON
    try {
      const request = JSON.parse(buffer);
      buffer = ''; // Clear buffer

      console.log('[Enclave] Request:', request.action);

      let response;

      switch (request.action) {
        case 'sign_report':
          response = await signReport(request.data);
          break;

        case 'attest':
          response = await generateAttestation(request.data);
          break;

        case 'ping':
          response = { status: 'ok', timestamp: new Date().toISOString() };
          break;

        default:
          response = { error: 'Unknown action' };
      }

      socket.write(JSON.stringify(response) + '\n');
    } catch (error) {
      if (error instanceof SyntaxError) {
        // Incomplete JSON, wait for more data
        return;
      }
      console.error('[Enclave] Error:', error.message);
      socket.write(JSON.stringify({ error: error.message }) + '\n');
    }
  });

  socket.on('error', (err) => {
    console.error('[Enclave] Socket error:', err);
  });

  socket.on('end', () => {
    console.log('[Enclave] Client disconnected');
  });
});

async function signReport(reportData) {
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(reportData))
    .digest('hex');

  // In production: sign with enclave-specific key
  const signature = crypto.createHash('sha384')
    .update(hash + process.env.ENCLAVE_SECRET || 'demo-secret')
    .digest('hex');

  return {
    signature,
    enclaveId: 'nitro_enclave_1',
    timestamp: new Date().toISOString(),
    mrenclave: process.env.MRENCLAVE || 'pending'
  };
}

async function generateAttestation(data) {
  // Generate attestation document
  // In production: use nitro-cli attestation
  const reportHash = crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');

  return {
    attestationDocument: Buffer.from(JSON.stringify({
      moduleId: 'nitro_enclave_1',
      timestamp: Date.now(),
      digest: reportHash,
      pcrs: {
        PCR0: process.env.EXPECTED_PCR0 || 'mock_pcr0',
        PCR1: 'mock_pcr1',
        PCR2: 'mock_pcr2'
      }
    })).toString('base64'),
    signature: reportHash,
    timestamp: new Date().toISOString()
  };
}

server.listen(VSOCK_PORT, () => {
  console.log(`[Enclave] Server listening on vsock port $${VSOCK_PORT}`);
  console.log('[Enclave] Ready to process requests');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Enclave] Shutting down...');
  server.close(() => {
    console.log('[Enclave] Server closed');
    process.exit(0);
  });
});
EOF

# Create Dockerfile for enclave
cat > /opt/nautilus/Dockerfile <<'EOF'
FROM amazonlinux:2

# Install Node.js 16 (compatible with Amazon Linux 2 GLIBC 2.26)
RUN curl -fsSL https://rpm.nodesource.com/setup_16.x | bash - && \
    yum install -y nodejs && \
    yum clean all

# Create app directory
WORKDIR /app

# Copy application
COPY package.json .
COPY enclave-server.js .

# Install dependencies
RUN npm install --production

# Expose vsock port
EXPOSE 5000

# Start server
CMD ["node", "enclave-server.js"]
EOF

# Install npm dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build Docker image
echo "🐳 Building enclave Docker image..."
sudo docker build -t nautilus-enclave:latest /opt/nautilus

# Build Nitro Enclave Image
echo "🔐 Building Nitro Enclave Image (EIF)..."
sudo nitro-cli build-enclave \
  --docker-uri nautilus-enclave:latest \
  --output-file /opt/nautilus/nautilus.eif \
  > /opt/nautilus/build-output.json 2>&1

# Extract PCR measurements
if [ -f /opt/nautilus/build-output.json ]; then
  PCR0=$(cat /opt/nautilus/build-output.json | jq -r '.Measurements.PCR0' 2>/dev/null || echo "pending")
  echo "PCR0: $PCR0" | sudo tee /opt/nautilus/measurements.txt
fi

# Run enclave
echo "🚀 Starting Nitro Enclave..."
ENCLAVE_ID=$(sudo nitro-cli run-enclave \
  --eif-path /opt/nautilus/nautilus.eif \
  --memory $${ENCLAVE_MEMORY_MB} \
  --cpu-count $${ENCLAVE_CPU_COUNT} \
  --enclave-cid 16 \
  --debug-mode \
  | jq -r '.EnclaveID')

echo "✅ Enclave started with ID: $ENCLAVE_ID"
echo "$ENCLAVE_ID" | sudo tee /opt/nautilus/enclave-id.txt

# Setup vsock-proxy (to allow external connections)
echo "🔌 Setting up vsock proxy..."
sudo nohup socat TCP-LISTEN:5000,fork VSOCK-CONNECT:16:5000 > /opt/nautilus/proxy.log 2>&1 &

# Health check endpoint
echo "🏥 Setting up health check endpoint..."
cat > /opt/nautilus/health-server.js <<'EOF'
const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    // Check if enclave is running
    exec('sudo nitro-cli describe-enclaves', (error, stdout, stderr) => {
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

sudo nohup node /opt/nautilus/health-server.js > /opt/nautilus/health.log 2>&1 &

# Create systemd service for auto-restart
cat > /tmp/nautilus-enclave.service <<'EOF'
[Unit]
Description=Nautilus Nitro Enclave
After=docker.service nitro-enclaves-allocator.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nautilus
ExecStart=/usr/bin/nitro-cli run-enclave --eif-path /opt/nautilus/nautilus.eif --memory ${enclave_memory_mb} --cpu-count ${enclave_cpu_count} --enclave-cid 16
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/nautilus-enclave.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nautilus-enclave.service

echo ""
echo "✅ Nautilus Nitro Enclave setup complete!"
echo ""
echo "📊 Enclave info:"
sudo nitro-cli describe-enclaves | jq '.'
echo ""
echo "🔍 Measurements:"
cat /opt/nautilus/measurements.txt
echo ""
echo "💡 Useful commands:"
echo "  - View console:   sudo nitro-cli console --enclave-id $ENCLAVE_ID"
echo "  - Describe:       sudo nitro-cli describe-enclaves"
echo "  - Health check:   curl http://localhost:8080/health"
echo "  - Test enclave:   echo '{\"action\":\"ping\"}' | nc localhost 5000"
echo ""
