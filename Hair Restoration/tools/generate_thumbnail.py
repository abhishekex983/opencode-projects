#!/usr/bin/env python3
"""
YouTube Short Thumbnail Generator using Kie.ai GPT Image 2 API
Generates a bold, attention-grabbing thumbnail for Hair Restoration content.
"""

import requests
import time
import json
import os
from datetime import datetime

# Configuration
API_KEY = "5affbda25e59469c0043f85c2828f71a"
BASE_URL = "https://api.kie.ai/api/v1"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".tmp")

# Thumbnail prompt
PROMPT = """Bold YouTube Shorts thumbnail, abstract style. Dark navy blue (#002444) background with dramatic lighting and depth.

Central text: "Does Low Vitamin D Cause Hair Thinning?" in bold white Plus Jakarta Sans font, large and eye-catching, positioned prominently.

Abstract visual elements: glowing vitamin D supplement capsule or golden sunlight rays, hair strand silhouettes flowing, subtle molecular/scientific DNA patterns. Crimson red (#B91C1C) accent highlights and glowing effects on key elements.

Style: Clean, modern, high-contrast, clickbait-worthy, professional health/wellness aesthetic. Sharp text rendering. No watermarks. Cinematic lighting."""

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}


def submit_task():
    """Submit text-to-image generation task to Kie.ai API."""
    print("[1/3] Submitting thumbnail generation task...")
    
    payload = {
        "model": "gpt-image-2-text-to-image",
        "input": {
            "prompt": PROMPT,
            "aspect_ratio": "9:16"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/jobs/createTask",
            headers=HEADERS,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        if data.get("code") == 200 and data.get("data", {}).get("taskId"):
            task_id = data["data"]["taskId"]
            print(f"   Task submitted successfully. Task ID: {task_id}")
            return task_id
        else:
            print(f"   Error: Unexpected response: {json.dumps(data, indent=2)}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"   Error submitting task: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Response: {e.response.text}")
        return None


def poll_task(task_id, max_attempts=60, interval=5):
    """Poll task status until completion."""
    print(f"[2/3] Polling task status (max {max_attempts} attempts, {interval}s interval)...")
    
    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.get(
                f"{BASE_URL}/jobs/recordInfo?taskId={task_id}",
                headers=HEADERS,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            status = data.get("data", {}).get("state", "unknown")
            print(f"   Attempt {attempt}/{max_attempts}: Status = {status}")
            
            if status in ("done", "success", "completed"):
                result = data.get("data", {})
                result_json = result.get("resultJson", "")
                if result_json:
                    import json as json_lib
                    result_data = json_lib.loads(result_json)
                    urls = result_data.get("resultUrls", [])
                    if urls:
                        image_url = urls[0]
                        print(f"   Generation complete!")
                        return image_url
                print(f"   Completed but no image URL found: {json.dumps(result, indent=2)}")
                return None
                    
            elif status in ("failed", "error", "FAILED", "ERROR"):
                fail_msg = data.get("data", {}).get("failMsg", "Unknown error")
                print(f"   Task failed: {fail_msg}")
                return None
            
            time.sleep(interval)
            
        except requests.exceptions.RequestException as e:
            print(f"   Error polling: {e}")
            time.sleep(interval)
    
    print("   Max attempts reached. Task may still be processing.")
    return None


def download_image(image_url, filename=None):
    """Download the generated image."""
    print(f"[3/3] Downloading image...")
    
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"thumbnail_vitamin_d_hair_{timestamp}.png"
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    try:
        response = requests.get(image_url, timeout=60)
        response.raise_for_status()
        
        with open(filepath, "wb") as f:
            f.write(response.content)
        
        file_size = os.path.getsize(filepath)
        print(f"   Image saved: {filepath}")
        print(f"   File size: {file_size / 1024:.1f} KB")
        return filepath
        
    except requests.exceptions.RequestException as e:
        print(f"   Error downloading: {e}")
        return None


def main():
    """Main execution flow."""
    print("=" * 60)
    print("YouTube Short Thumbnail Generator")
    print("Title: Does Low Vitamin D Cause Hair Thinning?")
    print("Size: 9:16 (864x1536)")
    print("=" * 60)
    print()
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Step 1: Submit task
    task_id = submit_task()
    if not task_id:
        print("\n[FAILED] Could not submit task.")
        return 1
    
    # Step 2: Poll for completion
    image_url = poll_task(task_id)
    if not image_url:
        print("\n[FAILED] Task did not complete or no image URL returned.")
        return 1
    
    # Step 3: Download image
    filepath = download_image(image_url)
    if not filepath:
        print("\n[FAILED] Could not download image.")
        return 1
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Thumbnail generated successfully!")
    print(f"File: {filepath}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    exit(main())
