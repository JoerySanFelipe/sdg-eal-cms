# 🏛️ Master Improvement Blueprint: Public SDG Narrative Pages

This blueprint establishes the **Gold Standard UI & Readability Baseline** using **SDG 1 (No Poverty - `sdg1.html`)** as the reference model and serves as the master contract for reviewing, polishing, and verifying all 17 public SDG narrative pages:

1. **SDG 1: No Poverty** (`sdg1.html`) — *Reference Baseline*
2. **SDG 2: Zero Hunger** (`sdg2.html`)
3. **SDG 3: Good Health and Well-Being** (`sdg3.html`)
4. **SDG 4: Quality Education** (`sdg4.html`)
5. **SDG 5: Gender Equality** (`sdg5.html`)
6. **SDG 6: Clean Water and Sanitation** (`sdg6.html`)
7. **SDG 7: Affordable and Clean Energy** (`sdg7.html`)
8. **SDG 8: Decent Work and Economic Growth** (`sdg8.html`)
9. **SDG 9: Industry, Innovation and Infrastructure** (`sdg9.html`)
10. **SDG 10: Reduced Inequalities** (`sdg10.html`)
11. **SDG 11: Sustainable Cities and Communities** (`sdg11.html`)
12. **SDG 12: Responsible Consumption and Production** (`sdg12.html`)
13. **SDG 13: Climate Action** (`sdg13.html`)
14. **SDG 14: Life Below Water** (`sdg14.html`)
15. **SDG 15: Life on Land** (`sdg15.html`)
16. **SDG 16: Peace, Justice and Strong Institutions** (`sdg16.html`)
17. **SDG 17: Partnerships for the Goals** (`sdg17.html`)

---

## 1. Core Design Standards & Principles

- **Montserrat Typography Throughout**: Every heading, lead paragraph, metric card, drawer title, author name, and button strictly uses `font-sans` (Montserrat).
- **Executive Readability & Contrast**:
  - Headings: Bold / Black weights (`font-black`, `font-bold`), `text-slate-900` or `text-ucu-blue-dark`.
  - Body Text: `text-slate-700` with comfortable line-height (`leading-relaxed` / `leading-loose`).
  - Metadata: `text-slate-500` / `text-slate-400`.
- **AI & Ranking Bot Evaluation Readiness**:
  - Semantic HTML5 structure (`<header>`, `<main>`, `<article>`, `<section>`, `<figure>`, `<figcaption>`).
  - Explicit ARIA accessibility (`role="region"`, `aria-expanded`, `aria-controls`, `aria-label`).
  - Clean text nodes and structured metrics facilitating parsing by evaluation crawlers (THE Impact, UI GreenMetric, QS, AI evaluators).
- **Harmonious SDG Brand Colors**:
  - Each goal dynamically accentuates borders, pill badges, active year tabs, and left indicator bars using its official UN brand color hex (`#E5243B` to `#19486A`).

---

## 2. Standardized Section Breakdown & Verification Checkpoints

### 🔹 Checkpoint 1: Hero Banner, 18-Goal Left Navigation, & Floating Year Tabs
- **Hero Banner (`<ucu-sdg-page-hero>`)**:
  - Clean glassmorphic container for goal icon with subtle border and shadow.
  - Deep radial gradient blending UCU Navy (`#24305E`) with the official SDG brand color.
  - Sizable goal title (`text-3xl md:text-5xl xl:text-6xl font-black font-sans`).
  - Subtle Previous / Next goal floating switcher (`[ < Prev ]` and `[ Next > ]`) with query-preserving year parameter.
  - Dynamic 17-color spectrum bar along the bottom edge.
- **Left Sidebar Navigation (18 Goal Cards)**:
  - Sticky vertical navigation container with rounded goal cards and active goal highlight ring.
- **Right Floating Bookmark Year Tabs**:
  - Vertical floating pill strip (`2025`, `2024`, `2023`) with high-contrast active tab matching the goal brand color and smooth hover effects (`window.ucuSwitchYear`).
  - Clean segmented control for mobile screens.

### 🔹 Checkpoint 2: Zone 1 (Overview Narrative & Floating Metric Cards)
- **Executive Lead Summary**:
  - High-readability typography (`text-base md:text-lg text-slate-700 leading-relaxed font-medium`).
- **Floating Metric Cards (`<ucu-metric-cards>`)**:
  - 3-card responsive grid (`navy`, `white`, `red`).
  - Bold numbers (`text-3xl md:text-4xl font-black font-sans`).
  - Pure minimalist stroke outline Lucide SVG icons.
  - Clear uppercase label tracking.

### 🔹 Checkpoint 3: Zone 2 (Impact Drawers & Content Blocks)
- **Sub-Accordion Impact Drawers**:
  - Rounded container cards (`border border-slate-200/90 rounded-2xl bg-white shadow-xs hover:shadow-md`).
  - Dynamic colored dot indicator and state toggle pill (`[ Explore ]` / `[ Hide ]`).
- **Visual Content Block Stream (`UcuBlockRenderer`)**:
  - Formatted paragraphs with markdown parsing (bolding, italics, links, lists).
  - Heading blocks with colored bar accents and trailing divider lines.
  - Responsive figure media blocks with center captions.
  - Callouts and data charts (`<ucu-data-viz>`).
  - Aligned community engagement event cards (`.ucu-event-trigger`).

### 🔹 Checkpoint 4: Researches & Publications Accordion Feed
- **Accordion 2 (Publications)**:
  - Live count badge (`Publications [N]`).
  - Academic paper cards with title, publication date badge, author list with red tag, readable abstract, keyword tags, and repository access buttons.

### 🔹 Checkpoint 5: Bottom SDG Ribbon Strip & Event Modals
- **Bottom SDG Ribbon Strip (`<ucu-sdg-ribbon>`)**:
  - Responsive horizontal strip of all 17 goals with active goal highlighted with glow/ring.
- **Event Modals (`<ucu-modal-shell>`)**:
  - Backdrop-blurred interactive modal shell (`backdrop-blur-md bg-slate-950/70`) for aligned outreach stories.

---

## 3. Rollout Checklist for 17 Public SDG Narrative Pages

| Goal # | Goal Name | Brand Color | Route | Status |
| :---: | :--- | :---: | :--- | :---: |
| **01** | **No Poverty** | `#E5243B` | `sdg1.html` | 🎯 Active Development (Baseline) |
| **02** | **Zero Hunger** | `#DDA63A` | `sdg2.html` | Pending Baseline Lock-in |
| **03** | **Good Health and Well-Being** | `#4C9F38` | `sdg3.html` | Pending Baseline Lock-in |
| **04** | **Quality Education** | `#C5192D` | `sdg4.html` | Pending Baseline Lock-in |
| **05** | **Gender Equality** | `#FF3A21` | `sdg5.html` | Pending Baseline Lock-in |
| **06** | **Clean Water and Sanitation** | `#26BDE2` | `sdg6.html` | Pending Baseline Lock-in |
| **07** | **Affordable and Clean Energy** | `#FCC30B` | `sdg7.html` | Pending Baseline Lock-in |
| **08** | **Decent Work and Economic Growth** | `#A21942` | `sdg8.html` | Pending Baseline Lock-in |
| **09** | **Industry, Innovation and Infrastructure** | `#FD6925` | `sdg9.html` | Pending Baseline Lock-in |
| **10** | **Reduced Inequalities** | `#DD1367` | `sdg10.html` | Pending Baseline Lock-in |
| **11** | **Sustainable Cities and Communities** | `#FD9D24` | `sdg11.html` | Pending Baseline Lock-in |
| **12** | **Responsible Consumption and Production** | `#BF8B2E` | `sdg12.html` | Pending Baseline Lock-in |
| **13** | **Climate Action** | `#3F7E44` | `sdg13.html` | Pending Baseline Lock-in |
| **14** | **Life Below Water** | `#0A97D9` | `sdg14.html` | Pending Baseline Lock-in |
| **15** | **Life on Land** | `#56C02B` | `sdg15.html` | Pending Baseline Lock-in |
| **16** | **Peace, Justice and Strong Institutions** | `#00689D` | `sdg16.html` | Pending Baseline Lock-in |
| **17** | **Partnerships for the Goals** | `#19486A` | `sdg17.html` | Pending Baseline Lock-in |
