#!/usr/bin/env python3
"""
Quick test script for Python services
"""
import requests
import base64
from pathlib import Path

def test_ai_detection():
    print("\n=== Testing AI Detection Service ===")
    
    # Find a test image
    test_img = Path("test-images/dataset/real").glob("*.jpg")
    test_img = list(test_img)[:1]
    
    if not test_img:
        print("No test images found")
        return False
    
    img_path = test_img[0]
    print(f"Using image: {img_path}")
    
    with open(img_path, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode('utf-8')
    
    try:
        response = requests.post(
            "http://localhost:8001/detect",
            json={"media": img_b64},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ AI Detection working!")
            print(f"  Verdict: {result.get('verdict')}")
            print(f"  Confidence: {result.get('confidence')}")
            return True
        else:
            print(f"✗ AI Detection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ AI Detection error: {e}")
        return False


def test_reverse_search():
    print("\n=== Testing Reverse Search Service ===")
    
    # Find a test image
    test_img = Path("test-images/dataset/real").glob("*.jpg")
    test_img = list(test_img)[:1]
    
    if not test_img:
        print("No test images found")
        return False
    
    img_path = test_img[0]
    print(f"Using image: {img_path}")
    
    with open(img_path, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode('utf-8')
    
    try:
        response = requests.post(
            "http://localhost:8002/search",
            json={"media": img_b64, "filename": img_path.name},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Reverse Search working!")
            print(f"  Matches: {len(result.get('matches', []))}")
            print(f"  Confidence: {result.get('confidence', 0)}")
            return True
        else:
            print(f"✗ Reverse Search failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Reverse Search error: {e}")
        return False


def main():
    print("Testing Python Services...")
    
    ai_ok = test_ai_detection()
    search_ok = test_reverse_search()
    
    print("\n" + "="*50)
    print("Results:")
    print(f"  AI Detection: {'✓ PASS' if ai_ok else '✗ FAIL'}")
    print(f"  Reverse Search: {'✓ PASS' if search_ok else '✗ FAIL'}")
    print("="*50)
    
    if ai_ok and search_ok:
        print("\n🎉 All services working!")
        return 0
    else:
        print("\n⚠️  Some services failed")
        return 1


if __name__ == "__main__":
    exit(main())

