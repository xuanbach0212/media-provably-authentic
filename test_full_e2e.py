#!/usr/bin/env python3
"""
Full E2E Flow Test
Tests: Upload → AI Detection → Reverse Search → Blockchain → Results
"""

import requests
import time
import json
import base64
from pathlib import Path

# Configuration
BACKEND_URL = "http://localhost:3001"
FRONTEND_URL = "http://localhost:3000"

# Find a test image
test_images = [
    "/Users/s29815/Developer/Hackathon/media-provably-authentic/test-images/real_image.jpg",
    "/Users/s29815/Developer/Hackathon/media-provably-authentic/test-images/ai_generated.jpg",
    "/Users/s29815/Downloads/test.jpg",  # fallback
]

test_image = None
for img_path in test_images:
    if Path(img_path).exists():
        test_image = img_path
        break

if not test_image:
    print("❌ No test image found. Creating a simple test image...")
    from PIL import Image
    import numpy as np
    
    # Create simple test image
    img = Image.fromarray(np.random.randint(0, 255, (256, 256, 3), dtype=np.uint8))
    test_image = "/tmp/test_e2e.jpg"
    img.save(test_image)
    print(f"✅ Created test image: {test_image}")

print("\n" + "="*60)
print("🚀 FULL E2E FLOW TEST")
print("="*60)

# Step 1: Health checks
print("\n📊 Step 1: Health Checks")
print("-" * 40)

services = {
    "Backend": f"{BACKEND_URL}/health",
    "AI Detection": "http://localhost:8000/health",
    "Reverse Search": "http://localhost:8001/health",
}

for name, url in services.items():
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            print(f"✅ {name}: OK")
        else:
            print(f"⚠️  {name}: {resp.status_code}")
    except Exception as e:
        print(f"❌ {name}: {e}")

# Step 2: Upload image
print("\n📤 Step 2: Upload Image")
print("-" * 40)

with open(test_image, 'rb') as f:
    files = {'file': ('test.jpg', f, 'image/jpeg')}
    
    print(f"Uploading: {test_image}")
    try:
        resp = requests.post(f"{BACKEND_URL}/api/upload", files=files, timeout=30)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            upload_data = resp.json()
            job_id = upload_data.get('jobId')
            print(f"✅ Upload successful!")
            print(f"   Job ID: {job_id}")
        else:
            print(f"❌ Upload failed: {resp.text}")
            exit(1)
    except Exception as e:
        print(f"❌ Upload error: {e}")
        exit(1)

# Step 3: Poll job status
print("\n⏳ Step 3: Processing Job")
print("-" * 40)

max_wait = 120  # 2 minutes
start_time = time.time()
job_complete = False

while time.time() - start_time < max_wait:
    try:
        resp = requests.get(f"{BACKEND_URL}/api/job/{job_id}", timeout=10)
        if resp.status_code == 200:
            job_status = resp.json()
            status = job_status.get('status')
            progress = job_status.get('progress', 0)
            
            print(f"   Status: {status} ({progress}%)", end='\r')
            
            if status == 'completed':
                job_complete = True
                print(f"\n✅ Job completed!")
                break
            elif status == 'failed':
                print(f"\n❌ Job failed: {job_status.get('error')}")
                exit(1)
        
        time.sleep(2)
    except Exception as e:
        print(f"\n⚠️  Status check error: {e}")
        time.sleep(2)

if not job_complete:
    print(f"\n❌ Timeout waiting for job completion")
    exit(1)

# Step 4: Get results
print("\n📊 Step 4: Verification Results")
print("-" * 40)

try:
    resp = requests.get(f"{BACKEND_URL}/api/job/{job_id}", timeout=10)
    if resp.status_code == 200:
        result = resp.json()
        
        print(f"✅ Results retrieved!")
        print(f"\n🎯 VERDICT: {result.get('verdict', 'N/A').upper()}")
        print(f"📈 Confidence: {result.get('confidence', 0)*100:.1f}%")
        
        # AI Detection
        if 'aiDetection' in result:
            ai = result['aiDetection']
            print(f"\n🤖 AI Detection:")
            print(f"   AI Generated: {ai.get('aiGenerated')}%")
            print(f"   Deepfake: {ai.get('deepfake')}%")
            print(f"   Manipulated: {ai.get('manipulated')}%")
        
        # Reverse Search
        if 'reverseSearch' in result:
            rs = result['reverseSearch']
            matches = rs.get('matches', [])
            print(f"\n🔍 Reverse Search:")
            print(f"   Matches found: {len(matches)}")
            if matches:
                for i, match in enumerate(matches[:3], 1):
                    print(f"   {i}. {match.get('url', 'N/A')} ({match.get('similarity', 0)*100:.0f}%)")
        
        # Blockchain
        if 'blockchainAttestation' in result:
            bc = result['blockchainAttestation']
            print(f"\n⛓️  Blockchain Attestation:")
            print(f"   Attestation ID: {bc.get('attestationId', 'N/A')}")
            print(f"   Tx Hash: {bc.get('txHash', 'N/A')[:20]}...")
            print(f"   Timestamp: {bc.get('timestamp', 'N/A')}")
        
        # Storage
        if 'storage' in result:
            storage = result['storage']
            print(f"\n💾 Storage:")
            print(f"   Report CID: {storage.get('reportCID', 'N/A')[:20]}...")
        
        print(f"\n" + "="*60)
        print("✅ FULL E2E FLOW SUCCESSFUL!")
        print("="*60)
        
        # Print full result as JSON
        print(f"\n📄 Full Result:")
        print(json.dumps(result, indent=2))
        
    else:
        print(f"❌ Failed to get results: {resp.status_code}")
        exit(1)
        
except Exception as e:
    print(f"❌ Error getting results: {e}")
    exit(1)

print(f"\n✅ Test complete! Frontend available at: {FRONTEND_URL}")
print(f"   View result: {FRONTEND_URL}/verify/{job_id}")

