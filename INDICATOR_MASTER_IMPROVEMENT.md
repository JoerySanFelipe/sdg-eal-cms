# Indicator Master Improvement Blueprint

## 1. Overview & Architecture

All 7 Indicator Pillar Studios are rendered by a centralized modular engine: [`admin/js/modules/indicators-manager.js`](file:///c:/kudecode/sdg-web/admin/js/modules/indicators-manager.js).

This blueprint establishes the **Gold Standard UI** using **Setting & Infrastructure (`indicators/infrastructure.html`)** as the reference baseline and serves as the master contract for verifying all 7 Indicator Pillar Studios:
1. **Setting & Infrastructure** (`indicators/infrastructure.html`) - `Criteria 01 of 07`
2. **Energy & Climate Change** (`indicators/energy.html`) - `Criteria 02 of 07`
3. **Waste Management** (`indicators/waste.html`) - `Criteria 03 of 07`
4. **Water Management** (`indicators/water.html`) - `Criteria 04 of 07`
5. **Transportation** (`indicators/transportation.html`) - `Criteria 05 of 07`
6. **Education & Research** (`indicators/education.html`) - `Criteria 06 of 07`
7. **Digitalization** (`indicators/digitalization.html`) - `Criteria 07 of 07`

---

## 2. Standardized Section Breakdown

### A. Studio Header
- **Eyebrow**: `Header Page`
- **Monospaced Badge**: `indicators/${pillarId}.html`
- **Studio Title**: `${pillar.title} Studio`
- **Clean Layout**: No unnecessary badge pills, no duplicate quick tabs (managed via CMS primary sidebar).

---

### B. Section 1: Navigation Image
- **Index Badge**: Amber `Section 1` + stroke Image SVG icon.
- **Title**: `Navigation Image`
- **Dropzone Card**: 16:9 framed aspect-ratio container (`w-full sm:w-72 h-40 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-900 shadow-2xs`).
- **Interactive States**:
  - Drag-and-drop file upload support.
  - Image hover blur effect (`group-hover:blur-[2px]`).
  - Centered hover overlay with `[ ⬆ Replace ]` button trigger and helper text (`Click or Drop new image`).
- **Clean Controls**: Legacy "Reset to Default" button removed.

---

### C. Section 2: Narrative & Executive Overview
- **Index Badge**: Amber `Section 2` + stroke Document SVG icon.
- **Title**: `Pillar Narrative & Executive Summary`
- **Textarea**: 6-row clean textarea bound to `draft.narrative` (`bg-slate-50 border-slate-200 focus:bg-white rounded-lg`).
- **Helper Hint**: `Tip: Separate paragraphs with a blank line for styled narrative blocks.`

---

### D. Section 3: Metric Cards (3 Cards)
- **Index Badge**: Amber `Section 3` + stroke Chart SVG icon.
- **Title**: `Metric Cards`
- **Horizontal Row Card Components**:
  - Card Index Badge: `#1`, `#2`, `#3`
  - **Interactive Lucide Icon Selector**: 1-click button (`w-10 h-10 rounded-xl bg-white border border-slate-200`) opening the full Lucide Icon Library modal.
  - `Metric Value` input (centered bold/black text)
  - `Metric Title / Label` input
  - `Linked Evidence ID` input (e.g. `1_3` or `1.3`)
  - `Theme` Dropdown: Clean color names (`Blue`, `White`, `Red`)

---

### E. Section 4: Evidence Repository
- **Index Badge**: Amber `Section 4` + stroke Folder SVG icon.
- **Title**: `Evidence Repository (${evidenceList.length} Items)`
- **Header Action Trigger**: `[ + Add Indicator Evidence ]` high-contrast button positioned in Section 4 header top-right.
- **Icon / Seal Container**:
  - Framed preview box enlarged to `w-16 h-16 rounded-2xl bg-white border border-slate-200 p-2 shadow-2xs`.
  - `[ ⬆ Upload Icon ]` trigger pill.
  - Legacy reset button removed.
- **Search Bar**: Placed directly below the Icon / Seal container with matching **exact full width** (`w-full pl-9 pr-4 py-2`).
- **Evidence Card Items Grid**:
  - Natural numerical sort: `sortEvidences(list)` (`1.1`, `1.2`, `1.3`...).
  - Indicator Code Badge (`font-mono font-bold bg-ucu-blue-dark text-white`).
  - Framed Thumbnail Box (`w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1.5`) with cascading fallback.
  - Criteria Title with hover color transition.
  - Aligned UN SDG Pills (`SDG 1` to `SDG 17`) with official metadata colors.
  - Stroke Action Triggers: `[ ✏ Edit ]` and `[ 🗑 Delete ]` with modal confirmation.
  - Simplified Layout: Physical URL path string and category name badge removed from preview cards.

---

### F. Center Modal Evidence Editor
- **Modal Header**: White container with stroke icon, title `Add Indicator Evidence` / `Edit Indicator Evidence`, and `[ ✕ ]` close trigger.
- **2-Column Form Fields**:
  - `Indicator Code / ID *` (e.g. `1.3` or `3.4 (WS.2)`)
  - `Category Badge *`
  - `Evidence Criteria Title *`
  - `Evidence HTML Source Path *` (e.g. `../evidence/infrastructure/1_3.html`)
- **17 UN SDG Matrix Tag Selector**:
  - 17 interactive pill chips with active checkmark overlays and official vibrant colors.
- **Modal Footer**:
  - `Cancel` button
  - `[ 💾 Save Evidence Item ]` button with validation.

---

## 3. Rollout Checklist for 7 Indicator Pillar Studios

| Pillar ID | Pillar Title | Public Page Path | Criteria Num | Default Icon Path | Status |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **infrastructure** | Setting & Infrastructure | `indicators/infrastructure.html` | 01 | `images/indicator-icons/infrastructure.png` | 🌟 Gold Standard (Passed & Locked In) |
| **energy** | Energy & Climate Change | `indicators/energy.html` | 02 | `images/indicator-icons/energy.png` | 🌟 Fully Deployed & Verified (Passed) |
| **waste** | Waste Management | `indicators/waste.html` | 03 | `images/indicator-icons/waste.png` | 🌟 Fully Deployed & Verified (Passed) |
| **water** | Water Management | `indicators/water.html` | 04 | `images/indicator-icons/water.png` | 🌟 Fully Deployed & Verified (Passed) |
| **transportation** | Transportation | `indicators/transportation.html` | 05 | `images/indicator-icons/transportation.png` | 🌟 Fully Deployed & Verified (Passed) |
| **education** | Education & Research | `indicators/education.html` | 06 | `images/indicator-icons/education.png` | 🌟 Fully Deployed & Verified (Passed) |
| **digitalization** | Governance & Digitalization | `indicators/digitalization.html` | 07 | `images/indicator-icons/digitalization.png` | 🌟 Fully Deployed & Verified (Passed) |

---

## 4. Master Verified Changes & Approvals Log

### ✅ Checkpoint 1: Initial UI Improvement — `PASSED`
* **Status**: **PASSED & APPROVED** (Initial baseline architecture)

### ✅ Checkpoint 2: Setting & Infrastructure Studio Polish & Icon Library — `PASSED & LOCKED IN`
* **Status**: **PASSED & LOCKED IN** (Setting & Infrastructure Reference)
* **Scope Verified**:
  1. **Header Bar**: Standardized header with `Header Page` eyebrow + `indicators/infrastructure.html` badge + `Setting & Infrastructure Studio` title. Removed duplicate criteria pill and header switcher tabs.
  2. **Section 1 (Navigation Image)**: Relabeled to `Navigation Image`, removed reset button, created 16:9 drag-and-drop dropzone (`#pillar-thumb-dropzone`) with hover blur effect (`group-hover:blur-[2px]`) and centered `[ ⬆ Replace ]` button.
  3. **Section 3 (Metric Cards)**: Relabeled to `Metric Cards`, transformed into horizontal stacked row cards with card index badges (#1, #2, #3), centered value input, title input, linked evidence ID input, clean theme dropdown (`Blue`, `White`, `Red`), and **Interactive Lucide Icon Picker integration** (`data-pick-indicator-metric-icon`).
  4. **Section 4 (Evidence Repository)**: Relabeled to `Evidence Repository (${evidenceList.length} Items)`, relocated `+ Add Indicator Evidence` button to Section 4 header top-right, enlarged `Icon / Seal` container to `w-16 h-16`, removed reset button, and repositioned the search bar directly below `Icon / Seal` with matching full width.
  5. **Evidence Cards**: Cleaned card layout by removing physical URL path and category name badge, keeping only monospace code tag (`1.1`, `1.2`), thumbnail, title, aligned UN SDG color pills, and stroke edit/delete triggers.

### ✅ Checkpoint 3: Evidence Modal Editor — `PASSED & LOCKED IN`
* **Status**: **PASSED & LOCKED IN**
* **Scope Verified**:
  1. **Modal Header**: Modern white container with stroke icon badge, `Add Indicator Evidence` / `Edit Indicator Evidence` title, and `[ ✕ ]` close button.
  2. **2-Column Form Fields**: `Indicator Code / ID`, `Category Badge`, `Evidence Criteria Title`, `Evidence HTML Source Path`.
  3. **17 UN SDG Matrix Tag Selector**: 17 interactive pill chips with active checkmark overlays and official vibrant colors.
  4. **Modal Footer Actions**: Validated `Cancel` and `[ 💾 Save Evidence Item ]` triggers with smooth live state dispatch.

### ✅ Checkpoint 4: 7 Indicator Studios Full Rollout & Verification — `PASSED & COMPLETED`
* **Status**: **PASSED & COMPLETED**
* **Scope Verified**:
  1. All 7 Indicator Pillar Studios (`infrastructure`, `energy`, `waste`, `water`, `transportation`, `education`, `digitalization`) fully verified across the unified modular engine.
  2. All default icons in `images/indicator-icons/` verified and linked.
  3. Real-time Firebase Public Sync with live metric cards and modal hydration verified.
  4. AST syntax audit on all 16 scripts passed with 0 errors.
  5. Tailwind CSS v3 compiled successfully.




