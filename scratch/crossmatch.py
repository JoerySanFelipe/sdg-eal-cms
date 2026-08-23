import re
import json

# Load partners-data.js
with open(r"c:\kudecode\sdg-web\js\partners-data.js", "r", encoding="utf-8") as f:
    js_content = f.read()

# Extract names from JS array
# Schema: { name: "...", category: "...", ... }
registered_names_raw = re.findall(r'name:\s*"([^"]+)"', js_content)

print(f"Total registered names in partners-data.js: {len(registered_names_raw)}")

def normalize(name):
    # Remove punctuation, extra spaces, lowercase
    name = re.sub(r'[\–\-\\\/\.\,\(\)\']', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip().lower()
    return name

registered_normalized = {normalize(n): n for n in registered_names_raw}

# Load Partners_Names.txt
with open(r"c:\kudecode\sdg-web\document_files\Partners_Names.txt", "r", encoding="utf-8") as f:
    txt_lines = f.readlines()

txt_partners = []
for line in txt_lines:
    line = line.strip()
    if not line:
        continue
    # Remove leading number prefix e.g. "1. " or "128. "
    match = re.match(r'^\d+\.\s*(.*)$', line)
    if match:
        partner_name = match.group(1).strip().rstrip('\\').strip()
        if partner_name:
            txt_partners.append(partner_name)

print(f"Total entries in Partners_Names.txt: {len(txt_partners)}")

# Deduplicate txt_partners while preserving original casing and order
unique_txt_partners = []
seen_txt_norm = set()
for name in txt_partners:
    norm = normalize(name)
    if norm not in seen_txt_norm:
        seen_txt_norm.add(norm)
        unique_txt_partners.append(name)

print(f"Unique entries in Partners_Names.txt: {len(unique_txt_partners)}")

registered_matches = []
unregistered = []

for name in unique_txt_partners:
    norm = normalize(name)
    matched = False
    
    # Check exact normalized match
    if norm in registered_normalized:
        registered_matches.append((name, registered_normalized[norm], "exact"))
        matched = True
    else:
        # Check partial / sub-string match both ways
        partial_match = None
        for reg_norm, reg_orig in registered_normalized.items():
            if norm == reg_norm or norm in reg_norm or reg_norm in norm:
                partial_match = reg_orig
                break
        if partial_match:
            registered_matches.append((name, partial_match, "partial"))
            matched = True
            
    if not matched:
        unregistered.append(name)

print(f"\n--- MATCHED WITH REGISTERED ({len(registered_matches)}) ---")
for orig, reg, mtype in registered_matches:
    print(f"[{mtype.upper()}] TXT: '{orig}'  <===>  JS: '{reg}'")

print(f"\n--- UNREGISTERED ({len(unregistered)}) ---")
for u in unregistered:
    print(u)

# Write unregistered names to file
output_path = r"c:\kudecode\sdg-web\document_files\Unregistered_Partners_Names.txt"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(f"UNREGISTERED PARTNERS ({len(unregistered)} entries)\n")
    f.write("="*50 + "\n\n")
    for idx, u in enumerate(unregistered, 1):
        f.write(f"{idx}. {u}\n")

print(f"\nSaved unregistered partners to {output_path}")
