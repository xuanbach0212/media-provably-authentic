#!/usr/bin/env python3
"""
Automated Multi-Model Testing
Tests all 6 models by automatically restarting the service with each model
"""
import subprocess
import time
import json
import signal
import sys
from pathlib import Path
from test_multi_models import ModelTester
from datetime import datetime

class AutomatedModelTester:
    def __init__(self):
        self.service_dir = Path("services/ai-detection")
        self.config_file = self.service_dir / "config.py"
        self.venv_python = self.service_dir / "venv/bin/python"
        self.service_process = None
        self.tester = ModelTester()
        
        # Models to test
        self.models = [
            ("umm-maybe/AI-image-detector", "primary"),
            ("dima806/deepfake_vs_real_image_detection", "deepfake"),
            ("Organika/sdxl-detector", "sdxl"),
            ("openai/clip-vit-base-patch32", "clip"),
            ("google/vit-base-patch16-224", "vit"),
            ("microsoft/resnet-50", "resnet"),
        ]
    
    def read_config(self):
        """Read current config file"""
        with open(self.config_file, 'r') as f:
            return f.read()
    
    def write_config(self, content):
        """Write config file"""
        with open(self.config_file, 'w') as f:
            f.write(content)
    
    def update_config_model(self, model_key):
        """Update config to use specific model"""
        config = self.read_config()
        
        # Update SINGLE_MODEL_TEST to test this specific model
        import re
        pattern = r'SINGLE_MODEL_TEST = .*'
        replacement = f'SINGLE_MODEL_TEST = "{model_key}"  # Testing {model_key}'
        config = re.sub(pattern, replacement, config)
        
        self.write_config(config)
        print(f"✓ Updated config to use model: {model_key}")
    
    def stop_service(self):
        """Stop the AI detection service"""
        print("Stopping service...")
        subprocess.run(["pkill", "-f", "python.*main.py"], 
                      capture_output=True)
        time.sleep(3)
        print("✓ Service stopped")
    
    def start_service(self):
        """Start the AI detection service"""
        print("Starting service...")
        self.stop_service()
        
        # Start service in background
        cmd = f"cd {self.service_dir} && source venv/bin/activate && python main.py > /tmp/ai-detection-test.log 2>&1 &"
        subprocess.run(cmd, shell=True, executable="/bin/zsh")
        
        # Wait for service to be ready
        if self.tester.wait_for_service(max_retries=60):
            print("✓ Service started successfully")
            return True
        else:
            print("✗ Service failed to start")
            return False
    
    def prepare_dataset(self, num_real=50, num_ai=50):
        """Prepare test dataset"""
        dataset_dir = Path('test-images/dataset')
        image_data = []
        
        # Sample real images
        real_dir = dataset_dir / 'real'
        if real_dir.exists():
            real_images = list(real_dir.glob('**/*.jpg'))[:num_real]
            for img in real_images:
                image_data.append((img, 'real'))
        
        # Sample AI images
        ai_dir = dataset_dir / 'ai-generated'
        if ai_dir.exists():
            ai_images = list(ai_dir.glob('**/*.jpg'))[:num_ai]
            for img in ai_images:
                image_data.append((img, 'ai-generated'))
        
        return image_data
    
    def run_all_tests(self):
        """Run tests for all models"""
        print("\n" + "="*80)
        print("AUTOMATED MULTI-MODEL TESTING")
        print("="*80)
        
        # Prepare dataset once
        image_data = self.prepare_dataset()
        if not image_data:
            print("✗ No images found in test-images/dataset")
            return
        
        image_paths = [img for img, _ in image_data]
        ground_truths = [gt for _, gt in image_data]
        
        print(f"\n📊 Test Configuration:")
        print(f"   Total images: {len(image_data)}")
        print(f"   Models to test: {len(self.models)}")
        print(f"   Estimated time: ~{len(self.models) * 2} minutes")
        
        all_results = []
        
        # Test each model
        for idx, (model_name, model_key) in enumerate(self.models, 1):
            print(f"\n\n{'#'*80}")
            print(f"# TEST {idx}/{len(self.models)}: {model_name}")
            print(f"{'#'*80}")
            
            try:
                # Update config for this model
                self.update_config_model(model_key)
                
                # Restart service
                if not self.start_service():
                    print(f"✗ Failed to start service for {model_name}")
                    continue
                
                # Warm up model
                print("Warming up model...")
                try:
                    subprocess.run(
                        ["curl", "-X", "POST", "-s", "http://localhost:8001/models/warm-up"],
                        capture_output=True,
                        timeout=30
                    )
                    time.sleep(2)
                except:
                    pass
                
                # Test model
                metrics = self.tester.test_model_on_dataset(
                    model_name, image_paths, ground_truths
                )
                
                if metrics:
                    all_results.append(metrics)
                
            except KeyboardInterrupt:
                print("\n\n⚠️  Testing interrupted by user")
                break
            except Exception as e:
                print(f"✗ Error testing {model_name}: {e}")
                continue
        
        # Stop service
        self.stop_service()
        
        # Save and display results
        if all_results:
            self.save_and_display_results(all_results, len(image_data))
        else:
            print("\n✗ No results to display")
    
    def save_and_display_results(self, all_results, total_images):
        """Save results and display comparison"""
        # Save to JSON
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"model_comparison_{timestamp}.json"
        
        results_data = {
            'timestamp': timestamp,
            'total_images': total_images,
            'models_tested': len(all_results),
            'forensics_enabled': False,
            'results': all_results
        }
        
        with open(results_file, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        print(f"\n💾 Results saved to {results_file}")
        
        # Display comparison table
        self.tester.print_comparison_table(all_results)
        
        # Generate recommendation
        self.generate_recommendation(all_results)
    
    def generate_recommendation(self, results):
        """Generate final recommendation"""
        print("\n" + "="*80)
        print("RECOMMENDATIONS")
        print("="*80)
        
        best_overall = max(results, key=lambda x: x['overall_accuracy'])
        best_ai = max(results, key=lambda x: x['ai_accuracy'])
        best_real = max(results, key=lambda x: x['real_accuracy'])
        best_balanced = min(results, key=lambda x: abs(x['ai_accuracy'] - x['real_accuracy']))
        
        print(f"\n🎯 Best for Production:")
        print(f"   Model: {best_overall['model']}")
        print(f"   Overall Accuracy: {best_overall['overall_accuracy']:.1f}%")
        print(f"   Real: {best_overall['real_accuracy']:.1f}% | AI: {best_overall['ai_accuracy']:.1f}%")
        
        print(f"\n⚖️  Most Balanced:")
        print(f"   Model: {best_balanced['model']}")
        print(f"   Real: {best_balanced['real_accuracy']:.1f}% | AI: {best_balanced['ai_accuracy']:.1f}%")
        print(f"   Difference: {abs(best_balanced['ai_accuracy'] - best_balanced['real_accuracy']):.1f}%")
        
        print(f"\n🤖 Best AI Detection:")
        print(f"   Model: {best_ai['model']}")
        print(f"   AI Accuracy: {best_ai['ai_accuracy']:.1f}%")
        
        print(f"\n📸 Best Real Detection:")
        print(f"   Model: {best_real['model']}")
        print(f"   Real Accuracy: {best_real['real_accuracy']:.1f}%")


def main():
    tester = AutomatedModelTester()
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️  Testing interrupted")
        tester.stop_service()
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        tester.stop_service()
        sys.exit(1)


if __name__ == "__main__":
    main()

