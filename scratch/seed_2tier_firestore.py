import json
import urllib.request
import urllib.error

PROJECT_ID = "sdg-web-d07ac"
API_KEY = "AIzaSyBCfgDS0NliRN3LJR2cOie6y9N4YONtTR8"

BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def to_firestore_value(val):
    if val is None:
        return {"nullValue": None}
    elif isinstance(val, bool):
        return {"booleanValue": val}
    elif isinstance(val, int):
        return {"integerValue": str(val)}
    elif isinstance(val, float):
        return {"doubleValue": val}
    elif isinstance(val, str):
        return {"stringValue": val}
    elif isinstance(val, list):
        return {"arrayValue": {"values": [to_firestore_value(x) for x in val]}}
    elif isinstance(val, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(v) for k, v in val.items()}}}
    return {"stringValue": str(val)}

def save_document(collection_path, doc_id, data_dict):
    url = f"{BASE_URL}/{collection_path}/{doc_id}?key={API_KEY}"
    payload = {
        "fields": {k: to_firestore_value(v) for k, v in data_dict.items()}
    }
    body = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="PATCH")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"  [OK] Saved {collection_path}/{doc_id}")
            return True
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8', errors='ignore')
        print(f"  [FAIL] {collection_path}/{doc_id} HTTP {e.code}: {err[:120]}")
        return False
    except Exception as e:
        print(f"  [FAIL] {collection_path}/{doc_id} Error: {e}")
        return False

print("=== Starting 2-Tier Clean Firestore Seeder ===\n")

# 1. Seed pages/home
home_data = {
    "sectionType": "home",
    "sectionId": "main",
    "sliderImages": [
        "../images/home-sliders/1.png",
        "../images/home-sliders/2.png",
        "../images/home-sliders/3.png"
    ],
    "commitmentEyebrow": "Our Commitment",
    "commitmentTitle": "Global Standards, Local Impact",
    "introParagraph1": "Urdaneta City University stands at the intersection of international academic excellence and localized sustainable development. We are committed to dismantling geographical boundaries through strategic global linkages, robust research collaboration, and an unwavering dedication to the United Nations Agenda 2030.",
    "introParagraph2": "By forging active partnerships across multiple continents, we subject our academic frameworks to rigorous global evaluations. This international exposure translates into cutting-edge pedagogy and facilities, empowering our External Office to drive true socio-economic mobility through evidence-based community outreach.",
    "headlineSliders": [
        "../images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
        "../images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
        "../images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png"
    ],
    "metricsEyebrow": "Institutional Impact",
    "metricsTitle": "Stat Numbers",
    "metrics": [
        {"label": "Total Events", "value": "48", "id": "totalEvents"},
        {"label": "Research & Pubs", "value": "124", "id": "totalResearch"},
        {"label": "Univ Rankings", "value": "6", "id": "universityRankings"},
        {"label": "Local Partners", "value": "85", "id": "localPartners"},
        {"label": "Global Partners", "value": "24", "id": "globalPartners"},
        {"label": "Active MOUs", "value": "42", "id": "activeMous"}
    ],
    "availableArchiveYears": ["2025", "2024", "2023"]
}
save_document("pages", "home", home_data)

# 2. Seed pages/sdg_dashboard_2025
sdg_dashboard_data = {
    "sectionType": "sdg_dashboard",
    "sectionId": "2025",
    "year": "2025",
    "heroEyebrow": "Local Action. Global Impact.",
    "heroHeadline": "SDG Reports",
    "heroHighlight": "2025",
    "heroDescription": "Documenting Urdaneta City University’s measurable contributions to the United Nations Sustainable Development Goals through education, research, partnerships, and community-driven initiatives in 2025.",
    "metrics": [
        {"metricId": "sdgTargets", "value": "169", "label": "Targets", "theme": "white"},
        {"metricId": "totalEvents", "value": "48", "label": "Events", "theme": "white"},
        {"metricId": "totalResearch", "value": "124", "label": "Research", "theme": "white"}
    ],
    "sdgCards": [
        {"goalNum": "1", "title": "No Poverty", "subtitle": "End poverty in all its forms everywhere.", "color": "#E5243B", "bgImg": "../images/sdg/bg/1.png", "logoImg": "../images/sdg/sdg1.png"},
        {"goalNum": "2", "title": "Zero Hunger", "subtitle": "End hunger, achieve food security and improved nutrition.", "color": "#DDA63A", "bgImg": "../images/sdg/bg/2.png", "logoImg": "../images/sdg/sdg2.png"},
        {"goalNum": "3", "title": "Good Health and Well-being", "subtitle": "Ensure healthy lives and promote well-being for all.", "color": "#4C9F38", "bgImg": "../images/sdg/bg/3.png", "logoImg": "../images/sdg/sdg3.png"},
        {"goalNum": "4", "title": "Quality Education", "subtitle": "Ensure inclusive and equitable quality education.", "color": "#C5192D", "bgImg": "../images/sdg/bg/4.png", "logoImg": "../images/sdg/sdg4.png"},
        {"goalNum": "5", "title": "Gender Equality", "subtitle": "Achieve gender equality and empower all women and girls.", "color": "#FF3A21", "bgImg": "../images/sdg/bg/5.png", "logoImg": "../images/sdg/sdg5.png"},
        {"goalNum": "6", "title": "Clean Water and Sanitation", "subtitle": "Ensure availability and sustainable management of water.", "color": "#26BDE2", "bgImg": "../images/sdg/bg/6.png", "logoImg": "../images/sdg/sdg6.png"},
        {"goalNum": "7", "title": "Affordable and Clean Energy", "subtitle": "Ensure access to affordable, reliable, sustainable energy.", "color": "#FCC30B", "bgImg": "../images/sdg/bg/7.png", "logoImg": "../images/sdg/sdg7.png"},
        {"goalNum": "8", "title": "Decent Work and Economic Growth", "subtitle": "Promote sustained, inclusive and sustainable economic growth.", "color": "#A21942", "bgImg": "../images/sdg/bg/8.png", "logoImg": "../images/sdg/sdg8.png"},
        {"goalNum": "9", "title": "Industry, Innovation and Infrastructure", "subtitle": "Build resilient infrastructure, promote inclusive industrialization.", "color": "#FD6925", "bgImg": "../images/sdg/bg/9.png", "logoImg": "../images/sdg/sdg9.png"},
        {"goalNum": "10", "title": "Reduced Inequalities", "subtitle": "Reduce inequality within and among countries.", "color": "#DD1367", "bgImg": "../images/sdg/bg/10.png", "logoImg": "../images/sdg/sdg10.png"},
        {"goalNum": "11", "title": "Sustainable Cities and Communities", "subtitle": "Make cities and human settlements inclusive, safe, resilient.", "color": "#FD9D24", "bgImg": "../images/sdg/bg/11.png", "logoImg": "../images/sdg/sdg11.png"},
        {"goalNum": "12", "title": "Responsible Consumption and Production", "subtitle": "Ensure sustainable consumption and production patterns.", "color": "#BF8B2E", "bgImg": "../images/sdg/bg/12.png", "logoImg": "../images/sdg/sdg12.png"},
        {"goalNum": "13", "title": "Climate Action", "subtitle": "Take urgent action to combat climate change and its impacts.", "color": "#3F7E44", "bgImg": "../images/sdg/bg/13.png", "logoImg": "../images/sdg/sdg13.png"},
        {"goalNum": "14", "title": "Life Below Water", "subtitle": "Conserve and sustainably use the oceans, seas and marine resources.", "color": "#0A97D9", "bgImg": "../images/sdg/bg/14.png", "logoImg": "../images/sdg/sdg14.png"},
        {"goalNum": "15", "title": "Life on Land", "subtitle": "Protect, restore and promote sustainable use of terrestrial ecosystems.", "color": "#56C02B", "bgImg": "../images/sdg/bg/15.png", "logoImg": "../images/sdg/sdg15.png"},
        {"goalNum": "16", "title": "Peace, Justice and Strong Institutions", "subtitle": "Promote peaceful and inclusive societies for sustainable development.", "color": "#00689D", "bgImg": "../images/sdg/bg/16.png", "logoImg": "../images/sdg/sdg16.png"},
        {"goalNum": "17", "title": "Partnerships for the Goals", "subtitle": "Strengthen the means of implementation and revitalize the global partnership.", "color": "#19486A", "bgImg": "../images/sdg/bg/17.png", "logoImg": "../images/sdg/sdg17.jpg"}
    ]
}
save_document("pages", "sdg_dashboard_2025", sdg_dashboard_data)

# 3. Seed pages/impact_2025
save_document("pages", "impact_2025", {
    "sectionType": "impact",
    "sectionId": "2025",
    "year": "2025",
    "heroEyebrow": "News & Documentation",
    "heroHeadline": "Impact & Events",
    "heroHighlight": "2025.",
    "heroDescription": "Documenting UCU's institutional milestones, community engagements, and sustainable development initiatives.",
    "metrics": [
        {"value": "3", "label": "Upcoming (May)", "theme": "white"},
        {"metricId": "totalEvents", "value": "48", "label": "Total Engagements", "theme": "white"},
        {"value": "5,000+", "label": "Community Reached", "theme": "white"},
        {"value": "17", "label": "SDGs Addressed", "theme": "white"}
    ]
})

# 4. Seed pages/research_2025
save_document("pages", "research_2025", {
    "sectionType": "research",
    "sectionId": "2025",
    "year": "2025",
    "heroEyebrow": "Institutional Archive",
    "heroHeadline": "SDG Research",
    "heroHighlight": "2025.",
    "heroDescription": "An open-access archive of Urdaneta City University's academic contributions. Explore peer-reviewed publications, institutional studies, and localized research directly aligned with the United Nations' Sustainable Development Goals."
})

# 5. Seed pages/rankings
save_document("pages", "rankings", {
    "sectionType": "rankings",
    "sectionId": "main",
    "heroEyebrow": "A Network of Excellence",
    "heroHeadline": "Connecting UCU",
    "heroHighlight": "Globally",
    "heroDescription": "Forging high-impact relationships with global academic institutions and premier industry leaders to elevate the educational standard of Urdaneta City University.",
    "standingTitle": "Current Global Standing",
    "trajectoryEyebrow": "Institutional Trajectory",
    "trajectoryTitle": "Historical Performance"
})

# 6. Seed pages/partnerships
save_document("pages", "partnerships", {
    "sectionType": "partnership",
    "sectionId": "main",
    "heroEyebrow": "Trusted Connections. Global Vision.",
    "heroHeadline": "UCU Beyond",
    "heroHighlight": "Borders",
    "heroDescription": "Creating lasting partnerships that empower education, elevate standards, and connect Urdaneta City University to opportunities across the world.",
    "metrics": [
        {"metricId": "activeMous", "value": "42", "label": "Active MOUs", "theme": "white"},
        {"metricId": "globalPartners", "value": "24", "label": "International Partners", "theme": "white"},
        {"metricId": "localPartners", "value": "85", "label": "Local Partners", "theme": "white"},
        {"metricId": "membershipPartners", "value": "18", "label": "Memberships", "theme": "white"},
        {"metricId": "totalCountries", "value": "12", "label": "Partner Countries", "theme": "white"}
    ],
    "partnershipFormUrl": "https://forms.google.com/your-form-id-here",
    "emailExternal": "externalaffairsandlinkages@ucu.edu.ph",
    "emailOfficial": "officeofthepresident@ucu.edu.ph"
})

# 7. Seed pages/smart_eco_campus
save_document("pages", "smart_eco_campus", {
    "sectionType": "smarteco",
    "sectionId": "main",
    "heroEyebrow": "Innovation Powered by Sustainability",
    "heroHeadline": "Smart Eco",
    "heroHighlight": "Campus",
    "heroDescription": "Creating a campus where innovation, sustainability, and responsible growth work together to elevate institutional performance and environmental impact.",
    "recognitionEyebrow": "Global Recognition",
    "recognitionTitle": "An Academic Milestone",
    "introParagraph1": "The UI GreenMetric World University Rankings evaluates green campuses and environmental sustainability across 39 indicators in 6 criteria.",
    "introParagraph2": "As a first try for UCU in this global ranking, it is an academic milestone worthy of celebration.",
    "introParagraph3": "Congratulations, UCUians! Mabuhay ang Urdaneta City University!",
    "awardImages": [
        "./images/smart-eco-assets/ui-gm2.jpg",
        "./images/smart-eco-assets/ui-gm.jpg"
    ],
    "standingHeader": "Out of 1,477 universities worldwide in 2025, WE ARE:",
    "milestones": [
        {"rank": "#1", "label": "Local Universities & Colleges (LUC) in the Philippines"},
        {"rank": "#1", "label": "HEI in Water Management Category"},
        {"rank": "#1", "label": "in the Province of Pangasinan"},
        {"rank": "#3", "label": "in Region 1"},
        {"rank": "#8", "label": "in the Philippines"},
        {"rank": "#431", "label": "Worldwide"}
    ],
    "sustainabilityTitle": "SUSTAINABILITY INDICATORS",
    "sustainabilityIndicators": [
        {"num": "01", "title": "Setting and Infrastructure", "img": "./images/smart-eco-assets/setting_and_infrastructure.jpg", "link": "./indicators/infrastructure.html"},
        {"num": "02", "title": "Energy and Climate Change", "img": "./images/smart-eco-assets/energy_and_climate_change.jpg", "link": "./indicators/energy.html"},
        {"num": "03", "title": "Waste", "img": "./images/smart-eco-assets/waste.jpg", "link": "./indicators/waste.html"},
        {"num": "04", "title": "Water", "img": "./images/smart-eco-assets/water.jpg", "link": "./indicators/water.html"},
        {"num": "05", "title": "Transportation", "img": "./images/smart-eco-assets/transportation.jpg", "link": "./indicators/transportation.html"},
        {"num": "06", "title": "Education and Research", "img": "./images/smart-eco-assets/education_and_research.jpg", "link": "./indicators/education.html"},
        {"num": "07", "title": "Digitalization", "img": "./images/smart-eco-assets/digitalization.jpg", "link": "./indicators/digitalization.html"}
    ],
    "sustainabilityParagraph": "These seven sustainability indicators form the strategic framework of Urdaneta City University’s Smart Eco Campus initiative. By aggressively aligning our institutional metrics with global environmental standards—such as the UI GreenMetric framework—we do more than cultivate a green learning environment. We forge high-impact linkages with international stakeholders, driving collaborative research and scalable sustainable practices that elevate our graduates to global competitiveness."
})

# 8. Seed pages/announcements & individual announcements/
featured_ann = {
    "id": "ann_2025_01",
    "category": "Academic Linkages",
    "title": "Strength of Urdaneta City University Research & Global Linkages Endorsed by 2025 Milestones",
    "content": "Urdaneta City University welcomes the latest results of institutional research evaluations and international linkages, demonstrating the university’s unwavering delivery of high-quality, high-impact sustainable development programs and global academic alliances.",
    "image": "./images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
    "date": "May 20, 2025",
    "isFeatured": True
}

recent_announcements = [
    {
        "id": "ann_2025_02",
        "category": "Community Extension",
        "title": "UCU Collaborates with DSWD on Kalahi-CIDSS Cash-for-Work Sustainable Infrastructure",
        "content": "Empowering vulnerable communities across Pangasinan through direct infrastructure livelihood support, civic engagement, and targeted poverty mitigation.",
        "image": "./images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
        "date": "March 15, 2025"
    },
    {
        "id": "ann_2025_03",
        "category": "Green Campus",
        "title": "Smart Eco Campus Initiative Receives Landmark UI GreenMetric Global Standing",
        "content": "Ranked #1 Local University in the Philippines and #1 in Water Management Category worldwide, driving institutional climate action and clean energy.",
        "image": "./images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png",
        "date": "February 10, 2025"
    },
    {
        "id": "ann_2025_04",
        "category": "Academic Linkages",
        "title": "UCU Signs New International Memorandums of Understanding Across ASEAN Region",
        "content": "Broadening cross-border faculty mobility, student exchanges, and joint peer-reviewed publications with premier Southeast Asian partner universities.",
        "image": "./images/events/Kalahi-CIDSS-Cash-for-Work/Pic4.png",
        "date": "January 28, 2025"
    }
]

save_document("pages", "announcements", {
    "sectionType": "announcement",
    "sectionId": "main",
    "featured": featured_ann,
    "list": recent_announcements
})

save_document("announcements", featured_ann["id"], featured_ann)
for a in recent_announcements:
    save_document("announcements", a["id"], a)

# 9. Seed sdg_narratives (1 to 17)
SDG_TITLES = {
    1: ("No Poverty", "End poverty in all its forms everywhere.", "#E5243B"),
    2: ("Zero Hunger", "End hunger, achieve food security and improved nutrition.", "#DDA63A"),
    3: ("Good Health and Well-being", "Ensure healthy lives and promote well-being for all.", "#4C9F38"),
    4: ("Quality Education", "Ensure inclusive and equitable quality education.", "#C5192D"),
    5: ("Gender Equality", "Achieve gender equality and empower all women and girls.", "#FF3A21"),
    6: ("Clean Water and Sanitation", "Ensure availability and sustainable management of water.", "#26BDE2"),
    7: ("Affordable and Clean Energy", "Ensure access to affordable, reliable, sustainable energy.", "#FCC30B"),
    8: ("Decent Work and Economic Growth", "Promote sustained, inclusive and sustainable economic growth.", "#A21942"),
    9: ("Industry, Innovation and Infrastructure", "Build resilient infrastructure, promote inclusive industrialization.", "#FD6925"),
    10: ("Reduced Inequalities", "Reduce inequality within and among countries.", "#DD1367"),
    11: ("Sustainable Cities and Communities", "Make cities and human settlements inclusive, safe, resilient.", "#FD9D24"),
    12: ("Responsible Consumption and Production", "Ensure sustainable consumption and production patterns.", "#BF8B2E"),
    13: ("Climate Action", "Take urgent action to combat climate change and its impacts.", "#3F7E44"),
    14: ("Life Below Water", "Conserve and sustainably use the oceans, seas and marine resources.", "#0A97D9"),
    15: ("Life on Land", "Protect, restore and promote sustainable use of terrestrial ecosystems.", "#56C02B"),
    16: ("Peace, Justice and Strong Institutions", "Promote peaceful and inclusive societies for sustainable development.", "#00689D"),
    17: ("Partnerships for the Goals", "Strengthen the means of implementation and revitalize the global partnership.", "#19486A")
}

for i in range(1, 18):
    title, subtitle, color = SDG_TITLES[i]
    sdg_doc = {
        "sdgNum": i,
        "year": "2025",
        "title": title,
        "subtitle": subtitle,
        "colorHex": color,
        "heroBgImage": f"../images/sdg-banner/sdg{i}.jpg",
        "heroIconImage": f"../images/sdg/sdg{i}.png",
        "executiveSummary": f"Sustainable Development Goal {i} ({title}) drives institutional action at Urdaneta City University. Through innovative research, strategic partnerships, and community-led initiatives, UCU actively contributes to regional and global sustainable development targets.",
        "metrics": [
            {"id": "m1", "value": "1,920", "label": "Beneficiaries Reached", "theme": "navy", "icon": "users"},
            {"id": "m2", "value": "45", "label": "Active Programs", "theme": "red", "icon": "activity"},
            {"id": "m3", "value": "15", "label": "Researches", "theme": "navy", "icon": "book"}
        ],
        "sections": [
            {
                "id": "sec_1",
                "order": 1,
                "title": "Institutional Framework & Action Plans",
                "paragraphs": [
                    f"Urdaneta City University (UCU) recognizes that achieving {title} requires a rigorous, evidence-based approach that integrates campus-wide policies with community engagement.",
                    "Our strategic directives align university resources with regional development goals to foster equitable progress and systemic resilience."
                ],
                "eventModalId": "kalahi-cidss"
            },
            {
                "id": "sec_2",
                "order": 2,
                "title": "Community Extension & Direct Interventions",
                "paragraphs": [
                    "Through specialized extension programs, UCU faculty and students engage directly with local government units and grassroots communities to deliver measurable impact."
                ],
                "eventModalId": ""
            }
        ],
        "visualizations": [
            {
                "id": "viz_1",
                "title": "Intervention Success Rates",
                "type": "progress",
                "payload": [
                    {"label": "Community Participation", "percentage": 94, "barColorClass": "bg-ucu-blue-dark"},
                    {"label": "Target Attainment", "percentage": 88, "barColorClass": "bg-ucu-red"}
                ]
            }
        ],
        "status": "published"
    }
    save_document("sdg_narratives", f"{i}_2025", sdg_doc)

print("\n=== Seeding Finished Successfully! ===")
