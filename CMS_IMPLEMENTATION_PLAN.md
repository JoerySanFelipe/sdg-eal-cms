# Implementation Plan: Vanilla Firebase-Backed Admin CMS for UCU SDG Web Portal

**Project Location**: `C:\kudecode\sdg-web`  
**Architecture**: Vanilla HTML5 + Tailwind CSS v3 + Native Web Components + Firebase v10 SDK (Firestore + Auth)  
**Target Deployment**: Subpage inside official University Website (`university.edu/sdg/`)

---

## 1. Executive Summary & Goals

The UCU SDG Web Portal is a static HTML/Tailwind subpage documenting Urdaneta City University's contributions to the 17 UN Sustainable Development Goals for **THE Impact Rankings** and **UI GreenMetric**.

This upgrade implements a **self-contained, hidden Admin Content Management System (`/admin/`)** directly inside the codebase with:
1. **Hidden Access**: No public navigation links; accessible only via direct URL (e.g. `/admin/`).
2. **Secure Login Gate**: Real authentication using Firebase Auth (Email/Password).
3. **Split-Screen Studio Mode**:
   - **Left Panel**: Dynamic CRUD form inputs for SDG narratives, indicator evidence, institutional rankings, and news.
   - **Right Panel**: Real-time interactive website preview with Desktop, Tablet, and Mobile device frame toggles.
4. **Cloud Firestore Integration**: Instant live updates when clicking "Publish" without needing to re-upload files or maintain a custom backend server.
5. **Zero Disruption to Static Base**: The public website continues to work seamlessly with hardcoded HTML as a default fallback if offline.

---

## 2. Directory & File Architecture

```
sdg-web/
├── index.html                   ← Public Homepage (enhanced with Firestore live reader)
├── sdg-reports/                 ← Public SDG Narrative Pages
├── indicators/                  ← Public Indicator Pages
├── css/
│   ├── global.css               ← Tailwind CSS source
│   └── style.css                ← Compiled Tailwind CSS (Tailwind v3)
├── js/
│   ├── sdg-components.js        ← Existing Native Web Components
│   └── firebase-public-sync.js  ← [NEW] Lightweight Firestore public hydration bridge
└── admin/                       ← [NEW] Self-Contained Admin Portal
    ├── index.html               ← Split-Screen Studio & Login UI
    ├── css/
    │   └── admin.css            ← Admin dashboard styling (Tailwind utility classes)
    └── js/
        ├── firebase-config.js   ← Firebase SDK initialization (Auth + Firestore)
        ├── auth.js              ← Login/logout & session persistence
        ├── cms-state.js         ← In-memory state & Firestore CRUD operations
        ├── cms-forms.js         ← Dynamic CRUD form builders per section
        └── preview-bridge.js    ← Real-time split-screen postMessage syncer
```

---

## 3. Detailed Component Breakdown

### A. Admin Portal UI (`admin/index.html` & `admin/css/admin.css`)
- **Login View (When Unauthenticated)**:
  - UCU-branded modal card asking for Email and Password.
  - Error state handling (invalid credentials, network issues).
- **Studio View (When Authenticated)**:
  - **Top Navigation**: University seal, active user badge, "Save & Publish to Cloud" button, Logout button, and connection status indicator.
  - **Left Sidebar**: Page selector:
    - 🏠 Homepage & Global Banners
    - 🎯 SDG Narratives (SDG 1 through SDG 17, with Year Switcher: 2023, 2024, 2025)
    - 📊 UI GreenMetric Indicators (Pillars: Setting, Energy, Waste, Water, Transportation, Education)
    - 🏆 Institutional Rankings (THE Impact Rankings & UI GreenMetric scores)
    - 📅 Events & News Feed
  - **Center Editor Form**: Customized input controls per section (Rich text for narratives, numerical inputs for metrics, repeatable accordion builders, image asset URLs).
  - **Right Live Preview**: `<iframe>` rendering the selected page with responsive width toggles (Desktop 100%, Tablet 768px, Mobile 375px) and refresh controls.

### B. Dynamic Form & CRUD Engine (`admin/js/cms-forms.js` & `admin/js/cms-state.js`)
- **SDG Narratives**:
  - `heroTitle`, `heroSubtitle`, `executiveSummary`
  - `metrics`: Array of `{ number: "₱2.4M", label: "Aid Disbursed" }`
  - `accordions`: Array of `{ title: "Section 1", content: "..." }`
- **Indicators & Evidence**:
  - `code` (e.g. `GD.5`, `WS.2`), `title`, `description`, `evidenceFiles` (DOCX/PDF links), `images`
- **Events**:
  - `title`, `date`, `location`, `sdgTags`, `description`, `photoUrl`

### C. Live Split-Screen Syncer (`admin/js/preview-bridge.js`)
- Uses `window.postMessage` to communicate between the Admin parent frame and the child preview `iframe`.
- As the user types in any form field, the message is dispatched and the preview DOM updates in real-time.

### D. Public Hydration Bridge (`js/firebase-public-sync.js`)
- Included in public HTML files before the closing `</body>` tag.
- If in preview mode (inside admin iframe): listens to `postMessage` events and updates elements directly.
- If in normal public mode: checks Firestore for published overrides. If found, hydrates the DOM; otherwise keeps default static HTML.

---

## 4. Execution Steps for the Next Session

1. **Step 1**: Create `admin/index.html`, `admin/css/admin.css`, and the core JS modules (`firebase-config.js`, `auth.js`, `cms-state.js`, `cms-forms.js`, `preview-bridge.js`).
2. **Step 2**: Create `js/firebase-public-sync.js` and link it to the public pages.
3. **Step 3**: Compile Tailwind CSS with `npx tailwindcss -i ./css/global.css -o ./css/style.css`.
4. **Step 4**: Verify login flow, form CRUD, split-screen preview responsiveness, and Firestore syncing.
