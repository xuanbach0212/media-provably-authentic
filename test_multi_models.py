"""
Multi-Model Comparison Test
Tests 6 different HuggingFace models on the same dataset
"""
import requests
import base64
from pathlib import Path
import json
import time
from datetime import datetime
import sys

class ModelTester:
    def __init__(self, api_url="http://localhost:8001"):
        self.api_url = api_url
        self.results = {}
        
    def wait_for_service(self, max_retries=30):
        """Wait for service to be ready"""
        print("Waiting for service to be ready...")
        for i in range(max_retries):
            try:
                response = requests.get(f"{self.api_url}/health", timeout=2)
                if response.status_code == 200:
                    print("✓ Service is ready")
                    return True
            except:
                pass
            time.sleep(1)
        return False
    
    def get_current_model(self):
        """Get currently loaded model"""
        try:
            response = requests.get(f"{self.api_url}/models/status", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('loaded_models'):
                    return data['loaded_models'][0]
        except:
            pass
        return None
    
    def detect_image(self, image_path):
        """Detect a single image"""
        try:
            with open(image_path, 'rb') as f:
                img_bytes = f.read()
            img_b64 = base64.b64encode(img_bytes).decode('utf-8')
            
            start_time = time.time()
            response = requests.post(
                f"{self.api_url}/detect",
                json={'media': img_b64},
                timeout=60
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'predicted': result['verdict'],
                    'confidence': result['confidence'],
                    'ai_score': result['modelScores'].get('ai_generated_score', 0),
                    'elapsed': elapsed
                }
            else:
                return {'success': False, 'error': f"HTTP {response.status_code}"}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def test_model_on_dataset(self, model_name, image_paths, ground_truths):
        """Test a specific model on dataset"""
        print(f"\n{'='*70}")
        print(f"Testing: {model_name}")
        print(f"{'='*70}")
        
        results = []
        start_time = time.time()
        
        for i, (img_path, gt) in enumerate(zip(image_paths, ground_truths)):
            if (i + 1) % 10 == 0:
                print(f"Progress: {i+1}/{len(image_paths)}")
            
            result = self.detect_image(img_path)
            if result['success']:
                results.append({
                    'ground_truth': gt,
                    'predicted': result['predicted'],
                    'ai_score': result['ai_score'],
                    'elapsed': result['elapsed']
                })
        
        total_time = time.time() - start_time
        
        # Calculate metrics
        if not results:
            print("✗ No successful detections")
            return None
        
        # Normalize predictions
        def normalize(verdict):
            if verdict == "AI_GENERATED":
                return "ai-generated"
            return "real"
        
        correct = sum(1 for r in results if normalize(r['predicted']) == r['ground_truth'])
        total = len(results)
        accuracy = correct / total * 100
        
        # Per-category
        real_results = [r for r in results if r['ground_truth'] == 'real']
        ai_results = [r for r in results if r['ground_truth'] == 'ai-generated']
        
        real_correct = sum(1 for r in real_results if normalize(r['predicted']) == 'real')
        ai_correct = sum(1 for r in ai_results if normalize(r['predicted']) == 'ai-generated')
        
        real_acc = (real_correct / len(real_results) * 100) if real_results else 0
        ai_acc = (ai_correct / len(ai_results) * 100) if ai_results else 0
        
        avg_time = sum(r['elapsed'] for r in results) / len(results)
        
        metrics = {
            'model': model_name,
            'total_tested': total,
            'overall_accuracy': accuracy,
            'real_accuracy': real_acc,
            'ai_accuracy': ai_acc,
            'avg_time_per_image': avg_time,
            'total_time': total_time,
            'real_correct': real_correct,
            'real_total': len(real_results),
            'ai_correct': ai_correct,
            'ai_total': len(ai_results)
        }
        
        # Print results
        print(f"\n📊 Results:")
        print(f"   Overall Accuracy: {accuracy:.1f}%")
        print(f"   Real Images:      {real_acc:.1f}% ({real_correct}/{len(real_results)})")
        print(f"   AI-Generated:     {ai_acc:.1f}% ({ai_correct}/{len(ai_results)})")
        print(f"   Avg Time:         {avg_time:.3f}s per image")
        print(f"   Total Time:       {total_time:.1f}s")
        
        return metrics
    
    def print_comparison_table(self, all_results):
        """Print comparison table"""
        print("\n" + "="*100)
        print("MODEL COMPARISON RESULTS")
        print("="*100)
        print(f"\n{'Model':<45} | {'Overall':>8} | {'Real':>8} | {'AI':>8} | {'Time/img':>9}")
        print("-"*100)
        
        for result in all_results:
            print(f"{result['model']:<45} | {result['overall_accuracy']:7.1f}% | "
                  f"{result['real_accuracy']:7.1f}% | {result['ai_accuracy']:7.1f}% | "
                  f"{result['avg_time_per_image']:8.3f}s")
        
        print("="*100)
        
        # Find best models
        best_overall = max(all_results, key=lambda x: x['overall_accuracy'])
        best_ai = max(all_results, key=lambda x: x['ai_accuracy'])
        fastest = min(all_results, key=lambda x: x['avg_time_per_image'])
        
        print(f"\n🏆 BEST MODELS:")
        print(f"   Best Overall:     {best_overall['model']} ({best_overall['overall_accuracy']:.1f}%)")
        print(f"   Best AI Detection: {best_ai['model']} ({best_ai['ai_accuracy']:.1f}%)")
        print(f"   Fastest:          {fastest['model']} ({fastest['avg_time_per_image']:.3f}s)")
        
        return best_overall, best_ai, fastest


def main():
    # Models to test
    models_to_test = [
        ("umm-maybe/AI-image-detector", "primary"),
        ("dima806/deepfake_vs_real_image_detection", "deepfake"),
        ("Organika/sdxl-detector", "sdxl"),
        ("openai/clip-vit-base-patch32", "clip"),
        ("google/vit-base-patch16-224", "vit"),
        ("microsoft/resnet-50", "resnet"),
    ]
    
    # Prepare dataset
    dataset_dir = Path('test-images/dataset')
    image_data = []
    
    # Sample 50 real
    real_dir = dataset_dir / 'real'
    if real_dir.exists():
        real_images = list(real_dir.glob('**/*.jpg'))[:50]
        for img in real_images:
            image_data.append((img, 'real'))
    
    # Sample 50 AI
    ai_dir = dataset_dir / 'ai-generated'
    if ai_dir.exists():
        ai_images = list(ai_dir.glob('**/*.jpg'))[:50]
        for img in ai_images:
            image_data.append((img, 'ai-generated'))
    
    if not image_data:
        print("✗ No images found")
        return
    
    print(f"Testing {len(image_data)} images with {len(models_to_test)} models")
    print(f"Estimated time: ~{len(models_to_test) * 2} minutes")
    
    image_paths = [img for img, _ in image_data]
    ground_truths = [gt for _, gt in image_data]
    
    # Test each model
    tester = ModelTester()
    all_results = []
    
    for model_name, model_key in models_to_test:
        print(f"\n\n{'#'*70}")
        print(f"# MODEL {len(all_results)+1}/{len(models_to_test)}: {model_name}")
        print(f"{'#'*70}")
        
        # Note: In real implementation, would need to restart service with different model
        # For now, we test with currently loaded model
        # User needs to manually change model in config and restart service
        
        input(f"\nPress Enter when service is running with {model_name}...")
        
        if not tester.wait_for_service():
            print(f"✗ Service not ready, skipping {model_name}")
            continue
        
        current = tester.get_current_model()
        print(f"Current model: {current}")
        
        metrics = tester.test_model_on_dataset(model_name, image_paths, ground_truths)
        if metrics:
            all_results.append(metrics)
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"model_comparison_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump({
            'timestamp': timestamp,
            'total_images': len(image_data),
            'models_tested': len(all_results),
            'results': all_results
        }, f, indent=2)
    
    print(f"\n💾 Results saved to {results_file}")
    
    # Print comparison
    if all_results:
        tester.print_comparison_table(all_results)


if __name__ == "__main__":
    main()

