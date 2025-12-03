#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🧪 TESTING FORENSIC ANALYSIS                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if AI detection service is running
echo "1️⃣  Checking AI Detection service..."
docker-compose ps ai-detection

echo ""
echo "2️⃣  Checking ENABLE_FORENSICS config..."
docker-compose exec -T ai-detection python -c "import config; print('ENABLE_FORENSICS:', config.ENABLE_FORENSICS)"

echo ""
echo "3️⃣  Creating test image..."
# Create a simple test image using Python
docker-compose exec -T ai-detection python << 'EOF'
from PIL import Image
import io
import base64

# Create a simple test image
img = Image.new('RGB', (300, 300), color='red')
buffer = io.BytesIO()
img.save(buffer, format='JPEG')
img_bytes = buffer.getvalue()
img_b64 = base64.b64encode(img_bytes).decode('utf-8')

print("Test image created (300x300 red square)")
print(f"Base64 length: {len(img_b64)} chars")
EOF

echo ""
echo "4️⃣  Testing forensic analysis directly..."
echo "Calling AI Detection API with test image..."

# Create test image and call API
TEST_IMAGE=$(docker-compose exec -T ai-detection python << 'EOF'
from PIL import Image
import io
import base64

img = Image.new('RGB', (300, 300), color='blue')
buffer = io.BytesIO()
img.save(buffer, format='JPEG')
img_bytes = buffer.getvalue()
print(base64.b64encode(img_bytes).decode('utf-8'))
EOF
)

# Call API
curl -s -X POST http://localhost:8000/detect/base64 \
  -H "Content-Type: application/json" \
  -d "{\"media\": \"$TEST_IMAGE\"}" \
  | python3 -m json.tool | head -50

echo ""
echo "5️⃣  Watching logs for forensic analysis..."
echo "Looking for 'Phase 2: Forensic analysis' in recent logs..."
docker-compose logs ai-detection --tail=50 | grep -E "(Phase|Forensic|forensic|Manipulation)"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         ✅ TEST COMPLETE                                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"

