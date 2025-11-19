"""Test chi tiết một ảnh"""
import requests
import base64
import json
from pathlib import Path
import sys

def test_image_detailed(image_path):
    """Test một ảnh với output chi tiết"""
    print("=" * 80)
    print(f"🔍 DETAILED ANALYSIS: {Path(image_path).name}")
    print("=" * 80)
    
    # Đọc image
    with open(image_path, 'rb') as f:
        img_bytes = f.read()
    img_b64 = base64.b64encode(img_bytes).decode('utf-8')
    
    print(f"\n📊 File size: {len(img_bytes):,} bytes")
    
    # Call detection
    response = requests.post(
        'http://localhost:8001/detect',
        json={'media': img_b64},
        timeout=30
    )
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return
    
    result = response.json()
    
    # Main verdict
    print(f"\n{'='*80}")
    print(f"📊 VERDICT: {result['verdict']}")
    print(f"   Confidence: {result['confidence']:.2%}")
    print(f"{'='*80}")
    
    # Model scores
    scores = result['modelScores']
    print(f"\n🤖 MODEL SCORES:")
    print(f"   AI Generated Score:  {scores.get('ai_generated_score', 0):.4f}")
    print(f"   Deepfake Score:      {scores.get('deepfake_score', 0):.4f}")
    print(f"   Manipulation Score:  {scores.get('manipulation_score', 0):.4f}")
    print(f"   Authenticity Score:  {scores.get('authenticity_score', 0):.4f}")
    
    # Model predictions
    if 'primary_predictions' in scores:
        print(f"\n🎯 PRIMARY MODEL PREDICTIONS:")
        for pred in scores['primary_predictions']:
            bar = "█" * int(pred['score'] * 50)
            print(f"   {pred['label']:15s} {pred['score']:6.2%} {bar}")
    
    # Forensic analysis - DETAILED
    forensics = result['forensicAnalysis']
    print(f"\n🔍 FORENSIC ANALYSIS (DETAILED):")
    print(f"   Image dimensions: {forensics.get('width')}x{forensics.get('height')}")
    print(f"   Format: {forensics.get('format')}")
    print(f"   Mode: {forensics.get('mode')}")
    print()
    print(f"   📷 EXIF Analysis:")
    print(f"      Has EXIF data:       {forensics.get('has_exif', False)}")
    print(f"      EXIF fields count:   {forensics.get('exif_fields_count', 0)}")
    print(f"      Has editing software: {forensics.get('has_editing_software', False)}")
    print(f"      EXIF suspicious:     {forensics.get('exif_suspicious', False)}")
    
    if forensics.get('exif_data'):
        print(f"      EXIF data: {json.dumps(forensics['exif_data'], indent=6)}")
    
    print(f"\n   🔬 Noise Analysis:")
    print(f"      Noise level:         {forensics.get('noise_level', 0):.6f}")
    print(f"      Laplacian variance:  {forensics.get('laplacian_variance', 0):.6f}")
    print(f"      Uniform noise:       {forensics.get('uniform_noise_pattern', False)}")
    
    print(f"\n   📦 Compression Analysis:")
    print(f"      Block variance std:  {forensics.get('block_variance_std', 0):.6f}")
    print(f"      Inconsistent comp:   {forensics.get('inconsistent_compression', False)}")
    print(f"      Artifacts detected:  {forensics.get('compression_artifacts_detected', False)}")
    
    print(f"\n   🎨 Color Analysis:")
    color_std = forensics.get('color_channel_std', {})
    print(f"      Red channel std:     {color_std.get('red', 0):.6f}")
    print(f"      Green channel std:   {color_std.get('green', 0):.6f}")
    print(f"      Blue channel std:    {color_std.get('blue', 0):.6f}")
    print(f"      Region consistency:  {forensics.get('region_color_consistency', 0):.6f}")
    print(f"      Color inconsistent:  {forensics.get('color_inconsistencies', False)}")
    print(f"      Unnaturally consist: {forensics.get('unnaturally_consistent', False)}")
    
    print(f"\n   ✂️ Edge Analysis:")
    print(f"      Edge density:        {forensics.get('edge_density', 0):.6f}")
    print(f"      Avg edge strength:   {forensics.get('average_edge_strength', 0):.6f}")
    print(f"      Edge artifacts:      {forensics.get('edge_artifacts', False)}")
    
    print(f"\n   ⚠️  FINAL MANIPULATION LIKELIHOOD: {forensics.get('manipulation_likelihood', 0):.1%}")
    
    print(f"\n{'='*80}")
    
    # Analysis
    print(f"\n💡 ANALYSIS:")
    if result['verdict'] == 'MANIPULATED':
        print("   ✅ Correctly identified as MANIPULATED")
    elif result['verdict'] == 'AI_GENERATED':
        print("   ⚠️  Identified as AI_GENERATED (may also be manipulated)")
    else:
        print("   ❌ Identified as REAL - FALSE NEGATIVE!")
        print("   🔍 Forensics should have caught this:")
        if forensics.get('manipulation_likelihood', 0) > 0.5:
            print(f"      - Manipulation likelihood is {forensics.get('manipulation_likelihood', 0):.1%}")
        if forensics.get('exif_suspicious'):
            print("      - EXIF is suspicious")
        if forensics.get('compression_artifacts_detected'):
            print("      - Compression artifacts detected")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        image_path = "test-images/unknown/Anh trên TikTok.jpeg"
    
    test_image_detailed(image_path)

