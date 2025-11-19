"""Test AI Detection với hình ảnh thực từ test-images folder"""
import requests
import base64
from pathlib import Path
import json

def detect_image(image_path):
    """Detect một hình ảnh"""
    # Đọc và encode image
    with open(image_path, 'rb') as f:
        img_bytes = f.read()
    img_b64 = base64.b64encode(img_bytes).decode('utf-8')
    
    # Gọi API
    response = requests.post(
        'http://localhost:8001/detect',
        json={'media': img_b64},
        timeout=30
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        return None

def main():
    test_dir = Path('test-images')
    
    print("=" * 70)
    print("🔍 AI DETECTION TEST - Real Images")
    print("=" * 70)
    
    # Tìm tất cả images trong test-images
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.webp']
    all_images = []
    for ext in image_extensions:
        all_images.extend(test_dir.rglob(ext))
    
    if not all_images:
        print("\n⚠️  Không tìm thấy hình ảnh trong test-images/")
        print("   Vui lòng thêm ảnh vào:")
        print("   - test-images/real/         (ảnh thật)")
        print("   - test-images/ai-generated/ (ảnh AI)")
        print("   - test-images/manipulated/  (ảnh đã chỉnh sửa)")
        print("   - test-images/unknown/      (ảnh cần test)")
        return
    
    print(f"\n📁 Tìm thấy {len(all_images)} hình ảnh")
    print()
    
    # Test từng ảnh
    for img_path in sorted(all_images):
        category = img_path.parent.name
        filename = img_path.name
        
        print(f"\n{'─' * 70}")
        print(f"📸 {category}/{filename}")
        
        result = detect_image(img_path)
        
        if result:
            verdict = result['verdict']
            confidence = result['confidence']
            scores = result['modelScores']
            
            # Icon theo verdict
            icon = "✅" if verdict == "REAL" else "🤖" if verdict == "AI_GENERATED" else "⚠️"
            
            print(f"   {icon} Verdict: {verdict} ({confidence:.1%})")
            print(f"   🎯 AI Score: {scores.get('ai_generated_score', 0):.3f}")
            print(f"   🎭 Deepfake: {scores.get('deepfake_score', 0):.3f}")
            
            # Model predictions nếu có
            if 'primary_predictions' in scores:
                top = scores['primary_predictions'][0]
                print(f"   🔝 Top: {top['label']} ({top['score']:.1%})")
        else:
            print("   ❌ Detection failed")
    
    print(f"\n{'=' * 70}")
    print("✅ Test hoàn tất")
    print(f"{'=' * 70}")

if __name__ == "__main__":
    main()

