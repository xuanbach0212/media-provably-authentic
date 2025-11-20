#!/usr/bin/env python3
"""
End-to-End Test for New Metrics-Based System
Tests the full flow: upload → AI detection → conditional reverse search → blockchain
"""

import requests
import json
import os
import base64
import time
from datetime import datetime

# Service URLs
BACKEND_URL = "http://localhost:3001"
AI_DETECTION_URL = "http://localhost:8000"
REVERSE_SEARCH_URL = "http://localhost:8001"

# Test images
TEST_IMAGES_DIR = "test-images/dataset"
REAL_IMAGE = None
AI_IMAGE = None

def find_test_images():
    """Find one real and one AI-generated image for testing"""
    global REAL_IMAGE, AI_IMAGE
    
    # Find real image
    real_dir = os.path.join(TEST_IMAGES_DIR, "real")
    for file in os.listdir(real_dir):
        if file.lower().endswith(('.jpg', '.jpeg', '.png')):
            REAL_IMAGE = os.path.join(real_dir, file)
            break
    
    # Find AI-generated image
    ai_dir = os.path.join(TEST_IMAGES_DIR, "ai-generated")
    for file in os.listdir(ai_dir):
        if file.lower().endswith(('.jpg', '.jpeg', '.png')):
            AI_IMAGE = os.path.join(ai_dir, file)
            break
    
    print(f"✓ Found test images:")
    print(f"  Real: {REAL_IMAGE}")
    print(f"  AI: {AI_IMAGE}")

def test_ai_detection_service(image_path):
    """Test AI detection service directly"""
    print(f"\n=== Testing AI Detection Service ===")
    print(f"Image: {os.path.basename(image_path)}")
    
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    
    encoded_image = base64.b64encode(image_bytes).decode('utf-8')
    
    payload = {"media": encoded_image}
    headers = {"Content-Type": "application/json"}
    
    start_time = time.time()
    response = requests.post(f"{AI_DETECTION_URL}/detect/base64", json=payload, headers=headers, timeout=60)
    elapsed = time.time() - start_time
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ AI Detection completed in {elapsed:.2f}s")
        print(f"  Ensemble Score: {result['ensembleScore']:.3f}")
        print(f"  Models Used: {result['metadata'].get('models_used', 'unknown')}")
        
        # Check individual model scores
        if 'individual_models' in result['modelScores']:
            print(f"  Individual Model Scores:")
            for model, scores in result['modelScores']['individual_models'].items():
                print(f"    {model}: {scores['ai_score']:.3f}")
        
        return result
    else:
        print(f"✗ AI Detection failed: {response.status_code}")
        print(response.text)
        return None

def test_reverse_search_service(image_path):
    """Test reverse search service directly"""
    print(f"\n=== Testing Reverse Search Service ===")
    print(f"Image: {os.path.basename(image_path)}")
    
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    
    encoded_image = base64.b64encode(image_bytes).decode('utf-8')
    
    payload = {
        "media": encoded_image,
        "filename": os.path.basename(image_path)
    }
    headers = {"Content-Type": "application/json"}
    
    start_time = time.time()
    response = requests.post(f"{REVERSE_SEARCH_URL}/search", json=payload, headers=headers, timeout=120)
    elapsed = time.time() - start_time
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Reverse Search completed in {elapsed:.2f}s")
        print(f"  Matches Found: {len(result.get('matches', []))}")
        
        if result.get('matches'):
            print(f"  Top Matches:")
            for i, match in enumerate(result['matches'][:3], 1):
                print(f"    {i}. {match['url']} (similarity: {match['similarity']:.2%})")
        
        return result
    else:
        print(f"✗ Reverse Search failed: {response.status_code}")
        print(response.text)
        return None

def test_conditional_reverse_search():
    """Test that reverse search is conditional based on ensemble score"""
    print(f"\n=== Testing Conditional Reverse Search Logic ===")
    
    # Test with real image (likely low ensemble score < 0.5)
    print(f"\n1. Real Image (expected: score < 0.5, reverse search should run)")
    ai_result = test_ai_detection_service(REAL_IMAGE)
    
    if ai_result:
        ensemble_score = ai_result['ensembleScore']
        should_search = ensemble_score < 0.5 or ensemble_score > 0.8
        print(f"  → Score: {ensemble_score:.3f}")
        print(f"  → Should trigger reverse search: {should_search}")
        
        if should_search:
            print(f"  → Testing reverse search...")
            test_reverse_search_service(REAL_IMAGE)
    
    # Test with AI-generated image (likely high ensemble score > 0.8)
    print(f"\n2. AI-Generated Image (expected: score > 0.8, reverse search should run)")
    ai_result = test_ai_detection_service(AI_IMAGE)
    
    if ai_result:
        ensemble_score = ai_result['ensembleScore']
        should_search = ensemble_score < 0.5 or ensemble_score > 0.8
        print(f"  → Score: {ensemble_score:.3f}")
        print(f"  → Should trigger reverse search: {should_search}")
        
        if should_search:
            print(f"  → Testing reverse search...")
            test_reverse_search_service(AI_IMAGE)

def test_full_backend_flow(image_path, label):
    """Test full backend flow including blockchain attestation"""
    print(f"\n=== Testing Full Backend Flow: {label} ===")
    print(f"Image: {os.path.basename(image_path)}")
    
    # 1. Upload
    print(f"\n1. Uploading media...")
    with open(image_path, "rb") as f:
        files = {"file": f}
        data = {
            "userId": "test-user",
            "signature": "test-signature"
        }
        response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data, timeout=30)
    
    if response.status_code != 200:
        print(f"✗ Upload failed: {response.status_code}")
        print(response.text)
        return
    
    upload_result = response.json()
    job_id = upload_result['jobId']
    print(f"✓ Upload successful")
    print(f"  Job ID: {job_id}")
    print(f"  Media CID: {upload_result.get('mediaCID', 'N/A')}")
    
    # 2. Poll for completion
    print(f"\n2. Polling for completion...")
    max_attempts = 60
    attempt = 0
    
    while attempt < max_attempts:
        attempt += 1
        time.sleep(2)
        
        response = requests.get(f"{BACKEND_URL}/api/job/{job_id}", timeout=10)
        if response.status_code != 200:
            print(f"✗ Status check failed: {response.status_code}")
            continue
        
        status = response.json()
        print(f"  [{attempt}] Status: {status['status']} - {status.get('progress', 0):.0f}%")
        
        if status['status'] == 'COMPLETED':
            print(f"✓ Job completed!")
            report = status.get('report')
            
            if not report:
                print(f"✗ No report in response")
                return
            
            # 3. Analyze results
            print(f"\n3. Analysis Results:")
            analysis_data = report.get('analysisData', {})
            ai_detection = analysis_data.get('aiDetection', {})
            reverse_search = analysis_data.get('reverseSearch')
            
            print(f"\n  AI Detection:")
            print(f"    Ensemble Score: {ai_detection.get('ensembleScore', 'N/A'):.3f}")
            
            individual_models = ai_detection.get('modelScores', {}).get('individual_models', {})
            if individual_models:
                print(f"    Individual Models:")
                for model, scores in list(individual_models.items())[:5]:
                    print(f"      {model}: {scores.get('ai_score', 0):.3f}")
            
            print(f"\n  Reverse Search:")
            if reverse_search:
                print(f"    Status: Executed")
                print(f"    Matches: {len(reverse_search.get('matches', []))}")
            else:
                print(f"    Status: Skipped (score in middle range)")
            
            print(f"\n  Blockchain Attestation:")
            blockchain = report.get('blockchainAttestation', {})
            print(f"    TX Hash: {blockchain.get('txHash', 'N/A')}")
            print(f"    Timestamp: {blockchain.get('timestamp', 'N/A')}")
            
            return report
        
        elif status['status'] == 'FAILED':
            print(f"✗ Job failed: {status.get('message', 'Unknown error')}")
            return
    
    print(f"✗ Timeout waiting for completion")

def main():
    print("="*70)
    print("END-TO-END TEST: New Metrics-Based System")
    print("="*70)
    
    # Find test images
    try:
        find_test_images()
    except Exception as e:
        print(f"✗ Error finding test images: {e}")
        return
    
    # Check services
    print(f"\n=== Checking Services ===")
    services = [
        ("Backend", f"{BACKEND_URL}/health"),
        ("AI Detection", f"{AI_DETECTION_URL}/health"),
        ("Reverse Search", f"{REVERSE_SEARCH_URL}/health"),
    ]
    
    all_up = True
    for name, url in services:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✓ {name}: UP")
            else:
                print(f"✗ {name}: DOWN ({response.status_code})")
                all_up = False
        except Exception as e:
            print(f"✗ {name}: DOWN ({e})")
            all_up = False
    
    if not all_up:
        print(f"\n✗ Not all services are running. Start with: ./start-all-services.sh")
        return
    
    # Run tests
    print(f"\n" + "="*70)
    print("STARTING TESTS")
    print("="*70)
    
    # Test services directly
    test_conditional_reverse_search()
    
    # Test full backend flow
    test_full_backend_flow(REAL_IMAGE, "Real Image")
    test_full_backend_flow(AI_IMAGE, "AI-Generated Image")
    
    print(f"\n" + "="*70)
    print("TESTS COMPLETE")
    print("="*70)

if __name__ == "__main__":
    main()

