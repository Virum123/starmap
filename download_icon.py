
import os
import urllib.request

# Create directory
if not os.path.exists('static/icons'):
    os.makedirs('static/icons')

# Download Starbucks Logo
url = "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png"
print("Downloading logo...")

try:
    # Save as icon (using original size for simplicity, browsers usually scale it down)
    urllib.request.urlretrieve(url, "static/icons/icon-192x192.png")
    urllib.request.urlretrieve(url, "static/icons/icon-512x512.png")
    print("Icons downloaded successfully to static/icons/")
except Exception as e:
    print(f"Error downloading icon: {e}")
