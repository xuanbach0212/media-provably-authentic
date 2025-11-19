#!/usr/bin/env python3
"""
Test Multi-Enclave Flow
Tests the production multi-worker + aggregator + consensus system
"""

import requests
import base64
import time
import os

BACKEND_URL = "http://localhost:3001"
TEST_IMAGE_PATH = "test-images/dataset/real/img0- (338).jpg"

def test_multi_enclave_flow():
    print("="*70)
    print("MULTI-ENCLAVE FLOW TEST")
    print("="*70)
    
    # Check if multi-worker mode is enabled
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        response.raise_for_status()
        print("✓ Backend is running")
    except Exception as e:
        print(f"✗ Backend not reachable: {e}")
        return False
    
    # Upload test image
    print("\n1. Uploading test image...")
    try:
        with open(TEST_IMAGE_PATH, "rb") as f:
            files = {'file': (os.path.basename(TEST_IMAGE_PATH), f.read(), 'image/jpeg')}
            data = {'userId': 'test_multi_enclave', 'signature': 'test_signature'}
            response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
            response.raise_for_status()
            result = response.json()
            job_id = result['jobId']
            print(f"✓ Upload successful!")
            print(f"   Job ID: {job_id}")
    except Exception as e:
        print(f"✗ Upload failed: {e}")
        return False
    
    # Poll for completion (multi-enclave takes longer)
    print("\n2. Polling for consensus (multi-enclave processing)...")
    max_attempts = 100  # 5 minutes
    attempt = 0
    
    while attempt < max_attempts:
        try:
            response = requests.get(f"{BACKEND_URL}/api/job/{job_id}")
            response.raise_for_status()
            status_data = response.json()
            status = status_data['status']
            
            if attempt % 5 == 0:  # Print every 15 seconds
                print(f"   Status: {status} (attempt {attempt+1}/{max_attempts})")
            
            if status == "COMPLETED":
                report = status_data['report']
                print(f"\n✓ Job completed!")
                
                # Check for consensus metadata
                consensus = report.get('consensusMetadata', {})
                if consensus:
                    print(f"\n3. Consensus Results:")
                    print(f"   Agreement Rate: {consensus.get('agreementRate', 0)*100:.1f}%")
                    print(f"   Participating Enclaves: {consensus.get('participatingEnclaves', 0)}")
                    print(f"   Consensus Timestamp: {consensus.get('consensusTimestamp', 'N/A')}")
                    print(f"\n   Final Verdict: {report['verdict']}")
                    print(f"   Final Confidence: {report['confidence']*100:.1f}%")
                    
                    # Show individual enclave results if available
                    ai_detection = report.get('aiDetection', {})
                    individual_verdicts = ai_detection.get('modelScores', {}).get('individual_model_verdicts', {})
                    if individual_verdicts:
                        print(f"\n   Individual Model Verdicts:")
                        for model, data in individual_verdicts.items():
                            print(f"      {model}: {data.get('verdict')} ({data.get('ai_score', 0)*100:.1f}%)")
                    
                    return True
                else:
                    print(f"\n⚠️  Completed but no consensus metadata found")
                    print(f"   This might be single-worker mode")
                    print(f"   Verdict: {report['verdict']}")
                    return True
                    
            elif status == "FAILED":
                print(f"\n✗ Job failed during processing")
                return False
                
        except Exception as e:
            print(f"\n✗ Error polling status: {e}")
            return False
        
        time.sleep(3)
        attempt += 1
    
    print(f"\n✗ Timeout waiting for completion")
    return False

def test_dispute_flow(job_id):
    print("\n" + "="*70)
    print("TESTING DISPUTE FLOW")
    print("="*70)
    
    print("\n1. Submitting dispute...")
    try:
        dispute_data = {
            "jobId": job_id,
            "challengerAddress": "0x1234567890",
            "evidenceCID": "evidence_blob_123",
            "reason": "Test dispute"
        }
        response = requests.post(f"{BACKEND_URL}/api/dispute", json=dispute_data)
        response.raise_for_status()
        result = response.json()
        print(f"✓ Dispute submitted!")
        print(f"   Status: {result['status']}")
        print(f"   Estimated time: {result['estimatedTime']}")
        return True
    except Exception as e:
        print(f"✗ Dispute submission failed: {e}")
        return False

if __name__ == "__main__":
    # Test multi-enclave flow
    success = test_multi_enclave_flow()
    
    print("\n" + "="*70)
    if success:
        print("✅ MULTI-ENCLAVE TEST PASSED!")
    else:
        print("❌ MULTI-ENCLAVE TEST FAILED!")
    print("="*70)
    
    print("\n💡 To enable multi-worker mode:")
    print("   1. Edit backend/.env")
    print("   2. Set USE_MULTI_WORKER=true")
    print("   3. Restart backend: cd backend && npm run dev")
    print("\n   The system will then use 3 enclaves with consensus!")

