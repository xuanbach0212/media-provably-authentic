"""
Batch AI Detection Testing for Large Datasets
Supports parallel processing and progress tracking
"""
import requests
import base64
from pathlib import Path
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import time
from datetime import datetime
import csv

class BatchDetector:
    def __init__(self, api_url="http://localhost:8001/detect", max_workers=10):
        self.api_url = api_url
        self.max_workers = max_workers
        self.results = []
        
    def detect_image(self, image_path, ground_truth):
        """Detect a single image"""
        try:
            # Read and encode
            with open(image_path, 'rb') as f:
                img_bytes = f.read()
            img_b64 = base64.b64encode(img_bytes).decode('utf-8')
            
            # Call API
            start_time = time.time()
            response = requests.post(
                self.api_url,
                json={'media': img_b64},
                timeout=60
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'filename': image_path.name,
                    'path': str(image_path),
                    'ground_truth': ground_truth,
                    'predicted': result['verdict'],
                    'confidence': result['confidence'],
                    'ai_score': result['modelScores'].get('ai_generated_score', 0),
                    'elapsed_time': elapsed,
                    'success': True
                }
            else:
                return {
                    'filename': image_path.name,
                    'path': str(image_path),
                    'ground_truth': ground_truth,
                    'error': f"HTTP {response.status_code}",
                    'success': False
                }
                
        except Exception as e:
            return {
                'filename': image_path.name,
                'path': str(image_path),
                'ground_truth': ground_truth,
                'error': str(e),
                'success': False
            }
    
    def process_batch(self, image_paths, ground_truths, batch_size=100):
        """Process images in batches with parallel execution"""
        results = []
        
        print(f"\n🚀 Processing {len(image_paths)} images with {self.max_workers} workers...")
        print(f"📦 Batch size: {batch_size}")
        
        # Process in batches to avoid memory issues
        for i in range(0, len(image_paths), batch_size):
            batch_paths = image_paths[i:i+batch_size]
            batch_truths = ground_truths[i:i+batch_size]
            
            print(f"\n📊 Batch {i//batch_size + 1}/{(len(image_paths)-1)//batch_size + 1}")
            
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                # Submit all tasks
                futures = {
                    executor.submit(self.detect_image, path, truth): (path, truth)
                    for path, truth in zip(batch_paths, batch_truths)
                }
                
                # Process results with progress bar
                for future in tqdm(as_completed(futures), total=len(futures), desc="Detecting"):
                    result = future.result()
                    results.append(result)
            
            # Save intermediate results
            self.save_results(results, f"results_batch_{i//batch_size + 1}.json")
        
        self.results = results
        return results
    
    def save_results(self, results, filename="batch_results.json"):
        """Save results to JSON"""
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"💾 Saved to {filename}")
    
    def save_csv(self, results, filename="batch_results.csv"):
        """Save results to CSV"""
        if not results:
            return
        
        with open(filename, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=results[0].keys())
            writer.writeheader()
            writer.writerows(results)
        print(f"📊 CSV saved to {filename}")
    
    def calculate_metrics(self, results):
        """Calculate accuracy metrics"""
        successful = [r for r in results if r.get('success')]
        total = len(successful)
        
        if total == 0:
            print("❌ No successful detections")
            return
        
        # Map predictions to categories
        def normalize_verdict(verdict):
            if verdict == "AI_GENERATED":
                return "ai-generated"
            elif verdict in ["REAL", "MANIPULATED"]:
                return "real"
            return verdict.lower()
        
        # Calculate metrics
        correct = sum(1 for r in successful 
                     if normalize_verdict(r['predicted']) == r['ground_truth'])
        
        accuracy = correct / total * 100
        
        # Per-category metrics
        categories = {}
        for r in successful:
            gt = r['ground_truth']
            if gt not in categories:
                categories[gt] = {'total': 0, 'correct': 0}
            categories[gt]['total'] += 1
            if normalize_verdict(r['predicted']) == gt:
                categories[gt]['correct'] += 1
        
        # Calculate average processing time
        avg_time = sum(r.get('elapsed_time', 0) for r in successful) / total
        
        # Print results
        print("\n" + "="*70)
        print("📊 DETECTION METRICS")
        print("="*70)
        print(f"\n📈 Overall Performance:")
        print(f"   Total images: {len(results)}")
        print(f"   Successful: {total}")
        print(f"   Failed: {len(results) - total}")
        print(f"   Accuracy: {accuracy:.2f}%")
        print(f"   Avg time: {avg_time:.3f}s per image")
        print(f"   Throughput: {1/avg_time:.2f} images/sec")
        
        print(f"\n📊 Per-Category Accuracy:")
        for cat, metrics in categories.items():
            cat_acc = metrics['correct'] / metrics['total'] * 100
            print(f"   {cat:15s} {cat_acc:6.2f}% ({metrics['correct']}/{metrics['total']})")
        
        # Confusion matrix
        print(f"\n🔀 Predictions Breakdown:")
        predictions = {}
        for r in successful:
            pred = normalize_verdict(r['predicted'])
            if pred not in predictions:
                predictions[pred] = 0
            predictions[pred] += 1
        
        for pred, count in predictions.items():
            print(f"   {pred:15s} {count:6d} ({count/total*100:.1f}%)")
        
        print("="*70)
        
        return {
            'total': len(results),
            'successful': total,
            'accuracy': accuracy,
            'avg_time': avg_time,
            'categories': categories
        }

def main():
    # Configuration
    dataset_dir = Path('test-images/dataset')
    
    print("="*70)
    print("🔍 BATCH AI DETECTION TEST")
    print("="*70)
    
    # Collect all images
    image_data = []
    
    # Real images
    real_dir = dataset_dir / 'real'
    if real_dir.exists():
        real_images = list(real_dir.glob('**/*.jpg')) + \
                     list(real_dir.glob('**/*.jpeg')) + \
                     list(real_dir.glob('**/*.png'))
        for img in real_images:
            image_data.append((img, 'real'))
        print(f"📁 Found {len(real_images)} real images")
    
    # AI-generated images
    ai_dir = dataset_dir / 'ai-generated'
    if ai_dir.exists():
        ai_images = list(ai_dir.glob('**/*.jpg')) + \
                   list(ai_dir.glob('**/*.jpeg')) + \
                   list(ai_dir.glob('**/*.png'))
        for img in ai_images:
            image_data.append((img, 'ai-generated'))
        print(f"🤖 Found {len(ai_images)} AI-generated images")
    
    if not image_data:
        print("\n❌ No images found in test-images/dataset/")
        return
    
    total_images = len(image_data)
    print(f"\n📊 Total: {total_images} images")
    
    # Ask for confirmation for large datasets
    if total_images > 1000:
        print(f"\n⚠️  This is a large dataset ({total_images} images)")
        print(f"   Estimated time: ~{total_images * 0.5 / 60:.1f} minutes")
        response = input("   Continue? (y/n): ")
        if response.lower() != 'y':
            print("Cancelled")
            return
    
    # Create detector
    detector = BatchDetector(max_workers=5)  # Adjust workers based on your system
    
    # Split paths and ground truths
    image_paths = [img for img, _ in image_data]
    ground_truths = [gt for _, gt in image_data]
    
    # Process
    start_time = time.time()
    results = detector.process_batch(image_paths, ground_truths, batch_size=100)
    total_time = time.time() - start_time
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    detector.save_results(results, f"batch_results_{timestamp}.json")
    detector.save_csv(results, f"batch_results_{timestamp}.csv")
    
    # Calculate metrics
    metrics = detector.calculate_metrics(results)
    
    print(f"\n⏱️  Total time: {total_time/60:.2f} minutes")
    print(f"✅ Results saved with timestamp: {timestamp}")

if __name__ == "__main__":
    main()

