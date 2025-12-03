#!/bin/bash
# Auto-start script for Nautilus Enclave
# This script runs on boot to start the enclave and proxy

set -e

ENCLAVE_CID=16
EIF_PATH="/opt/nautilus/out/nitro.eif"
LOG_FILE="/var/log/nautilus-enclave.log"

echo "$(date): Starting Nautilus enclave..." | tee -a "$LOG_FILE"

# Terminate any existing enclaves
nitro-cli terminate-enclave --all 2>&1 | tee -a "$LOG_FILE" || true
pkill -f "python3.*3000" || true

# Wait for allocator
sleep 5

# Start enclave
echo "$(date): Launching enclave..." | tee -a "$LOG_FILE"
nitro-cli run-enclave \
  --eif-path "$EIF_PATH" \
  --memory 4096 \
  --cpu-count 2 \
  --enclave-cid "$ENCLAVE_CID" \
  --debug-mode 2>&1 | tee -a "$LOG_FILE"

# Wait for enclave to boot
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

# Wait for app to start
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
            except Exception as e:
                pass
            finally:
                try:
                    src.close()
                    dst.close()
                except:
                    pass

        t1 = threading.Thread(target=forward, args=(client_sock, vsock, "client->enclave"))
        t2 = threading.Thread(target=forward, args=(vsock, client_sock, "enclave->client"))
        t1.daemon = True
        t2.daemon = True
        t1.start()
        t2.start()
        t1.join()
        t2.join()
    except Exception as e:
        print(f"Connection error: {e}", file=sys.stderr)
        try:
            client_sock.close()
        except:
            pass

def main():
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
            print(f"Accept error: {e}", file=sys.stderr)
            sys.stderr.flush()

if __name__ == '__main__':
    main()
PYPROXY

# Wait for proxy to start
sleep 2

# Test connectivity
echo "$(date): Testing enclave connectivity..." | tee -a "$LOG_FILE"
if curl -s --connect-timeout 3 http://localhost:3000/ | grep -q "Pong"; then
    echo "$(date): ✅ Enclave is responding!" | tee -a "$LOG_FILE"
else
    echo "$(date): ⚠️  Enclave not responding yet" | tee -a "$LOG_FILE"
fi

echo "$(date): Enclave startup complete" | tee -a "$LOG_FILE"
