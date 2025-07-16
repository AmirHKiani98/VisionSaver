#!/usr/bin/env python
"""
Test script for RTSP recording functionality
"""
import os
import sys
import django
import dotenv

# Load environment variables
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.hc_to_app_env'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.processor.settings')
django.setup()

from record.rtsp_object import RTSPObject

def test_rtsp_recording():
    """Test RTSP recording with the problematic URL"""
    
    # Test URLs
    test_urls = [
        "rtsp://admin:admin@192.168.130.110/Stream2",  # Problematic URL
        "rtsp://192.168.29.108/cam1"  # Working URL
    ]
    
    for url in test_urls:
        print(f"\n🔧 Testing RTSP recording for: {url}")
        try:
            rtsp_obj = RTSPObject(url)
            output_file = f"test_recording_{url.split('/')[-1].replace(':', '_')}.mp4"
            
            print(f"📹 Starting 1-minute recording to: {output_file}")
            # Record for 1 minute for quick testing
            rtsp_obj.record(1, output_file)
            
            # Check file size
            if os.path.exists(output_file):
                file_size = os.path.getsize(output_file)
                print(f"✅ Recording completed. File size: {file_size} bytes")
                
                # Clean up test file
                os.remove(output_file)
                print(f"🗑️ Cleaned up test file")
            else:
                print("❌ Recording file was not created")
                
        except Exception as e:
            print(f"❌ Error testing {url}: {e}")

if __name__ == "__main__":
    test_rtsp_recording()
