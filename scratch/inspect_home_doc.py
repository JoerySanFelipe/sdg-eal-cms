import urllib.request
import json

PROJECT_ID = "sdg-web-d07ac"
url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/pages/home"

req = urllib.request.Request(url, headers={"Accept": "application/json"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("Document data in Firestore for pages/home:")
    print(json.dumps(data, indent=2))
