"""
Screenshot infographic variations to PNG using Python Playwright.
"""

import os
import sys
from playwright.sync_api import sync_playwright

VARIATIONS = [
    {
        "html": r"F:\Opencode Projects\Hair Restoration\Media\tools\infographic-v2.html",
        "output": r"F:\Opencode Projects\Hair Restoration\Media\.tmp\nizoral-vs-nioxin-pin-v2.png",
    },
    {
        "html": r"F:\Opencode Projects\Hair Restoration\Media\tools\infographic-v3.html",
        "output": r"F:\Opencode Projects\Hair Restoration\Media\.tmp\nizoral-vs-nioxin-pin-v3.png",
    },
]

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        for v in VARIATIONS:
            html_url = "file:///" + v["html"].replace("\\", "/")
            print(f"Rendering: {html_url}")
            
            page = browser.new_page(viewport={"width": 1000, "height": 1500})
            page.goto(html_url, wait_until="networkidle")
            page.wait_for_timeout(2000)
            
            page.screenshot(
                path=v["output"],
                clip={"x": 0, "y": 0, "width": 1000, "height": 1500},
                type="png"
            )
            page.close()
            
            size = os.path.getsize(v["output"])
            print(f"  Saved: {v['output']} ({size:,} bytes)")
        
        browser.close()
    print("Done!")

if __name__ == "__main__":
    main()
