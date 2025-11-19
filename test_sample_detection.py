"""
Quick sample test with small subset of dataset
"""
import sys
from pathlib import Path
import random

# Import from batch detector
sys.path.insert(0, str(Path(__file__).parent))
from test_batch_detection import BatchDetector

def main():
    dataset_dir = Path('test-images/dataset')
    
    print("="*70)
    print("🧪 SAMPLE TEST - Quick Validation")
    print("="*70)
    
    # Collect sample images
    sample_size = 100  # Test with 100 images first
    image_data = []
    
    # Sample from real
    real_dir = dataset_dir / 'real'
    if real_dir.exists():
        real_images = list(real_dir.glob('**/*.jpg'))[:50]
        for img in real_images:
            image_data.append((img, 'real'))
        print(f"📁 Sampled {len(real_images)} real images")
    
    # Sample from AI-generated
    ai_dir = dataset_dir / 'ai-generated'
    if ai_dir.exists():
        ai_images = list(ai_dir.glob('**/*.jpg'))[:50]
        for img in ai_images:
            image_data.append((img, 'ai-generated'))
        print(f"🤖 Sampled {len(ai_images)} AI-generated images")
    
    if not image_data:
        print("❌ No images found")
        return
    
    # Shuffle
    random.shuffle(image_data)
    
    print(f"\n📊 Testing with {len(image_data)} images...")
    
    # Create detector
    detector = BatchDetector(max_workers=5)
    
    # Process
    image_paths = [img for img, _ in image_data]
    ground_truths = [gt for _, gt in image_data]
    
    results = detector.process_batch(image_paths, ground_truths, batch_size=50)
    
    # Calculate metrics
    detector.calculate_metrics(results)
    
    # Save
    detector.save_results(results, "sample_results.json")
    detector.save_csv(results, "sample_results.csv")

if __name__ == "__main__":
    main()

