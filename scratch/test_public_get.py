import urllib.request
import json

PROJECT_ID = "sdg-web-d07ac"
url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/pages/home"

print(f"Testing public GET fetch for pages/home:")
try:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Status: 200 OK")
        fields = data.get("fields", {})
        print("Fields in Firestore for pages/home:")
        for k in fields:
            print(f"  - {k}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
