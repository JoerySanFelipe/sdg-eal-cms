import json
import urllib.request
import urllib.error

PROJECT_ID = "sdg-web-d07ac"
API_KEY = "AIzaSyBCfgDS0NliRN3LJR2cOie6y9N4YONtTR8"

base_url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

url = f"{base_url}/cms_content?key={API_KEY}"
req = urllib.request.Request(url, headers={"Accept": "application/json"})

print(f"=== Inspecting 'cms_content' Collection ({PROJECT_ID}) ===\n")
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        docs = data.get("documents", [])
        print(f"Total documents in 'cms_content': {len(docs)}\n")
        for d in docs:
            doc_id = d.get("name", "").split("/")[-1]
            fields = d.get("fields", {})
            section_type = fields.get("sectionType", {}).get("stringValue", "N/A")
            section_id = fields.get("sectionId", {}).get("stringValue", "N/A")
            updated_at = fields.get("updatedAt", {}).get("timestampValue", "N/A")
            
            # Extract keys inside 'data' mapValue
            data_map = fields.get("data", {}).get("mapValue", {}).get("fields", {})
            data_keys = list(data_map.keys())
            
            print(f"- Doc ID: {doc_id}")
            print(f"  Type: {section_type} | ID: {section_id} | Updated: {updated_at}")
            print(f"  Data Keys: {', '.join(data_keys)}")
            print("-" * 50)
except Exception as e:
    print(f"Error querying cms_content: {e}")
