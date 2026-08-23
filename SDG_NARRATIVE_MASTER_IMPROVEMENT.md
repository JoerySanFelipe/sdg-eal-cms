# SDG Narrative Master Improvement Blueprint

## 1. Overview & Architecture

All 17 Sustainable Development Goal (SDG) Narrative Studios are rendered and managed by a centralized modular engine: [`admin/js/modules/sdg-reports-manager.js`](file:///c:/kudecode/sdg-web/admin/js/modules/sdg-reports-manager.js).

This blueprint establishes the **Gold Standard UI** using **SDG 1 (No Poverty - `sdg1.html`)** as the reference baseline and serves as the master contract for reviewing, polishing, and verifying all 17 SDG Narrative Studios:

1. **SDG 1: No Poverty** (`sdg1.html`) — _Reference Baseline_
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

## 2. Standardized Section Breakdown

### A. Studio Header & Global Controls

- **Eyebrow**: `Header Page`
- **Monospaced Badge**: `sdg${sdgNum}.html`
- **Studio Title**: `SDG ${sdgNum} Studio`
- **Goal Badge**: Vibrant colored square pill with official SDG brand color hex (`hero.themeColor || meta.color`) and bold goal number.
- **Pulsing High-Attention Working Year Controls**:
  - Prominent container with `border-2 border-blue-500 shadow-sm animate-pulse hover:animate-none`.
  - Larger bold `Working Year:` label.
  - Sizable `<select id="sdg-year-select">` with dynamic reporting years.
  - Large bold `[ + Add Year ]` button and `[ 🗑 ]` remove year trigger.

---

### B. Section 1: Hero Banner

- **Index Badge**: Amber `Section 1` + stroke Image/Globe SVG icon.
- **Title**: `Hero Banner` (clean and straight-to-the-point).
- **Rearranged 3-Row Layout**:
  - **1st Row (Horizontal 30% / 60% / 10% Partition)**:
    - **Logo / Icon** (`30%`): Framed dropzone matching the Evidence Indicator Studio design—image smoothly fills the card with full native drag-and-drop, dragover highlight ring, zoom on hover, and centered white pill `[ ⬆ Replace ]` button with helper text _"Click or Drop new image"_.
    - **Hero banner** (`60%`): Wide rectangular display dropzone matching the Evidence Indicator Studio design—native drag-and-drop, dragover highlight ring, zoom on hover, and centered white pill `[ ⬆ Replace ]` button with helper text _"Click or Drop new banner"_.
    - **Brand Color** (`10%`): Clean borderless color picker card with large color preview on top and centered hex text box at the bottom.
  - **2nd Row**:
    - **Eyebrow**: Full-width input (`#sdg-field-goal-name`).
  - **3rd Row**:
    - **Headline**: Left-column input (`#sdg-field-goal-title`).
    - **Description**: Right-column input (`#sdg-field-subtitle`).

---

### C. Section 2: Top Overview Narrative (Zone 1)

- **Index Badge**: Amber `Section 2` + stroke Document SVG icon.
- **Title**: `Top Overview Narrative`
- **Visual Block Editor as Primary Creation Engine**:
  - `[ Visual Block Editor ]` button in the section header triggers the full-featured block management modal.
  - Removed Quick Add toolbar to maintain unified workflow through the Visual Block Editor.
  - Interactive block stream listing displaying configured metric cards (with Lucide icons), paragraphs, callouts, and data cards.

---

### D. Section 3: Impact Drawers (Zone 2)

- **Index Badge**: Amber `Section 3` + stroke Layers SVG icon.
- **Title**: `Impact Drawers (${drawers.length})`
- **Header Action Trigger**: `[ + New Drawer ]` Orange action button (`bg-amber-600 hover:bg-amber-700 text-white font-bold`) in Section 3 header top-right (creates new drawer with default title `"Added New Drawer"`).
- **Standardized Drawer Cards Layout**:
  - **1st Row**:
    - Badge Number (`#${dIdx + 1}`)
    - Title Heading (clean static text display; editing is managed inside the modal)
    - `Default Open` Checkbox toggle
    - Reorder buttons (`▲`/`▼`)
    - `[ Editor ]` Orange button (`bg-amber-600 hover:bg-amber-700 text-white font-bold`) opens full visual block editor modal
    - `[ 🗑 ]` Delete button (with confirmation modal via `window.cmsConfirm`)
  - **2nd Row**:
    - `Blocks (${contents.length})` summary list showing configured block pills
- **Drawer Editor Modal (`sdg_drawer`)**:
  - **Header**: High-contrast square number box (`#1`, `#2`) + clean title `"Drawer Content"`.
  - **Drawer Title Input**: Editable inside the modal.
  - **Block Stream & Adding Events**: Events and initiatives are added directly as rich content blocks (`event_card`, `paragraph`, `image`, `table`, `chart`, `metric_cards`) inside the modal body.
  - **Modal Exit Safety & Confirmation**:
    - Backdrop click closing is disabled to prevent accidental loss of edits.
    - Cancel button and top Close `[ × ]` button trigger a confirmation dialog (_"Discard Unsaved Changes?"_).
  - **Block Deletion Safety**:
    - Deleting content blocks, metric cards, table rows, or chart points inside the modal prompts explicit confirmation via `window.cmsConfirm`.
  - **Modal Layering & Stacking**:
    - Global confirmation modal operates at `z-[300]`, seamlessly overlaying active editor modals (`z-[120]`).
- **Universal Deletion Safety Modal**:
  - All deletion actions across the entire studio (Drawers, Content Blocks, Metric Cards, Hero Banner, Logo) require explicit user confirmation through `window.cmsConfirm`.

---

## 3. Rollout Checklist for 17 SDG Narrative Studios

| Goal # | Goal Name                                   | Brand Color | Public Page Route | Default Banner Image          |                Status                |
| :----: | :------------------------------------------ | :---------: | :---------------- | :---------------------------- | :----------------------------------: |
| **01** | **No Poverty**                              |  `#E5243B`  | `sdg1.html`       | `images/sdg-banner/sdg1.jpg`  | 🎯 Gold Standard Baseline (Verified) |
| **02** | **Zero Hunger**                             |  `#DDA63A`  | `sdg2.html`       | `images/sdg-banner/sdg2.jpg`  |         ✅ Deployed & Active         |
| **03** | **Good Health and Well-Being**              |  `#4C9F38`  | `sdg3.html`       | `images/sdg-banner/sdg3.jpg`  |         ✅ Deployed & Active         |
| **04** | **Quality Education**                       |  `#C5192D`  | `sdg4.html`       | `images/sdg-banner/sdg4.jpg`  |         ✅ Deployed & Active         |
| **05** | **Gender Equality**                         |  `#FF3A21`  | `sdg5.html`       | `images/sdg-banner/sdg5.jpg`  |         ✅ Deployed & Active         |
| **06** | **Clean Water and Sanitation**              |  `#26BDE2`  | `sdg6.html`       | `images/sdg-banner/sdg6.jpg`  |         ✅ Deployed & Active         |
| **07** | **Affordable and Clean Energy**             |  `#FCC30B`  | `sdg7.html`       | `images/sdg-banner/sdg7.jpg`  |         ✅ Deployed & Active         |
| **08** | **Decent Work and Economic Growth**         |  `#A21942`  | `sdg8.html`       | `images/sdg-banner/sdg8.jpg`  |         ✅ Deployed & Active         |
| **09** | **Industry, Innovation and Infrastructure** |  `#FD6925`  | `sdg9.html`       | `images/sdg-banner/sdg9.jpg`  |         ✅ Deployed & Active         |
| **10** | **Reduced Inequalities**                    |  `#DD1367`  | `sdg10.html`      | `images/sdg-banner/sdg10.jpg` |         ✅ Deployed & Active         |
| **11** | **Sustainable Cities and Communities**      |  `#FD9D24`  | `sdg11.html`      | `images/sdg-banner/sdg11.jpg` |         ✅ Deployed & Active         |
| **12** | **Responsible Consumption and Production**  |  `#BF8B2E`  | `sdg12.html`      | `images/sdg-banner/sdg12.jpg` |         ✅ Deployed & Active         |
| **13** | **Climate Action**                          |  `#3F7E44`  | `sdg13.html`      | `images/sdg-banner/sdg13.jpg` |         ✅ Deployed & Active         |
| **14** | **Life Below Water**                        |  `#0A97D9`  | `sdg14.html`      | `images/sdg-banner/sdg14.jpg` |         ✅ Deployed & Active         |
| **15** | **Life on Land**                            |  `#56C02B`  | `sdg15.html`      | `images/sdg-banner/sdg15.jpg` |         ✅ Deployed & Active         |
| **16** | **Peace, Justice and Strong Institutions**  |  `#00689D`  | `sdg16.html`      | `images/sdg-banner/sdg16.jpg` |         ✅ Deployed & Active         |
| **17** | **Partnerships for the Goals**              |  `#19486A`  | `sdg17.html`      | `images/sdg-banner/sdg17.jpg` |         ✅ Deployed & Active         |

---

## 4. Master Verified Changes & Approvals Log

### ✅ Checkpoint 1: Header & Section 1 (Hero Banner) — `PASSED & LOCKED`

- **Target Reference**: SDG 1 (No Poverty)
- **Locked-In Specifications**:
  1. **Header**:
     - Studio Title: `SDG ${sdgNum} Studio`
     - Eyebrow: `Header Page` with `sdg${sdgNum}.html` monospaced badge
     - Goal Badge: High-contrast vibrant square pill with official SDG brand color hex (`hero.themeColor || meta.color`) and bold goal number
     - Clean Year Controls: `Year:` label with pulsing animated dropdown selector (`#sdg-year-select`), `[ + Add Year ]` button, and `[ 🗑 ]` remove year trigger
     - Removed redundant Goal dropdown (handled by sidebar navigation) and duplicate year badge pill.
  2. **Section 1: Hero Banner**:
     - Section Title: `Hero Banner`
     - Clean input labels: `Eyebrow`, `Headline`, `Description`, `Color` without cluttering subtitles
     - **Horizontal 1st Row Partition (30% / 60% / 10%)**:
       - `Logo / Icon` (30%): Borderless full-bleed square dropzone with drag-and-drop & click-to-upload, hover blur, and centered `[ Replace ]` / `[ Remove ]` buttons
       - `Hero banner` (60%): Wide rectangular display dropzone with drag-and-drop & click-to-upload, hover blur, and centered `[ Replace ]` / `[ Remove ]` buttons
       - `Brand Color` (10%): Clean borderless color picker card with full-bleed preview on top and centered hex text box at the bottom
     - **2nd Row**: Full-width `Eyebrow` input (`#sdg-field-goal-name`)
     - **3rd Row**: 2-Column side-by-side `Headline` (`#sdg-field-goal-title`) and `Description` (`#sdg-field-subtitle`)
- **Validation**: Tailwind CSS v3 compiled cleanly. Verified and approved by user.

---

### ✅ Checkpoint 2: Section 2 (Top Overview Narrative) — `PASSED & LOCKED`

- **Target Reference**: SDG 1 (No Poverty)
- **Locked-In Specifications**:
  - Section Title: `Top Overview Narrative`
  - Removed Quick Add toolbar to establish the Visual Block Editor (`[ Visual Block Editor ]` trigger) as the single primary creation engine.
  - Interactive block stream with Metric Cards (Lucide icons integration), Paragraphs, Callouts, and live preview sync.
- **Validation**: Tailwind CSS v3 compiled cleanly. Verified and approved by user.

---

### ✅ Checkpoint 3: Section 3 (Impact Drawers) & Universal Studio Safety — `PASSED & LOCKED`

- **Target Reference**: SDG 1 (No Poverty)
- **Locked-In Specifications**:
  1. **Section 3 Header & Triggers**:
     - Section Title: `Impact Drawers (${drawers.length})`
     - Header Action: Orange `[ + New Drawer ]` button (`bg-amber-600 hover:bg-amber-700 text-white font-bold`) creating a new drawer titled `"Added New Drawer"`
  2. **Standardized Drawer Cards**:
     - 1st Row: Badge number (`#1`), clean static title heading, `Default Open` checkbox, reorder buttons (`▲`/`▼`), Orange `[ Editor ]` button (`bg-amber-600 hover:bg-amber-700 text-white font-bold`), and delete button
     - 2nd Row: `Blocks (${contents.length})` summary list
     - Removed obsolete Row 3 (Linked Event tags) as events are managed as rich content blocks inside the drawer editor modal
  3. **Drawer Editor Modal (`sdg_drawer`)**:
     - High-contrast square number box (`#1`, `#2`) + clean title `"Drawer Content"`
     - Editable `Drawer Title` input
     - Direct event integration via `event_card` content blocks inside the stream
     - Backdrop click closing disabled to protect against accidental exits
     - Confirmation modal prompt on `Cancel` and top Close `[ × ]` (_"Discard Unsaved Changes?"_)
     - Explicit confirmation prompt on deleting content blocks, metric items, table rows, and chart points
  4. **Universal Studio Deletion Safety**:
     - Universal `window.cmsConfirm` prompt on all deletion actions across the entire studio
     - Global confirmation modal stacked at `z-[300]` above any sub-modal (`z-[120]`)
- **Validation**: Tailwind CSS v3 compiled cleanly. Verified and locked in by user.

---

## 5. Master Baseline Status

🎯 **SDG 1 Studio Reference Baseline is 100% Complete & Locked In.**
All architectural changes, component structures, event listeners, and visual block editor integrations are saved in the master blueprint and ready for deployment across all 17 SDG narrative studios upon user signal.
