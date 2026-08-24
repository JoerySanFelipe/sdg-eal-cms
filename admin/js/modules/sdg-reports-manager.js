// admin/js/modules/sdg-reports-manager.js
// Modular Feature Manager for 17 SDG Narrative Reports (CMS Studio)
// Dual-Zone Page-Level CMS Block Editor (Zone 1: Overview Blocks, Zone 2: Impact Drawers)

import { cmsState, compressAndEncodeImage, pickImageFileFromSystem, getAvailableYears, addAvailableYear, removeAvailableYear, getDefaultYear } from '../cms-state.js';
import { previewBridge } from '../preview-bridge.js';
import { universalBlockEditor } from '../universal-block-editor.js';
import { lucideIconPicker } from '../lucide-icon-picker.js';
import { escapeHtml, resolveAssetUrl, SDG_METADATA } from '../shared-utils.js';

export class SdgReportsManager {
  /**
   * Escape HTML utility
   */
  escape(str) {
    return escapeHtml(str);
  }

  /**
   * Resolve media image paths for Admin context
   */
  resolveAdminImageSrc(src) {
    return resolveAssetUrl(src, { isAdmin: true });
  }

  /**
   * Get all registered events from UCU_EVENTS for select dropdowns
   */
  getRegisteredEvents() {
    const eventMap = new Map();

    // 1. Global baseline UCU_EVENTS
    if (Array.isArray(window.UCU_EVENTS)) {
      window.UCU_EVENTS.forEach(ev => {
        if (ev && ev.id) eventMap.set(ev.id, ev);
      });
    }

    // 2. CMS current Draft / Local published events
    try {
      const storedEvents = localStorage.getItem('UCU_PUBLISHED_pages__events') || 
                           localStorage.getItem('UCU_PUBLISHED_events') ||
                           localStorage.getItem('UCU_DRAFT_pages__events');
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        const list = parsed.eventsList || parsed.events || (Array.isArray(parsed) ? parsed : []);
        if (Array.isArray(list)) {
          list.forEach(ev => {
            if (ev && ev.id) eventMap.set(ev.id, ev);
          });
        }
      }
    } catch (e) {}

    return Array.from(eventMap.values());
  }

  /**
   * Ensure draft has valid structured data
   */
  normalizeDraft(sdgNum, year, draft) {
    const meta = SDG_METADATA[sdgNum] || { title: `SDG ${sdgNum}`, subtitle: "Sustainable Development Goal", color: "#394a8a" };

    if (!draft.heroHeader || typeof draft.heroHeader !== 'object') {
      draft.heroHeader = {
        goalName: `Sustainable Development Goal ${sdgNum}`,
        goalTitle: draft.title || meta.title,
        subtitle: draft.subtitle || meta.subtitle,
        sdgNum: parseInt(sdgNum, 10) || 1,
        heroBackground: draft.heroBgImage || `../images/sdg-banner/sdg${sdgNum}.jpg`,
        heroIconImage: draft.heroIconImage || `../images/sdg/sdg${sdgNum}.png`,
        themeColor: draft.colorHex || meta.color
      };
    }

    // Zone 1: Narrative Blocks
    if (!Array.isArray(draft.narrative)) {
      draft.narrative = [];
      const defaultMetrics = Array.isArray(draft.metrics) && draft.metrics.length > 0 ? draft.metrics : [
        { value: "1,920", label: "Beneficiaries Reached", theme: "navy", icon: "users" },
        { value: "45", label: "Active Programs", theme: "red", icon: "target" },
        { value: "15", label: "Research Publications", theme: "navy", icon: "book-open" }
      ];
      draft.narrative.push({
        type: "metric_cards",
        metrics: defaultMetrics
      });

      const leadText = draft.executiveSummary || `Sustainable Development Goal ${sdgNum} (${meta.title}) drives institutional action at Urdaneta City University. Through innovative research, strategic partnerships, and community-led initiatives, UCU actively contributes to regional and global sustainable development targets.`;
      draft.narrative.push({
        type: "paragraph",
        content: leadText
      });
    }

    // Zone 2: Impact Drawers
    if (!Array.isArray(draft.impactDrawers)) {
      const legacySecs = Array.isArray(draft.sections) ? draft.sections : (Array.isArray(draft.subSections) ? draft.subSections : []);
      if (legacySecs.length > 0) {
        draft.impactDrawers = legacySecs.map(sec => {
          let contents = [];
          if (Array.isArray(sec.blocks) && sec.blocks.length > 0) {
            contents = sec.blocks;
          } else if (Array.isArray(sec.paragraphs)) {
            contents = sec.paragraphs.filter(Boolean).map(p => ({ type: 'paragraph', content: p }));
          } else if (typeof sec.content === 'string' && sec.content) {
            contents = [{ type: 'paragraph', content: sec.content }];
          }
          return {
            drawerTitle: sec.title || sec.drawerTitle || "Impact Chapter",
            isOpen: sec.isOpen !== undefined ? sec.isOpen : false,
            eventId: sec.eventId || "",
            contents: contents
          };
        });
      } else {
        draft.impactDrawers = [
          {
            drawerTitle: "Institutional Action & Sustainable Initiatives",
            isOpen: true,
            eventId: "",
            contents: [
              {
                type: "paragraph",
                content: `Comprehensive academic and operational initiatives advancing Sustainable Development Goal ${sdgNum} across Urdaneta City University and partner communities.`
              }
            ]
          }
        ];
      }
    }

    // Ensure sync between mirror alias arrays
    draft.sections = draft.impactDrawers;
    draft.subSections = draft.impactDrawers;
    draft.title = draft.heroHeader.goalTitle || meta.title;
    draft.subtitle = draft.heroHeader.subtitle || meta.subtitle;
    draft.colorHex = draft.heroHeader.themeColor || meta.color;
    draft.reportYear = year || getDefaultYear();

    return draft;
  }

  /**
   * Main Render function for SDG Narrative Report Studio
   */
  render(sdgNum, year, rawDraft = {}) {
    const meta = SDG_METADATA[sdgNum] || { title: `SDG ${sdgNum}`, subtitle: "Sustainable Development Goal", color: "#394a8a" };
    const draft = this.normalizeDraft(sdgNum, year, rawDraft);
    const hero = draft.heroHeader;
    const narrativeBlocks = draft.narrative;
    const drawers = draft.impactDrawers;
    const availableEvents = this.getRegisteredEvents();
    const availableYears = getAvailableYears();
    const currentYearStr = String(year || getDefaultYear());

    const resolvedHeroBg = this.resolveAdminImageSrc(hero.heroBackground);
    const resolvedHeroLogo = this.resolveAdminImageSrc(hero.heroIconImage || `../images/sdg/sdg${sdgNum}.png`);

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        
        <!-- Header Banner & Year Switcher -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0 ring-4 ring-white font-sans" style="background-color: ${hero.themeColor || meta.color};">
              ${sdgNum}
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1 font-sans">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">Header Page</span>
                <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">sdg${sdgNum}.html</span>
              </div>
              <h2 class="text-xl font-bold text-slate-900 tracking-tight font-sans">SDG ${sdgNum} Studio</h2>
            </div>
          </div>

          <!-- Year Controls with Pulsing Dropdown Selector -->
          <div class="flex items-center gap-2 bg-slate-50/90 p-1.5 px-3 rounded-2xl border border-slate-200 shadow-2xs">
            <label class="text-xs font-black text-slate-700 font-sans uppercase tracking-wider">Year:</label>
            <select id="sdg-year-select" class="px-3.5 py-1.5 text-xs font-black rounded-xl border-2 border-blue-500 bg-white text-ucu-blue-dark shadow-xs ring-2 ring-blue-400/50 animate-pulse focus:animate-none cursor-pointer outline-none font-sans">
              ${availableYears.map(y => `
                <option value="${y}" ${currentYearStr === y ? 'selected' : ''}>Year ${y}</option>
              `).join('')}
            </select>
            <button type="button" id="btn-add-new-year" class="px-3 py-1.5 text-xs font-bold rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white shadow-2xs flex items-center gap-1 cursor-pointer transition-colors font-sans" title="Add a new reporting year">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Add Year</span>
            </button>
            ${availableYears.length > 1 ? `
              <button type="button" id="btn-remove-current-year" class="p-1.5 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 shadow-2xs cursor-pointer transition-colors font-sans" title="Remove Year ${currentYearStr} from reporting list">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- ========================================== -->
        <!-- ZONE 1: HERO & TOP OVERVIEW BLOCK EDITOR   -->
        <!-- ========================================== -->
        
        <!-- Section 1: Hero Banner -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 1</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              <span>Hero Banner</span>
            </h3>
          </div>
          
          <div class="space-y-4">
            <!-- 1st Row: Logo / Icon (30%), Hero banner (60%), Brand Color (10%) -->
            <div class="flex flex-col md:flex-row gap-4 items-start">
              
              <!-- Logo / Icon (30%) -->
              <div class="w-full md:w-[30%] space-y-1.5">
                <label class="block text-xs font-bold text-slate-800 font-sans">Logo / Icon</label>
                <label for="sdg-logo-uploader" id="sdg-logo-dropzone" class="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-900 shadow-2xs shrink-0 group cursor-pointer block transition-all hover:border-ucu-blue/50">
                  ${resolvedHeroLogo ? `
                    <img src="${resolvedHeroLogo}" class="w-full h-full object-cover transition-all duration-300 group-hover:blur-[2px] group-hover:scale-105">
                    <div class="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                      <span class="px-3.5 py-1.5 bg-white/95 text-slate-800 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 font-sans">
                        <svg class="w-3.5 h-3.5 text-ucu-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span>Replace</span>
                      </span>
                      <span class="text-[10px] text-white/90 font-medium font-sans">Click or Drop new image</span>
                    </div>
                  ` : `
                    <div class="flex flex-col items-center justify-center h-full gap-1.5 text-slate-400 p-4 bg-slate-50">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <p class="text-xs font-bold text-slate-600 font-sans">Drag &amp; Drop Logo</p>
                      <p class="text-[10px] text-slate-400 font-sans">or click to upload</p>
                    </div>
                  `}
                </label>
                <input type="file" id="sdg-logo-uploader" accept="image/*" class="hidden">
              </div>

              <!-- Hero banner (60%) -->
              <div class="w-full md:w-[60%] space-y-1.5">
                <label class="block text-xs font-bold text-slate-800 font-sans">Hero banner</label>
                <label for="sdg-hero-uploader" id="sdg-hero-dropzone" class="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-900 shadow-2xs shrink-0 group cursor-pointer block transition-all hover:border-ucu-blue/50">
                  ${resolvedHeroBg ? `
                    <img src="${resolvedHeroBg}" class="w-full h-full object-cover transition-all duration-300 group-hover:blur-[2px] group-hover:scale-105">
                    <div class="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                      <span class="px-3.5 py-1.5 bg-white/95 text-slate-800 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 font-sans">
                        <svg class="w-3.5 h-3.5 text-ucu-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span>Replace</span>
                      </span>
                      <span class="text-[10px] text-white/90 font-medium font-sans">Click or Drop new banner</span>
                    </div>
                  ` : `
                    <div class="flex flex-col items-center justify-center h-full gap-1.5 text-slate-400 p-4 bg-slate-900">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <p class="text-xs font-bold text-white font-sans">Drag &amp; Drop Hero Banner</p>
                      <p class="text-[10px] text-slate-300 font-sans">or click to upload</p>
                    </div>
                  `}
                </label>
                <input type="file" id="sdg-hero-uploader" accept="image/*" class="hidden">
              </div>

              <!-- Brand Color (10%) -->
              <div class="w-full md:w-[10%] space-y-1.5">
                <label class="block text-xs font-bold text-slate-800 font-sans truncate" title="Brand Color">Color</label>
                <div class="w-full h-44 flex flex-col items-center justify-between">
                  <input type="color" id="sdg-field-color-picker" value="${hero.themeColor || meta.color}" class="w-full h-32 rounded-2xl cursor-pointer border-0 shadow-2xs p-0 overflow-hidden">
                  <input type="text" id="sdg-field-color-text" value="${hero.themeColor || meta.color}" class="w-full mt-2 px-1 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-mono font-bold text-center outline-none font-sans" title="${hero.themeColor || meta.color}">
                </div>
              </div>

            </div>

            <!-- 2nd Row: Eyebrow -->
            <div>
              <label class="block text-xs font-bold text-slate-800 font-sans mb-1.5">Eyebrow</label>
              <input type="text" id="sdg-field-goal-name" value="${this.escape(hero.goalName || `Sustainable Development Goal ${sdgNum}`)}" placeholder="e.g. Sustainable Development Goal ${sdgNum}" class="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue text-slate-800 outline-none font-sans">
            </div>

            <!-- 3rd Row: Headline, Description -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-800 font-sans mb-1.5">Headline</label>
                <input type="text" id="sdg-field-goal-title" value="${this.escape(hero.goalTitle || meta.title)}" placeholder="Goal Headline" class="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue text-slate-800 outline-none font-sans">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-800 font-sans mb-1.5">Description</label>
                <input type="text" id="sdg-field-subtitle" value="${this.escape(hero.subtitle || meta.subtitle)}" placeholder="Hero Description" class="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue text-slate-800 outline-none font-sans">
              </div>
            </div>

          </div>
        </div>

        <!-- Section 2: Top Overview Narrative Block Stream -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 2</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span>Top Overview Narrative (${narrativeBlocks.length} Blocks)</span>
              </h3>
            </div>
            
            <div class="flex items-center gap-2">
              <button type="button" id="btn-open-overview-vbe" class="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-ucu-blue text-white hover:bg-ucu-blue-dark transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs font-sans">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span>Editor</span>
              </button>
            </div>
          </div>

          <!-- Overview Blocks Stream List -->
          <div class="space-y-4" id="sdg-overview-blocks-list">
            ${narrativeBlocks.length === 0 ? `
              <div class="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <p class="text-xs font-bold text-slate-500 font-sans">No content blocks in Overview. Click "Editor" above to add paragraphs, metric cards, charts, or images.</p>
              </div>
            ` : narrativeBlocks.map((block, bIdx) => this.renderOverviewBlockItem(block, bIdx, narrativeBlocks.length)).join('')}
          </div>
        </div>

        <!-- ========================================== -->
        <!-- ZONE 2: MULTI-DRAWER IMPACT CHAPTERS       -->
        <!-- ========================================== -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 3</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                <span>Impact Drawers (${drawers.length})</span>
              </h3>
            </div>
            
            <button type="button" id="btn-add-impact-drawer" class="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 font-sans">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>New Drawer</span>
            </button>
          </div>

          <div class="space-y-4" id="sdg-impact-drawers-container">
            ${drawers.length === 0 ? `
              <div class="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                <p class="text-xs font-bold text-slate-500 font-sans">No impact drawers created yet. Click "+ New Drawer" above to create your first drawer.</p>
              </div>
            ` : drawers.map((drawer, dIdx) => this.renderImpactDrawerItem(drawer, dIdx, drawers.length, availableEvents)).join('')}
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Render single block card in Zone 1 (Overview)
   */
  renderOverviewBlockItem(block, bIdx, totalCount) {
    const type = block.type || 'paragraph';

    return `
      <div class="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3 shadow-2xs hover:border-slate-300 transition-all">
        <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-md bg-ucu-blue-dark text-white flex items-center justify-center text-[10px] font-black font-sans">${bIdx + 1}</span>
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">${type.replace('_', ' ')}</span>
          </div>
          <div class="flex items-center gap-1">
            <button type="button" data-move-overview-block="${bIdx}" data-dir="up" class="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg bg-white border border-slate-200 cursor-pointer ${bIdx === 0 ? 'opacity-30 pointer-events-none' : ''}" title="Move Up">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button type="button" data-move-overview-block="${bIdx}" data-dir="down" class="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg bg-white border border-slate-200 cursor-pointer ${bIdx === totalCount - 1 ? 'opacity-30 pointer-events-none' : ''}" title="Move Down">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button type="button" data-delete-overview-block="${bIdx}" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 ml-1 cursor-pointer transition-colors" title="Delete Block">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        ${this.renderOverviewBlockContent(block, bIdx)}
      </div>
    `;
  }

  /**
   * Render custom content for block types in Zone 1
   */
  renderOverviewBlockContent(block, bIdx) {
    const type = block.type || 'paragraph';

    if (type === 'metric_cards' || type === 'metrics') {
      const metrics = Array.isArray(block.metrics) ? block.metrics : [];
      return `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">Metrics Cards</label>
            <button type="button" data-add-metric-item="${bIdx}" class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-ucu-blue text-white hover:bg-ucu-blue-dark cursor-pointer font-sans shadow-2xs">+ Add Metric Card</button>
          </div>
          <div class="space-y-2.5">
            ${metrics.map((m, mIdx) => {
              const iconKey = m.icon || m.iconName || '';
              const iconSvg = iconKey 
                ? lucideIconPicker.getSvg(iconKey, 20, 2)
                : (m.svgIcon && m.svgIcon.includes('<svg') ? m.svgIcon : lucideIconPicker.getSvg('award', 20, 2));

              return `
                <div class="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3.5 relative group shadow-2xs hover:border-slate-300 transition-all">
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="w-7 h-7 rounded-lg bg-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 font-sans">
                      #${mIdx + 1}
                    </div>
                    
                    <!-- Lucide Icon Selector Button -->
                    <button 
                      type="button" 
                      data-pick-overview-metric-icon="${bIdx}-${mIdx}" 
                      class="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:border-ucu-blue text-ucu-blue-dark hover:text-ucu-blue flex items-center justify-center shadow-2xs hover:shadow-xs transition-all cursor-pointer group shrink-0" 
                      title="Click to Choose Lucide Icon (${iconKey || 'default'})"
                    >
                      <div class="w-5 h-5 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform">
                        ${iconSvg}
                      </div>
                    </button>
                  </div>

                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    <div>
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Metric Value</label>
                      <input type="text" data-metric-card-field="value" data-block-idx="${bIdx}" data-metric-idx="${mIdx}" value="${this.escape(m.value || '')}" placeholder="e.g. 1,920" class="w-full px-3 py-1.5 text-xs font-black text-center bg-slate-50 border border-slate-200 rounded-lg text-ucu-blue-dark shadow-2xs focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans outline-none">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Metric Label</label>
                      <input type="text" data-metric-card-field="label" data-block-idx="${bIdx}" data-metric-idx="${mIdx}" value="${this.escape(m.label || '')}" placeholder="e.g. Beneficiaries Reached" class="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg shadow-2xs focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans outline-none">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Theme Color</label>
                      <select data-metric-card-field="theme" data-block-idx="${bIdx}" data-metric-idx="${mIdx}" class="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 shadow-2xs focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans outline-none cursor-pointer">
                        <option value="white" ${(m.theme === 'white' || !m.theme) ? 'selected' : ''}>White</option>
                        <option value="navy" ${(m.theme === 'navy' || m.theme === 'blue') ? 'selected' : ''}>Blue</option>
                        <option value="red" ${m.theme === 'red' ? 'selected' : ''}>Red</option>
                      </select>
                    </div>
                  </div>

                  <button type="button" data-delete-metric-item="${bIdx}-${mIdx}" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors self-end sm:self-center" title="Remove Metric Card">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (type === 'paragraph') {
      return `
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-sans">Executive Summary / Paragraph Narrative</label>
          <textarea data-overview-field="content" data-block-idx="${bIdx}" rows="3" placeholder="Enter narrative text..." class="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl leading-relaxed text-slate-800 focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue outline-none font-sans">${this.escape(block.content || '')}</textarea>
        </div>
      `;
    }

    if (type === 'callout') {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-sans">Stat Value</label>
            <input type="text" data-overview-field="value" data-block-idx="${bIdx}" value="${this.escape(block.value || '')}" placeholder="e.g. 100%" class="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg outline-none font-sans">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-sans">Stat Label</label>
            <input type="text" data-overview-field="label" data-block-idx="${bIdx}" value="${this.escape(block.label || '')}" placeholder="e.g. Community Satisfaction" class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none font-sans">
          </div>
        </div>
      `;
    }

    return `
      <div>
        <p class="text-xs text-slate-500 italic font-sans">Advanced content block (${type}). Click "Editor" above to edit visually with full preview.</p>
      </div>
    `;
  }

  /**
   * Render single Impact Drawer Card in Zone 2
   */
  renderImpactDrawerItem(drawer, dIdx, totalCount, availableEvents) {
    const contents = Array.isArray(drawer.contents) ? drawer.contents : (Array.isArray(drawer.blocks) ? drawer.blocks : []);
    const isOpen = drawer.isOpen !== false;

    return `
      <div class="p-5 sm:p-6 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-4 shadow-xs hover:border-slate-300 transition-all" data-drawer-index="${dIdx}">
        
        <!-- 1st Row: Badge number, Title (Static Heading), Default Open Checkbox, Reorder Buttons, Editor Button, Delete Button -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div class="flex items-center gap-2.5 flex-1 min-w-[200px]">
            <span class="w-7 h-7 rounded-lg bg-ucu-blue-dark text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs font-sans">#${dIdx + 1}</span>
            <h4 class="text-sm font-bold text-slate-800 font-sans truncate" title="${this.escape(drawer.drawerTitle || drawer.title || 'Added New Drawer')}">
              ${this.escape(drawer.drawerTitle || drawer.title || 'Added New Drawer')}
            </h4>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 cursor-pointer select-none font-sans">
              <input type="checkbox" data-drawer-open-toggle="${dIdx}" ${isOpen ? 'checked' : ''} class="rounded text-ucu-blue focus:ring-ucu-blue">
              <span>Default Open</span>
            </label>

            <!-- Reorder Buttons -->
            <button type="button" data-move-drawer="${dIdx}" data-dir="up" class="p-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-200 cursor-pointer ${dIdx === 0 ? 'opacity-30 pointer-events-none' : ''}" title="Move Up">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button type="button" data-move-drawer="${dIdx}" data-dir="down" class="p-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-200 cursor-pointer ${dIdx === totalCount - 1 ? 'opacity-30 pointer-events-none' : ''}" title="Move Down">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            <!-- Editor Button -->
            <button type="button" data-open-drawer-vbe="${dIdx}" class="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer font-sans" title="Open Drawer Editor">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span>Editor</span>
            </button>
            
            <!-- Delete Button -->
            <button type="button" data-delete-drawer="${dIdx}" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 cursor-pointer transition-colors" title="Delete Drawer">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <!-- 2nd Row: Blocks -->
        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold uppercase text-slate-500 font-sans">Blocks (${contents.length})</label>
          <div class="p-3 bg-white rounded-xl border border-slate-200/90 text-xs text-slate-600">
            ${contents.length === 0 ? `
              <span class="text-slate-400 italic font-sans">No content blocks yet. Click "Editor" button above to add paragraphs, data charts, photos, or tables.</span>
            ` : `
              <div class="flex flex-wrap items-center gap-1.5">
                ${contents.map((b, bIdx) => `
                  <span class="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 shadow-2xs font-sans">
                    #${bIdx + 1} ${b.type || 'paragraph'}
                  </span>
                `).join('')}
              </div>
            `}
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Bind event listeners to dynamic CMS controls
   */
  bindEvents(container, parentFormEngine) {
    if (!container) return;

    // SDG Goal Switcher
    const goalSelect = container.querySelector('#sdg-goal-select');
    if (goalSelect) {
      goalSelect.addEventListener('change', (e) => {
        const goalNum = e.target.value;
        const currentYear = cmsState.activeSection.year || '2025';
        if (typeof window.cmsNavigateToSection === 'function') {
          window.cmsNavigateToSection('sdg', goalNum, currentYear);
        } else {
          cmsState.setActiveSection('sdg', goalNum, currentYear);
        }
      });
    }

    // Year Selector
    const yearSelect = container.querySelector('#sdg-year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        const selectedYear = e.target.value;
        const currentGoal = cmsState.activeSection.id || '1';
        if (typeof window.cmsNavigateToSection === 'function') {
          window.cmsNavigateToSection('sdg', currentGoal, selectedYear);
        } else {
          cmsState.setActiveSection('sdg', currentGoal, selectedYear);
        }
      });
    }

    // Add New Year Button
    const btnAddYear = container.querySelector('#btn-add-new-year');
    if (btnAddYear) {
      btnAddYear.addEventListener('click', () => {
        const nextSuggested = String(new Date().getFullYear());
        const inputYear = prompt("Enter 4-digit Year for SDG reporting (e.g. 2026, 2027):", nextSuggested);
        if (inputYear && /^\d{4}$/.test(inputYear.trim())) {
          const yr = inputYear.trim();
          addAvailableYear(yr);
          const currentGoal = cmsState.activeSection.id || '1';
          if (typeof window.cmsNavigateToSection === 'function') {
            window.cmsNavigateToSection('sdg', currentGoal, yr);
          } else {
            cmsState.setActiveSection('sdg', currentGoal, yr);
          }
        }
      });
    }

    // Remove Current Year Button
    const btnRemoveYear = container.querySelector('#btn-remove-current-year');
    if (btnRemoveYear) {
      btnRemoveYear.addEventListener('click', async () => {
        const currentGoal = cmsState.activeSection.id || '1';
        const currentYear = cmsState.activeSection.year || getDefaultYear();
        
        const confirmed = typeof window.cmsConfirm === 'function' ? await window.cmsConfirm({
          title: `Remove Reporting Year ${currentYear}?`,
          description: `Are you sure you want to remove Year ${currentYear} from the active SDG reporting years? Any custom narrative drafts or published reports under this year can be restored at any time by re-adding Year ${currentYear}.`,
          icon: "🗑️",
          iconBg: "bg-red-500/20 text-red-500",
          confirmText: `Remove Year ${currentYear}`,
          confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold"
        }) : confirm(`Are you sure you want to remove Year ${currentYear}?`);

        if (confirmed) {
          const res = removeAvailableYear(currentYear);
          if (res.success) {
            const nextYr = res.nextYear;
            if (typeof window.cmsNavigateToSection === 'function') {
              window.cmsNavigateToSection('sdg', currentGoal, nextYr);
            } else {
              cmsState.setActiveSection('sdg', currentGoal, nextYr);
            }
          } else {
            alert(res.reason || "Cannot remove year.");
          }
        }
      });
    }

    // Hero Goal Title & Subtitle Fields
    const goalNameInput = container.querySelector('#sdg-field-goal-name');
    if (goalNameInput) {
      goalNameInput.addEventListener('input', (e) => {
        if (!cmsState.currentDraft.heroHeader) cmsState.currentDraft.heroHeader = {};
        cmsState.currentDraft.heroHeader.goalName = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    const goalTitleInput = container.querySelector('#sdg-field-goal-title');
    if (goalTitleInput) {
      goalTitleInput.addEventListener('input', (e) => {
        if (!cmsState.currentDraft.heroHeader) cmsState.currentDraft.heroHeader = {};
        cmsState.currentDraft.heroHeader.goalTitle = e.target.value;
        cmsState.currentDraft.title = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    const subtitleInput = container.querySelector('#sdg-field-subtitle');
    if (subtitleInput) {
      subtitleInput.addEventListener('input', (e) => {
        if (!cmsState.currentDraft.heroHeader) cmsState.currentDraft.heroHeader = {};
        cmsState.currentDraft.heroHeader.subtitle = e.target.value;
        cmsState.currentDraft.subtitle = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    // Hero Color Picker & Text
    const colorPicker = container.querySelector('#sdg-field-color-picker');
    const colorText = container.querySelector('#sdg-field-color-text');
    if (colorPicker && colorText) {
      const handleColor = (val) => {
        if (!cmsState.currentDraft.heroHeader) cmsState.currentDraft.heroHeader = {};
        cmsState.currentDraft.heroHeader.themeColor = val;
        cmsState.currentDraft.colorHex = val;
        colorPicker.value = val;
        colorText.value = val;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      };
      colorPicker.addEventListener('input', (e) => handleColor(e.target.value));
      colorText.addEventListener('input', (e) => handleColor(e.target.value));
    }

    // Hero Background Browse / Replace / Remove
    // ----------------------------------------------------
    // Section 1: Hero Banner & Logo Upload / Drag-and-Drop
    // ----------------------------------------------------
    const heroUploader = container.querySelector('#sdg-hero-uploader');
    if (heroUploader) {
      heroUploader.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
          const encoded = await compressAndEncodeImage(file, 1400, 700, 0.75);
          if (encoded) {
            if (!cmsState.currentDraft.heroHeader) cmsState.currentDraft.heroHeader = {};
            cmsState.currentDraft.heroHeader.heroBackground = encoded;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }
      });
    }

    const heroDropzone = container.querySelector('#sdg-hero-dropzone');
    if (heroDropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        heroDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          heroDropzone.classList.add('border-ucu-blue', 'ring-2', 'ring-ucu-blue/20');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        heroDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          heroDropzone.classList.remove('border-ucu-blue', 'ring-2', 'ring-ucu-blue/20');
        }, false);
      });

      heroDropzone.addEventListener('drop', async (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
          const encoded = await compressAndEncodeImage(file, 1400, 700, 0.75);
          if (encoded) {
            if (!cmsState.currentDraft.heroHeader) cmsState.currentDraft.heroHeader = {};
            cmsState.currentDraft.heroHeader.heroBackground = encoded;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }
      }, false);
    }

    const logoUploader = container.querySelector('#sdg-logo-uploader');
    if (logoUploader) {
      logoUploader.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
          const encoded = await compressAndEncodeImage(file, 400, 400, 0.85);
          if (encoded) {
            if (!cmsState.currentDraft.heroHeader) cmsState.currentDraft.heroHeader = {};
            cmsState.currentDraft.heroHeader.heroIconImage = encoded;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }
      });
    }

    const logoDropzone = container.querySelector('#sdg-logo-dropzone');
    if (logoDropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        logoDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          logoDropzone.classList.add('border-ucu-blue', 'ring-2', 'ring-ucu-blue/20');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        logoDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          logoDropzone.classList.remove('border-ucu-blue', 'ring-2', 'ring-ucu-blue/20');
        }, false);
      });

      logoDropzone.addEventListener('drop', async (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
          const encoded = await compressAndEncodeImage(file, 400, 400, 0.85);
          if (encoded) {
            if (!cmsState.currentDraft.heroHeader) cmsState.currentDraft.heroHeader = {};
            cmsState.currentDraft.heroHeader.heroIconImage = encoded;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }
      }, false);
    }

    // ==========================================
    // ZONE 1: OVERVIEW BLOCKS LISTENERS
    // ==========================================

    // Open Visual Block Editor for Overview
    const btnOpenOverviewVbe = container.querySelector('#btn-open-overview-vbe');
    if (btnOpenOverviewVbe) {
      btnOpenOverviewVbe.addEventListener('click', async () => {
        const currentBlocks = Array.isArray(cmsState.currentDraft.narrative) ? cmsState.currentDraft.narrative : [];
        const res = await universalBlockEditor.open({
          title: `SDG ${cmsState.activeSection.id || '1'} — Overview & Narrative Lead`,
          type: 'sdg_overview',
          item: {
            title: cmsState.currentDraft.heroHeader?.goalTitle || "Goal Overview",
            blocks: currentBlocks
          },
          showMetadata: false
        });

        if (res) {
          const newBlocks = res.blocks || (res.item && res.item.blocks) || [];
          cmsState.currentDraft.narrative = newBlocks;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    }

    // Delete Overview Block with Confirmation Modal
    container.querySelectorAll('[data-delete-overview-block]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bIdx = parseInt(btn.getAttribute('data-delete-overview-block'), 10);
        const block = cmsState.currentDraft.narrative?.[bIdx];
        if (!block) return;

        const blockType = (block.type || 'paragraph').replace('_', ' ');
        const confirmed = typeof window.cmsConfirm === 'function' ? await window.cmsConfirm({
          title: "Delete Content Block?",
          description: `Are you sure you want to delete this ${blockType} block from the overview narrative?`,
          icon: "🗑️",
          iconBg: "bg-red-500/20 text-red-500",
          confirmText: "Delete Block",
          confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold"
        }) : confirm(`Delete this ${blockType} block?`);

        if (confirmed && Array.isArray(cmsState.currentDraft.narrative) && cmsState.currentDraft.narrative[bIdx]) {
          cmsState.currentDraft.narrative.splice(bIdx, 1);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // Move Overview Block
    container.querySelectorAll('[data-move-overview-block]').forEach(btn => {
      btn.addEventListener('click', () => {
        const bIdx = parseInt(btn.getAttribute('data-move-overview-block'), 10);
        const dir = btn.getAttribute('data-dir');
        const list = cmsState.currentDraft.narrative;
        if (Array.isArray(list)) {
          const targetIdx = dir === 'up' ? bIdx - 1 : bIdx + 1;
          if (targetIdx >= 0 && targetIdx < list.length) {
            const temp = list[bIdx];
            list[bIdx] = list[targetIdx];
            list[targetIdx] = temp;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }
      });
    });

    // Overview Input Fields Binding
    container.querySelectorAll('[data-overview-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const bIdx = parseInt(input.getAttribute('data-block-idx'), 10);
        const field = input.getAttribute('data-overview-field');
        if (Array.isArray(cmsState.currentDraft.narrative) && cmsState.currentDraft.narrative[bIdx]) {
          cmsState.currentDraft.narrative[bIdx][field] = e.target.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // Metric Cards Fields Inside Overview
    container.querySelectorAll('[data-metric-card-field]').forEach(input => {
      const handleMetricUpdate = (e) => {
        const bIdx = parseInt(input.getAttribute('data-block-idx'), 10);
        const mIdx = parseInt(input.getAttribute('data-metric-idx'), 10);
        const field = input.getAttribute('data-metric-card-field');
        const block = cmsState.currentDraft.narrative?.[bIdx];
        if (block && Array.isArray(block.metrics) && block.metrics[mIdx]) {
          block.metrics[mIdx][field] = e.target.value;
          cmsState.currentDraft.metrics = block.metrics;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      };
      input.addEventListener('input', handleMetricUpdate);
      input.addEventListener('change', handleMetricUpdate);
    });

    // Metric Icon Picker Inside Overview
    container.querySelectorAll('[data-pick-overview-metric-icon]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [bIdx, mIdx] = btn.getAttribute('data-pick-overview-metric-icon').split('-').map(Number);
        const block = cmsState.currentDraft.narrative?.[bIdx];
        if (!block || !Array.isArray(block.metrics) || !block.metrics[mIdx]) return;

        const currentMetric = block.metrics[mIdx];
        const currentIconKey = currentMetric.icon || currentMetric.iconName || '';

        lucideIconPicker.open({
          currentIcon: currentIconKey,
          onSelect: (iconName, svgHtml) => {
            currentMetric.icon = iconName;
            currentMetric.svgIcon = svgHtml;
            cmsState.currentDraft.metrics = block.metrics;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        });
      });
    });

    // Add / Delete Metric Card Items Inside Overview
    container.querySelectorAll('[data-add-metric-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const bIdx = parseInt(btn.getAttribute('data-add-metric-item'), 10);
        const block = cmsState.currentDraft.narrative?.[bIdx];
        if (block) {
          if (!Array.isArray(block.metrics)) block.metrics = [];
          const defaultIcons = ['award', 'globe', 'book-open', 'users', 'handshake', 'trending-up', 'leaf'];
          const chosenIcon = defaultIcons[block.metrics.length % defaultIcons.length];
          const defaultSvg = lucideIconPicker.getSvg(chosenIcon, 28, 2);

          block.metrics.push({ 
            value: "0", 
            label: "New Metric", 
            theme: "white",
            icon: chosenIcon,
            svgIcon: defaultSvg
          });
          cmsState.currentDraft.metrics = block.metrics;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    container.querySelectorAll('[data-delete-metric-item]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const [bIdx, mIdx] = btn.getAttribute('data-delete-metric-item').split('-').map(Number);
        const block = cmsState.currentDraft.narrative?.[bIdx];
        if (!block || !Array.isArray(block.metrics) || !block.metrics[mIdx]) return;

        const metricLabel = block.metrics[mIdx].label || `Metric #${mIdx + 1}`;
        const confirmed = typeof window.cmsConfirm === 'function' ? await window.cmsConfirm({
          title: "Remove Metric Card?",
          description: `Are you sure you want to remove the metric "${metricLabel}"?`,
          icon: "🗑️",
          iconBg: "bg-red-500/20 text-red-500",
          confirmText: "Remove Metric",
          confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold"
        }) : confirm(`Remove metric "${metricLabel}"?`);

        if (confirmed) {
          block.metrics.splice(mIdx, 1);
          cmsState.currentDraft.metrics = block.metrics;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // ==========================================
    // ZONE 2: IMPACT DRAWERS LISTENERS
    // ==========================================

    // Add Impact Drawer Button
    const btnAddDrawer = container.querySelector('#btn-add-impact-drawer');
    if (btnAddDrawer) {
      btnAddDrawer.addEventListener('click', () => {
        if (!Array.isArray(cmsState.currentDraft.impactDrawers)) {
          cmsState.currentDraft.impactDrawers = [];
        }
        cmsState.currentDraft.impactDrawers.push({
          drawerTitle: "Added New Drawer",
          title: "Added New Drawer",
          isOpen: true,
          eventId: "",
          eventIds: [],
          linkedEvents: [],
          contents: [
            {
              type: "paragraph",
              content: "Describe the policies, programs, and verified sustainable outcomes executed for this initiative..."
            }
          ]
        });

        // Mirror aliases
        cmsState.currentDraft.sections = cmsState.currentDraft.impactDrawers;
        cmsState.currentDraft.subSections = cmsState.currentDraft.impactDrawers;

        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        parentFormEngine.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    // Drawer Open Toggle Listener
    container.querySelectorAll('[data-drawer-open-toggle]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const dIdx = parseInt(chk.getAttribute('data-drawer-open-toggle'), 10);
        const drawer = cmsState.currentDraft.impactDrawers?.[dIdx];
        if (drawer) {
          drawer.isOpen = e.target.checked;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // Move Drawer Up / Down
    container.querySelectorAll('[data-move-drawer]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dIdx = parseInt(btn.getAttribute('data-move-drawer'), 10);
        const dir = btn.getAttribute('data-dir');
        const list = cmsState.currentDraft.impactDrawers;
        if (Array.isArray(list)) {
          const targetIdx = dir === 'up' ? dIdx - 1 : dIdx + 1;
          if (targetIdx >= 0 && targetIdx < list.length) {
            const temp = list[dIdx];
            list[dIdx] = list[targetIdx];
            list[targetIdx] = temp;

            cmsState.currentDraft.sections = list;
            cmsState.currentDraft.subSections = list;

            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }
      });
    });

    // Delete Drawer with Confirmation Modal
    container.querySelectorAll('[data-delete-drawer]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const dIdx = parseInt(btn.getAttribute('data-delete-drawer'), 10);
        const list = cmsState.currentDraft.impactDrawers;
        if (!Array.isArray(list) || !list[dIdx]) return;

        const drawerTitle = list[dIdx].drawerTitle || list[dIdx].title || `Drawer #${dIdx + 1}`;
        const confirmed = typeof window.cmsConfirm === 'function' ? await window.cmsConfirm({
          title: "Delete Impact Drawer?",
          description: `Are you sure you want to delete "${drawerTitle}" and all its content blocks? This action cannot be undone.`,
          icon: "🗑️",
          iconBg: "bg-red-500/20 text-red-500",
          confirmText: "Delete Drawer",
          confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold"
        }) : confirm(`Delete "${drawerTitle}"?`);

        if (confirmed && Array.isArray(list) && list[dIdx]) {
          list.splice(dIdx, 1);
          cmsState.currentDraft.sections = list;
          cmsState.currentDraft.subSections = list;

          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // Open Visual Block Editor for a specific Impact Drawer
    container.querySelectorAll('[data-open-drawer-vbe]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const dIdx = parseInt(btn.getAttribute('data-open-drawer-vbe'), 10);
        const drawer = cmsState.currentDraft.impactDrawers?.[dIdx];
        if (drawer) {
          const currentBlocks = Array.isArray(drawer.contents) ? drawer.contents : (Array.isArray(drawer.blocks) ? drawer.blocks : []);
          const currentEventIds = Array.isArray(drawer.eventIds) ? drawer.eventIds : (drawer.eventId ? [drawer.eventId] : (Array.isArray(drawer.linkedEvents) ? drawer.linkedEvents : []));
          const availableEvents = this.getRegisteredEvents();
          
          const res = await universalBlockEditor.open({
            title: `${dIdx + 1} Drawer Content`,
            type: 'sdg_drawer',
            sdgNum: parseInt(cmsState.activeSection.id || '1', 10),
            availableEvents: availableEvents,
            item: {
              drawerIndex: dIdx + 1,
              title: drawer.drawerTitle || drawer.title || "Added New Drawer",
              drawerTitle: drawer.drawerTitle || drawer.title || "Added New Drawer",
              blocks: currentBlocks,
              eventIds: currentEventIds,
              linkedEvents: currentEventIds,
              relatedSdgs: [parseInt(cmsState.activeSection.id || '1', 10)]
            },
            showMetadata: false
          });

          if (res) {
            const newBlocks = res.blocks || (res.item && res.item.blocks) || [];
            const newTitle = (res.title || (res.item && res.item.title) || (res.item && res.item.drawerTitle) || "Added New Drawer").trim();
            const newEventIds = res.eventIds || (res.item && res.item.eventIds) || (res.item && res.item.linkedEvents) || [];

            drawer.drawerTitle = newTitle;
            drawer.title = newTitle;
            drawer.contents = newBlocks;
            drawer.blocks = newBlocks;
            drawer.eventIds = newEventIds;
            drawer.linkedEvents = newEventIds;
            drawer.eventId = newEventIds[0] || '';

            cmsState.currentDraft.sections = cmsState.currentDraft.impactDrawers;
            cmsState.currentDraft.subSections = cmsState.currentDraft.impactDrawers;

            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }
      });
    });
  }
}

export const sdgReportsManager = new SdgReportsManager();
