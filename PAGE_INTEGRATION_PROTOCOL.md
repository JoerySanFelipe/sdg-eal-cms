# Standard Page-by-Page Integration Protocol
### UCU SDG Web Portal — CMS & Database Sync Protocol

This document defines the standardized 5-step engineering protocol for auditing, synchronizing, and verifying all public web pages against Cloud Firestore and the Admin CMS Studio.

---

## 🧭 The 5-Step Protocol Workflow

```
[ Step 1: DOM & HTML Audit ]
            ↓
[ Step 2: Editables & Media Inventory ]
            ↓
[ Step 3: Database & CMS Form Alignment ]
            ↓
[ Step 4: Live Sync & Hydration Check ]
            ↓
[ Step 5: Audit Summary & Recommendations ]
```

---

### Step 1: DOM & HTML Structure Audit
- Open and inspect the target public page (e.g. `index.html`, `announcement.html`, `smart-eco-campus.html`).
- Identify all major visual sections (Hero, Narratives, Metric grids, Image carousels, Repeaters).
- Verify that every dynamic text, number, and media container has clear, semantic element selectors (such as unique IDs like `#hero-headline`, `#stat-numbers-grid`, or dataset tags).

### Step 2: Editables & Media Inventory
- Create a complete catalog of all content elements on the page:
  - **Text Fields**: Eyebrows, Headlines, Highlights, Introductory Leads, Paragraphs.
  - **Metrics / Numbers**: Values, Labels, Theme colors (Navy / Red / White).
  - **Media & Images**: Slider arrays, Background banners, Feature photos, Pillar icons.
  - **Repeaters / Dynamic Lists**: Cards, Accordions, Milestones, Grid feeds.

### Step 3: Database & CMS Form Alignment
- Check Firestore schema for the page (e.g., `pages/{pageDocId}` or entity collection `sdg_narratives/{id}`).
- Cross-reference with `admin/js/cms-forms.js` and `admin/js/cms-state.js`:
  - Are all fields present in the form builder?
  - Are drag-and-drop image uploaders with circular red `×` remove buttons active?
  - Are field keys in the CMS 100% identical to the database keys?

### Step 4: Real-Time Sync & Hydration Verification
- Inspect `js/firebase-public-sync.js` for the page's handler:
  - **Live Preview Mode**: Does typing in the CMS editor or uploading an image immediately update the split-screen iframe via `postMessage`?
  - **Production Mode**: Does `checkAndHydratePublishedData()` fetch the document from Firestore REST API on direct page load and seamlessly update the DOM?

### Step 5: Audit Summary & Recommendations
- Present a clear comparison table to the user.
- Detail what is already working, what needs DOM adjustments, and propose UI/UX enhancements.
- Await user review and confirmation before executing code changes.

---

## 📑 Page Registry & Target Documents

| Target Webpage | Firestore Path | CMS Section Type | Status |
| :--- | :--- | :--- | :--- |
| `index.html` | `pages/home` | `home` | ✅ Fully Integrated & Verified |
| `announcement.html` | `pages/announcements` & `announcements/` | `announcement` | ✅ Fully Integrated & Verified |
| `sdg-reports.html` | `pages/sdg_dashboard_2025` | `sdg_dashboard` | ✅ Fully Integrated & Verified |
| `smart-eco-campus.html` | `pages/smart_eco_campus` & `indicators/` | `smarteco` | ✅ Fully Integrated & Verified |
| `rankings.html` | `pages/rankings` & `rankings/` | `rankings` | ✅ Fully Integrated & Verified |
| `partnership.html` | `pages/partnerships` & `partners/` | `partnership` | ✅ Fully Integrated & Verified |
| `impact.html` | `pages/impact_2025` & `events/` | `impact` | ✅ Fully Integrated & Verified |
| `research.html` | `pages/research_2025` & `research/` | `research` | ✅ Fully Integrated & Verified |
| `sdg-reports/sdg1.html`...`17.html` | `sdg_narratives/{1..17}_2025` | `sdg` | Pending Audit |
