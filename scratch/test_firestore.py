import json
import urllib.request
import urllib.error

PROJECT_ID = "sdg-web-d07ac"
API_KEY = "AIzaSyBCfgDS0NliRN3LJR2cOie6y9N4YONtTR8"

url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/test_collection/test_doc?key={API_KEY}"

payload = {
    "fields": {
        "message": {"stringValue": "Connection Successful"},
        "timestamp": {"stringValue": "2026-08-17T12:15:00Z"}
    }
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={"Content-Type": "application/json"},
    method="PATCH"
)

try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.status, response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.read().decode())
except Exception as e:
    print("Error:", e)
