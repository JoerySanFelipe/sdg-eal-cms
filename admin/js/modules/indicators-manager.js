// admin/js/modules/indicators-manager.js
// Modular Feature Manager for 7 UI GreenMetric Indicator Pillars & Evidence Registry (CMS Studio)

import { cmsState, compressAndEncodeImage } from '../cms-state.js';
import { previewBridge } from '../preview-bridge.js';
import { lucideIconPicker } from '../lucide-icon-picker.js';
import { escapeHtml, resolveAssetUrl, INDICATOR_PILLARS, SDG_METADATA, naturalSort } from '../shared-utils.js';

export class IndicatorsManager {
  constructor() {
    this.searchQuery = '';
    this.activeModal = null;
  }

  /**
   * Escape HTML utility
   */
  escape(str) {
    return escapeHtml(str);
  }

  /**
   * Resolve image path for admin view
   */
  resolveAdminImageSrc(src) {
    return resolveAssetUrl(src, { isAdmin: true });
  }

  /**
   * SDG official metadata helper
   */
  getSdgColor(num) {
    return SDG_METADATA[num]?.color || '#24305e';
  }

  getSdgTitle(num) {
    return SDG_METADATA[num]?.title || `SDG ${num}`;
  }

  /**
   * Universal Natural Numerical Evidence Sorter with Automatic Deduplication
   */
  sortEvidences(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const unique = [];
    for (const item of list) {
      if (!item) continue;
      const key = (item.codeID || item.id || '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(item);
      } else if (!key) {
        unique.push(item);
      }
    }
    return unique.sort((a, b) => {
      const codeA = (a.codeID || a.id || '').replace(/^modal-/, '').replace(/_/g, '.');
      const codeB = (b.codeID || b.id || '').replace(/^modal-/, '').replace(/_/g, '.');
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  /**
   * Render evidence cards grid HTML
   */
  renderEvidenceCardsHtml(evidenceList, defaultIcon = 'images/smart-eco-assets/ui-green-seal.png') {
    if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
      return `
        <div class="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
          <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.5L19 7.5V19a2 2 0 0 1-2 2z"/></svg>
          </div>
          <h4 class="text-xs font-bold text-slate-700 font-sans">No evidence submissions found</h4>
          <p class="text-[11px] text-slate-400 max-w-sm mx-auto font-sans">Try adjusting your search query or click "+ Add Indicator Evidence" above.</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${evidenceList.map(item => {
          const code = item.codeID || item.id || 'Indicator';
          const sdgs = Array.isArray(item.relatedSdgs) ? item.relatedSdgs : [];
          const hasCustomCardThumb = item.thumb_evidence && 
            item.thumb_evidence !== 'images/smart-eco-assets/ui-green-seal.png' && 
            !item.thumb_evidence.startsWith('images/indicator-icons/') &&
            !item.thumb_evidence.startsWith('../images/indicator-icons/');
          const rawImg = hasCustomCardThumb ? item.thumb_evidence : defaultIcon;
          const imgSrc = this.resolveAdminImageSrc(rawImg);

          return `
            <div class="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl flex flex-col justify-between gap-3 group hover:border-slate-300 hover:shadow-xs transition-all">
              
              <div class="space-y-2.5">
                <!-- Card Top: ID Code -->
                <div class="flex items-center justify-between gap-2">
                  <span class="px-2.5 py-0.5 rounded-md bg-ucu-blue-dark text-white text-[10px] font-black tracking-wider shadow-2xs font-mono">
                    ${this.escape(code)}
                  </span>
                </div>

                <!-- Thumbnail & Title -->
                <div class="flex items-start gap-3">
                  <div class="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    <img src="${imgSrc}" alt="${this.escape(item.title)}" class="max-h-full max-w-full object-contain">
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="text-xs font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-ucu-blue transition-colors font-sans">
                      ${this.escape(item.title)}
                    </h4>
                  </div>
                </div>

                <!-- Attached SDG Pills -->
                ${sdgs.length > 0 ? `
                  <div class="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1">
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1 font-sans">SDGs:</span>
                    ${sdgs.map(num => `
                      <span class="w-5 h-5 rounded-[4px] text-white text-[9px] font-black flex items-center justify-center shadow-2xs font-sans" style="background-color: ${this.getSdgColor(num)};" title="SDG ${num}: ${this.getSdgTitle(num)}">
                        ${num}
                      </span>
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <!-- Card Actions -->
              <div class="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                <button type="button" data-evidence-edit="${item.originalIndex}" class="flex-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1 font-sans">
                  <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>Edit</span>
                </button>
                <button type="button" data-evidence-delete="${item.originalIndex}" class="px-2.5 py-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs" title="Delete Evidence Item">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render Indicator Pillar CMS Studio Management View
   */
  render(pillarId, draft) {
    if (!draft) draft = {};
    const pillar = INDICATOR_PILLARS.find(p => p.id === pillarId) || { id: pillarId, title: "Setting & Infrastructure", num: "01", img: "images/smart-eco-assets/setting_and_infrastructure.jpg" };
    
    // Ensure fallback to baseline if draft properties are uninitialized
    const baseline = cmsState.getBaselineData({ type: 'indicator', id: pillarId });
    if (!draft.narrative && baseline.narrative) draft.narrative = baseline.narrative;
    
    const baselineEvidences = baseline.evidences || baseline.evidenceList || [];
    if ((!draft.evidences || draft.evidences.length === 0) && (!draft.evidenceList || draft.evidenceList.length === 0)) {
      draft.evidences = JSON.parse(JSON.stringify(baselineEvidences));
      draft.evidenceList = JSON.parse(JSON.stringify(baselineEvidences));
    }

    const baselineMetrics = baseline.metricsCard || baseline.metrics || [];
    if ((!draft.metricsCard || draft.metricsCard.length === 0) && (!draft.metrics || draft.metrics.length === 0)) {
      draft.metricsCard = JSON.parse(JSON.stringify(baselineMetrics));
      draft.metrics = JSON.parse(JSON.stringify(baselineMetrics));
    }

    if (!draft.thumb_image && !draft.thumbnailImg) {
      draft.thumb_image = baseline.thumb_image || pillar.img;
      draft.thumbnailImg = baseline.thumb_image || pillar.img;
    }

    const PILLAR_DEFAULT_ICONS = {
      infrastructure: "images/indicator-icons/infrastructure.png",
      energy: "images/indicator-icons/energy.png",
      waste: "images/indicator-icons/waste.png",
      water: "images/indicator-icons/water.png",
      transportation: "images/indicator-icons/transportation.png",
      education: "images/indicator-icons/education.png",
      digitalization: "images/indicator-icons/digitalization.png"
    };

    const defaultEvidenceIcon = PILLAR_DEFAULT_ICONS[pillarId] || "images/smart-eco-assets/ui-green-seal.png";
    const currentEvidenceIcon = draft.evidence_thumb || draft.thumb_evidence || defaultEvidenceIcon;

    let rawEvidenceList = Array.isArray(draft.evidences) ? draft.evidences : (Array.isArray(draft.evidenceList) ? draft.evidenceList : []);
    const evidenceList = this.sortEvidences(rawEvidenceList);
    // Keep draft's array in sync with sorted order
    draft.evidences = evidenceList;
    draft.evidenceList = evidenceList;

    const metrics = Array.isArray(draft.metricsCard) ? draft.metricsCard : (Array.isArray(draft.metrics) ? draft.metrics : []);
    const currentThumbnail = draft.thumb_image || draft.thumbnailImg || pillar.img;

    // Filter evidence by Search Query
    const filteredEvidence = evidenceList.map((item, originalIndex) => ({ ...item, originalIndex })).filter(item => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      const code = (item.codeID || item.id || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const badge = (item.badge || '').toLowerCase();
      return code.includes(q) || title.includes(q) || badge.includes(q);
    });

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        
        <!-- Studio Header -->
        <div class="pb-5 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 text-base font-black flex items-center justify-center shadow-xs border border-emerald-200 font-sans">
              ${pillar.num}
            </span>
            <div>
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">Header Page</span>
                <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">indicators/${pillarId}.html</span>
              </div>
              <h2 class="text-xl font-bold text-slate-900 tracking-tight font-sans">${this.escape(draft.indicatorTitle || draft.pillarTitle || pillar.title)} Studio</h2>
            </div>
          </div>
        </div>

        <!-- Section 1: Navigation Image -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 1</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Navigation Image</span>
            </h3>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-6">
            <!-- Framed Drag-and-Drop / Hover Card -->
            <label for="pillar-thumbnail-uploader" id="pillar-thumb-dropzone" class="w-full sm:w-72 h-40 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-900 shadow-2xs shrink-0 relative group cursor-pointer block transition-all hover:border-ucu-blue/50">
              <img id="pillar-thumb-preview" src="${this.resolveAdminImageSrc(currentThumbnail)}" alt="${pillar.title} Thumbnail" class="w-full h-full object-cover transition-all duration-300 group-hover:blur-[2px] group-hover:scale-105">
              <div class="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                <span class="px-3.5 py-1.5 bg-white/95 text-slate-800 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 font-sans">
                  <svg class="w-3.5 h-3.5 text-ucu-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>Replace</span>
                </span>
                <span class="text-[10px] text-white/90 font-medium font-sans">Click or Drop new image</span>
              </div>
            </label>
            <input type="file" id="pillar-thumbnail-uploader" accept="image/*" class="hidden">

            <div class="space-y-1 flex-1">
              <h4 class="text-xs font-bold text-slate-800 font-sans">Hero &amp; Top Navigation Banner</h4>
              <p class="text-[11px] text-slate-400 leading-relaxed font-sans">High resolution 16:9 photo (min 1200x675px) recommended. Used as the top image banner across indicator pages and gallery tile on Smart Eco Campus. Automatically optimized &amp; saved.</p>
            </div>
          </div>
        </div>

        <!-- Section 2: Narrative & Executive Overview -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 2</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span>Pillar Narrative &amp; Executive Summary</span>
            </h3>
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Narrative Description Paragraphs</label>
            <textarea data-bind="narrative" rows="6" class="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue leading-relaxed font-sans" placeholder="Enter comprehensive narrative paragraphs...">${this.escape(draft.narrative || '')}</textarea>
            <span class="text-[10px] text-slate-400 mt-1 block font-sans">Tip: Separate paragraphs with a blank line for styled narrative blocks.</span>
          </div>
        </div>

        <!-- Section 3: Metric Cards -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 3</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <span>Metric Cards</span>
            </h3>
          </div>

          <div class="space-y-3" id="indicator-metrics-container">
            ${[0, 1, 2].map(idx => {
              const m = metrics[idx] || { value: '', title: '', label: '', theme: idx === 1 ? 'red' : 'blue', url: '', evidenceId: '', icon: 'award' };
              const cardTitle = m.title || m.label || '';
              const cardUrl = m.url || m.evidenceId || '';
              const theme = m.theme === 'navy' ? 'blue' : (m.theme || 'blue');
              const iconKey = m.icon || (idx === 0 ? 'building' : (idx === 1 ? 'zap' : 'leaf'));
              const iconSvg = iconKey 
                ? lucideIconPicker.getSvg(iconKey, 20, 2)
                : (m.svgIcon && m.svgIcon.includes('<svg') ? m.svgIcon : lucideIconPicker.getSvg('award', 20, 2));

              return `
                <div class="p-4 bg-slate-50/80 border border-slate-200/90 rounded-xl flex flex-col lg:flex-row items-start lg:items-center gap-3.5 transition-all hover:border-slate-300">
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="w-7 h-7 rounded-lg bg-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 font-sans">
                      #${idx + 1}
                    </div>
                    
                    <!-- Lucide Icon Selector Button -->
                    <button 
                      type="button" 
                      data-pick-indicator-metric-icon="${idx}" 
                      class="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:border-ucu-blue text-ucu-blue-dark hover:text-ucu-blue flex items-center justify-center shadow-2xs hover:shadow-xs transition-all cursor-pointer group shrink-0" 
                      title="Click to Choose Lucide Icon (${iconKey || 'default'})"
                    >
                      <div class="w-5 h-5 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform">
                        ${iconSvg}
                      </div>
                    </button>
                  </div>

                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
                    <div class="sm:col-span-3">
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Metric Value</label>
                      <input type="text" data-metric-field="value" data-metric-idx="${idx}" value="${this.escape(m.value || '')}" placeholder="e.g. 91% or 35,544" class="w-full px-3 py-1.5 text-xs font-black text-center bg-white border border-slate-200 rounded-lg text-ucu-blue-dark shadow-2xs focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
                    </div>

                    <div class="sm:col-span-4">
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Metric Title / Label</label>
                      <input type="text" data-metric-field="title" data-metric-idx="${idx}" value="${this.escape(cardTitle)}" placeholder="e.g. Energy-Efficient Appliances" class="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-800 shadow-2xs focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
                    </div>

                    <div class="sm:col-span-3">
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Linked Evidence ID</label>
                      <input type="text" data-metric-field="url" data-metric-idx="${idx}" value="${this.escape(cardUrl)}" placeholder="e.g. 1_3 or 1.3" class="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
                    </div>

                    <div class="sm:col-span-2">
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Theme</label>
                      <select data-metric-field="theme" data-metric-idx="${idx}" class="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
                        <option value="blue" ${theme === 'blue' ? 'selected' : ''}>Blue</option>
                        <option value="white" ${theme === 'white' ? 'selected' : ''}>White</option>
                        <option value="red" ${theme === 'red' ? 'selected' : ''}>Red</option>
                      </select>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Section 4: Evidence Repository -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 4</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <span>Evidence Repository</span>
              </h3>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 font-sans">${evidenceList.length} Items</span>
            </div>

            <button type="button" id="btn-add-evidence" class="px-3.5 py-2 bg-ucu-blue hover:bg-ucu-blue-dark text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer font-sans self-start sm:self-auto">
              <svg class="w-4 h-4 text-ucu-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Add Indicator Evidence</span>
            </button>
          </div>

          <!-- Icon / Seal Container -->
          <div class="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                <img id="pillar-evidence-icon-preview" src="${this.resolveAdminImageSrc(currentEvidenceIcon)}" alt="${pillar.title} Evidence Icon" class="max-h-full max-w-full object-contain">
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-800 font-sans">Icon / Seal</h4>
                <p class="text-[11px] text-slate-400 leading-relaxed max-w-md font-sans">Default icon seal applied across all evidence cards and modal headers for ${this.escape(pillar.title)}.</p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <label for="pillar-evidence-icon-uploader" class="px-3.5 py-1.5 bg-ucu-blue hover:bg-ucu-blue-dark text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5 font-sans">
                <svg class="w-3.5 h-3.5 text-ucu-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Upload Icon</span>
              </label>
              <input type="file" id="pillar-evidence-icon-uploader" accept="image/*" class="hidden">
            </div>
          </div>

          <!-- Search Bar: Placed directly below Icon / Seal with exact full width -->
          <div class="relative w-full">
            <input type="text" id="evidence-search-input" value="${this.escape(this.searchQuery)}" placeholder="Search indicator code, title..." class="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue focus:bg-white font-sans">
            <svg class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>

          <!-- Evidence Cards Grid Container -->
          <div id="evidence-cards-container">
            ${this.renderEvidenceCardsHtml(filteredEvidence, currentEvidenceIcon)}
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Bind event listeners for Indicator Pillar section
   */
  bindEvents(container, parentFormEngine) {
    if (!container) return;

    const draft = cmsState.currentDraft || {};
    const pillarId = cmsState.activeSection.id || 'infrastructure';
    const pillar = INDICATOR_PILLARS.find(p => p.id === pillarId) || { id: pillarId, title: "Setting & Infrastructure", num: "01", img: "images/smart-eco-assets/setting_and_infrastructure.jpg" };

    // 1. Two-way data binding for textareas and text inputs
    container.querySelectorAll('[data-bind]').forEach(el => {
      el.oninput = () => {
        const key = el.dataset.bind;
        draft[key] = el.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(draft);
      };
    });

    // 2. Pillar Tabs Switcher
    container.querySelectorAll('[data-switch-pillar]').forEach(btn => {
      btn.onclick = () => {
        const targetPillar = btn.dataset.switchPillar;
        if (typeof window.cmsNavigateToSection === 'function') {
          window.cmsNavigateToSection('indicator', targetPillar, '2025');
        } else {
          const sidebarBtn = document.querySelector(`[data-nav-type="indicator"][data-nav-id="${targetPillar}"]`);
          if (sidebarBtn) sidebarBtn.click();
        }
      };
    });

    // 3. Pillar Thumbnail Uploader & Drag-and-Drop
    const thumbUploader = container.querySelector('#pillar-thumbnail-uploader');
    const thumbDropzone = container.querySelector('#pillar-thumb-dropzone');
    
    if (thumbUploader) {
      thumbUploader.onchange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const compressed = await compressAndEncodeImage(file, 1400, 800, 0.85);
          if (compressed) {
            draft.thumb_image = compressed;
            draft.thumbnailImg = compressed;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            if (parentFormEngine) parentFormEngine.render();
            previewBridge.sendLiveUpdate(draft);
          }
        }
      };
    }

    if (thumbDropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        thumbDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          thumbDropzone.classList.add('border-ucu-blue', 'ring-2', 'ring-ucu-blue/20');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        thumbDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          thumbDropzone.classList.remove('border-ucu-blue', 'ring-2', 'ring-ucu-blue/20');
        }, false);
      });

      thumbDropzone.addEventListener('drop', async (e) => {
        const dt = e.dataTransfer;
        const files = dt && dt.files;
        if (files && files.length > 0) {
          const file = files[0];
          const compressed = await compressAndEncodeImage(file, 1400, 800, 0.85);
          if (compressed) {
            draft.thumb_image = compressed;
            draft.thumbnailImg = compressed;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            if (parentFormEngine) parentFormEngine.render();
            previewBridge.sendLiveUpdate(draft);
          }
        }
      }, false);
    }

    // 5. Metric inputs sync
    container.querySelectorAll('[data-metric-field]').forEach(input => {
      const handler = () => {
        if (!Array.isArray(draft.metricsCard)) draft.metricsCard = [{}, {}, {}];
        if (!Array.isArray(draft.metrics)) draft.metrics = [{}, {}, {}];
        const idx = parseInt(input.dataset.metricIdx, 10);
        const field = input.dataset.metricField;
        
        if (!draft.metricsCard[idx]) draft.metricsCard[idx] = {};
        if (!draft.metrics[idx]) draft.metrics[idx] = {};

        draft.metricsCard[idx][field] = input.value;
        draft.metrics[idx][field] = input.value;

        if (field === 'title' || field === 'label') {
          draft.metricsCard[idx].title = input.value;
          draft.metricsCard[idx].label = input.value;
          draft.metrics[idx].title = input.value;
          draft.metrics[idx].label = input.value;
        }
        if (field === 'url' || field === 'evidenceId') {
          draft.metricsCard[idx].url = input.value;
          draft.metricsCard[idx].evidenceId = input.value;
          draft.metrics[idx].url = input.value;
          draft.metrics[idx].evidenceId = input.value;
        }

        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(draft);
      };
      input.oninput = handler;
      input.onchange = handler;
    });

    // 5B. Metric Cards Lucide Icon Picker
    container.querySelectorAll('[data-pick-indicator-metric-icon]').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.pickIndicatorMetricIcon, 10);
        if (!Array.isArray(draft.metricsCard)) draft.metricsCard = [{}, {}, {}];
        if (!Array.isArray(draft.metrics)) draft.metrics = [{}, {}, {}];
        if (!draft.metricsCard[idx]) draft.metricsCard[idx] = {};
        if (!draft.metrics[idx]) draft.metrics[idx] = {};

        const currentMetric = draft.metricsCard[idx] || {};
        
        lucideIconPicker.open({
          currentIcon: currentMetric.icon || 'award',
          onSelect: (chosenIcon) => {
            currentMetric.icon = chosenIcon;
            const defaultSvg = lucideIconPicker.getSvg(chosenIcon, 28, 2);
            currentMetric.svgIcon = defaultSvg;
            draft.metricsCard[idx].icon = chosenIcon;
            draft.metricsCard[idx].svgIcon = defaultSvg;
            draft.metrics[idx].icon = chosenIcon;
            draft.metrics[idx].svgIcon = defaultSvg;
            
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            previewBridge.sendLiveUpdate(draft);
            if (parentFormEngine) parentFormEngine.render();
          }
        });
      };
    });

    // 6. Pillar Default Evidence Icon & Seal Uploader
    const PILLAR_DEFAULT_ICONS = {
      infrastructure: "images/indicator-icons/infrastructure.png",
      energy: "images/indicator-icons/energy.png",
      waste: "images/indicator-icons/waste.png",
      water: "images/indicator-icons/water.png",
      transportation: "images/indicator-icons/transportation.png",
      education: "images/indicator-icons/education.png",
      digitalization: "images/indicator-icons/digitalization.png"
    };

    const evidenceIconUploader = container.querySelector('#pillar-evidence-icon-uploader');
    if (evidenceIconUploader) {
      evidenceIconUploader.onchange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const compressed = await compressAndEncodeImage(file, 400, 400, 0.85);
          if (compressed) {
            draft.evidence_thumb = compressed;
            draft.thumb_evidence = compressed;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            if (parentFormEngine) parentFormEngine.render();
            previewBridge.sendLiveUpdate(draft);
          }
        }
      };
    }

    // 7. Reset Pillar Evidence Icon & Seal
    const btnResetEvidenceIcon = container.querySelector('#btn-reset-evidence-icon');
    if (btnResetEvidenceIcon) {
      btnResetEvidenceIcon.onclick = async () => {
        const confirmed = typeof window.cmsConfirm === 'function'
          ? await window.cmsConfirm({
              title: "Reset Evidence Icon?",
              description: `Reset default evidence icon for ${pillar.title} back to official UI GreenMetric seal?`,
              icon: "🏷️",
              confirmText: "Reset to Default",
              confirmClass: "bg-amber-600 hover:bg-amber-500 text-white"
            })
          : confirm(`Reset default evidence icon for ${pillar.title} to default?`);

        if (!confirmed) return;

        draft.evidence_thumb = PILLAR_DEFAULT_ICONS[pillarId] || "images/smart-eco-assets/ui-green-seal.png";
        draft.thumb_evidence = PILLAR_DEFAULT_ICONS[pillarId] || "images/smart-eco-assets/ui-green-seal.png";
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        if (parentFormEngine) parentFormEngine.render();
        previewBridge.sendLiveUpdate(draft);
      };
    }

    // 8. Search input live filter
    const searchInput = container.querySelector('#evidence-search-input');
    if (searchInput) {
      searchInput.oninput = () => {
        this.searchQuery = searchInput.value.trim();
        this.updateEvidenceListView(container, parentFormEngine);
      };
    }

    // 9. Add Evidence Button
    const btnAdd = container.querySelector('#btn-add-evidence');
    if (btnAdd) {
      btnAdd.onclick = () => {
        const currentPillar = INDICATOR_PILLARS.find(p => p.id === cmsState.activeSection.id) || { num: "01", title: "Indicator" };
        const evList = Array.isArray(draft.evidences) ? draft.evidences : (draft.evidenceList || []);
        const defaultIcon = draft.evidence_thumb || draft.thumb_evidence || PILLAR_DEFAULT_ICONS[pillarId] || "images/smart-eco-assets/ui-green-seal.png";
        this.openEvidenceEditor({
          item: {
            codeID: `${currentPillar.num}.${evList.length + 1}`,
            id: `${currentPillar.num}_${evList.length + 1}`,
            title: '',
            badge: currentPillar.title,
            referenceId: currentPillar.num,
            src: `../evidence/${cmsState.activeSection.id}/new_evidence.html`,
            relatedSdgs: [],
            thumb_evidence: defaultIcon,
            img: defaultIcon
          },
          isNew: true,
          index: -1,
          parentFormEngine
        });
      };
    }

    // 10. Bind card actions
    this.bindEvidenceCardActions(container, parentFormEngine);
  }

  /**
   * Update evidence list view during search
   */
  updateEvidenceListView(container, parentFormEngine) {
    const listContainer = container.querySelector('#evidence-cards-container');
    if (!listContainer) return;

    const draft = cmsState.currentDraft || {};
    const pillarId = cmsState.activeSection.id || 'infrastructure';
    const PILLAR_DEFAULT_ICONS = {
      infrastructure: "images/indicator-icons/infrastructure.png",
      energy: "images/indicator-icons/energy.png",
      waste: "images/indicator-icons/waste.png",
      water: "images/indicator-icons/water.png",
      transportation: "images/indicator-icons/transportation.png",
      education: "images/indicator-icons/education.png",
      digitalization: "images/indicator-icons/digitalization.png"
    };
    const defaultEvidenceIcon = PILLAR_DEFAULT_ICONS[pillarId] || "images/smart-eco-assets/ui-green-seal.png";
    const currentEvidenceIcon = draft.evidence_thumb || draft.thumb_evidence || defaultEvidenceIcon;

    let rawList = Array.isArray(draft.evidences) ? draft.evidences : (Array.isArray(draft.evidenceList) ? draft.evidenceList : []);
    const evidenceList = this.sortEvidences(rawList);

    const filtered = evidenceList.map((item, originalIndex) => ({ ...item, originalIndex })).filter(item => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      const code = (item.codeID || item.id || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const badge = (item.badge || '').toLowerCase();
      return code.includes(q) || title.includes(q) || badge.includes(q);
    });

    listContainer.innerHTML = this.renderEvidenceCardsHtml(filtered, currentEvidenceIcon);
    this.bindEvidenceCardActions(container, parentFormEngine);
  }

  /**
   * Bind edit and delete actions on evidence cards
   */
  bindEvidenceCardActions(container, parentFormEngine) {
    const draft = cmsState.currentDraft || {};
    const list = Array.isArray(draft.evidences) ? draft.evidences : (Array.isArray(draft.evidenceList) ? draft.evidenceList : []);

    container.querySelectorAll('[data-evidence-edit]').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.evidenceEdit, 10);
        if (list && list[idx]) {
          this.openEvidenceEditor({
            item: list[idx],
            isNew: false,
            index: idx,
            parentFormEngine
          });
        }
      };
    });

    container.querySelectorAll('[data-evidence-delete]').forEach(btn => {
      btn.onclick = async () => {
        const idx = parseInt(btn.dataset.evidenceDelete, 10);
        if (list && list[idx]) {
          const targetItem = list[idx];
          const targetCode = targetItem.codeID || targetItem.id || 'Evidence Item';
          const confirmed = typeof window.cmsConfirm === 'function'
            ? await window.cmsConfirm({
                title: "Delete Evidence Item?",
                description: `Are you sure you want to remove ${targetCode} (${targetItem.title || 'Evidence Item'})?`,
                icon: "📋",
                confirmText: "Delete",
                confirmClass: "bg-red-600 hover:bg-red-500 text-white"
              })
            : confirm(`Delete evidence item ${targetCode}?`);

          if (!confirmed) return;

          let currentList = Array.isArray(draft.evidences) ? draft.evidences : (Array.isArray(draft.evidenceList) ? draft.evidenceList : []);
          currentList = [...currentList];
          if (idx >= 0 && idx < currentList.length) {
            currentList.splice(idx, 1);
          }

          const sortedList = this.sortEvidences(currentList);
          draft.evidences = sortedList;
          draft.evidenceList = sortedList;

          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          if (parentFormEngine) parentFormEngine.render();
          previewBridge.sendLiveUpdate(draft);
        }
      };
    });
  }

  /**
   * Dedicated Center Modal Editor for an Evidence Item
   */
  openEvidenceEditor({ item, isNew, index, parentFormEngine }) {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }

    const modalData = { ...item };
    if (!modalData.codeID && modalData.id) modalData.codeID = modalData.id.replace(/_/g, '.');
    if (!Array.isArray(modalData.relatedSdgs)) modalData.relatedSdgs = [];

    const modalEl = document.createElement('div');
    modalEl.id = 'evidence-modal-overlay';
    modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn';

    const renderModal = () => {
      modalEl.innerHTML = `
        <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn font-sans">
          
          <!-- Modal Header -->
          <div class="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs font-sans">
                ${isNew ? `
                  <svg class="w-4 h-4 text-ucu-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                ` : `
                  <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                `}
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 tracking-tight font-sans">${isNew ? 'Add Evidence Indicator' : 'Edit Evidence Indicator'}</h3>
                <p class="text-[11px] text-slate-400 font-sans">UI GreenMetric Evidence Criteria &amp; SDG Mapping</p>
              </div>
            </div>
            <button type="button" id="btn-close-evidence-modal" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs font-sans">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Modal Form Body -->
          <div class="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
            
            <!-- Code & Category Badge -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Indicator Code / ID *</label>
                <input type="text" id="ev-modal-id" value="${this.escape(modalData.codeID || modalData.id || '')}" placeholder="e.g. 1.3 or 3.4 (WS.2)" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-mono font-bold text-ucu-blue-dark">
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Category Badge *</label>
                <input type="text" id="ev-modal-badge" value="${this.escape(modalData.badge || '')}" placeholder="e.g. Setting and Infrastructure" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
              </div>
            </div>

            <!-- Evidence Title -->
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Evidence Criteria Title *</label>
              <textarea id="ev-modal-title" rows="2" placeholder="e.g. 1.3 Number of Campus Sites" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-bold leading-relaxed font-sans">${this.escape(modalData.title || '')}</textarea>
            </div>

            <!-- Content Source Link / Path -->
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Evidence HTML Source Path *</label>
              <input type="text" id="ev-modal-src" value="${this.escape(modalData.src || '')}" placeholder="e.g. ../evidence/infrastructure/1_3.html" class="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
            </div>

            <!-- 17 SDG Matrix Multi-Tag Selector -->
            <div class="pt-2">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-[10px] font-bold uppercase text-slate-500 font-sans">Aligned UN SDGs (${modalData.relatedSdgs.length} Selected)</label>
                <span class="text-[10px] text-slate-400 font-sans">Click SDG pills to toggle active status</span>
              </div>

              <div class="grid grid-cols-6 sm:grid-cols-9 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                ${Array.from({ length: 17 }, (_, i) => i + 1).map(num => {
                  const isSelected = modalData.relatedSdgs.includes(num);
                  const color = this.getSdgColor(num);
                  return `
                    <button type="button" data-toggle-sdg="${num}" class="h-9 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center relative font-sans ${isSelected ? 'text-white shadow-md scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}" style="${isSelected ? `background-color: ${color}; border-color: ${color};` : ''}" title="SDG ${num}: ${this.getSdgTitle(num)}">
                      ${num}
                      ${isSelected ? '<span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white text-ucu-blue-dark rounded-full text-[8px] flex items-center justify-center font-black shadow-xs">✓</span>' : ''}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button type="button" id="btn-cancel-evidence-modal" class="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans shadow-2xs">
              Cancel
            </button>
            <button type="button" id="btn-save-evidence-modal" class="px-4 py-1.5 bg-ucu-blue hover:bg-ucu-blue-dark text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer font-sans">
              <svg class="w-3.5 h-3.5 text-ucu-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              <span>Save Evidence Item</span>
            </button>
          </div>

        </div>
      `;

      // Wire Modal Internal Events
      modalEl.querySelector('#btn-close-evidence-modal').onclick = () => this.closeEvidenceModal();
      modalEl.querySelector('#btn-cancel-evidence-modal').onclick = () => this.closeEvidenceModal();

      // Field Changes
      modalEl.querySelector('#ev-modal-id').oninput = (e) => { 
        modalData.codeID = e.target.value;
        modalData.id = e.target.value.replace(/\./g, '_');
      };
      modalEl.querySelector('#ev-modal-badge').oninput = (e) => { modalData.badge = e.target.value; };
      modalEl.querySelector('#ev-modal-title').oninput = (e) => { modalData.title = e.target.value; };
      modalEl.querySelector('#ev-modal-src').oninput = (e) => { modalData.src = e.target.value; };

      // In-place Toggle SDG Buttons (Zero scroll jump)
      modalEl.querySelectorAll('[data-toggle-sdg]').forEach(btn => {
        btn.onclick = () => {
          const sdgNum = parseInt(btn.dataset.toggleSdg, 10);
          const pos = modalData.relatedSdgs.indexOf(sdgNum);
          if (pos > -1) {
            modalData.relatedSdgs.splice(pos, 1);
          } else {
            modalData.relatedSdgs.push(sdgNum);
            modalData.relatedSdgs.sort((a, b) => a - b);
          }
          renderModal();
        };
      });

      // Save Evidence Item
      modalEl.querySelector('#btn-save-evidence-modal').onclick = () => {
        if (!modalData.codeID && !modalData.id) {
          alert('Please enter an Indicator Code/ID.');
          return;
        }
        if (!modalData.title) {
          alert('Please enter a Criteria Title.');
          return;
        }

        const draft = cmsState.currentDraft || {};
        let currentList = Array.isArray(draft.evidences) ? draft.evidences : (Array.isArray(draft.evidenceList) ? draft.evidenceList : []);
        currentList = [...currentList];

        if (isNew) {
          currentList.push(modalData);
        } else if (index >= 0 && index < currentList.length) {
          currentList[index] = modalData;
        }

        const sortedList = this.sortEvidences(currentList);
        draft.evidences = sortedList;
        draft.evidenceList = sortedList;

        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        if (parentFormEngine) parentFormEngine.render();
        previewBridge.sendLiveUpdate(draft);
        this.closeEvidenceModal();
      };
    };

    renderModal();
    document.body.appendChild(modalEl);
    this.activeModal = modalEl;
  }

  /**
   * Close and cleanup center modal editor
   */
  closeEvidenceModal() {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
  }
}

export const indicatorsManager = new IndicatorsManager();
