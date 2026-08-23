// admin/js/modules/research-manager.js
// Modular Feature Manager for Academic Research Publications (CMS Studio)

import { cmsState } from '../cms-state.js';
import { previewBridge } from '../preview-bridge.js';

export const SDG_COLORS = {
  1: "#E5243B",
  2: "#DDA63A",
  3: "#4C9F38",
  4: "#C5192D",
  5: "#FF3A21",
  6: "#26BDE2",
  7: "#FCC30B",
  8: "#A21942",
  9: "#FD6925",
  10: "#DD1367",
  11: "#FD9D24",
  12: "#BF8B2E",
  13: "#3F7E44",
  14: "#0A97D9",
  15: "#56C02B",
  16: "#00689D",
  17: "#19486A"
};

if (typeof window !== 'undefined' && !window.UCU_SDG_COLORS) {
  window.UCU_SDG_COLORS = SDG_COLORS;
}

export class ResearchManager {
  constructor() {
    this.filterKeyword = '';
    this.filterSdg = 'all';
    this.activeModal = null;
  }

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
   * Format file size helper
   */
  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Render Academic Research CMS Management View
   */
  render(draft) {
    const researchList = Array.isArray(draft.researchList) ? draft.researchList : [];
    
    let displayList = researchList;
    if (this.filterKeyword.trim().length > 0) {
      const kw = this.filterKeyword.toLowerCase().trim();
      displayList = displayList.filter(r => {
        return (r.title || '').toLowerCase().includes(kw) ||
               (r.authors || '').toLowerCase().includes(kw) ||
               (r.abstract || '').toLowerCase().includes(kw) ||
               (r.keywords || []).some(k => (k || '').toLowerCase().includes(kw));
      });
    }

    if (this.filterSdg !== 'all') {
      const targetNum = parseInt(this.filterSdg, 10);
      displayList = displayList.filter(r => (r.sdgs || []).includes(targetNum));
    }

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        
        <!-- Header & Top Action -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Header Page</span>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">research.html</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Research Studio</h2>
          </div>

          <button type="button" id="btn-create-research" class="px-4 py-2 text-xs font-bold rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Research Paper</span>
          </button>
        </div>

        <!-- Section 1: Hero Banner -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 1</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              <span>Hero Banner</span>
            </h3>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Eyebrow Badge</label>
              <input type="text" data-bind="heroEyebrow" value="${this.escape(draft.heroEyebrow || 'Institutional Archive')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Main Headline</label>
              <input type="text" data-bind="heroHeadline" value="${this.escape(draft.heroHeadline || 'SDG Research')}" class="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Highlight Word / Accent</label>
              <input type="text" data-bind="heroHighlight" value="${this.escape(draft.heroHighlight || 'Archive.')}" class="w-full px-3 py-1.5 text-xs font-bold text-ucu-blue bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Hero Description Paragraph</label>
            <textarea data-bind="heroDescription" rows="2" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">${this.escape(draft.heroDescription || "An open-access archive of Urdaneta City University's academic contributions. Explore peer-reviewed publications, institutional studies, and localized research directly aligned with the United Nations' Sustainable Development Goals.")}</textarea>
          </div>
        </div>

        <!-- Section 2: Repository Filters & Publications Feed -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 2</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                <span>Publications Repository (${displayList.length} of ${researchList.length})</span>
              </h3>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase text-slate-500">SDG Filter:</span>
              <select id="research-sdg-filter" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue cursor-pointer">
                <option value="all" ${this.filterSdg === 'all' ? 'selected' : ''}>All 17 SDGs</option>
                ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(num => `
                  <option value="${num}" ${this.filterSdg === String(num) ? 'selected' : ''}>SDG ${num}</option>
                `).join('')}
              </select>
            </div>

            <div class="relative flex-1 sm:max-w-xs">
              <input type="text" id="research-search-input" value="${this.escape(this.filterKeyword)}" placeholder="Search title, author, keyword..." class="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 text-slate-700 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
              <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>

          <!-- Research Papers List -->
          ${displayList.length === 0 ? `
            <div class="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <p class="text-xs font-bold text-slate-600">No research publications found matching your filter.</p>
              <p class="text-[11px] text-slate-400 mt-1">Try selecting "All 17 SDGs" or click "Add Research Paper" above.</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${displayList.map((item) => {
                const globalIndex = researchList.indexOf(item);
                return this.renderPaperCard(item, globalIndex);
              }).join('')}
            </div>
          `}
        </div>

      </div>
    `;
  }

  /**
   * Render Paper Card in CMS matching public site aesthetic
   */
  renderPaperCard(item, index) {
    const sdgs = Array.isArray(item.sdgs) ? item.sdgs : [];
    const keywords = Array.isArray(item.keywords) ? item.keywords : [];
    const colors = window.UCU_SDG_COLORS || SDG_COLORS;
    const hasPdf = item.pdfLink && item.pdfLink !== '#' && item.pdfLink.trim().length > 0;
    const dateFormatted = item.date || (item.month ? `${item.month} ${item.year || '2025'}` : (item.year || '2025'));

    const sdgBadges = sdgs.map((sdgNum) => `
      <div class="flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-black shadow-2xs shrink-0" style="background-color: ${colors[sdgNum] || "#24305e"};" title="SDG ${sdgNum}">${sdgNum}</div>
    `).join("");

    const keywordPills = keywords.map((kw) => `
      <span class="text-[0.65rem] font-bold text-ucu-blue-dark bg-ucu-blue-dark/5 px-2.5 py-1 rounded-md border border-ucu-blue-dark/10 tracking-widest uppercase">${this.escape(kw)}</span>
    `).join("");

    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col space-y-4">
        
        <!-- Title & Sub-header -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="space-y-1.5 flex-1">
            <h4 class="text-base sm:text-lg font-black text-ucu-blue-dark leading-snug">
              ${this.escape(item.title || 'Untitled Research Publication')}
            </h4>
            
            <div class="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 font-sans">
              <span class="font-semibold text-slate-700 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                ${this.escape(item.authors || 'UCU Faculty / Researchers')}
              </span>
              <span class="text-slate-300">&bull;</span>
              <span class="font-medium text-slate-500 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${this.escape(dateFormatted)}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 self-start">
            <button type="button" data-research-action="edit" data-research-index="${index}" class="px-3 py-1.5 text-xs font-bold rounded-xl bg-ucu-blue text-white hover:bg-ucu-blue-dark transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer">
              <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Edit</span>
            </button>
            <button type="button" data-research-action="delete" data-research-index="${index}" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer" title="Delete Publication">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <!-- Abstract -->
        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 font-medium">
          ${this.escape(item.abstract || 'No abstract summary provided.')}
        </p>

        <!-- Keywords -->
        ${keywordPills ? `<div class="flex flex-wrap gap-1.5">${keywordPills}</div>` : ''}

        <!-- Bottom Footer (SDG Badges + PDF Status) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-auto">
          <div>
            <span class="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider block mb-1">SDG Alignment</span>
            <div class="flex flex-wrap gap-1.5">${sdgBadges}</div>
          </div>

          <div class="shrink-0 flex items-center gap-2">
            ${hasPdf ? `
              <div class="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold shadow-2xs">
                <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span class="truncate max-w-[160px]">${this.escape(item.pdfFileName || 'PDF Attached')}</span>
                <span class="text-[10px] text-emerald-600">✓</span>
              </div>
            ` : `
              <span class="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold">
                No PDF Attached
              </span>
            `}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Bind event listeners for Research section
   */
  bindEvents(container, parentFormEngine) {
    if (!container) return;

    // Two-way data bindings for Hero Banner
    container.querySelectorAll('[data-bind]').forEach(input => {
      input.addEventListener('input', (e) => {
        const field = e.target.getAttribute('data-bind');
        cmsState.currentDraft[field] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // Filter Listeners
    const searchInput = container.querySelector('#research-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterKeyword = e.target.value;
        parentFormEngine.render();
      });
    }

    const sdgSelect = container.querySelector('#research-sdg-filter');
    if (sdgSelect) {
      sdgSelect.addEventListener('change', (e) => {
        this.filterSdg = e.target.value;
        parentFormEngine.render();
      });
    }

    // Add Paper Button
    const btnCreate = container.querySelector('#btn-create-research');
    if (btnCreate) {
      btnCreate.addEventListener('click', async () => {
        const currentYear = String(cmsState.currentDraft.year || '2025');
        const newPaper = {
          title: "",
          authors: "",
          month: new Date().toLocaleDateString('en-US', { month: 'short' }),
          year: currentYear,
          date: `${new Date().toLocaleDateString('en-US', { month: 'short' })} ${currentYear}`,
          abstract: "",
          sdgs: [4],
          keywords: ["Sustainable Development", "Higher Education"],
          pdfLink: "",
          pdfFileName: "",
          pdfFileSize: ""
        };

        const result = await this.openResearchEditor({
          title: "Add New Research Publication",
          isNew: true,
          item: newPaper
        });

        if (result) {
          if (!Array.isArray(cmsState.currentDraft.researchList)) {
            cmsState.currentDraft.researchList = [];
          }
          cmsState.currentDraft.researchList.unshift(result);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    }

    // Edit Paper / Delete Paper Actions
    container.querySelectorAll('[data-research-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-research-action');
        const idx = parseInt(btn.getAttribute('data-research-index'), 10);
        const list = cmsState.currentDraft.researchList || [];
        const item = list[idx];
        if (!item) return;

        // Edit Action
        if (action === 'edit') {
          const updated = await this.openResearchEditor({
            title: `Edit Publication: ${item.title || 'Paper'}`,
            isNew: false,
            item: item
          });

          if (updated) {
            list[idx] = updated;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }

        // Delete Action
        else if (action === 'delete') {
          const confirmed = await window.cmsConfirm({
            title: "Delete Publication?",
            description: `Are you sure you want to permanently delete "${item.title || 'Untitled'}" from the research archive?`,
            icon: "trash",
            iconBg: "bg-red-500/20 text-red-400",
            confirmText: "Delete Paper",
            confirmClass: "bg-red-600 hover:bg-red-500 text-white"
          });

          if (confirmed) {
            list.splice(idx, 1);
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }
      });
    });
  }

  /**
   * Open Center Modal Dedicated Research Editor
   * @param {Object} options { title, isNew, item }
   * @returns {Promise<Object|null>}
   */
  openResearchEditor({ title, isNew, item }) {
    return new Promise((resolve) => {
      const data = JSON.parse(JSON.stringify(item));
      data.sdgs = Array.isArray(data.sdgs) ? data.sdgs : [4];
      data.keywords = Array.isArray(data.keywords) ? data.keywords : [];

      // Extract month and year if missing
      if (!data.year) {
        if (data.date) {
          const matchYear = data.date.match(/\b(20\d{2}|19\d{2})\b/);
          if (matchYear) data.year = matchYear[1];
          const matchMonth = data.date.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i);
          if (matchMonth) {
            data.month = matchMonth[1].slice(0, 3);
            data.month = data.month.charAt(0).toUpperCase() + data.month.slice(1).toLowerCase();
          }
        }
        if (!data.year) data.year = "2025";
      }
      if (!data.month) data.month = "";

      // Create modal DOM shell
      const modalEl = document.createElement('div');
      modalEl.id = 'research-editor-modal';
      modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-fadeIn';
      
      const syncFormState = () => {
        const titleInput = modalEl.querySelector('#rf-title');
        const authorsInput = modalEl.querySelector('#rf-authors');
        const monthSelect = modalEl.querySelector('#rf-month');
        const yearInput = modalEl.querySelector('#rf-year');
        const abstractInput = modalEl.querySelector('#rf-abstract');
        const keywordsInput = modalEl.querySelector('#rf-keywords');
        if (titleInput) data.title = titleInput.value;
        if (authorsInput) data.authors = authorsInput.value;
        if (monthSelect) data.month = monthSelect.value;
        if (yearInput) data.year = yearInput.value;
        if (abstractInput) data.abstract = abstractInput.value;
        if (keywordsInput) data.keywords = keywordsInput.value.split(',').map(k => k.trim()).filter(Boolean);
      };

      const renderModalContent = () => {
        const colors = window.UCU_SDG_COLORS || SDG_COLORS;
        const hasPdf = data.pdfLink && data.pdfLink !== '#' && data.pdfLink.trim().length > 0;

        modalEl.innerHTML = `
          <div class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            
            <!-- Modal Header -->
            <div class="px-6 py-4 bg-[#0d1020] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/30">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white leading-snug">${this.escape(title)}</h3>
                  <p class="text-[11px] text-slate-400">PDF document attachment with direct in-browser viewing</p>
                </div>
              </div>

              <button type="button" id="btn-close-research-modal" class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Modal Scrollable Body -->
            <div class="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50" id="research-modal-body">
              
              <!-- Paper Title -->
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Publication Title <span class="text-red-500">*</span>
                </label>
                <input type="text" id="rf-title" value="${this.escape(data.title || '')}" placeholder="e.g. Impact of Digital Health Interventions on Rural Education" class="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue text-slate-800">
              </div>

              <!-- Authors, Month & Year Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Author(s) / Research Team <span class="text-red-500">*</span></label>
                  <input type="text" id="rf-authors" value="${this.escape(data.authors || '')}" placeholder="e.g. Dr. Maria Santos, et al." class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold">
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Month</label>
                    <select id="rf-month" class="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold text-slate-700 cursor-pointer">
                      <option value="" ${!data.month ? 'selected' : ''}>None</option>
                      ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => `
                        <option value="${m}" ${data.month === m ? 'selected' : ''}>${m}</option>
                      `).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Year <span class="text-red-500">*</span></label>
                    <input type="text" id="rf-year" value="${this.escape(data.year || '2025')}" placeholder="2025" class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold text-slate-800">
                  </div>
                </div>
              </div>

              <!-- Narrative Abstract -->
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Research Abstract / Summary Excerpt</label>
                <textarea id="rf-abstract" rows="3" placeholder="Comprehensive summary of research findings, methodology, and SDG contributions..." class="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue leading-relaxed text-slate-800">${this.escape(data.abstract || '')}</textarea>
              </div>

              <!-- Aligned SDG Goals Multi-Select (1 to 17) -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-[10px] font-bold uppercase text-slate-500">Aligned SDG Goals</label>
                  <span class="text-[10px] font-semibold text-slate-400">${data.sdgs.length} Goal${data.sdgs.length === 1 ? '' : 's'} Selected</span>
                </div>
                
                <div class="flex flex-wrap gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl">
                  ${Array.from({ length: 17 }, (_, i) => i + 1).map(num => {
                    const isSelected = data.sdgs.includes(num);
                    const color = colors[num] || '#24305e';
                    return `
                      <button type="button" data-sdg-toggle="${num}" class="w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center justify-center ${isSelected ? 'text-white shadow-xs scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}" style="${isSelected ? `background-color: ${color}; border-color: ${color};` : ''}" title="SDG ${num} - ${window.SDG_METADATA?.[num]?.title || `Goal ${num}`}">
                        <span>${num}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Keywords / Research Tags -->
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Keywords / Subject Tags (Comma-separated)</label>
                <input type="text" id="rf-keywords" value="${this.escape(data.keywords.join(', '))}" placeholder="e.g. Adolescent Health, Digital Health, Inclusive Growth" class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-medium">
              </div>

              <!-- Strict PDF File Uploader -->
              <div class="space-y-2 pt-2 border-t border-slate-200">
                <div class="flex items-center justify-between">
                  <label class="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <span>Attached Research Document (PDF)</span>
                  </label>
                  ${hasPdf ? `<span class="text-[10px] text-emerald-600 font-bold">✓ PDF Ready</span>` : ''}
                </div>

                ${hasPdf ? `
                  <div class="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <div class="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-sm shrink-0 font-bold border border-red-100">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                      </div>
                      <div class="min-w-0 flex-1 space-y-0.5">
                        <h5 class="text-xs font-bold text-slate-800 truncate block" title="${this.escape(data.pdfFileName || 'research-paper.pdf')}">
                          ${this.escape(data.pdfFileName || 'research-paper.pdf')}
                        </h5>
                        <p class="text-[10px] text-slate-400 font-medium truncate">
                          ${data.pdfFileSize ? `Size: ${data.pdfFileSize} &bull; ` : ''}Direct PDF Viewer Enabled
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <label for="research-pdf-input" class="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 text-ucu-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                        <span>Replace</span>
                      </label>

                      <button type="button" id="btn-remove-pdf" class="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ` : `
                  <div id="pdf-dropzone" class="border-2 border-dashed border-slate-200 hover:border-ucu-blue bg-white rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                    <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    </div>
                    <div>
                      <span class="text-xs font-bold text-slate-800 block">Drag &amp; drop PDF document here, or click below</span>
                      <span class="text-[10px] text-slate-400">Strictly .PDF format supported</span>
                    </div>

                    <div class="pt-1">
                      <label for="research-pdf-input" class="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all">
                        <svg class="w-3.5 h-3.5 text-ucu-blue pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                        <span>Open File Explorer</span>
                      </label>
                    </div>
                  </div>
                `}

                <!-- Native Hidden File Input strictly for PDFs -->
                <input type="file" id="research-pdf-input" accept=".pdf,application/pdf" class="hidden">
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
              <button type="button" id="btn-cancel-research" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                Cancel
              </button>

              <button type="button" id="btn-save-research" class="px-5 py-2 rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer">
                <span>Save Publication</span>
              </button>
            </div>

          </div>
        `;

        // Bind PDF upload / drop listeners
        const fileInput = modalEl.querySelector('#research-pdf-input');
        const handlePdfUpload = (file) => {
          if (!file) return;
          
          // Strict PDF check
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
          if (!isPdf) {
            alert("⚠️ Invalid File Type:\nPlease select a PDF document (.pdf). Images and other formats are strictly not supported for academic research papers.");
            return;
          }

          syncFormState(); // Preserve typed title, authors, abstract, etc.

          // Instant Blob Object URL for local session & preview
          const blobUrl = URL.createObjectURL(file);
          data.pdfLink = blobUrl;
          data.pdfFileName = file.name;
          data.pdfFileSize = this.formatBytes(file.size);
          renderModalContent();
        };

        if (fileInput) {
          fileInput.onchange = (e) => {
            if (e.target.files && e.target.files.length > 0) {
              handlePdfUpload(e.target.files[0]);
              fileInput.value = '';
            }
          };
        }

        const dropzone = modalEl.querySelector('#pdf-dropzone');
        if (dropzone) {
          dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('border-ucu-blue', 'bg-blue-50/50');
          });
          dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('border-ucu-blue', 'bg-blue-50/50');
          });
          dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-ucu-blue', 'bg-blue-50/50');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handlePdfUpload(e.dataTransfer.files[0]);
            }
          });
        }

        const btnRemovePdf = modalEl.querySelector('#btn-remove-pdf');
        if (btnRemovePdf) {
          btnRemovePdf.onclick = () => {
            syncFormState(); // Preserve typed title, authors, abstract, etc.
            data.pdfLink = '';
            data.pdfFileName = '';
            data.pdfFileSize = '';
            renderModalContent();
          };
        }

        // SDG Toggle Buttons
        modalEl.querySelectorAll('[data-sdg-toggle]').forEach(btn => {
          btn.onclick = () => {
            syncFormState(); // Preserve typed title, authors, abstract, etc.
            const num = parseInt(btn.getAttribute('data-sdg-toggle'), 10);
            if (data.sdgs.includes(num)) {
              data.sdgs = data.sdgs.filter(n => n !== num);
            } else {
              data.sdgs.push(num);
              data.sdgs.sort((a, b) => a - b);
            }
            renderModalContent();
          };
        });

        // Close / Cancel
        const closeModal = (val) => {
          modalEl.remove();
          this.activeModal = null;
          resolve(val);
        };

        const btnClose = modalEl.querySelector('#btn-close-research-modal');
        if (btnClose) btnClose.onclick = () => closeModal(null);

        const btnCancel = modalEl.querySelector('#btn-cancel-research');
        if (btnCancel) btnCancel.onclick = () => closeModal(null);

        // Save
        const btnSave = modalEl.querySelector('#btn-save-research');
        if (btnSave) {
          btnSave.onclick = () => {
            const titleInput = modalEl.querySelector('#rf-title');
            const authorsInput = modalEl.querySelector('#rf-authors');
            const monthSelect = modalEl.querySelector('#rf-month');
            const yearInput = modalEl.querySelector('#rf-year');
            const abstractInput = modalEl.querySelector('#rf-abstract');
            const keywordsInput = modalEl.querySelector('#rf-keywords');

            if (!titleInput.value.trim()) {
              alert("Please enter a Publication Title.");
              titleInput.focus();
              return;
            }

            const month = monthSelect ? monthSelect.value : "";
            const year = yearInput && yearInput.value.trim() ? yearInput.value.trim() : "2025";

            data.title = titleInput.value.trim();
            data.authors = authorsInput ? authorsInput.value.trim() : "";
            data.month = month;
            data.year = year;
            data.date = month ? `${month} ${year}` : year;
            data.abstract = abstractInput ? abstractInput.value.trim() : "";
            
            if (keywordsInput) {
              data.keywords = keywordsInput.value.split(',').map(k => k.trim()).filter(Boolean);
            }

            if (data.sdgs.length === 0) {
              data.sdgs = [4]; // Default to SDG 4 Quality Education
            }

            closeModal(data);
          };
        }
      };

      renderModalContent();
      document.body.appendChild(modalEl);
      this.activeModal = modalEl;
    });
  }
}

export const researchManager = new ResearchManager();
