import urllib.request
import json

PROJECT_ID = "sdg-web-d07ac"
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

TEST_DOCS = [
    ("pages", "home"),
    ("pages", "announcements"),
    ("pages", "sdg_dashboard_2025"),
    ("pages", "smart_eco_campus"),
    ("pages", "rankings"),
    ("pages", "partnerships"),
    ("pages", "impact_2025"),
    ("pages", "research_2025"),
    ("sdg_narratives", "1_2025"),
    ("announcements", "ann_2025_01")
]

print("=== Testing Public GET Endpoints in Firestore ===")
for col, doc_id in TEST_DOCS:
    url = f"{BASE}/{col}/{doc_id}"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            field_count = len(data.get("fields", {}))
            print(f"  [PASS] {col}/{doc_id} -> HTTP {resp.status} (Contains {field_count} fields)")
    except urllib.error.HTTPError as e:
        print(f"  [FAIL] {col}/{doc_id} -> HTTP {e.code}")
    except Exception as e:
        print(f"  [FAIL] {col}/{doc_id} -> Error: {e}")
