import re

# Read partners-data.js
with open(r"c:\kudecode\sdg-web\js\partners-data.js", "r", encoding="utf-8") as f:
    js_content = f.read()

# Extract array elements with name & category
matches = re.findall(r'\{\s*name:\s*"([^"]+)",\s*category:\s*"([^"]+)"', js_content)
js_partners = [{"name": m[0], "category": m[1]} for m in matches]

def clean_text(text):
    text = text.replace('’', "'").replace('–', '-').replace('—', '-').replace('\u2013', '-').replace('\u2014', '-')
    return text

def normalize(name):
    name = clean_text(name)
    name = re.sub(r'[\-\\\/\.\,\(\)\']', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip().lower()
    return name

js_map = {normalize(p["name"]): p for p in js_partners}

# Read Partners_Names.txt
with open(r"c:\kudecode\sdg-web\document_files\Partners_Names.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

txt_entries = []
for line in lines:
    line = clean_text(line.strip())
    if not line:
        continue
    m = re.match(r'^\d+\.\s*(.*)$', line)
    if m:
        entry = m.group(1).strip().rstrip('\\').strip()
        if entry:
            txt_entries.append(entry)

# Find duplicate entries within TXT file itself
seen_txt = {}
dedup_txt_entries = []
duplicates_in_txt = []

for entry in txt_entries:
    norm = normalize(entry)
    if norm in seen_txt:
        duplicates_in_txt.append((entry, seen_txt[norm]))
    else:
        seen_txt[norm] = entry
        dedup_txt_entries.append(entry)

registered_found = []
unregistered = []

for entry in dedup_txt_entries:
    norm = normalize(entry)
    
    # 1. Exact normalized match
    if norm in js_map:
        registered_found.append({
            "txt_name": entry,
            "js_name": js_map[norm]["name"],
            "category": js_map[norm]["category"],
            "match_type": "Exact Match"
        })
        continue
        
    # 2. Alias Matches
    alias_match = None
    if norm == normalize("Lananpin National High School"):
        alias_match = js_map[normalize("Lananpin National High School")]
    elif norm == normalize("DEPARTMENT OF EDUCATION SCHOOLS DIVISION OFFICE URDANETA CITY"):
        alias_match = js_map[normalize("SDO-Urdaneta City")]

    if alias_match:
        registered_found.append({
            "txt_name": entry,
            "js_name": alias_match["name"],
            "category": alias_match["category"],
            "match_type": "Alias Match"
        })
        continue

    unregistered.append(entry)

# Accurate Categorization
def get_category(name):
    u = name.upper()
    
    # Hospitality / Hotels / Dining
    if any(k in u for k in ["HOTEL", "RESORT", "CAFÉ", "CAFE", "BREWERY", "RESTAURANT", "LODGE", "ASTORIA", "STAY", "PARK HOTEL", "CASA VALLEJO", "CHALET BAGUIO"]):
        return "Hospitality, Hotels & Dining"
        
    # Travel & Tourism
    if any(k in u for k in ["TRAVEL", "TOURS", "ESCAPADE"]):
        return "Travel & Tourism Agencies"
        
    # Academic / Educational
    if any(k in u for k in ["SCHOOL", "COLLEGE", "ACADEMY", "HIGH SCHOOL", "ELEMENTARY", "UNIVERSITY"]):
        return "Academic / Educational Institutions"
        
    # Hospitals & Healthcare
    if any(k in u for k in ["HOSPITAL", "MEDICAL", "HEALTH", "RED CROSS", "PSYCHOLOGICAL", "THERAPY", "CLINIC"]):
        return "Hospitals & Healthcare Facilities"
        
    # LGU & Government
    if any(k in u for k in [
        "LGU", "DEPARTMENT OF", "MUNICIPAL", "FIRE STATION", "POLICE STATION", 
        "COMMISSION", "OFFICE", "NATIONAL BUREAU", "PHILHEALTH", 
        "SOCIAL SECURITY SYSTEM", "DPWH", "DAR", "DOLE", "DSWD", "DEPED", 
        "COMELEC", "COA", "SSS", "BJMP", "DISTRICT JAIL", "REGISTRY OF DEEDS"
    ]):
        return "LGU, Government Agencies & Public Services"
        
    # Corporate & Industry
    return "Corporate & Industry Partners"

categorized_unregistered = {
    "Academic / Educational Institutions": [],
    "Hospitality, Hotels & Dining": [],
    "Travel & Tourism Agencies": [],
    "Hospitals & Healthcare Facilities": [],
    "LGU, Government Agencies & Public Services": [],
    "Corporate & Industry Partners": []
}

for item in unregistered:
    cat = get_category(item)
    categorized_unregistered[cat].append(item)

# Generate clean text file
txt_out_path = r"c:\kudecode\sdg-web\document_files\Unregistered_Partners_Names.txt"
with open(txt_out_path, "w", encoding="utf-8") as f:
    f.write("=========================================================\n")
    f.write("UCU SDG WEB - UNREGISTERED PARTNERS FROM Partners_Names.txt\n")
    f.write(f"Total Entries in File: {len(txt_entries)}\n")
    f.write(f"Unique Partner Names in File: {len(dedup_txt_entries)}\n")
    f.write(f"Already Registered in Website: {len(registered_found)}\n")
    f.write(f"Unregistered Partners Needed: {len(unregistered)}\n")
    f.write("=========================================================\n\n")
    
    count = 1
    for cat, items in categorized_unregistered.items():
        if not items:
            continue
        f.write(f"--- {cat.upper()} ({len(items)} items) ---\n")
        for item in items:
            f.write(f"{count:3d}. {item}\n")
            count += 1
        f.write("\n")

print("Updated Unregistered_Partners_Names.txt successfully!")
