# Project Handover & Status: UCU SDG Web Portal

> **CRITICAL INSTRUCTION FOR ALL AI AGENTS**: Read this entire file **before performing any action** in this workspace. This document is the authoritative ground truth for the project's current state. It supersedes any assumptions or general knowledge you may have. Do not hallucinate file paths, component names, or data structures — refer to the sections below.

---

## 1. Project Overview

This is the **UCU External Affairs and Linkages (EAL) SDG Web Portal** for **Urdaneta City University (UCU)**, Urdaneta City, Philippines. The portal publicly documents UCU's contributions to all 17 United Nations Sustainable Development Goals (SDGs) as required for **THE Impact Rankings** and **UI GreenMetric** submissions.

The codebase is a **vanilla HTML5 + Tailwind CSS v3** project — **no frontend framework** (no React, Vue, Angular). UI components are implemented as **native Web Components** (`customElements.define`) in JavaScript.

### Primary Entry Points

- `index.html` — Homepage
- `announcement.html` — Announcements & News Gateway (Featured hero card + recent cards stream)
- `sdg-reports.html` — SDG Reports Dashboard (17-card SDG master grid)
- `impact.html` — Impact & Engagements Gateway (with on-page Year Filter)
- `research.html` — Research Archive (with on-page Year Filter)
- `rankings.html` — Institutional Rankings & Trajectory
- `partnership.html` — International & Local Partnerships
- `smart-eco-campus.html` — Smart Eco Campus & UI GreenMetric (7 Sustainability Pillars)
- `admin/index.html` — Executive Split-Screen CMS Studio & Live Preview Bridge

---

## 2. Architecture & Key File Registry

### Core Client Files

| File                         | Purpose                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `css/global.css`             | Tailwind CSS input source. **Always edit this file, NOT `style.css`**                             |
| `css/style.css`              | **Compiled output only.** Never edit manually. Regenerate with Tailwind CLI.                      |
| `js/core-ui.js`              | `<ucu-header>`, `<ucu-footer>`, `<ucu-section-header>`, smart breadcrumbs, back-to-top            |
| `js/sdg-components.js`       | `<ucu-sdg-layout>`, `<sdg-card>`, `<sdg-see-all-card>`, `<ucu-hero-banner>`, `<ucu-metric-cards>` |
| `js/firebase-public-sync.js` | Real-time split-screen `postMessage` listener + production Firestore/LocalStorage REST client     |
| `js/events-data.js`          | UCU events and activities data store                                                              |
| `js/institutional-data.js`   | Institutional metrics, research publications, and SDG data arrays                                 |
| `js/modals.js`               | Modal overlay logic for event and impact cards                                                    |
| `js/visual-media.js`         | Image error fallback handler and visual helpers                                                   |

### Admin CMS Files (`admin/`)

| File                          | Purpose                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `admin/index.html`            | Split-Screen Studio, sidebar navigation across all pages, login modal, device mode frame        |
| `admin/css/admin.css`         | Studio split-pane styles, device frames (Desktop 100%, Tablet 768px, Mobile 390px), live pulses |
| `admin/js/firebase-config.js` | Firebase v10 Modular SDK config manager + LocalStorage fallback                                 |
| `admin/js/auth.js`            | Firebase Auth controller + Local Demo Session gatekeeper                                        |
| `admin/js/cms-state.js`       | Centralized draft state manager, storage uploaders, baseline seed data                          |
| `admin/js/cms-forms.js`       | Dynamic form builders for all 8 public page categories with live event bindings                 |
| `admin/js/preview-bridge.js`  | Low-latency postMessage live bridge & responsive viewport frame switcher                        |
| `admin/js/database-seeder.js` | 1-click cloud seeder populating Firestore collections across all site data                      |

---

## 3. Tailwind CSS Compilation

**This is mandatory after ANY change to `.html` or `.js` files that use Tailwind utility classes.**

```bash
npx tailwindcss -i ./css/global.css -o ./css/style.css
```

> ⚠️ Tailwind v3 is used. The project does NOT use Tailwind v4. Do not use v4 syntax.

---

## 4. Current Progress & Work Completed (August 17, 2026)

### 4.1 Announcements Gateway & CMS

- **Public Page (`announcement.html`)**:
  - Designed after the approved Leeds Beckett style reference.
  - **Featured Top Announcement (Horizontal Split Hero Card)**: Bold dark panel with "Featured" badge, high-impact headline, narrative lead, publication date, "Read Full Article" button, and high-resolution photo with smooth hover zoom.
  - **Recent Announcements Grid**: Responsive multi-column grid with top image, dark navy brand panel with category tag, bold heading, narrative excerpt, date, and interactive "Read →" link.
  - Connected with dynamic `<ucu-header>` and `<ucu-footer>`.
- **Global Header Navigation (`<ucu-header>` in `js/core-ui.js`)**:
  - Added **"Announcements"** navigation link immediately following **"Home"**.
  - Registered with stateless breadcrumb engine (`Home > Announcements`).
- **CMS Form Editor (`admin/js/cms-forms.js` & `admin/js/cms-state.js`)**:
  - Added **📢 Announcements & News** navigation item in the CMS sidebar.
  - Featured Announcement editor with Drag-and-Drop Image Uploader + circular red `×` remove button.
  - Recent Announcements stream editor with `+ Add Announcement` button, per-card field editing, card image upload & removal, and card deletion.
  - Live preview bridge in `admin/js/preview-bridge.js` routing to `../announcement.html?cms_preview=true`.
  - Database seeder in `admin/js/database-seeder.js` seeding `announcements_main`.

### 4.2 Page-by-Page CMS Form Builders & Live Preview Bridge

- **Homepage (`index.html`)**:
  - Section 1: Hero Image Slider (Drag & Drop multi-image upload with circular red `×` remove buttons).
  - Section 2: Headline (Eyebrow, Title, Narrative 1, Narrative 2, Drag & Drop Slider with image removal).
  - Section 3: Stat Numbers (6 editable cards with single-column row layout, editable Labels and Values).
  - Section 4: SDG Narratives (Eyebrow, Title, 3 Top Impact Metric Cards with Navy/Red/White theme selector, Sub-sections Accordions).
- **SDG Reports (`sdg-reports/2025.html`)**:
  - Hero banner configuration & Universal Metric Cards.
  - **17 SDG Goal Cards Grid**: Full editable list for all 17 goals (Goal Number, Title, Subtitle/Description, Drag-and-Drop Background Image upload with remove button, Drag-and-Drop SDG Logo/Icon upload with remove button).
- **Impact & Events (`impact/2025.html`)**:
  - Hero configuration & Universal Metric Cards.
- **SDG Research (`research/2025.html`)**:
  - Hero configuration & Archive description.
- **Rankings (`rankings.html`)**:
  - Current Global Standing & Historical Trajectory header configurations.
- **Partnerships (`partnership.html`)**:
  - Active Partnership Metrics, Google Form URL, and official institutional contact emails.
- **Smart Eco Campus (`smart-eco-campus.html`)**:
  - Recognition narrative, UI GreenMetric Award Sliders, Institutional Milestones rankings, **7 Sustainability Indicator Pillars** (Number, Title, Drag-and-Drop Pillar Image upload with remove button, Target Page Link), and Concluding Strategic Framework narrative.

### 4.3 Drag-and-Drop Image Upload & Removal System

- Added `uploadSingleImageToTarget(targetType, index, property, file)` and `removeNestedTargetProperty()` to `admin/js/cms-state.js`.
- Integrated across:
  - Homepage Hero & Headline sliders
  - SDG Goal Cards (Background Image & SDG Logo)
  - Sustainability Indicator Pillars (Pillar Image)
  - Announcements (Featured photo & Card images)
- Uploads directly to Firebase Storage with instant local preview / offline fallback.

### 4.4 Clean 2-Tier Database Architecture Refactor

- **Tier 1 (`pages/` Collection)**:
  - `pages/home`, `pages/announcements`, `pages/sdg_dashboard_2025`, `pages/smart_eco_campus`, `pages/rankings`, `pages/partnerships`, `pages/impact_2025`, `pages/research_2025`.
- **Tier 2 (Granular Entity Collections)**:
  - `sdg_narratives/` (1 to 17 Goals)
  - `announcements/` (Individual news articles)
  - `indicators/` (7 UI GreenMetric Pillars & Evidence)
  - `rankings/` (Institutional ranking scorecards)
  - `events/` (Community engagement activities)
  - `research/` (Academic publications archive)
- Refactored `admin/js/cms-state.js`, `js/firebase-public-sync.js`, and `admin/js/database-seeder.js` to speak directly to this clean schema.

### 4.5 Recent Milestone Progress (August 17–23, 2026)

- **CMS Modal Dialogs & Safety System (`admin/index.html`, `admin/js/cms-forms.js`)**:
  - Implemented sleek, accessible confirmation modals via `window.cmsConfirm()` for all deletion, discard, and publishing actions.
  - **Sleek Dark Animated Publishing Status Modal (`#cms-publish-modal`)**: Centered, modern dark modal (`bg-slate-900 border border-slate-700/80 rounded-2xl`) operating at `z-[350]` with deep backdrop blur (`bg-slate-950/80 backdrop-blur-md`). Features:
    - **No Top Gradient Line**: Clean borderless top edge matching executive SaaS standards.
    - **Pure Outline SVG Icons**: Completely replaced all emojis with clean, stroke outline SVG icons across loading (stroke cloud-sync orbit), success (stroke emerald checkmark badge), and error states.
    - **In-Progress State**: Spinning blue stroke orbit with pulsing outline cloud-upload icon and live synchronization badge.
    - **Success State**: Smooth transition to a vibrant emerald outline checkmark badge, celebratory pulse, live timestamp badge (`● Live as of HH:MM:SS AM/PM`), and auto-dismiss after ~2.0 seconds with manual `[ Done ]` trigger.
    - **Error State**: Graceful red alert outline box with specific error details.
  - **Strict "Publish" Button Label & Outline Icon**: Resolved previous text reset bug so the top action button consistently displays **`"Publish"`** with an outline upload SVG icon before, during, and after publishing.
  - **Accurate Discard Engine (`admin/js/cms-state.js`)**: `discardDraftToLastPublished()` fetches and restores the latest saved state from Cloud Firestore/LocalStorage instead of deleting the document or resetting to factory defaults.

- **Announcements System & Public Integration (`announcement.html`, `admin/js/cms-forms.js`, `admin/js/cms-state.js`, `js/firebase-public-sync.js`)**:
  - **⭐ Exclusive Single-Featured Logic**: Toggle button in CMS sets chosen announcement as `isFeatured: true` and automatically demotes any previously featured card to standard recent status.
  - **Clean 3-Row Card Layout in CMS**:
    - Row 1: Headline / Title, Category / Tag, Publication Date (3-column grid).
    - Row 2: Drag & Drop Multi-Image Uploader (up to 5 images) with client-side WebP canvas compression, instant re-render, and individual thumbnail removal with modal confirmation.
    - Row 3: Narrative Content / Summary.
  - **Date Range & Keyword Filter Bar in CMS**: Quick presets (`Last 7 Days (Default)`, `Last 30 Days`, `2025`, `All Time`), custom `From` & `To` date pickers, and live keyword search.
  - **10-Item Public Pagination on `announcement.html`**: 1 Top Featured Hero Banner + 9 Recent Grid Cards per page with numbered pagination controls and smooth scroll.
  - **Database Sync Fix**: Corrected document path routing in `cmsState.getDocPath` for `pages/announcements` so clicking "Publish to Cloud" immediately hydrates the public site.

### 4.6 Smart Eco Campus & UI GreenMetric (`smart-eco-campus.html`)

- **Public Page & Hero Banner**: Live `<ucu-hero-banner>` configuration with Eyebrow, Headline, Highlight, Description.
- **Academic Milestone & Dual Award Slider**: Integrated multi-photo certificate drag-and-drop uploader with confirmation modals.
- **7 Global Standing Highlights**: Complete synchronization of the 7 ranking cards (1 Featured Large Card + 6 Category Cards).
- **7 Sustainability Indicator Pillars**: Upgraded pillar cards with Number/Code, Pillar Name/Title, and instant **"Replace Image"** button & drag-to-replace uploader. Omitted target link input fields in CMS per user directive to preserve fixed system routing.
- **Live Preview Sync**: Fully synchronized via `BroadcastChannel` and `firebase-public-sync.js`.

### 4.7 Institutional Rankings & Accreditations (`rankings.html`)

- **Public Page Cleanup**: Replaced legacy CDN Tailwind script with standard compiled `<link rel="stylesheet" href="./css/style.css">`.
- **Top Hero Banner**: Live `<ucu-hero-banner>` configuration (Eyebrow, Headline, Highlight, Description).
- **Section Headings & Trajectory Title Fix**: Added explicit IDs (`#standing-title`, `#trajectory-eyebrow`, `#trajectory-title`) on `rankings.html` and synced them in `firebase-public-sync.js` so Trajectory Title changes reflect immediately on preview and public site.
- **Top Highlights Marquee (`<ucu-ranking-carousel>`)**: Dynamic multi-card continuous scroll carousel with ranking badges, crown ranks, and custom logos.
- **Historical Performance Timeline (`<ucu-ranking-timeline>`)**: Chronological trajectory cards with sub-metrics repeater, year milestones, pulse dots, and interactive category filters.
- **Hybrid Logo Management & Admin Path Fix**: Added `resolveAdminImageSrc` helper to properly resolve default brand logos (`AppliedHE`, `WURI`, `UI GreenMetric`, `THE Impact`, `HE HIGHER EDUCATION`) in the CMS Studio subfolder context with live preview on organization change and custom image replacement.
- **Closing Mission / Terminus Statement**: Fully editable closing quote at the bottom of the timeline with live updates.
- **Live Preview Sync**: Real-time cross-tab and iframe hydration via `BroadcastChannel` and `firebase-public-sync.js`.

---

### 4.8 Institutional Partnerships & Linkages (`partnership.html`) & Homepage Alliances Unification

- **Top Hero Banner**: Live `<ucu-hero-banner>` configuration (Eyebrow, Headline, Highlight, Description).
- **Top Linkages Metrics Repeater**: Live `<ucu-metric-cards>` controls (Active MOUs, International Partners, Local Partners, Memberships, Partner Countries).
- **Dynamic Partner Grids & Country Pills**: Enhanced `<ucu-partner-grid>`, `<ucu-country-grid>`, and `<ucu-partner-carousel>` to support real-time re-rendering.
- **Unified Strategic Alliance Card**: Standardized the Strategic Alliance card across both `partnership.html` and `index.html` (and their respective CMS forms in `buildPartnershipForm` and `buildHomeForm`) with explicit IDs (`#alliance-title`, `#alliance-description`), Inquiry Form URL, and Direct Correspondence Channels.
- **Live Preview Sync**: Fully synchronized via `BroadcastChannel` and `firebase-public-sync.js`.

---

### 4.9 Institutional Impact & Engagements (`impact.html`)

- **Top Hero Banner**: Live `<ucu-hero-banner>` configuration (Eyebrow, Headline, Highlight, Description).
- **Impact Metric Cards**: Configurable 4 metric cards (Upcoming, Total Engagements with `totalEvents` ID link, Community Reached, SDGs Addressed).
- **Year Filter Bar & Dedicated Component Render**: Upgraded `<ucu-impact-feed>` with a dedicated `render()` method that cleanly handles `year="all"` / `year=""` and dynamic year switching.
- **Full Events & Engagements Manager in CMS**:
  - Add Engagement Event (`+ Add Engagement Event`) & Delete Event with `window.cmsConfirm` modal.
  - Event Title, Date String, Year, and Narrative Summary Description.
  - Cover Photo Uploader / Instant Replace with WebP canvas compression (`single-image-uploader-zone`).
  - Interactive multi-select SDG alignment pills (SDGs 1-17).
  - Flags: `isHighlights` (Top Story highlight on the left) and `isFeatured` (Show on public feed).
  - Modal HTML Detail Link (`src`).
- **Live Preview Sync & Cloud Publication**: Real-time synchronization via `BroadcastChannel` and `firebase-public-sync.js` (`pages/impact_2025` & `events`).

---

### 4.10 Academic SDG Research Archive (`research.html`)

- **Top Hero Banner**: Live `<ucu-hero-banner>` configuration (Eyebrow, Headline, Highlight, Description).
- **Year Filter Bar & Dedicated Component Render**: Upgraded `<ucu-research-feed>` with a dedicated `render()` method supporting live real-time re-rendering and multi-year filtering.
- **Full Research Publications Archive Manager in CMS**:
  - Add Research Publication (`+ Add Research Publication`) & Delete Publication with `window.cmsConfirm` modal.
  - Publication Title, Authors & Affiliation, Date String / Volume (e.g. `Oct 2025`).
  - Abstract / Executive Narrative Description.
  - Comma-separated Keywords & Topic Tags input.
  - Interactive Multi-Select SDG Alignment Pills (SDGs 1-17).
  - PDF File / Document Link input (`pdfLink`).
- **Live Preview Sync & Cloud Publication**: Real-time synchronization via `BroadcastChannel` and `firebase-public-sync.js` (`pages/research_2025` & `research`).

---

### 4.11 Enterprise Architecture Transformation: Centralized Collections, Modular Block CMS, Chart Templates & Deep-Linking (Option B)

- **Phase 1: Core Engines & Dynamic Visualizations**:
  - `js/global-charts.js`: Standardized `<ucu-data-viz>` component with 5 built-in responsive templates (`progress` bars, `vertical` YoY comparison, `stacked` distribution, SVG `donut`/pie chart, and data matrix `table`).
  - `js/block-renderer.js`: Universal `window.UcuBlockRenderer` engine supporting lightweight markdown (`**bold**`, `*italic*`, `[label](url)`, `- lists`), responsive images with captions, stat callouts, charts, tables, and document download buttons.
  - `js/modals.js`: Upgraded `<ucu-modal-shell>` to prioritize `data-blocks` / database rich content rendering, lightbox viewer, previous/next navigation, and automatic URL deep-link synchronization (`?event=...`, `?evidence=...`, `?modal=...`) on popstate and modal open/close.
- **Phase 2: Database Migration & Seeder Upgrade**:
  - `admin/js/database-seeder.js`: Upgraded 1-click cloud seeder to populate all 6 centralized Firestore collections (`events`, `research`, `partners`, `rankings`, `indicators` + `evidence_items`, `sdg_narratives`) complete with structured blocks and public page baseline documents.
- **Phase 3: CMS Studio Block-Based Visual Editor**:
  - `admin/js/cms-forms.js`: Implemented `renderBlockBuilder` helper with `+ Add Block` menu (Text with formatting micro-toolbar, Headings, Images, Stat Callouts, Charts with 5 templates, Tables with add/remove rows, and PDF Documents), block reordering (🔼/🔽), and deletion.
  - `admin/js/cms-state.js`: State management methods (`addContentBlock`, `updateContentBlock`, `moveContentBlock`, `deleteContentBlock`, `_getTargetBlockList`).
  - Integrated into Events Manager (`buildImpactForm`), UI GreenMetric Evidence Manager (`buildIndicatorForm`), and SDG Reports Manager (`buildSdgReportForm`).
- **Phase 4: Public Pages Integration & Real-Time Sync**:
  - `js/sdg-components.js`: `<ucu-sdg-layout>` hydrates narrative sub-sections, charts, and auto-filters events and research dynamically. Curtain reveal drawers and Bookmark Style side tab for years synced with URL query params (`?year=...`).
  - `js/eco-components.js`: `<ucu-indicator-layout>` passes `data-blocks` to `<ucu-modal-shell>` for rich database evidence rendering.
  - `js/firebase-public-sync.js`: Real-time split-screen sync and production Firestore REST hydration for all collections with 0ms smart caching.

---

### 4.12 Master Architecture Overhaul: Standalone Universal Block Editor, 3x3 Announcements Grid, & DRY Homepage Sync

- **Standalone Center-Modal Universal Block Editor (`admin/js/universal-block-editor.js`)**:
  - Full-screen backdrop overlay (`bg-slate-950/80 backdrop-blur-sm`) with center modal window for spacious, clutter-free visual content editing.
  - Complete block toolbox: Markdown text with micro-toolbar (`Bold`, `Italic`, `Link`, `Bullet List`), section headings (H2/H3), evidence photos with captions, impact stat callouts, interactive charts (5 templates), and dynamic data tables with pipe-delimited rows.
  - Drag-and-drop cover photo compression with `compressAndEncodeImage` generating lightweight WebP/JPEG payloads.
- **Announcements & News Master Studio (`admin/js/modules/announcements-manager.js` & `announcement.html`)**:
  - Replicated public layout in CMS: Top pinned horizontal Featured Hero Card + 3x3 Recent Announcements Grid (9 items per page) with pagination controls.
  - Clean 3-button card actions: `[⭐ Feature / Unfeature]`, `[✏️ Edit Full Content]` (opens Universal Block Editor), and `[🗑️ Delete]`.
  - Public `announcement.html` enhanced with modal trigger integration without PDF download links (content-only presentation as requested).
- **Homepage (`index.html`) DRY Dynamic Integration**:
  - Section 2 (Headline) dynamically binds to the active `[⭐ Featured]` announcement as a single source of truth.
  - Section 4 (Global Recognition), Section 5 (Latest Impact 3 Events), and Section 6 (Global Network) automatically consume data from their respective collections (`rankings`, `events`, `partners`).
- **Admin Codebase Modularization (`admin/js/modules/`)**:
  - Decomposed monolithic `cms-forms.js` into dedicated managers:
    - `home-manager.js`: Hero carousel, stat metrics, and alliance inquiry portals.
    - `announcements-manager.js`: 3x3 grid news management and featured article pinning.
    - `events-manager.js`: Community outreach, event highlights, and modal editor triggers.
    - `research-manager.js`: Academic research archive, SDG multi-tagging, and open-access links.
    - `rankings-manager.js`: Global rankings, WURI, AppliedHE, and UI GreenMetric badges.
    - `partnerships-manager.js`: International & local partnerships, MOUs, and contact channels.
    - `smarteco-manager.js`: UI GreenMetric milestones and 7 sustainability indicators.
    - `sdg-reports-manager.js`: 17 SDG narrative reports, year switching, and executive summaries.
- **Database Seeder & Public Sync Upgrades**:
  - Upgraded `database-seeder.js` to seed `pages/announcements` and recursive nested array sanitization.
  - Upgraded `firebase-public-sync.js` with `applyFeaturedHeadline`, `renderAnnouncementPage`, and `<ucu-modal-shell>` hydration.

### 4.13 Native File Explorer Click-to-Upload & Image Replacement Engine (Completed)

- **Problem Resolved**: In browser environments, programmatically calling `.click()` on hidden file inputs from within custom dropzone div containers caused event bubbling cancelations or browser security blocks, preventing the OS File Explorer from opening on simple clicks (even though Drag & Drop worked).
- **Solution Implemented**:
  - Re-architected `universal-block-editor.js` to use native semantic `<label for="...">` wrappers for both the primary Cover Image dropzone and all block photo dropzones/replace buttons.
  - Placed `<input type="file">` as an accessible linked form control (`opacity-0 absolute pointer-events-none w-0 h-0`) so clicking anywhere on the dropzone or `[Replace Photo]` triggers the OS file picker natively via the browser's form control engine.
  - Added automatic reset of `fileInput.value = ''` upon processing, ensuring selecting the same file repeatedly always triggers the `change` event.
  - Retained full Drag & Drop (`dragover`, `dragleave`, `drop`) and auto-WebP compression (`compressAndEncodeImage`) for ultra-fast, lightweight image handling.

### 4.14 Universal Image Uploader Overhaul Across Entire CMS (Completed)

- **Codebase-Wide Image Handling Overhaul**:
  - **Homepage (`home-manager.js`)**: Added drag-and-drop dropzone (`#home-upload-new-slide`) and per-slide replace buttons to dynamically upload new banner carousel slides directly into WebP.
  - **17 SDG Reports (`sdg-reports-manager.js`)**: Added Hero Background image upload trigger with direct WebP encoding.
  - **Global Rankings (`rankings-manager.js`)**: Added visual logo upload dropzone for each ranking organization card.
  - **Universal Visual Block Editor (`universal-block-editor.js`)**: Standardized `<label for="...">` activation pattern across all cover image and content photo blocks with seamless drag-and-drop and OS file picker integration.

### 4.15 Pure HTML Native File Picker Implementation (Completed)

- **Direct OS File Dialog Integration Fix**:
  - Discovered that Chromium browsers (Brave/Chrome) and Microsoft Edge were silently blocking programmatic `input.click()` calls inside `setTimeout` or `Promise` callbacks (throwing `The user aborted a request`), and that `window.showOpenFilePicker` was actively blocked by Brave Shields and certain Windows Group Policies.
  - **Final Resolution**: Completely bypassed all JavaScript `click()` event restrictions by converting the `[📂 Open File Explorer]` UI buttons into native HTML `<label for="...">` elements directly pointing to the visible DOM `<input type="file">`.
  - This allows the browser's C++ rendering engine to natively open the File Explorer on click without any JavaScript event loop interference, rendering it 100% immune to CSS `pointer-events` overlays, modal focus traps, and browser script security policies.

- **Academic Research Studio & Direct PDF Viewer Integration**:
  - Implemented dedicated center modal editor in `admin/js/modules/research-manager.js` for adding and editing academic publications.
  - Implemented strict PDF-only validation (`application/pdf` and `.pdf` files) with File Explorer `<label>` trigger, drag & drop, file size formatting, and preview in new tab.
  - Integrated **Firebase Cloud Storage** (`uploadBytesResumable`, `getDownloadURL`) for seamless, lightweight cloud PDF hosting with live upload progress.
  - Resolved browser `about:blank#blocked` policy by implementing universal embedded HTML viewer in `window.ucuOpenPdfDocument`.
  - Safeguarded `cmsState.publishCurrentDraft()` against browser `localStorage` 5MB quota errors.
  - Interactive UN SDG Alignment selector (Goals 1–17) with live colored badges and multi-selection pills.
  - Card-only layout for `research.html` public view with direct browser PDF viewer (`target="_blank"`) without modal popups.
  - Fully synchronized with Cloud Firestore (`pages/research_2025`), Firebase Storage, and `previewBridge.sendLiveUpdate`.

- **Strategic Linkages & Partnerships Studio (`partnership.html` & `admin/js/modules/partnerships-manager.js`)**:
  - Implemented comprehensive CMS management for Top Banner (Eyebrow, Headline, Highlight, Description).
  - Implemented real-time interactive controls for 5 Strategic Linkage Metric Cards (`activeMous`, `globalPartners`, `localPartners`, `membershipPartners`, `totalCountries`).
  - Implemented full Institutional Partner Organization Directory: Category Tabs (`All`, `Local Academic`, `Local Industry`, `International Academic`, `International Industry`, `Membership`), live search filtering by partner name, and responsive partner card grid with logo badges and action buttons.
  - Implemented dedicated center modal editor for adding and editing partner organizations with native File Explorer logo upload (`<label for="...">`), instant logo preview, and URL link input.
  - Implemented Global Footprint Countries Manager with interactive live national flag previews using `flag-icons`.
  - Implemented Strategic Alliance & Direct Correspondence Portals form (Inquiry Google Form link, Directorate Email, Official President Email).
  - Fully synchronized with Cloud Firestore (`pages/partnership_2025`), LocalStorage cache, and `previewBridge.sendLiveUpdate`.

- **Institutional Rankings & Trajectory Studio (`rankings.html` & `admin/js/modules/rankings-manager.js`) [LOCKED IN ✅]**:
  - Implemented comprehensive CMS management for Top Banner Hero and Section Headings (`standingTitle`, `trajectoryEyebrow`, `trajectoryTitle`, `terminusStatement`).
  - Filtered Organization dropdown to only display organizations currently saved in the database/draft + `+ Custom Organization...`.
  - Implemented Organization Theme Color Picker (`<input type="color">`, hex input, quick preset swatches) with in-place live DOM updates and zero scroll snapping.
  - Implemented Pillar & Category Sub-Metrics Color Picker with hex input and swatches to customize background colors of each pillar card.
  - Implemented dual sorting switcher (`🕒 Year (Newest)` vs `🔤 Organization (A-Z)`) and non-interrupting live search bar.
  - Built dedicated Center Modal Editor supporting cycle year, main rank, category scope, short highlight description, official publication URL (`publicationUrl`), and native File Explorer custom logo upload.
  - Restored and styled the **`[🌐 See Publication ↗]`** button on the public Historical Timeline cards (`UcuRankingTimeline`) with automatic URL normalization (supporting direct URLs, `www.`, and Facebook post links).
  - Fully synchronized with Cloud Firestore (`pages/rankings`), LocalStorage cache, and `previewBridge.sendLiveUpdate`.

- **Smart Eco Campus & 7 UI GreenMetric Indicator Pillars Studio (`smart-eco-campus.html` & `indicators/*.html`) [COMPLETED]**:
  - **Smart Eco Campus Hub (`smart-eco-campus.html`) [LOCKED IN ✅]**:
    - Top Banner Hero Editor with two-way data binding.
    - UI GreenMetric Award Photos Slider with WebP compression and delete modal confirmation.
    - Global Recognition Narrative Editor (eyebrow, title, 3 paragraphs).
    - UI GreenMetric Verified Milestones strictly 7 cards with live 3-color theme switcher (`Blue`, `White`, `Red`) without UI overflow.
    - 7 Sustainability Indicator shortcuts with instant navigation.
    - Concluding Framework Statement editor.
  - **7 UI GreenMetric Indicator Pillar Studios (`admin/js/modules/indicators-manager.js` & `indicators/*.html`) [LOCKED IN ✅]**:
    - Complete official sequence: 01 Setting & Infrastructure, 02 Energy & Climate Change, 03 Waste, 04 Water, 05 Transportation, 06 Education & Research, 07 Governance & Digitalization.
    - Universal Natural Numerical Sorting on all evidence submissions (`1.3, 1.4, ..., 1.10, 1.15...`) on website and CMS.
    - Centralized **Pillar Evidence Icon & Seal** architecture with instant real-time live preview cascading and Firestore persistence.
    - Streamlined Evidence Modal Editor with 17 UN SDG Matrix multi-tag toggling (single clean clone, duplicate push bug eliminated).
    - Dual-collection sync on publish (`indicators/{pillarId}` + `evidences/{evidenceDocId}`) with hydration protection on live public pages.
    - Bidirectional navigation sync between Split-Screen Iframe preview and CMS Studio.
    - Fully synchronized with Cloud Firestore, LocalStorage cache, and preview bridge.
  - **17 SDG Narrative Pages & Page-Level CMS Block Editor (`sdg-reports/sdg1.html`–`sdg17.html` & `admin/js/modules/sdg-reports-manager.js`) [LOCKED IN ✅]**:
    - Complete restoration of the 6 core structural visual elements from the approved Leeds Beckett / UN SDG design:
      1. Hero Header (`<ucu-sdg-page-hero>`): Title, Subtitle, Hex color, background image, logo, and 17-color bottom spectrum stripe.
      2. Left Side Nav Bar: Fixed 260px strip with 18 horizontal cards (Card 0 linking to `sdg-reports.html` dashboard + Cards 1–17 with active goal glowing outline).
      3. Main SDG Goal Narrative Section: Master drawer (`border-l-[6px]`), `OVERVIEW` pill badge, 3 Top Impact Metric Cards, Executive Summary prose, and expandable **Impact Drawers** (grouped by H2 with full-width `<ucu-data-viz>` charts and attached community engagement event cards).
      4. Researches Master Drawer: Collapsible publications drawer (`border-l-[6px]`), `PUBLICATIONS (X)` badge, and research paper cards.
      5. Right Bookmark Year Tabs: Sticky vertical tabs flush with the main container with deep linking and smooth animated transition.
      6. Bottom Ribbon (`<ucu-sdg-ribbon>`): 17 colored numbered square pill buttons.
    - **Dynamic Multi-Year Management & Deep Linking Preservation [LOCKED IN ✅]**:
      - Admin ability to dynamically add and remove reporting years with custom confirmation modal (`window.cmsConfirm`).
      - Intelligent current-year default resolution (`new Date().getFullYear()`, e.g. `2026`).
      - In-page inter-SDG navigation persistence across Prev/Next buttons, vertical side navigation cards, and bottom ribbon pills (`?year=${activeYear}`).
    - **Searchable Combobox & Aligned Event Filtering [LOCKED IN ✅]**:
      - Automatic filtering in `UniversalBlockEditor` `event_card` block by active SDG alignment (`relatedSdgs.includes(activeSdg)`).
      - Live search input combobox with real-time matching and selected event card preview.
    - Non-destructive DOM rendering architecture in `js/sdg-components.js` with `updateWithLiveDraft(data)` preventing component wiping during real-time sync.
    - Page-Level CMS Block Editor in `admin/js/modules/sdg-reports-manager.js` featuring multi-drawer management (title, open state toggle, attached event picker, move up/down, delete) and integration with `UniversalBlockEditor`.
    - Live Split-Screen synchronization (`PreviewBridge` + `firebase-public-sync.js`) and database seeder in `admin/js/database-seeder.js` targeting `sdg_narratives/sdg_{num}_{year}`.

### 4.17 CMS Studio UI Redesign Phase 2 — Header Pages & SDG Reports Studio (Completed August 22, 2026)

- **Universal Lucide Icon Engine Integration (`admin/js/lucide-icon-picker.js`)**:
  - Integrated 2,000+ searchable outline icons across categories with descriptor-to-SVG parsing.
- **Homepage Studio (`admin/js/modules/home-manager.js` & `index.html`)**:
  - Initial UI Improvement + Lucide Icon selector on Section 3 metric cards + connected navigation buttons.
  - **Clean Hero Carousel Photo Cards**: Removed legacy URL text box from Section 1 slider items in favor of minimalist preview cards with Replace/Delete action pills.
  - **Theme Color Selector**: Added simplified Theme Color dropdown (`White`, `Blue`, `Red`) for each card.
  - **Metric ID Removal & Direct Values**: Completely eliminated `Metric ID (System Link)` and automated calculation overrides; values entered in CMS are directly rendered on the Homepage.
- **Announcements Studio & Public Page Synchronization (`admin/js/modules/announcements-manager.js` & `announcement.html`)**:
  - Featured Card: Gradient Blue (`bg-gradient-to-br from-ucu-blue-dark via-[#1e293b] to-ucu-blue`) with SDG number boxes on far right (`ml-auto`) and UCU Red button.
  - Recent Cards: Clean white cards with `border-slate-200`, Category Tag on top-left, Date on top-right, SDG Number Boxes on bottom-left, and `"Read more &rarr;"` on bottom-right.
  - Studio Recent Cards: Two-row footer with action buttons on second row to prevent overflowing.
- **SDG Reports Studio Initial UI Improvements & Final Audit Passed (`admin/js/modules/sdg-reports-manager.js`, `admin/js/cms-forms.js`, & `admin/index.html`)**:
  - **Header Bar & Breadcrumbs**: Standardized to `"Editing : SDG Reports"` (removed year from breadcrumb badge to prevent confusion) + physical entry badge `sdg-reports.html`.
  - **Relabeled Section 2**: Changed `"Summary Metrics Cards"` to `"Metrics Cards"`.
  - **Universal Metric Cards UI & Lucide Icon Engine**: Added Lucide outline icon picker trigger buttons with live SVG preview, direct Value/Label inputs, and unified theme dropdowns (`White`, `Blue`, `Red`) for both SDG Landing Dashboard and Individual SDG Narratives.
  - **Amber Section Badges**: Standardized all section badges across landing dashboard (`Section 1: Hero Banner & Header`, `Section 2: Metrics Cards`, `Section 3: SDG Goal Cards Grid`) and individual narrative studios (`Section 1: Hero Banner & Visual Identity`, `Section 2: Top Overview & Lead Narrative`, `Section 3: Impact Chapters & Expandable Drawers`).
  - **Outline SVGs**: Replaced all emoji icons with stroke outline SVGs for sections, block types, reordering buttons, drawer controls, and file uploads.
  - **Controls & Media Uploaders**: Clean framed preview cards with outline Replace/Remove pills and colored SDG filter buttons.
- **Research Studio & Public Research Page Improvements (`admin/js/modules/research-manager.js`, `js/research-data.js`, `js/impact-feeds.js`, `research.html`, & `admin/index.html`)**:
  - **Header Bar & Breadcrumbs**: Standardized to `"Editing : Research"` + physical entry badge `research.html` + relabeled title to `"Research Studio"` + fixed duplicate plus icon on `"Add Research Paper"` button.
  - **Month & Year Schema Separation**: Separated `month` and `year` fields in database/data structures (`window.UCU_RESEARCH`) and in the modal editor (`Month` select dropdown + `Year` input), auto-composing formatted `date` (`"Oct 2025"`).
  - **Modal Aligned SDG Goals**: Relabeled to `"Aligned SDG Goals"` + converted goal selection into square number boxes (`1`–`17`) with official UN SDG theme color fills when selected (e.g. SDG 1 Red, SDG 2 Gold, SDG 3 Green, etc.).
  - **Publications Repository Card Theme Colors**: Corrected SDG alignment box colors on CMS research cards to render using their specific SDG goal theme colors instead of plain blue.
  - **Clean PDF Upload UI**: Removed `"PDF Recommended"` yellow text in modal PDF uploader.
  - **Card UI Synchronization**: Aligned studio research cards with public website layout featuring prominent headline, user icon with authors, calendar icon with Month & Year, uppercase keyword pills, square colored SDG badges, and relabeled action button `"Edit"` (removed "Paper" suffix).
  - **Clean Horizontal Public Filter Toolbar (`research.html` & `UcuResearchFeed`)**: Fixed CSS width conflict by removing `.filter-btn { width: 100% }`, rendering the Year dropdown and all 18 SDG square number buttons in a clean, compact horizontal single-row toolbar with live real-time filtering, aligned to the universal institutional page content width (`max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8`) matching `impact.html`, `rankings.html`, and `partnership.html`.
- **Impact & Events Studio & Public Website Implementation (`admin/js/modules/events-manager.js`, `admin/js/universal-block-editor.js`, `impact.html`, `js/impact-feeds.js`)**:
  - **Header Bar & Breadcrumbs**: Standardized to `Editing : Impact & Events` + physical entry badge `impact.html` + title `"Impact & Events Studio"` + clean `+ Add Impact Event` button with stroke icon.
  - **Section 1 (Hero Banner)**: Relabeled to `"Hero Banner"` across all Header Page studios (**Impact & Events**, **SDG Reports**, **Research**, **Rankings**, **Partnerships**, and **Smart Eco Campus**), ensuring unified naming portal-wide.
  - **Section 2 (Metrics Cards Builder)**: Relabeled to `"Metrics Cards (${metrics.length})"` with amber section badge, universal **Lucide Icon Engine** (`lucideIconPicker`) integration, live SVG preview picker button, direct Value/Label inputs, and unified theme dropdowns (`White`, `Blue`, `Red`).
  - **Section 3 (Highlighted Event - CMS Featured Hero Card)**: Added dedicated Section 3 rendering the **Blue Gradient Hero Card** (`bg-gradient-to-br from-ucu-blue-dark via-[#1e293b] to-ucu-blue`) matching the Announcement Studio Section 1 layout:
    - Left side: `Featured Active` amber pill, date, block count, aligned SDG boxes on far right, headline, excerpt, and 3 action buttons (`[ ✏ Edit Full Event ]`, `[ ⭐ Unhighlight ]`, `[ 🗑 Delete ]`).
    - Right side: Framed cover photo.
    - Empty state: Clean dashed box with clear hint to highlight an event below if none is active.
  - **Section 4 (Events Repository & Announcement-Aligned Cards)**: 
    - 3x3 Card Grid matching Announcement Studio Recent Cards (top cover photo with `X Blocks` badge and `Featured Active` badge when highlighted, white canvas, category badge on left, date on right, two dedicated footer lines for SDG badges and CMS action buttons: `[ ⭐ Highlight / Highlighted ]`, `[ ✏ Edit ]`, `[ 🗑 Delete ]`).
    - Smart highlight switcher: Selecting an event unhighlights previous items to maintain single-hero active state.
  - **Modal Event Editor Structured Date & SDG Theme Colors**: Added separate Month dropdown (`January`–`December`), Day input (`15-22`), and Year input (`2025`), automatically computing formatted date string while maintaining granular field storage. Fixed `SDG_COLORS` color mapping so active SDG number boxes render with their exact UN theme colors (SDG 1 Red, SDG 2 Gold, SDG 3 Green, etc.).
  - **Announcement-Matched Public Layout & Separated Filtering (`impact.html` & `UcuImpactFeed`)**:
    - **1. Header Hero**: `<ucu-hero-banner>` with institutional typography.
    - **2. Metric Cards**: `<ucu-metric-cards>` with Lucide icons.
    - **3. Highlighted Event Hero Card (Blue Gradient)**: Replaced old "Institutional Highlights" section with a full-width blue gradient hero card (`bg-gradient-to-br from-ucu-blue-dark via-[#1e293b] to-ucu-blue`) matching the Announcement Featured Hero card. Positioned right image container with `lg:absolute lg:inset-y-0 lg:right-0` across `impact.html`, `announcement.html`, `events-manager.js`, and `announcements-manager.js` so tall portrait/document images are cleanly cropped (`object-cover`) without expanding or distorting the card's fixed height.
    - **4. Filter Section**: Centralized single-row horizontal toolbar (Year dropdown select + SDG 1–17 square colored number boxes).
    - **5. Recent Events Feed**: Clean title header (`Recent Events` without red pill accent) + 3x3 card grid matching the Recent Announcement card layout (category badge on top-left, date on top-right, bold headline, slate description, SDG boxes, and animated `Read more →` arrow).
  - **Universal Content Width & Typography**: Aligned to standard container width `max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8` with 100% Montserrat (`font-sans`) typography, eliminating `font-mono` on dates.
- **Universal Block Editor Modal Polish (`admin/js/universal-block-editor.js`)**:
  - **Metric Cards Icon Selector Integration**: Integrated `lucideIconPicker` trigger button with live Lucide SVG preview on each metric item in the modal.
  - **Header Subtitle Removed**: Removed `"Announcements & News Master Record"` / `"Universal Visual Content Builder"` text bloat for a cleaner modal top bar.
  - **Universal Stroke Outline SVGs**: Replaced all emojis throughout the modal (header icons, metadata badges, 8 block toolbar buttons, block order/delete controls, image upload triggers, chart controls, event card search & link elements) with clean stroke outline SVGs.
- **Metric Cards Component Theme Colors Standardized (`js/visual-media.js` & `css/global.css`)**:
  - **Red Theme Card**: `bg-ucu-red` with bright yellow outline icon (`text-ucu-yellow`), bold crisp white value (`!text-white`), and white uppercase label (`!text-white/90`).
  - **Navy Theme Card**: `bg-ucu-blue-dark` with bright yellow outline icon (`text-ucu-yellow`), bold crisp white value (`!text-white`), and white uppercase label (`!text-white/90`).
  - **White Theme Card**: `bg-white` with UCU red outline icon (`text-ucu-red`), dark blue value (`!text-ucu-blue-dark`), and muted slate label (`!text-slate-600`).
  - **Prose Style Leak Prevention**: Added CSS prose reset and converted value tags to `div.ucu-counter` to prevent `.ucu-prose-evidence h3` rules from overriding text colors and margins.

- **Rankings Studio Initial UI Improvements (`admin/js/modules/rankings-manager.js`)**:
  - **Header Bar & Breadcrumbs**: Standardized to `Editing : Institutional Rankings` + physical entry badge `rankings.html` + title `"Institutional Rankings Studio"` + clean `+ Add Ranking Record` button with stroke icon.
  - **Section 1 (Hero Banner)**: Standardized to white card layout (`bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4`) with amber section badge (`Section 1`), stroke globe icon, 3-column input row (`heroEyebrow`, `heroHeadline`, `heroHighlight`), and full-width description textarea.
  - **Section 2 (Headings & Terminus Vision)**: Converted to clean white card layout with amber section badge (`Section 2`), stroke book/vision icon, 3-column input row (`standingTitle`, `trajectoryEyebrow`, `trajectoryTitle`), and serif italic `terminusStatement` textarea.
  - **Section 3 (Rankings Directory & Accreditations)**:
    - Amber section badge (`Section 3`) + title `Rankings Directory (${filteredRankings.length} of ${rankingsList.length})`.
    - Segmented sorting control inside `bg-slate-100 p-1 rounded-xl` track (`Year (Newest)` vs `Org (A-Z)`).
    - Segmented filter pill track `bg-slate-100 p-1 rounded-xl` with high-contrast active state and pill counters.
    - Card Grid: Modern white card styling, high-contrast organization badge, framed logo container, sub-metrics breakdown pills with colored dots, official publication link badge, and stroke outline action buttons (`[ ✏ Edit ]`, `[ 🗑 Delete ]`).
  - **Center Modal Ranking Record Editor**:
    - Replaced emojis with clean stroke outline SVGs (header trophy icon, upload icon, delete icons, save check icon).
    - **Structured 7-Row Modal Layout**:
      - **Row 1**: Square Drag-and-Drop `Logo / Emblem` dropzone (with hover `[ ⬆ Replace Logo ]` overlay & reset button) + `Ranking Organization` dropdown (dynamically swaps to text input when custom org is chosen, with quick reset back to presets).
      - **Row 2**: `Theme Color` badge picker with hex input, quick preset swatches, and live preview badge.
      - **Row 3**: 3-column row for `Label`, `Rank Value`, and `Category / Scope`.
      - **Row 4**: 2-column row for `Year` and `Publication Date`.
      - **Row 5**: `Description` textarea.
      - **Row 6**: `Publication URL` input.
      - **Row 7**: `Pillar & Category Sub-Metrics` builder.

- **Strategic Linkages & Partnerships Studio & Public Page (`admin/js/modules/partnerships-manager.js` & `partnership.html`)**:
  - **Standardized Header**: `Header Page` + `partnership.html` mono badge + `Partnerships Studio` + `+ Add New Partner` button.
  - **Section 1 (Hero Banner)**: White card layout with amber badge (`Section 1`), stroke globe icon, 3-column input row (`heroEyebrow`, `heroHeadline`, `heroHighlight`), and `heroDescription`.
  - **Section 2 (Metrics Cards Builder - Auto-Calculated)**: Replicated the exact row interface design from **Impact & Events Studio (`events-manager.js`)**:
    - Number badge (`#1` to `#6`), interactive Lucide Icon Selector button.
    - 3-column input row: `Value (Auto-Calculated)` (read-only with `🔒 Fixed`), `Metric Label` (read-only with `🔒 Fixed`), and `Theme Color` dropdown strictly restricted to 3 clean institutional themes: **White**, **Blue**, and **Red** (`white`, `blue`, `red`).
    - Section title labeled cleanly as `Metrics Cards (${metrics.length})` with `Values & Names Auto-Calculated` status pill.
  - **Section 3 (Partners Directory)**: Amber badge (`Section 3`), stroke handshake/network icon, segmented sorting (`Recent` vs `Name (A-Z)`), segmented category filter tabs (`All Partners`, `Local Academic`, `Local Industry`, `International Academic`, `International Industry`, `Memberships`), 4-column modern card grid with framed logo boxes and stroke action buttons (`[ ✏ Edit ]`, `[ 🗑 Delete ]`).
  - **Section 4 (Represented Countries)**: Amber badge (`Section 4`), stroke flag icon, comma-separated textarea with live flag preview chips (`fi fi-xx`).
  - **Section 5 (Direct Linkage Portals)**: Amber badge (`Section 5`), stroke envelope icon, 2-column inputs for `allianceTitle`, `partnershipFormUrl`, `allianceDescription`, `emailExternal`, and `emailOfficial`.
  - **Center Modal Partner Editor**: Modernized with square drag-and-drop logo dropzone (`w-full h-28`), dark hover overlay `[ ⬆ Replace Logo ]`, remove logo trigger, bold labels, and stroke check icons.
  - **Public Page Headings Modernization (`partnership.html`)**: Removed legacy red pill accents from all category sections (`Local Academic Partners`, `Local Industry Partners`, `International Academic Partners`, `International Industry Partners`, `Memberships`, `Represented Countries`) and upgraded typography to `text-2xl sm:text-3xl md:text-4xl font-black text-ucu-blue-dark tracking-tight` with subtle trailing slate divider lines.
  - **Public Live Sync (`js/firebase-public-sync.js`)**: Dynamic real-time calculation and custom theme/icon hydration for `<ucu-metric-cards>` on `partnership.html`.

- **Smart Eco Campus Studio (`admin/js/modules/smarteco-manager.js`) & Public Page (`smart-eco-campus.html`)**:
  - **Standardized Header**: Clean header without external framework pills (`Header Page` + `smart-eco-campus.html` mono badge + `Smart Eco Campus Studio`).
  - **Section 1 (Hero Banner)**: White card layout with amber badge (`Section 1`), stroke globe icon, 3-column input row (`heroEyebrow`, `heroHeadline`, `heroHighlight`), and `heroDescription` textarea.
  - **Section 2A (Slider Images)**: Relabeled to `Slider Images (${awardImages.length})` with amber badge (`Section 2A`), framed aspect-ratio cards with dark hover backdrop, image blur effect (`group-hover:blur-[2px]`), centered red trash remove trigger `[ 🗑 Remove ]`, and dedicated bottom-right footer container holding the `+ Add` button.
  - **Section 2B (Narrative)**: Relabeled to `Narrative` with amber badge (`Section 2B`), 2-column header inputs, and consolidated `introNarrative` textarea where pressing Enter dynamically splits and reflects into new `<p>` tags on the live public site (with full backward compatibility for `introParagraph1` / `introParagraph2` / `introParagraph3`).
  - **Section 3 (Bento-Box Grid - 7 Official Cards)**: Relabeled to `Bento-Box Grid (${milestones.length})` with amber badge (`Section 3`), stroke trophy icon, full-width card stack (#1 to #7) with card 1 labeled `Milestone #1`, rank value, milestone label, and clean **Dropdown Theme Selector** showing concise color names (`Blue`, `White`, `Red`).
  - **Section 4 (7 Sustainability Indicator Pillars)**: Amber badge (`Section 4`), stroke leaf icon, 4-column studio link cards with `[ Open Studio → ]` shortcuts, and concluding statement textarea.
  - **Public Page Headings & Live Sync (`smart-eco-campus.html` & `firebase-public-sync.js`)**: Upgraded `Sustainability Indicators` heading to institutional standard (`text-2xl sm:text-3xl md:text-4xl font-black text-ucu-blue-dark tracking-tight`) with trailing slate divider lines, and dynamic multi-paragraph sync container.
- **7 Indicator Pillar Studios Engine (`admin/js/modules/indicators-manager.js`) & Blueprint (`INDICATOR_MASTER_IMPROVEMENT.md`)**:
  - **Standardized Header**: `Header Page` eyebrow + `indicators/${pillarId}.html` mono badge + `${pillar.title} Studio`. Duplicate criteria pill and switcher tabs removed.
  - **Section 1 (Navigation Image)**: Relabeled to `Navigation Image`, 16:9 framed drag-and-drop dropzone (`#pillar-thumb-dropzone`) with hover blur (`group-hover:blur-[2px]`) and centered `[ ⬆ Replace ]` button. Reset button removed.
  - **Section 2 (Pillar Narrative & Executive Summary)**: Amber badge (`Section 2`), stroke document icon, 6-row clean narrative textarea bound to `draft.narrative`.
  - **Section 3 (Metric Cards - 3 Cards)**: Amber badge (`Section 3`), stroke chart icon, horizontal stacked row cards with card index badges (#1, #2, #3), **Interactive Lucide Icon Picker integration** (`data-pick-indicator-metric-icon`), clean theme dropdown (`Blue`, `White`, `Red`), centered value, title, and linked evidence ID.
  - **Section 4 (Evidence Repository)**: Amber badge (`Section 4`), stroke folder icon, header `+ Add Indicator Evidence` button, enlarged `w-16 h-16` Icon / Seal box without reset button, full-width search bar below it, and 3-column modern card grid with monospace code tags, SDG pills, and stroke edit/delete action triggers (URL path and category badge removed).
  - **Modal Evidence Editor**: Modern white header, 2-column form rows, interactive 17 UN SDG chip matrix with official vibrant colors, and verified save pipeline (`PASSED & LOCKED IN`).
  - **All 7 Indicator Studios Rollout**: Setting & Infrastructure (01), Energy & Climate Change (02), Waste Management (03), Water Management (04), Transportation (05), Education & Research (06), and Governance & Digitalization (07) — **100% Deployed, Verified, & Passed**.

---

## 5. Next Steps & Upcoming Roadmap

1. **Public SDG Narrative Pages UI Modernization (`sdg-reports/sdg1.html` to `sdg17.html`)**:
   - Establish **`SDG_PUBLIC_NARRATIVE_MASTER_IMPROVEMENT.md`** using **SDG 1 (`sdg1.html`)** as the verified Gold Standard baseline.
   - **Checkpoint 1**: Hero Banner (`<ucu-sdg-page-hero>`), 18-card Left Sidebar Navigation, & Right Floating Bookmark Year Tabs.
   - **Checkpoint 2**: Zone 1 (Overview Narrative, Lead Typography, & `<ucu-metric-cards>` with Lucide outline icons).
   - **Checkpoint 3**: Zone 2 (Impact Drawers / Sub-Accordions, Visual Block Stream, & Aligned Community Event Cards).
   - **Checkpoint 4**: Researches & Publications Accordion Feed (Paper cards, author badges, keyword pills, PDF access buttons).
   - **Checkpoint 5**: Bottom SDG Ribbon Strip (`<ucu-sdg-ribbon>`) & Event Modals (`<ucu-modal-shell>`).
2. **Smart Eco Campus Studio User Verification & Approval**: Review proposed implementation plan and proceed based on user guidance.
3. **Public Page Polish (`smart-eco-campus.html`)**: Update section headings typography with trailing divider lines and verify live cloud sync.
4. **Portal-wide Audit & Cloud Firestore Sync**: Final build validation across all 7 Header Page studios.

- **17 SDG Narrative Studios Engine (`admin/js/modules/sdg-reports-manager.js`) & Blueprint (`SDG_NARRATIVE_MASTER_IMPROVEMENT.md`)**:
  - **Master Blueprint File**: [`SDG_NARRATIVE_MASTER_IMPROVEMENT.md`](file:///c:/kudecode/sdg-web/SDG_NARRATIVE_MASTER_IMPROVEMENT.md) establishing **SDG 1 (No Poverty)** as the Gold Standard baseline.
  - **Checkpoint 1 (Header & Section 1 - Hero Banner)**: **PASSED & LOCKED IN**. Standardized Header (Title `SDG ${sdgNum} Studio`, pulsing `Year:` selector, removed goal dropdown), Section 1 Hero Banner (30% Logo/Icon dropzone with evidence-indicator style hover pill and native drag-and-drop, 60% Hero banner dropzone with hover pill and drag-and-drop, 10% Color picker, Eyebrow, Headline & Description).
  - **Checkpoint 2 (Section 2 - Top Overview Narrative)**: **PASSED & LOCKED IN**. Title `Top Overview Narrative`, single primary creation engine via Visual Block Editor modal.
  - **Checkpoint 3 (Section 3 - Impact Drawers & Universal Safety)**: **PASSED & LOCKED IN**. Section Title `Impact Drawers (${drawers.length})`, orange `[ + New Drawer ]` and drawer card `[ Editor ]` triggers, static card heading, 2-row card layout (removed obsolete linked event tags), Drawer Editor modal with square number box `#1` and `"Drawer Content"` title, direct rich block event integration, backdrop click exit prevention, cancel/close unsaved changes confirmation, and explicit block deletion confirmations with `z-[300]` modal stacking.
  - **17 SDG Studios Full Deployment**: **100% DEPLOYED & ACTIVE**. All 17 SDG Narrative Studios (SDG 1 through SDG 17) are dynamically powered by the centralized modular engine [`admin/js/modules/sdg-reports-manager.js`](file:///c:/kudecode/sdg-web/admin/js/modules/sdg-reports-manager.js) and [`admin/js/universal-block-editor.js`](file:///c:/kudecode/sdg-web/admin/js/universal-block-editor.js), fully connected to Firestore CRUD, local draft caching, and real-time split-screen preview. All 17 public pages (`sdg1.html` to `sdg17.html`) are audited with complete script dependencies and live sync hydration.

---

## 6. Environment & Tool Rules

- **CSS Framework**: Tailwind CSS **v3** (not v4)
- **Compile command**: `npx tailwindcss -i ./css/global.css -o ./css/style.css`
- **Do NOT use** `browser_subagent` tool for rendering verification — user verifies manually
- **Do NOT include** `ArtifactMetadata` block in `write_to_file` when writing to workspace source files
- **IDE**: Antigravity IDE
- **Workspace root**: `c:\kudecode\sdg-web`
