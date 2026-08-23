// admin/js/modules/smarteco-manager.js
// Modular Feature Manager for Smart Eco Campus & UI GreenMetric (CMS Studio)

import { cmsState, INDICATOR_PILLARS, compressAndEncodeImage } from '../cms-state.js';
import { previewBridge } from '../preview-bridge.js';

const CANONICAL_MILESTONES = [
  { rank: "#1", label: "Local Universities & Colleges (LUC) in the Philippines", theme: "blue" },
  { rank: "#1", label: "HEI in Water Management Category", theme: "white" },
  { rank: "#1", label: "in the Province of Pangasinan", theme: "white" },
  { rank: "#3", label: "in Region 1", theme: "white" },
  { rank: "#8", label: "in the Entire Philippines", theme: "white" },
  { rank: "#189", label: "in Asia", theme: "white" },
  { rank: "#361", label: "IN THE WORLD", theme: "red" }
];

export class SmartEcoManager {
  /**
   * Escape HTML utility
   */
  escape(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Resolve image path for admin view
   */
  resolveAdminImageSrc(src) {
    if (!src) return '';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
      return src;
    }
    if (src.startsWith('../')) return src;
    if (src.startsWith('./')) return `../${src.slice(2)}`;
    return `../${src}`;
  }

  /**
   * Ensure 7 canonical milestones exist in draft
   */
  normalizeMilestones(draft) {
    if (!Array.isArray(draft.milestones) || draft.milestones.length !== 7 || (draft.milestones[5] && draft.milestones[5].rank === '#431')) {
      // Migrate / reset to canonical 7 cards
      draft.milestones = JSON.parse(JSON.stringify(CANONICAL_MILESTONES));
      cmsState.isDirty = true;
      cmsState.saveLocalDraft();
    }
  }

  /**
   * Render Smart Eco Campus CMS Management View
   */
  render(draft) {
    if (!draft) draft = {};
    this.normalizeMilestones(draft);

    const milestones = draft.milestones;
    const awardImages = Array.isArray(draft.awardImages) && draft.awardImages.length > 0 ? draft.awardImages : [
      "./images/smart-eco-assets/ui-gm2.jpg",
      "./images/smart-eco-assets/ui-gm.jpg"
    ];

    const defaultNarrative = 'The UI GreenMetric World University Rankings evaluates green campuses and environmental sustainability across 39 indicators in 6 criteria.\n\nAs a first try for UCU in this global ranking, it is an academic milestone worthy of celebration.';
    const currentNarrative = draft.introNarrative || (draft.introParagraph1 ? (draft.introParagraph1 + '\n\n' + (draft.introParagraph2 || '')) : defaultNarrative);
    const calloutText = draft.introCallout || draft.introParagraph3 || 'Congratulations, UCUians! Mabuhay ang Urdaneta City University!';

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        
        <!-- Studio Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">Header Page</span>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">smart-eco-campus.html</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight font-sans">Smart Eco Campus Studio</h2>
          </div>
        </div>

        <!-- Section 1: Hero Banner -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 1</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              <span>Hero Banner</span>
            </h3>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Eyebrow Badge</label>
              <input type="text" data-bind="heroEyebrow" value="${this.escape(draft.heroEyebrow || 'Innovation Powered by Sustainability')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Main Headline</label>
              <input type="text" data-bind="heroHeadline" value="${this.escape(draft.heroHeadline || 'Smart Eco')}" class="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Highlight Word / Accent</label>
              <input type="text" data-bind="heroHighlight" value="${this.escape(draft.heroHighlight || 'Campus')}" class="w-full px-3 py-1.5 text-xs font-bold text-ucu-blue bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Hero Description Paragraph</label>
            <textarea data-bind="heroDescription" rows="2" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">${this.escape(draft.heroDescription || 'Creating a campus where innovation, sustainability, and responsible growth work together to elevate institutional performance and environmental impact.')}</textarea>
          </div>
        </div>

        <!-- Section 2: Slider Images & Narrative -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Slider Images Manager (5 Cols) -->
          <div class="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2.5">
                  <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 2A</span>
                  <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                    <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    <span>Slider Images (${awardImages.length})</span>
                  </h3>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3" id="award-photos-container">
                ${awardImages.map((src, i) => `
                  <div class="relative group rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50 aspect-[3/4] flex items-center justify-center p-2 shadow-2xs hover:border-slate-300 transition-all">
                    <img src="${this.resolveAdminImageSrc(src)}" alt="Slide ${i+1}" class="max-h-full max-w-full object-contain transition-all duration-300 group-hover:scale-105 group-hover:blur-[2px]">
                    
                    <!-- Centered Trash Delete Action on Hover -->
                    <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 backdrop-blur-[1px] transition-all flex items-center justify-center pointer-events-none">
                      <button type="button" data-delete-award-img="${i}" class="pointer-events-auto px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all cursor-pointer font-sans" title="Delete Image">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Footer Container for Add Button -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-end">
              <label for="award-img-uploader" class="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-ucu-blue text-white hover:bg-ucu-blue-dark transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 font-sans">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Add</span>
              </label>
              <input type="file" id="award-img-uploader" accept="image/*" class="hidden">
            </div>
          </div>

          <!-- Narrative (7 Cols) -->
          <div class="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 2B</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>Narrative</span>
              </h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Section Eyebrow</label>
                <input type="text" data-bind="recognitionEyebrow" value="${this.escape(draft.recognitionEyebrow || 'Global Recognition')}" class="w-full px-3 py-1.5 text-xs font-bold text-ucu-blue bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Headline Title</label>
                <input type="text" data-bind="recognitionTitle" value="${this.escape(draft.recognitionTitle || 'An Academic Milestone')}" class="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Narrative Paragraphs (Press Enter for new paragraph)</label>
                <textarea data-bind="introNarrative" rows="4" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans" placeholder="Type narrative paragraphs here...">${this.escape(currentNarrative)}</textarea>
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Congratulatory Callout</label>
                <input type="text" data-bind="introCallout" value="${this.escape(calloutText)}" class="w-full px-3 py-1.5 text-xs font-bold text-ucu-blue bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
              </div>
            </div>
          </div>

        </div>

        <!-- Section 3: Bento-Box Grid (7 Official Cards) -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 3</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7.5"/><path d="M14 14.66V17c0 .55.45 1 1 1h1.5"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
                <span>Bento-Box Grid (${milestones.length})</span>
              </h3>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 font-sans">
              Strictly 7 Canonical Cards
            </span>
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Section Header Text</label>
            <input type="text" data-bind="standingHeader" value="${this.escape(draft.standingHeader || 'Out of 1,477 universities worldwide in 2025, WE ARE:')}" class="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
          </div>

          <!-- Clean Full-Width Stack of 7 Milestone Cards with Dropdown Theme -->
          <div class="space-y-3" id="milestones-container">
            ${milestones.map((m, idx) => {
              const currentTheme = m.theme || (idx === 0 ? 'blue' : (idx === 6 ? 'red' : 'white'));

              return `
                <div class="p-4 bg-slate-50/80 border border-slate-200/90 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-slate-300">
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="w-7 h-7 rounded-lg bg-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 font-sans">
                      #${idx + 1}
                    </div>
                    <span class="text-[11px] font-bold text-slate-700 font-sans w-24 sm:w-28 truncate" title="${idx === 6 ? 'Global Standing Card' : `Milestone #${idx + 1}`}">
                      ${idx === 6 ? 'Global Standing' : `Milestone #${idx + 1}`}
                    </span>
                  </div>

                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
                    <div class="sm:col-span-3">
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Rank Value</label>
                      <input type="text" data-milestone-field="rank" data-milestone-index="${idx}" value="${this.escape(m.rank || '#1')}" class="w-full px-3 py-1.5 text-xs font-black text-center bg-white border border-slate-200 rounded-lg text-ucu-blue-dark shadow-2xs focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans" placeholder="e.g. #1">
                    </div>

                    <div class="sm:col-span-6">
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Milestone Description</label>
                      <input type="text" data-milestone-field="label" data-milestone-index="${idx}" value="${this.escape(m.label || '')}" class="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-800 shadow-2xs focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans" placeholder="Milestone description text...">
                    </div>

                    <div class="sm:col-span-3">
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Theme Color</label>
                      <select data-milestone-field="theme" data-milestone-index="${idx}" class="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue cursor-pointer font-sans">
                        <option value="blue" ${currentTheme === 'blue' ? 'selected' : ''}>Blue</option>
                        <option value="white" ${currentTheme === 'white' ? 'selected' : ''}>White</option>
                        <option value="red" ${currentTheme === 'red' ? 'selected' : ''}>Red</option>
                      </select>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Section 4: 7 Sustainability Indicators Overview -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 4</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>7 Sustainability Indicator Pillars</span>
              </h3>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 font-sans">
              7 Active Indicator Studios
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            ${INDICATOR_PILLARS.map(ind => `
              <div data-goto-pillar="${ind.id}" class="group p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 hover:border-slate-300 rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition-all shadow-2xs hover:shadow-xs">
                <div class="flex items-center justify-between">
                  <span class="w-7 h-7 rounded-lg bg-white border border-slate-200 text-emerald-700 text-xs font-black flex items-center justify-center shadow-2xs font-sans">
                    ${this.escape(ind.num)}
                  </span>
                  <span class="text-[11px] font-bold text-ucu-blue group-hover:text-ucu-blue-dark flex items-center gap-1 font-sans">
                    <span>Open Studio</span> &rarr;
                  </span>
                </div>

                <div>
                  <h4 class="text-xs font-bold text-slate-800 leading-snug font-sans">${this.escape(ind.title)}</h4>
                  <span class="text-[10px] text-slate-400 mt-0.5 block font-sans">UI GreenMetric Pillar</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="pt-2">
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Concluding Framework Statement</label>
            <textarea data-bind="concludingParagraph" rows="3" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">${this.escape(draft.concludingParagraph || 'These seven sustainability indicators form the strategic framework of Urdaneta City University’s Smart Eco Campus initiative. By aggressively aligning our institutional metrics with global environmental standards—such as the UI GreenMetric framework—we do more than cultivate a green learning environment. We forge high-impact linkages with international stakeholders, driving collaborative research and scalable sustainable practices that elevate our graduates to global competitiveness.')}</textarea>
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Bind event listeners for Smart Eco section
   */
  bindEvents(container, parentFormEngine) {
    if (!container) return;

    const draft = cmsState.currentDraft || {};

    // 1. Two-way data binding for text inputs and textareas
    container.querySelectorAll('[data-bind]').forEach(el => {
      el.oninput = () => {
        const key = el.dataset.bind;
        draft[key] = el.value;

        // Auto-sync legacy fields for backward-compatibility
        if (key === 'introNarrative') {
          const pList = el.value.split('\n').map(p => p.trim()).filter(Boolean);
          draft.introParagraph1 = pList[0] || '';
          draft.introParagraph2 = pList.slice(1).join('\n\n') || '';
        }
        if (key === 'introCallout') {
          draft.introParagraph3 = el.value;
        }

        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(draft);
      };
    });

    // 2. Milestone Input Change (Rank and Label)
    container.querySelectorAll('input[data-milestone-field]').forEach(input => {
      const handler = (e) => {
        const idx = parseInt(input.dataset.milestoneIndex, 10);
        const field = input.dataset.milestoneField;
        if (Array.isArray(draft.milestones) && draft.milestones[idx]) {
          draft.milestones[idx][field] = e.target.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(draft);
        }
      };
      input.oninput = handler;
      input.onchange = handler;
    });

    // 3. Milestone Theme Dropdown Change (Blue, White, Red)
    container.querySelectorAll('select[data-milestone-field="theme"]').forEach(select => {
      select.onchange = (e) => {
        const idx = parseInt(select.dataset.milestoneIndex, 10);
        if (Array.isArray(draft.milestones) && draft.milestones[idx]) {
          draft.milestones[idx].theme = e.target.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(draft);
        }
      };
    });

    // 4. Award Image Uploader
    const imgUploader = container.querySelector('#award-img-uploader');
    if (imgUploader) {
      imgUploader.onchange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const compressed = await compressAndEncodeImage(file, 1200, 1600, 0.85);
          if (compressed) {
            if (!Array.isArray(draft.awardImages)) draft.awardImages = [];
            draft.awardImages.push(compressed);
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            if (parentFormEngine) parentFormEngine.render();
            previewBridge.sendLiveUpdate(draft);
          }
        }
      };
    }

    // 5. Delete Award Image WITH MODAL CONFIRMATION
    container.querySelectorAll('[data-delete-award-img]').forEach(btn => {
      btn.onclick = async () => {
        const idx = parseInt(btn.dataset.deleteAwardImg, 10);
        if (Array.isArray(draft.awardImages)) {
          const confirmed = typeof window.cmsConfirm === 'function'
            ? await window.cmsConfirm({
                title: "Remove Award Certificate?",
                description: "Are you sure you want to remove this award certificate photo from the slider?",
                icon: "📜",
                confirmText: "Delete Photo",
                confirmClass: "bg-red-600 hover:bg-red-500 text-white"
              })
            : confirm("Remove this award certificate photo?");

          if (!confirmed) return;

          draft.awardImages.splice(idx, 1);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          if (parentFormEngine) parentFormEngine.render();
          previewBridge.sendLiveUpdate(draft);
        }
      };
    });

    // 6. Shortcut goto Pillar Studio (Seamless Redirection)
    container.querySelectorAll('[data-goto-pillar]').forEach(card => {
      card.onclick = () => {
        const pillarId = card.dataset.gotoPillar;
        if (typeof window.cmsNavigateToSection === 'function') {
          window.cmsNavigateToSection('indicator', pillarId, '2025');
        } else {
          const sidebarBtn = document.querySelector(`[data-nav-type="indicator"][data-nav-id="${pillarId}"]`);
          if (sidebarBtn) sidebarBtn.click();
        }
      };
    });
  }
}

export const smartEcoManager = new SmartEcoManager();
