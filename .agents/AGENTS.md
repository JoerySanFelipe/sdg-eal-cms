# Project-Scoped Rules for Urdaneta City University (UCU) SDG Web Updates

## Content and Page Layout
- **Image Placement**: Always place newly extracted evidence screenshots/photos at the top of the content body (immediately after the opening element/tag, before any description or introductory paragraphs).
- **Exclude Document Covers**: Do not display images that function solely as document cover pages in the final HTML.
- **Word-for-Word Accuracy**: Copy text paragraphs, table cells, and values from the source DOCX files exactly as written, without paraphrasing or performing custom calculations.
- **Bulleted Lists**: Format lists using `<ul class="list-disc list-inside space-y-2 pl-4 text-lg font-medium leading-relaxed text-muted">` or similar clean styles.

## Metadata and File Registry
- **Title and Suffix Synchronization**: Update indicator titles in both the file's metadata comment and the corresponding `indicators/*.html` registry to match the DOCX title, including any indicator code suffixes (e.g. `(GD.5)`, `(WS.2)`).
- **Physical Filenames**: Do not rename the physical HTML files (e.g., `5_5.html` remains `5_5.html`). Only update the title strings inside the HTML files and index files.

## Technical Constraints
- **Tailwind Version**: Use Tailwind CSS v3 for style compilation.
- **Compilation Command**: Recompile styles after any HTML changes using `npx tailwindcss -i ./css/global.css -o ./css/style.css`.
- **Tool Restrictions**: Do not use the `browser_subagent` tool for checking rendering; verification is performed manually by the user.
- **Tool Parameter Safety**: Never include the `ArtifactMetadata` block in the `write_to_file` tool call when writing to workspace source files (only use it when creating/modifying artifacts in the brain directory).

## Session Initialization & Project State
- **Session Handover Status**: When starting a new session, or if you detect that the session/device has changed, always read the [PROJECT_STATUS.md](file:///c:/kudecode/sdg-web/PROJECT_STATUS.md) file in the root of the workspace first to understand the current task progress, procedures, recent changes, directory layout, and active code assets.

## CMS State Management & Database Rules
- **Centralized Asset Pattern**: Assets common to an entire category or pillar (e.g. `thumb_evidence`) must be stored once at the parent document level (`indicators/{pillarId}`). Child items must inherit via cascading fallbacks (`ev.thumb_evidence || parent.thumb_evidence || DEFAULT_ICON`) rather than duplicating binary data across child objects.
- **Shared Array Reference Guard**: Never call mutating array methods (`.push()`, `.splice()`) multiple times across aliased draft properties (e.g. `draft.evidences` and `draft.evidenceList`). Always clone (`[...currentList]`), mutate once, deduplicate by ID, and assign the unified array.
- **Dual-Collection Sync on Publish**: When publishing documents containing nested child entities that exist as standalone collections (e.g., `indicators/{id}` and `evidences/{docId}`), ensure `publishCurrentDraft()` synchronizes both the parent document and child collection documents.
- **Hydration Guarding**: On public pages, guard against secondary fallback collection queries overwriting freshly hydrated parent document states (`hasHydrated...` flags).
- **Natural Numerical Sorting**: All lists of sub-indicators, evidence items, and criteria codes must use natural numerical sorting: `localeCompare(..., undefined, { numeric: true, sensitivity: 'base' })`.

## CMS Studio UI Standards & Execution Workflow
- **Untitled UI / Modern SaaS Aesthetic**: Apply a unified, minimalist SaaS interface standard across all CMS studios:
  - Two-Column Form Row Layout: Left column contains the label and small helper text (`text-[11px] text-slate-400`); right column contains the input controls, separated by subtle borders (`border-slate-100`).
  - Segmented Control Tabs: Place sub-navigation tabs inside clean rounded track containers (`bg-slate-100 p-1 rounded-xl`).
  - Framed Media Uploaders: Use compact, crisp preview cards accompanied by clean inline action pills (`[ ⬆ Replace ]`, `[ ✕ Remove ]`).
  - Status Pills & Badges: Display high-contrast, polished state pills (`● DRAFT`, `● PUBLISHED`, `● Firestore Live`).
- **Incremental Page-by-Page Execution Protocol**: Always execute UI redesigns incrementally—one section/page at a time. Present design concepts, verify results with the user, and wait for explicit confirmation before proceeding to subsequent modules.
- **Strict Front-End Scope Boundary**: When performing UI redesigns, preserve all underlying backend data models, `data-bind` attributes, `cmsState` properties, `previewBridge` dispatchers, and Firestore sync pipelines intact. Never modify backend/functional logic without prior confirmation.


