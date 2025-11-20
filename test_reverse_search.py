#!/usr/bin/env python3
"""
Test Reverse Search Service
Tests the reverse image search functionality with sample images
"""
import requests
import os
import random
from pathlib import Path
from PIL import Image
import time
import json
import base64

# Configuration
REVERSE_SEARCH_URL = "http://localhost:8001"
DATASET_PATH = Path("test-images/dataset")
NUM_SAMPLES_PER_CATEGORY = 3

def test_health_check():
    """Check if reverse search service is running"""
    print("\n" + "="*70)
    print("  🏥 HEALTH CHECK")
    print("="*70)
    
    try:
        response = requests.get(f"{REVERSE_SEARCH_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Reverse Search Service is running!")
            print(f"   Status: {data.get('status')}")
            print(f"   Service: {data.get('service')}")
            print(f"   Version: {data.get('version')}")
            return True
        else:
            print(f"❌ Service returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {REVERSE_SEARCH_URL}")
        print(f"   Make sure the service is running on port 8002")
        print(f"   Start with: cd services/reverse-search && python main.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def select_sample_images():
    """Select random sample images from dataset"""
    samples = []
    
    # Select from AI-generated folder
    ai_folder = DATASET_PATH / "ai-generated"
    if ai_folder.exists():
        ai_images = list(ai_folder.glob("*.jpg"))[:50]  # Limit to first 50 for speed
        selected_ai = random.sample(ai_images, min(NUM_SAMPLES_PER_CATEGORY, len(ai_images)))
        samples.extend([{"path": img, "category": "AI-Generated"} for img in selected_ai])
    
    # Select from real folder
    real_folder = DATASET_PATH / "real"
    if real_folder.exists():
        real_images = list(real_folder.glob("*.jpg"))[:50]
        selected_real = random.sample(real_images, min(NUM_SAMPLES_PER_CATEGORY, len(real_images)))
        samples.extend([{"path": img, "category": "Real"} for img in selected_real])
    
    return samples

def test_reverse_search(image_path, category):
    """Test reverse search on a single image"""
    print(f"\n{'─'*70}")
    print(f"📸 Testing: {image_path.name}")
    print(f"   Category: {category}")
    
    try:
        # Read image and encode to base64
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Prepare JSON payload
        payload = {
            "media": image_base64,
            "filename": image_path.name
        }
        
        # Make request
        start_time = time.time()
        response = requests.post(
            f"{REVERSE_SEARCH_URL}/search",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            
            # Display results
            print(f"   ✅ Search completed in {elapsed_time:.2f}s")
            print(f"\n   📊 Results:")
            print(f"      Total matches: {result.get('totalMatches', 0)}")
            print(f"      Has similar: {result.get('hasSimilarImages', False)}")
            print(f"      Confidence: {result.get('overallConfidence', 0):.2f}")
            
            # Show top matches
            matches = result.get('matches', [])
            if matches:
                print(f"\n   🔍 Top {min(3, len(matches))} matches:")
                for i, match in enumerate(matches[:3], 1):
                    print(f"      {i}. {match.get('title', 'N/A')[:50]}")
                    print(f"         Source: {match.get('source', 'N/A')}")
                    print(f"         URL: {match.get('url', 'N/A')[:60]}...")
                    print(f"         Confidence: {match.get('confidence', 0):.2f}")
            else:
                print(f"   ℹ️  No similar images found")
            
            return {
                "success": True,
                "category": category,
                "elapsed_time": elapsed_time,
                "total_matches": result.get('totalMatches', 0),
                "has_similar": result.get('hasSimilarImages', False),
                "confidence": result.get('overallConfidence', 0)
            }
        else:
            print(f"   ❌ Search failed: {response.status_code}")
            print(f"      Response: {response.text[:200]}")
            return {
                "success": False,
                "category": category,
                "elapsed_time": elapsed_time,
                "error": response.text
            }
            
    except requests.exceptions.Timeout:
        print(f"   ⏱️  Request timeout (>30s)")
        return {"success": False, "category": category, "error": "timeout"}
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return {"success": False, "category": category, "error": str(e)}

def print_summary(results):
    """Print test summary"""
    print("\n" + "="*70)
    print("  📊 TEST SUMMARY")
    print("="*70)
    
    successful = [r for r in results if r.get("success")]
    failed = [r for r in results if not r.get("success")]
    
    print(f"\n✅ Successful: {len(successful)}/{len(results)}")
    print(f"❌ Failed: {len(failed)}/{len(results)}")
    
    if successful:
        avg_time = sum(r.get("elapsed_time", 0) for r in successful) / len(successful)
        total_matches = sum(r.get("total_matches", 0) for r in successful)
        with_matches = len([r for r in successful if r.get("has_similar")])
        
        print(f"\n⏱️  Average time: {avg_time:.2f}s")
        print(f"🔍 Total matches found: {total_matches}")
        print(f"📈 Images with matches: {with_matches}/{len(successful)}")
        
        # Category breakdown
        ai_results = [r for r in successful if r.get("category") == "AI-Generated"]
        real_results = [r for r in successful if r.get("category") == "Real"]
        
        if ai_results:
            ai_matches = sum(r.get("total_matches", 0) for r in ai_results)
            print(f"\n🤖 AI-Generated images:")
            print(f"   Tested: {len(ai_results)}")
            print(f"   Matches found: {ai_matches}")
            print(f"   Avg matches/image: {ai_matches/len(ai_results):.1f}")
        
        if real_results:
            real_matches = sum(r.get("total_matches", 0) for r in real_results)
            print(f"\n📷 Real images:")
            print(f"   Tested: {len(real_results)}")
            print(f"   Matches found: {real_matches}")
            print(f"   Avg matches/image: {real_matches/len(real_results):.1f}")
    
    if failed:
        print(f"\n⚠️  Failed tests:")
        for r in failed:
            print(f"   • Category: {r.get('category')}, Error: {r.get('error', 'Unknown')[:50]}")
    
    print("\n" + "="*70)

def main():
    print("\n" + "="*70)
    print("  🔍 REVERSE SEARCH SERVICE TEST")
    print("="*70)
    print(f"\nService URL: {REVERSE_SEARCH_URL}")
    print(f"Dataset: {DATASET_PATH}")
    print(f"Samples per category: {NUM_SAMPLES_PER_CATEGORY}")
    
    # Health check
    if not test_health_check():
        print("\n❌ Cannot proceed without service running.")
        print("   Start the service first:")
        print("   cd services/reverse-search && python main.py")
        return
    
    # Select samples
    print("\n" + "="*70)
    print("  📂 SELECTING SAMPLE IMAGES")
    print("="*70)
    
    samples = select_sample_images()
    if not samples:
        print("❌ No images found in dataset!")
        print(f"   Expected path: {DATASET_PATH}")
        return
    
    print(f"\n✅ Selected {len(samples)} sample images:")
    ai_count = len([s for s in samples if s['category'] == 'AI-Generated'])
    real_count = len([s for s in samples if s['category'] == 'Real'])
    print(f"   • AI-Generated: {ai_count}")
    print(f"   • Real: {real_count}")
    
    # Run tests
    print("\n" + "="*70)
    print("  🧪 RUNNING TESTS")
    print("="*70)
    
    results = []
    for sample in samples:
        result = test_reverse_search(sample['path'], sample['category'])
        results.append(result)
        time.sleep(0.5)  # Small delay between requests
    
    # Print summary
    print_summary(results)
    
    print("\n✅ Test complete!")

if __name__ == "__main__":
    main()

