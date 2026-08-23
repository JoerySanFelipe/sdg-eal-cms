// admin/js/universal-block-editor.js
// Standalone Center-Modal Universal Block-Based Visual Editor for UCU SDG CMS Studio
// Features Multi-Modal Image Input: Native File Browse, Clipboard Paste (Ctrl+V), Drag & Drop, and Direct URL/Asset Path

import { compressAndEncodeImage, pickImageFileFromSystem } from './cms-state.js';
import { lucideIconPicker } from './lucide-icon-picker.js';

export class UniversalBlockEditor {
  constructor() {
    this.activeModal = null;
    this.currentData = null;
    this.config = null;
    this.resolvePromise = null;
    this.rejectPromise = null;
    this._hasGlobalPasteHandler = false;
    this._lastFocusedBlockIndex = null;
    window.universalBlockEditorInstance = this;
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
   * Resolve media image paths for Admin context
   */
  resolveAdminImageSrc(src) {
    if (!src) return '';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) return src;
    if (src.startsWith('../')) return src;
    if (src.startsWith('./')) return `../${src.slice(2)}`;
    if (src.startsWith('/')) return `..${src}`;
    return `../${src}`;
  }

  /**
   * Open the Center-Modal Universal Visual Block Editor
   */
  open(options = {}) {
    return new Promise((resolve) => {
      this.config = {
        title: options.title || "Edit Content",
        type: options.type || "announcement",
        sdgNum: options.sdgNum || null,
        item: JSON.parse(JSON.stringify(options.item || {})),
        isNew: options.isNew || false,
        showMetadata: options.showMetadata !== false,
        availableEvents: options.availableEvents || []
      };

      // Ensure data arrays exist
      if (!Array.isArray(this.config.item.blocks)) {
        this.config.item.blocks = [];
      }
      if (!Array.isArray(this.config.item.relatedSdgs)) {
        this.config.item.relatedSdgs = [];
      }
      if (!Array.isArray(this.config.item.eventIds)) {
        this.config.item.eventIds = this.config.item.eventId ? [this.config.item.eventId] : (Array.isArray(this.config.item.linkedEvents) ? this.config.item.linkedEvents : []);
      }

      this.currentData = this.config.item;
      this.resolvePromise = resolve;
      this._lastFocusedBlockIndex = null;

      this.renderModal();
    });
  }

  /**
   * Render the full-screen overlay & center modal container
   */
  renderModal() {
    // Remove any existing modal
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }

    const isSdgDrawer = this.config.type === 'sdg_drawer';
    const drawerNumber = this.config.item.drawerIndex || 1;

    const overlay = document.createElement('div');
    overlay.id = 'universal-block-editor-modal';
    overlay.className = 'fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto';
    overlay.innerHTML = `
      <div class="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-ucu-blue text-white font-black text-sm flex items-center justify-center shadow-inner font-sans">
              ${isSdgDrawer ? `#${drawerNumber}` : (this.config.type === 'announcement' ? `
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
              ` : (this.config.type === 'event' ? `
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ` : `
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              `))}
            </span>
            <div>
              <h2 class="text-base sm:text-lg font-black text-white leading-tight font-sans">
                ${isSdgDrawer ? 'Drawer Content' : this.escape(this.config.title)}
              </h2>
            </div>
          </div>
          <button type="button" id="ube-btn-close-top" class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-lg font-bold" title="Close Without Saving">&times;</button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 bg-slate-50/50" id="ube-modal-body">
          ${this.renderFormSections()}
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 shadow-lg">
          <div class="text-xs text-slate-500 font-medium font-sans">
            <span id="ube-block-count-badge" class="px-2.5 py-1 bg-slate-100 rounded-lg font-bold text-slate-700 font-sans">
              ${this.currentData.blocks.length} Content Block${this.currentData.blocks.length === 1 ? '' : 's'}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" id="ube-btn-cancel" class="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer font-sans">
              Cancel
            </button>
            <button type="button" id="ube-btn-save" class="px-6 py-2.5 text-xs font-bold text-white bg-ucu-blue hover:bg-ucu-blue-dark rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer font-sans">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Save &amp; Apply Changes</span>
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);
    this.activeModal = overlay;

    // Prevent background body scrolling
    document.body.classList.add('overflow-hidden');

    this.bindModalEvents();
    this.bindGlobalClipboardPaste();
  }

  /**
   * Render all form sections inside modal body
   */
  renderFormSections() {
    if (this.config.type === 'sdg_drawer') {
      return `
        ${this.renderSdgDrawerDetailsSection()}
        ${this.renderBlocksSection()}
      `;
    }
    return `
      ${this.config.showMetadata ? this.renderMetadataSection() : ''}
      ${this.renderBlocksSection()}
    `;
  }

  /**
   * Render SDG Drawer Details (Title)
   */
  renderSdgDrawerDetailsSection() {
    const item = this.currentData;

    return `
      <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-sans">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            <span>Drawer Details</span>
          </span>
          <span class="px-2.5 py-0.5 rounded-md bg-blue-50 text-ucu-blue text-[10px] font-bold uppercase tracking-wider border border-blue-100 font-sans">Drawer #${item.drawerIndex || 1}</span>
        </div>

        <div class="space-y-4">
          <!-- Drawer Title -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-1.5 font-sans">Drawer Title</label>
            <input type="text" id="ube-field-drawer-title" value="${this.escape(item.title || item.drawerTitle || 'Added New Drawer')}" placeholder="e.g. Added New Drawer, Community Outreach" class="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue text-slate-800 outline-none font-sans">
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Metadata (Title, Date, Category, Cover Image, SDGs, Flags)
   */
  renderMetadataSection() {
    const item = this.currentData;
    const coverSrc = this.resolveAdminImageSrc(item.img || item.src || '');
    const relatedSdgs = Array.isArray(item.relatedSdgs) ? item.relatedSdgs : [];

    return `
      <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
            <span>Primary Details &amp; Cover Card</span>
          </span>
          ${this.config.type === 'event' && item.isHighlights ? `
            <span class="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-red-100 text-red-900 border border-red-200 flex items-center gap-1">
              <svg class="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Highlighted Event</span>
            </span>
          ` : (this.config.type === 'announcement' && item.isFeatured ? `
            <span class="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
              <svg class="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Featured Article</span>
            </span>
          ` : '')}
        </div>

        <div class="space-y-4">
          <!-- Title / Headline -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              ${this.config.type === 'event' ? 'Event Title / Name' : 'Article Headline / Title'} <span class="text-red-500">*</span>
            </label>
            <input type="text" id="ube-field-title" value="${this.escape(item.title || '')}" placeholder="${this.config.type === 'event' ? 'Enter event title...' : 'Enter prominent news or event title...'}" class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ucu-blue font-bold text-slate-800">
          </div>

          <!-- Category & Date Grid -->
          ${this.config.type === 'event' ? `
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Month</label>
              <select id="ube-field-month" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ucu-blue font-semibold cursor-pointer">
                <option value="">(Select Month)</option>
                ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => {
                  const isSel = (item.month === m || (item.date && item.date.toLowerCase().includes(m.toLowerCase())));
                  return `<option value="${m}" ${isSel ? 'selected' : ''}>${m}</option>`;
                }).join('')}
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Day(s) (Optional)</label>
              <input type="text" id="ube-field-day" value="${this.escape(item.day || '')}" placeholder="e.g. 15-22 or 10" class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ucu-blue font-medium">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Year</label>
              <input type="text" id="ube-field-year" value="${this.escape(item.year || '2025')}" placeholder="2025" class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ucu-blue font-semibold">
            </div>
          </div>
          ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Category / Badge Tag</label>
              <input type="text" id="ube-field-category" value="${this.escape(item.category || item.badge || '')}" placeholder="e.g. Research & Linkages, Institutional" class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ucu-blue font-semibold">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Publication Date</label>
              <input type="text" id="ube-field-date" value="${this.escape(item.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))}" placeholder="e.g. March 15, 2025" class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ucu-blue font-medium">
            </div>
          </div>
          `}

          <!-- Summary / 1st Paragraph Excerpt -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Short Narrative Excerpt (Card Summary)</label>
            <textarea id="ube-field-desc" rows="2" placeholder="Brief summary displayed on the card feed before clicking modal..." class="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ucu-blue leading-relaxed">${this.escape(item.desc || '')}</textarea>
          </div>

          <!-- Cover Image Multi-Modal Zone -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-700">Cover Image / Thumbnail</label>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-slate-400">Press <kbd class="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-700">Ctrl+V</kbd> to paste photo</span>
                ${coverSrc ? `<span class="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Attached</span>` : ''}
              </div>
            </div>

            ${coverSrc ? `
              <div class="relative w-full h-44 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 group shadow-xs">
                <img src="${coverSrc}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-slate-900/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  
                  <div class="flex items-center gap-2">
                    <!-- Direct Native File Explorer Button -->
                    <label for="ube-cover-file-input" id="ube-btn-browse-cover" class="bg-ucu-blue hover:bg-ucu-blue-dark text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer select-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span>Replace via File Explorer</span>
                    </label>

                    <button type="button" id="ube-btn-remove-cover" class="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer select-none">
                      <span>Remove</span>
                    </button>
                  </div>

                  <span class="text-[10px] text-slate-300">or press <kbd class="px-1.5 py-0.5 bg-black/60 rounded font-mono font-bold text-white">Ctrl+V</kbd> to paste screenshot</span>
                </div>
              </div>
            ` : `
              <div class="space-y-2.5">
                <!-- Dropzone Box with Direct File Explorer Button -->
                <div id="ube-cover-dropzone" class="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 hover:border-ucu-blue hover:bg-blue-50/40 transition-all flex flex-col items-center justify-center gap-2">
                  <div class="w-10 h-10 rounded-full bg-blue-100 text-ucu-blue flex items-center justify-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  
                  <div>
                    <span class="text-xs font-bold text-slate-700 block">Drag &amp; drop photo here, or open File Explorer</span>
                    <span class="text-[10px] text-slate-400">WebP Auto-Compression &bull; High Resolution</span>
                  </div>

                  <!-- Direct Action Buttons -->
                  <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <label for="ube-cover-file-input" id="ube-btn-browse-cover" class="px-4 py-2 rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer select-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                      <span>Open File Explorer</span>
                    </label>

                    <button type="button" id="ube-btn-paste-cover" class="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs">
                      <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      <span>Paste Screenshot (Ctrl+V)</span>
                    </button>
                  </div>
                </div>
              </div>
            `}

            <!-- Hidden Cover File Input (Triggered by Label) -->
            <input type="file" id="ube-cover-file-input" accept="image/*" class="hidden">
          </div>

          <!-- Related SDGs Pills Selector -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">Related SDG Alignments (1–17)</label>
            <div class="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-300 rounded-xl" id="ube-sdgs-container">
              ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(num => {
                const active = relatedSdgs.includes(num);
                const sdgColors = window.UCU_SDG_COLORS || {
                  1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D",
                  5: "#FF3A21", 6: "#26BDE2", 7: "#FCC30B", 8: "#A21942",
                  9: "#FD6925", 10: "#DD1367", 11: "#FD9D24", 12: "#BF8B2E",
                  13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B", 16: "#00689D", 17: "#19486A"
                };
                const color = Array.isArray(sdgColors) ? (sdgColors[num - 1] || '#24305e') : (sdgColors[num] || '#24305e');
                const styleAttr = active ? `style="background-color: ${color}; color: white; border-color: ${color};"` : '';
                return `
                  <button type="button" data-ube-sdg="${num}" ${styleAttr} class="w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${active ? 'shadow-xs font-black scale-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-200'}">
                    ${num}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Content Blocks Builder Section
   */
  renderBlocksSection() {
    const blocks = this.currentData.blocks || [];

    return `
      <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        
        <!-- Blocks Header & Add Block Action Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              <span>Content Blocks &amp; Modal Body (${blocks.length})</span>
            </h3>
            <p class="text-[11px] text-slate-400">Add paragraphs, headings, evidence photos, impact metrics, charts, and tables</p>
          </div>

          <!-- Add Block Buttons -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button type="button" data-ube-add-block="paragraph" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-ucu-blue hover:text-white text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>
              <span>Text</span>
            </button>
            <button type="button" data-ube-add-block="heading" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-ucu-blue hover:text-white text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M12 6v12"/></svg>
              <span>Heading</span>
            </button>
            <button type="button" data-ube-add-block="metric_cards" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-ucu-blue hover:text-white text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              <span>Metrics</span>
            </button>
            <button type="button" data-ube-add-block="image" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-ucu-blue hover:text-white text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Photo</span>
            </button>
            <button type="button" data-ube-add-block="callout" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-ucu-blue hover:text-white text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Stat</span>
            </button>
            <button type="button" data-ube-add-block="chart" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-ucu-blue hover:text-white text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <span>Chart</span>
            </button>
            <button type="button" data-ube-add-block="table" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-ucu-blue hover:text-white text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18M9 3v18M15 3v18M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/></svg>
              <span>Table</span>
            </button>
            <button type="button" data-ube-add-block="event_card" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-ucu-blue hover:text-white text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Event</span>
            </button>
          </div>
        </div>

        <!-- Blocks Render List -->
        <div class="space-y-4" id="ube-blocks-list">
          ${blocks.length === 0 ? `
            <div class="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>
              </div>
              <p class="text-xs font-bold text-slate-600">No Content Blocks Added Yet</p>
              <p class="text-[11px] text-slate-400">Click any of the buttons above (Text, Heading, Metrics, Photo, Stat, Chart, Table, Event) to start adding content.</p>
            </div>
          ` : blocks.map((b, bIdx) => this.renderSingleBlock(b, bIdx, blocks.length)).join('')}
        </div>

      </div>
    `;
  }

  /**
   * Render single block card container with tools (Move Up, Down, Delete)
   */
  renderSingleBlock(block, bIdx, totalCount) {
    const typeNames = {
      paragraph: "Paragraph / Text",
      heading: "Section Heading",
      image: "Evidence & Activity Photo",
      callout: "Highlight Impact Stat",
      chart: "Data Visualization Chart",
      table: "Data Evidence Table",
      metric_cards: "Top Metric Cards",
      event_card: "Aligned Community Project"
    };

    const typeIcons = {
      paragraph: `<svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>`,
      heading: `<svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M12 6v12"/></svg>`,
      image: `<svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
      callout: `<svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      chart: `<svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
      table: `<svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18M9 3v18M15 3v18M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/></svg>`,
      metric_cards: `<svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
      event_card: `<svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
    };

    return `
      <div class="p-4 bg-slate-50/80 border-2 border-slate-200 rounded-xl space-y-3 shadow-2xs hover:border-slate-300 transition-all" data-block-card-index="${bIdx}">
        
        <!-- Block Card Top Bar -->
        <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
              ${bIdx + 1}
            </span>
            <span class="text-xs font-black text-slate-700 flex items-center gap-1.5">
              ${typeIcons[block.type] || ''}
              <span>${typeNames[block.type] || block.type}</span>
            </span>
          </div>
          
          <div class="flex items-center gap-1">
            <button type="button" data-ube-move-block="${bIdx}" data-ube-dir="up" class="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg bg-white hover:bg-slate-200 text-xs border border-slate-200 cursor-pointer shadow-2xs ${bIdx === 0 ? 'opacity-30 pointer-events-none' : ''}" title="Move Up">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button type="button" data-ube-move-block="${bIdx}" data-ube-dir="down" class="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg bg-white hover:bg-slate-200 text-xs border border-slate-200 cursor-pointer shadow-2xs ${bIdx === totalCount - 1 ? 'opacity-30 pointer-events-none' : ''}" title="Move Down">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button type="button" data-ube-delete-block="${bIdx}" class="p-1.5 text-red-500 hover:text-red-700 rounded-lg bg-red-50 hover:bg-red-100 text-xs border border-red-100 ml-1 cursor-pointer shadow-2xs" title="Delete Block">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <!-- Block Specific Input Fields -->
        ${this.renderBlockFields(block, bIdx)}

      </div>
    `;
  }

  /**
   * Render custom fields per block type
   */
  renderBlockFields(block, bIdx) {
    const type = block.type || 'paragraph';

    // 1. PARAGRAPH BLOCK
    if (type === 'paragraph') {
      return `
        <div class="space-y-2">
          <!-- Micro Formatting Toolbar -->
          <div class="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            <button type="button" data-ube-toolbar="bold" data-block-index="${bIdx}" class="px-2.5 py-1 text-xs font-black text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer" title="Bold">B</button>
            <button type="button" data-ube-toolbar="italic" data-block-index="${bIdx}" class="px-2.5 py-1 text-xs font-serif italic text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer" title="Italic">I</button>
            <button type="button" data-ube-toolbar="link" data-block-index="${bIdx}" class="px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer flex items-center gap-1" title="Insert Link">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
              <span>Link</span>
            </button>
            <button type="button" data-ube-toolbar="list" data-block-index="${bIdx}" class="px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer flex items-center gap-1" title="Bullet List">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              <span>List</span>
            </button>
          </div>
          <textarea data-ube-block-field="content" data-block-index="${bIdx}" rows="3" placeholder="Enter paragraph narrative here..." class="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue leading-relaxed">${this.escape(block.content || '')}</textarea>
        </div>
      `;
    }

    // 2. HEADING BLOCK
    if (type === 'heading') {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div class="sm:col-span-1">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Level</label>
            <select data-ube-block-field="level" data-block-index="${bIdx}" class="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg">
              <option value="h2" ${block.level === 'h2' ? 'selected' : ''}>H2 Section</option>
              <option value="h3" ${block.level === 'h3' ? 'selected' : ''}>H3 Sub-section</option>
            </select>
          </div>
          <div class="sm:col-span-3">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Heading Title</label>
            <input type="text" data-ube-block-field="title" data-block-index="${bIdx}" value="${this.escape(block.title || '')}" placeholder="e.g. Institutional Strategy &amp; Results" class="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg">
          </div>
        </div>
      `;
    }

    // 3. IMAGE BLOCK (Multi-Modal: File Browse, Clipboard Paste, Drag & Drop, URL Path)
    if (type === 'image') {
      const resolvedSrc = this.resolveAdminImageSrc(block.src || block.url || '');
      const inputId = `ube-block-file-input-${bIdx}`;

      return `
        <div class="space-y-3">
          <!-- Dropzone / Upload Box -->
          <div>
            ${resolvedSrc ? `
              <div class="relative w-full h-44 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 group shadow-xs">
                <img src="${resolvedSrc}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-slate-900/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  
                  <div class="flex items-center gap-2">
                    <!-- Direct Native File Explorer Button -->
                    <button type="button" data-ube-image-browse="${bIdx}" class="bg-ucu-blue hover:bg-ucu-blue-dark text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer select-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span>Replace via File Explorer</span>
                    </button>

                    <button type="button" data-ube-image-remove="${bIdx}" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md cursor-pointer select-none">
                      <span>Remove</span>
                    </button>
                  </div>

                  <span class="text-[10px] text-slate-300">or click this card &amp; press <kbd class="px-1.5 py-0.5 bg-black/60 rounded font-mono font-bold text-white">Ctrl+V</kbd> to paste</span>
                </div>
              </div>
            ` : `
              <div class="space-y-2">
                <div data-ube-image-dropzone="${bIdx}" class="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-white hover:border-ucu-blue hover:bg-blue-50/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-ucu-blue pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <span class="text-xs font-bold text-slate-700 pointer-events-none">Drag &amp; drop evidence photo here, or open File Explorer</span>
                  <span class="text-[10px] text-slate-400 pointer-events-none">Supports JPG, PNG, WEBP</span>

                  <div class="flex items-center gap-2 pt-1">
                    <label for="${inputId}" data-ube-image-browse="${bIdx}" class="px-3.5 py-1.5 rounded-lg bg-ucu-blue hover:bg-ucu-blue-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer select-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                      <span>Open File Explorer</span>
                    </label>

                    <button type="button" data-ube-image-paste="${bIdx}" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      <span>Paste (Ctrl+V)</span>
                    </button>
                  </div>
                </div>

                <!-- Hidden Native File Input (Triggered by Label) -->
                <input type="file" id="${inputId}" data-ube-image-input="${bIdx}" accept="image/*" class="hidden">
              </div>
            `}
          </div>

          <!-- Photo Caption -->
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descriptive Photo Caption</label>
            <input type="text" data-ube-block-field="caption" data-block-index="${bIdx}" value="${this.escape(block.caption || '')}" placeholder="Caption explaining the activity..." class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg">
          </div>
        </div>
      `;
    }

    // 4. CALLOUT BLOCK
    if (type === 'callout') {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Highlighted Metric / Value</label>
            <input type="text" data-ube-block-field="value" data-block-index="${bIdx}" value="${this.escape(block.value || '')}" placeholder="e.g. 100% or 39" class="w-full px-2.5 py-1.5 text-xs font-black text-ucu-blue-dark bg-white border border-slate-300 rounded-lg">
          </div>
          <div class="sm:col-span-2">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Metric Label</label>
            <input type="text" data-ube-block-field="label" data-block-index="${bIdx}" value="${this.escape(block.label || '')}" placeholder="e.g. Total Program Participants" class="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg">
          </div>
          <div class="sm:col-span-3">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea data-ube-block-field="description" data-block-index="${bIdx}" rows="2" placeholder="Explanation of verified outcome..." class="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg leading-relaxed">${this.escape(block.description || '')}</textarea>
          </div>
        </div>
      `;
    }

    // 5. CHART BLOCK
    if (type === 'chart') {
      const template = block.chartType || 'progress';
      const payload = Array.isArray(block.payload) ? block.payload : [];

      return `
        <div class="space-y-3 p-3 bg-white rounded-xl border border-slate-200">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chart Template</label>
              <select data-ube-block-field="chartType" data-block-index="${bIdx}" class="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg">
                <option value="progress" ${template === 'progress' ? 'selected' : ''}>Progress Bars</option>
                <option value="vertical" ${template === 'vertical' ? 'selected' : ''}>Vertical YoY Column</option>
                <option value="stacked" ${template === 'stacked' ? 'selected' : ''}>Stacked Distribution</option>
                <option value="donut" ${template === 'donut' ? 'selected' : ''}>Donut / Pie Chart</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chart Title</label>
              <input type="text" data-ube-block-field="title" data-block-index="${bIdx}" value="${this.escape(block.title || '')}" placeholder="e.g. Outreach Impact" class="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subtitle</label>
              <input type="text" data-ube-block-field="subtitle" data-block-index="${bIdx}" value="${this.escape(block.subtitle || '')}" placeholder="e.g. Year-over-Year Target" class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg">
            </div>
          </div>

          <!-- Chart Data Items Builder -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase text-slate-500">Data Points (${payload.length})</span>
              <button type="button" data-ube-add-chart-point="${bIdx}" class="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">+ Add Data Point</button>
            </div>
            <div class="space-y-1.5">
              ${payload.map((pt, pIdx) => {
                const defaultColors = ['#24305e', '#dc2626', '#facc15', '#10b981', '#f97316'];
                const ptColor = pt.color || defaultColors[pIdx % defaultColors.length];
                return `
                  <div class="flex items-center gap-2">
                    <input type="color" data-ube-chart-field="color" data-block-index="${bIdx}" data-point-index="${pIdx}" value="${ptColor}" class="w-8 h-8 p-0.5 bg-white border border-slate-200 rounded cursor-pointer shrink-0" title="Legend Color">
                    <input type="text" data-ube-chart-field="label" data-block-index="${bIdx}" data-point-index="${pIdx}" value="${this.escape(pt.label || '')}" placeholder="Label (e.g. 2024)" class="flex-1 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded">
                    <input type="number" data-ube-chart-field="percentage" data-block-index="${bIdx}" data-point-index="${pIdx}" value="${pt.percentage ?? pt.value ?? ''}" placeholder="Value / %" class="w-24 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-center">
                    <button type="button" data-ube-delete-chart-point="${pIdx}" data-block-index="${bIdx}" class="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 cursor-pointer" title="Delete Point">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // 6. TABLE BLOCK
    if (type === 'table') {
      const headers = Array.isArray(block.headers) && block.headers.length > 0 ? block.headers : ["Column 1", "Column 2"];
      const rows = Array.isArray(block.rows) ? block.rows : [];

      let tableHtml = `
        <div class="space-y-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          
          <div class="space-y-3">
            <!-- Headers and Column Controls -->
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="text-[10px] font-bold uppercase text-slate-500">Table Columns (${headers.length})</span>
              <button type="button" data-ube-add-table-col="${bIdx}" class="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-sm cursor-pointer">+ Add Column</button>
            </div>
            
            <div class="flex-1 grid gap-2" style="grid-template-columns: repeat(${headers.length}, minmax(0, 1fr));">
              ${headers.map((hdr, cIdx) => `
                <div class="relative flex flex-col group/col">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[9px] font-bold text-slate-400 uppercase">Col ${cIdx + 1}</span>
                    <button type="button" data-ube-delete-table-col="${bIdx}-${cIdx}" class="opacity-0 group-hover/col:opacity-100 text-red-400 hover:text-red-600 p-0.5 rounded cursor-pointer transition-opacity" title="Remove Column">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <input type="text" data-ube-table-header="${cIdx}" data-block-index="${bIdx}" value="${this.escape(hdr)}" placeholder="Header Name" class="w-full px-2 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-ucu-blue">
                </div>
              `).join('')}
            </div>
          </div>

          <div class="space-y-3 mt-6">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="text-[10px] font-bold uppercase text-slate-500">Row Entries (${rows.length})</span>
              <button type="button" data-ube-add-table-row="${bIdx}" class="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-ucu-blue text-white hover:bg-ucu-blue-dark shadow-sm cursor-pointer">+ Add Row</button>
            </div>
            
            <div class="space-y-3 overflow-x-auto pb-2">
      `;

      if (rows.length === 0) {
        tableHtml += `<div class="text-center p-4 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">No rows added yet. Click "+ Add Row" to start.</div>`;
      }

      rows.forEach((rowStr, rIdx) => {
        const cells = rowStr.split('|').map(c => c.trim());
        while (cells.length < headers.length) cells.push("");
        cells.length = headers.length;

        tableHtml += `
          <div class="flex items-start gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
            <div class="flex-1 grid gap-2" style="grid-template-columns: repeat(${headers.length}, minmax(0, 1fr));">
        `;
        
        cells.forEach((cellVal, cIdx) => {
          const isImg = typeof cellVal === 'string' && cellVal.length > 0 && (cellVal.endsWith('.jpg') || cellVal.endsWith('.png') || cellVal.endsWith('.webp') || cellVal.startsWith('images/') || cellVal.startsWith('data:image/'));
          
          tableHtml += `
              <div class="relative flex flex-col group/cell">
                <div class="relative flex items-stretch h-full">
          `;

          if (isImg) {
            const resolvedImg = cellVal.startsWith('data:image/') ? cellVal : this.resolveAdminImageSrc(cellVal);
            tableHtml += `
                  <!-- Hidden Textarea to preserve data model structure -->
                  <textarea rows="1" data-ube-table-cell="${rIdx}-${cIdx}" data-block-index="${bIdx}" class="hidden">${this.escape(cellVal)}</textarea>
                  
                  <div class="w-full min-w-[80px] h-14 rounded border border-slate-200 shadow-2xs overflow-hidden relative group resize-x">
                    <img src="${resolvedImg}" class="w-full h-full object-cover bg-slate-100">
                    <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-sm">
                      <label for="ube-cell-img-${bIdx}-${rIdx}-${cIdx}" class="p-1.5 bg-white/20 hover:bg-white/40 rounded text-white cursor-pointer" title="Replace Image">
                        <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      </label>
                      <button type="button" data-ube-remove-cell-img="${bIdx}-${rIdx}-${cIdx}" class="p-1.5 bg-red-500/80 hover:bg-red-500 rounded text-white cursor-pointer" title="Remove Image">
                        <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                    <!-- Small resize handle indicator -->
                    <div class="absolute right-0 bottom-0 w-2 h-2 bg-slate-400/50 cursor-col-resize pointer-events-none"></div>
                  </div>
                  <input type="file" id="ube-cell-img-${bIdx}-${rIdx}-${cIdx}" accept="image/*" class="hidden" data-ube-cell-image-upload="${bIdx}-${rIdx}-${cIdx}" data-block-index="${bIdx}">
            `;
          } else {
            tableHtml += `
                  <textarea rows="1" data-ube-table-cell="${rIdx}-${cIdx}" data-block-index="${bIdx}" class="w-full pl-2 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono resize-none focus:ring-2 focus:ring-ucu-blue leading-relaxed min-h-[34px]" placeholder="Data...">${this.escape(cellVal)}</textarea>
                  
                  <label for="ube-cell-img-${bIdx}-${rIdx}-${cIdx}" class="absolute right-1 top-1.5 p-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer opacity-75 hover:opacity-100 transition-opacity border border-slate-200" title="Insert Image Path via File Explorer">
                    <svg class="w-3.5 h-3.5 text-ucu-blue group-hover/btn:text-ucu-blue-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </label>
                  <input type="file" id="ube-cell-img-${bIdx}-${rIdx}-${cIdx}" accept="image/*" class="hidden" data-ube-cell-image-upload="${bIdx}-${rIdx}-${cIdx}" data-block-index="${bIdx}">
            `;
          }

          tableHtml += `
                </div>
              </div>
          `;
        });

        tableHtml += `
            </div>
            <div class="pt-4 shrink-0 flex flex-col items-center justify-center">
              <button type="button" data-ube-delete-table-row="${rIdx}" data-block-index="${bIdx}" class="p-1.5 rounded bg-white border border-slate-200 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer" title="Delete Row">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        `;
      });

      tableHtml += `
            </div>
          </div>
        </div>
      `;
      return tableHtml;
    }

    // 7. METRIC CARDS BLOCK (With Lucide Icon Selector)
    if (type === 'metric_cards' || type === 'metrics') {
      const metrics = Array.isArray(block.metrics) ? block.metrics : [];
      return `
        <div class="space-y-3 p-4 bg-white rounded-xl border border-slate-200">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <span class="text-[10px] font-bold uppercase text-slate-500">Top Metric Cards (${metrics.length})</span>
            <button type="button" data-ube-add-metric-card="${bIdx}" class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-ucu-blue text-white hover:bg-ucu-blue-dark cursor-pointer transition-colors">+ Add Metric Card</button>
          </div>
          <div class="space-y-2.5">
            ${metrics.map((m, mIdx) => {
              const iconKey = m.icon || m.iconName || '';
              const iconSvg = iconKey 
                ? lucideIconPicker.getSvg(iconKey, 18, 2)
                : (m.svgIcon && m.svgIcon.includes('<svg') ? m.svgIcon : lucideIconPicker.getSvg('award', 18, 2));

              return `
                <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                  <!-- Lucide Icon Picker Button -->
                  <button 
                    type="button" 
                    data-ube-pick-metric-icon="${bIdx}-${mIdx}" 
                    class="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:border-ucu-blue text-ucu-blue-dark hover:text-ucu-blue flex items-center justify-center shadow-2xs hover:shadow-xs transition-all cursor-pointer group shrink-0" 
                    title="Click to Choose Lucide Icon (${iconKey || 'award'})"
                  >
                    <div class="w-4 h-4 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform">
                      ${iconSvg}
                    </div>
                  </button>
                  <input type="text" data-ube-metric-field="value" data-block-index="${bIdx}" data-metric-index="${mIdx}" value="${this.escape(m.value || '')}" placeholder="Value (e.g. 1,920)" class="w-28 px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
                  <input type="text" data-ube-metric-field="label" data-block-index="${bIdx}" data-metric-index="${mIdx}" value="${this.escape(m.label || '')}" placeholder="Label (e.g. Beneficiaries)" class="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold">
                  <select data-ube-metric-field="theme" data-block-index="${bIdx}" data-metric-index="${mIdx}" class="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue cursor-pointer">
                    <option value="white" ${m.theme === 'white' ? 'selected' : ''}>White</option>
                    <option value="navy" ${(m.theme === 'navy' || m.theme === 'blue') ? 'selected' : ''}>Blue</option>
                    <option value="red" ${m.theme === 'red' ? 'selected' : ''}>Red</option>
                  </select>
                  <button type="button" data-ube-delete-metric-card="${bIdx}-${mIdx}" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete Metric Card">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // 8. EVENT CARD BLOCK (Searchable Combobox Dropdown)
    if (type === 'event_card' || type === 'event') {
      const allEvents = window.UCU_EVENTS || [];
      const activeSdg = this.config?.sdgNum || (this.config?.item?.relatedSdgs && this.config.item.relatedSdgs[0]) || (window.cmsState?.activeSection?.type === 'sdg' ? parseInt(window.cmsState.activeSection.id, 10) : null);
      
      // Filter events by SDG alignment if in SDG context
      const alignedEvents = activeSdg
        ? allEvents.filter(ev => Array.isArray(ev.relatedSdgs) && ev.relatedSdgs.includes(activeSdg))
        : allEvents;

      // If a block already has an eventId selected that isn't in alignedEvents, ensure it's still available
      if (block.eventId && !alignedEvents.some(e => e.id === block.eventId)) {
        const found = allEvents.find(e => e.id === block.eventId);
        if (found) alignedEvents.unshift(found);
      }

      const selectedEvent = allEvents.find(e => e.id === block.eventId);
      const selectedImg = selectedEvent ? this.resolveAdminImageSrc(selectedEvent.img) : '';

      return `
        <div class="p-4 bg-white rounded-xl border border-slate-200 space-y-3 relative" data-ube-event-block-container="${bIdx}">
          
          <!-- Hidden Field Bound for Data Sync -->
          <input type="hidden" data-ube-block-field="eventId" data-block-index="${bIdx}" value="${this.escape(block.eventId || '')}">

          <div class="flex items-center justify-between">
            <label class="block text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Aligned Community Engagement Project ${activeSdg ? `<span class="px-2 py-0.5 rounded bg-blue-100 text-ucu-blue-dark font-black text-[9px]">Filtered for SDG ${activeSdg}</span>` : ''}</span>
            </label>
            <span class="text-[10px] text-slate-400 font-bold">${alignedEvents.length} Aligned Project${alignedEvents.length === 1 ? '' : 's'}</span>
          </div>

          ${selectedEvent ? `
            <!-- Selected Event Card State -->
            <div class="p-3 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group/selected">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-14 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  ${selectedImg ? `<img src="${selectedImg}" alt="" class="w-full h-full object-cover">` : `<svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <h5 class="text-xs font-bold text-slate-800 truncate">${this.escape(selectedEvent.title)}</h5>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                    <span class="font-medium text-slate-600">${this.escape(selectedEvent.date || 'Project')}</span>
                    ${Array.isArray(selectedEvent.relatedSdgs) ? `<span class="text-[9px] px-1.5 py-0.2 bg-blue-100 text-ucu-blue-dark font-bold rounded">SDG ${selectedEvent.relatedSdgs.join(', ')}</span>` : ''}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button type="button" data-ube-event-toggle-change="${bIdx}" class="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span>Change</span>
                </button>
                <button type="button" data-ube-event-clear="${bIdx}" class="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Remove linked event">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          ` : `
            <!-- Searchable Combobox Trigger & Input -->
            <div class="relative group/combobox" data-ube-combobox-wrapper="${bIdx}">
              <div class="relative flex items-center">
                <svg class="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                  type="text" 
                  data-ube-combobox-search="${bIdx}" 
                  placeholder="Search and select aligned community event..." 
                  autocomplete="off"
                  class="w-full pl-9 pr-8 py-2.5 text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-ucu-blue text-slate-800 transition-all shadow-2xs"
                >
                <button type="button" data-ube-combobox-toggle-btn="${bIdx}" class="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>

              <!-- Floating Dropdown Search Results Panel -->
              <div data-ube-combobox-dropdown="${bIdx}" class="hidden absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                ${alignedEvents.length === 0 ? `
                  <div class="p-4 text-center text-xs text-slate-400">
                    No community engagement projects aligned with SDG ${activeSdg || ''} found.
                  </div>
                ` : alignedEvents.map(ev => {
                  const evImg = this.resolveAdminImageSrc(ev.img);
                  const sdgPills = Array.isArray(ev.relatedSdgs) ? `SDG ${ev.relatedSdgs.join(', ')}` : '';
                  return `
                    <div data-ube-select-event-item="${ev.id}" data-block-index="${bIdx}" class="p-2.5 hover:bg-blue-50/80 cursor-pointer transition-colors flex items-center gap-3 group/item">
                      <div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        ${evImg ? `<img src="${evImg}" alt="" class="w-full h-full object-cover">` : `<svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`}
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-xs font-bold text-slate-800 group-hover/item:text-ucu-blue truncate">${this.escape(ev.title)}</div>
                        <div class="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span>${this.escape(ev.date || 'Event')}</span>
                          ${sdgPills ? `<span class="px-1.5 py-0.2 bg-blue-100 text-ucu-blue-dark font-black rounded text-[9px]">${sdgPills}</span>` : ''}
                        </div>
                      </div>
                      <span class="text-[10px] font-bold text-ucu-blue opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">Select ↵</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `}
        </div>
      `;
    }

    return '';
  }

  /**
   * Synchronize all text inputs into currentData memory
   */
  syncCurrentInputValues() {
    if (!this.activeModal) return;

    const titleInput = this.activeModal.querySelector('#ube-field-title');
    if (titleInput) this.currentData.title = titleInput.value;

    const drawerTitleInput = this.activeModal.querySelector('#ube-field-drawer-title');
    if (drawerTitleInput) {
      this.currentData.title = drawerTitleInput.value;
      this.currentData.drawerTitle = drawerTitleInput.value;
    }

    const eventCheckboxes = this.activeModal.querySelectorAll('input[data-ube-drawer-event-id]');
    if (eventCheckboxes.length > 0) {
      const selected = [];
      eventCheckboxes.forEach(chk => {
        if (chk.checked) selected.push(chk.getAttribute('data-ube-drawer-event-id'));
      });
      this.currentData.eventIds = selected;
      this.currentData.linkedEvents = selected;
      this.currentData.eventId = selected[0] || '';
    }

    const catInput = this.activeModal.querySelector('#ube-field-category');
    if (catInput) {
      this.currentData.category = catInput.value;
      this.currentData.badge = catInput.value;
    }

    const dateInput = this.activeModal.querySelector('#ube-field-date');
    if (dateInput) this.currentData.date = dateInput.value;

    const monthSelect = this.activeModal.querySelector('#ube-field-month');
    const dayInput = this.activeModal.querySelector('#ube-field-day');
    const yearInput = this.activeModal.querySelector('#ube-field-year');

    if (monthSelect || yearInput) {
      if (monthSelect) this.currentData.month = monthSelect.value;
      if (dayInput) this.currentData.day = dayInput.value;
      if (yearInput) this.currentData.year = yearInput.value;

      if (monthSelect?.value && yearInput?.value) {
        const d = dayInput?.value?.trim() ? ` ${dayInput.value.trim()},` : '';
        this.currentData.date = `${monthSelect.value}${d} ${yearInput.value.trim()}`;
      }
    }

    const descInput = this.activeModal.querySelector('#ube-field-desc');
    if (descInput) this.currentData.desc = descInput.value;

    // Block fields
    this.activeModal.querySelectorAll('[data-ube-block-field]').forEach(input => {
      const bIdx = parseInt(input.getAttribute('data-block-index'), 10);
      const field = input.getAttribute('data-ube-block-field');
      if (this.currentData.blocks && this.currentData.blocks[bIdx]) {
        this.currentData.blocks[bIdx][field] = input.value;
      }
    });

    // Chart payload dynamic fields
    this.activeModal.querySelectorAll('[data-ube-chart-field]').forEach(input => {
      const bIdx = parseInt(input.getAttribute('data-block-index'), 10);
      const pIdx = parseInt(input.getAttribute('data-point-index'), 10);
      const field = input.getAttribute('data-ube-chart-field');
      if (this.currentData.blocks && this.currentData.blocks[bIdx] && Array.isArray(this.currentData.blocks[bIdx].payload)) {
        if (!this.currentData.blocks[bIdx].payload[pIdx]) {
          this.currentData.blocks[bIdx].payload[pIdx] = {};
        }
        
        const val = input.type === 'number' ? parseFloat(input.value) : input.value;
        this.currentData.blocks[bIdx].payload[pIdx][field] = val;
        
        // Keep value in sync with percentage for backwards compatibility
        if (field === 'percentage') {
          this.currentData.blocks[bIdx].payload[pIdx]['value'] = val;
        }
      }
    });

    // Metric cards dynamic fields
    this.activeModal.querySelectorAll('[data-ube-metric-field]').forEach(input => {
      const bIdx = parseInt(input.getAttribute('data-block-index'), 10);
      const mIdx = parseInt(input.getAttribute('data-metric-index'), 10);
      const field = input.getAttribute('data-ube-metric-field');
      if (this.currentData.blocks && this.currentData.blocks[bIdx] && Array.isArray(this.currentData.blocks[bIdx].metrics)) {
        if (!this.currentData.blocks[bIdx].metrics[mIdx]) {
          this.currentData.blocks[bIdx].metrics[mIdx] = {};
        }
        this.currentData.blocks[bIdx].metrics[mIdx][field] = input.value;
      }
    });

    // Table block dynamic headers and rows
    if (this.currentData.blocks) {
      this.currentData.blocks.forEach((block, bIdx) => {
        if (block.type === 'table') {
          // Reconstruct headers
          const headerInputs = this.activeModal.querySelectorAll(`input[data-ube-table-header][data-block-index="${bIdx}"]`);
          if (headerInputs.length > 0) {
            const headers = [];
            headerInputs.forEach(input => headers.push(input.value.trim() || `Column ${headers.length + 1}`));
            block.headers = headers;
          }

          // Reconstruct rows
          if (Array.isArray(block.rows)) {
            const numCols = block.headers?.length || 0;
            for (let rIdx = 0; rIdx < block.rows.length; rIdx++) {
              const rowCells = [];
              for (let cIdx = 0; cIdx < numCols; cIdx++) {
                const cellTextarea = this.activeModal.querySelector(`textarea[data-ube-table-cell="${rIdx}-${cIdx}"][data-block-index="${bIdx}"]`);
                rowCells.push(cellTextarea ? cellTextarea.value.trim() : "");
              }
              block.rows[rIdx] = rowCells.join(' | ');
            }
          }
        }
      });
    }
  }

  /**
   * Bind Global Clipboard Paste (Ctrl+V) listener
   */
  bindGlobalClipboardPaste() {
    if (this._hasGlobalPasteHandler) return;
    this._hasGlobalPasteHandler = true;

    window.addEventListener('paste', async (e) => {
      if (!this.activeModal) return;

      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const encoded = await compressAndEncodeImage(file);
            if (encoded) {
              this.syncCurrentInputValues();
              
              // If a photo block was specifically targeted, set it there, else set as Cover photo
              if (this._lastFocusedBlockIndex !== null && this.currentData.blocks[this._lastFocusedBlockIndex]) {
                this.currentData.blocks[this._lastFocusedBlockIndex].src = encoded;
              } else {
                this.currentData.img = encoded;
                if (this.config.type !== 'event' && this.config.type !== 'announcement') {
                  this.currentData.src = encoded;
                }
              }
              this.refreshModalBody();
            }
          }
          break;
        }
      }
    });
  }

  /**
   * Bind all interactive event listeners inside the modal
   */
  bindModalEvents() {
    if (!this.activeModal) return;

    // Close & Cancel with Confirmation
    const closeBtnTop = this.activeModal.querySelector('#ube-btn-close-top');
    const cancelBtn = this.activeModal.querySelector('#ube-btn-cancel');
    const saveBtn = this.activeModal.querySelector('#ube-btn-save');

    const handleClose = async () => {
      const confirmed = typeof window.cmsConfirm === 'function' ? await window.cmsConfirm({
        title: "Discard Unsaved Changes?",
        description: "Are you sure you want to close the editor? Any unsaved edits will be discarded.",
        icon: "⚠️",
        iconBg: "bg-amber-500/20 text-amber-500",
        confirmText: "Discard Changes",
        confirmClass: "bg-amber-600 hover:bg-amber-700 text-white font-bold"
      }) : confirm("Discard unsaved changes?");

      if (confirmed) {
        this.closeModal(null);
      }
    };

    if (closeBtnTop) closeBtnTop.onclick = handleClose;
    if (cancelBtn) cancelBtn.onclick = handleClose;

    // Save Action
    if (saveBtn) {
      saveBtn.onclick = () => {
        this.syncCurrentInputValues();
        this.saveAndSubmit();
      };
    }

    // Do NOT close on overlay backdrop click (only cancel/close button allowed)
    this.activeModal.onclick = (e) => {
      // Backdrop clicks are intentionally ignored to prevent accidental closing
    };

    // Close on Escape Key with confirmation
    if (!this._hasEscHandler) {
      this._hasEscHandler = true;
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeModal) {
          handleClose();
        }
      });
    }

    // --- COVER PHOTO UPLOAD & REPLACE EVENT LISTENERS ---
    const handleCoverFile = async (file) => {
      if (!file) return;
      const encoded = await compressAndEncodeImage(file);
      if (encoded) {
        this.syncCurrentInputValues();
        this.currentData.img = encoded;
        if (this.config.type !== 'event' && this.config.type !== 'announcement') {
          this.currentData.src = encoded;
        }
        this.refreshModalBody();
      }
    };

    const coverInput = this.activeModal.querySelector('#ube-cover-file-input');
    const coverReplaceInput = this.activeModal.querySelector('#ube-cover-replace-input');
    const btnBrowseCover = this.activeModal.querySelector('#ube-btn-browse-cover');
    const btnRemoveCover = this.activeModal.querySelector('#ube-btn-remove-cover');
    const coverDropzone = this.activeModal.querySelector('#ube-cover-dropzone');
    const btnPasteCover = this.activeModal.querySelector('#ube-btn-paste-cover');
    const coverUrlInput = this.activeModal.querySelector('#ube-cover-url-input');
    const btnApplyCoverUrl = this.activeModal.querySelector('#ube-btn-apply-cover-url');

    // Direct Native File Explorer Picker Button (Triggered natively via <label for="...">)
    // No JavaScript onclick required, the browser handles the click routing.

    // Bind onchange for file inputs
    if (coverInput) {
      coverInput.onchange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          await handleCoverFile(e.target.files[0]);
          coverInput.value = '';
        }
      };
    }

    if (coverReplaceInput) {
      coverReplaceInput.onchange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          await handleCoverFile(e.target.files[0]);
          coverReplaceInput.value = '';
        }
      };
    }

    // Drag-and-drop on cover dropzone
    if (coverDropzone) {
      coverDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        coverDropzone.classList.add('border-ucu-blue', 'bg-blue-100/60');
      });
      coverDropzone.addEventListener('dragleave', () => {
        coverDropzone.classList.remove('border-ucu-blue', 'bg-blue-100/60');
      });
      coverDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        coverDropzone.classList.remove('border-ucu-blue', 'bg-blue-100/60');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleCoverFile(e.dataTransfer.files[0]);
        }
      });
    }

    // Paste button helper (prompts user to press Ctrl+V or uses clipboard API if granted)
    if (btnPasteCover) {
      btnPasteCover.onclick = async () => {
        this._lastFocusedBlockIndex = null;
        if (navigator.clipboard && navigator.clipboard.read) {
          try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
              for (const type of item.types) {
                if (type.startsWith('image/')) {
                  const blob = await item.getType(type);
                  await handleCoverFile(blob);
                  return;
                }
              }
            }
          } catch (err) {
            // Permission denied or unsupported, show prompt
          }
        }
        alert("Clipboard Image Paste:\nPress Ctrl + V on your keyboard right now to paste your copied screenshot or photo!");
      };
    }

    // Apply manual URL / path
    if (btnApplyCoverUrl && coverUrlInput) {
      btnApplyCoverUrl.onclick = () => {
        const val = coverUrlInput.value.trim();
        if (val) {
          this.syncCurrentInputValues();
          this.currentData.img = val;
          this.currentData.src = val;
          this.refreshModalBody();
        }
      };
    }

    // Remove cover photo button
    if (btnRemoveCover) {
      btnRemoveCover.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.syncCurrentInputValues();
        this.currentData.img = '';
        this.currentData.src = '';
        this.refreshModalBody();
      };
    }

    // Related SDGs Pills Multi-Select
    this.activeModal.querySelectorAll('[data-ube-sdg]').forEach(btn => {
      btn.onclick = () => {
        this.syncCurrentInputValues();
        const num = parseInt(btn.getAttribute('data-ube-sdg'), 10);
        if (!Array.isArray(this.currentData.relatedSdgs)) {
          this.currentData.relatedSdgs = [];
        }
        const sIndex = this.currentData.relatedSdgs.indexOf(num);
        if (sIndex > -1) {
          this.currentData.relatedSdgs.splice(sIndex, 1);
        } else {
          this.currentData.relatedSdgs.push(num);
          this.currentData.relatedSdgs.sort((a, b) => a - b);
        }
        this.refreshModalBody();
      };
    });

    // --- IMAGE BLOCK FILE INPUT LISTENERS (Multi-Modal) ---
    this.activeModal.querySelectorAll('input[data-ube-image-input]').forEach(fileInput => {
      const bIdx = parseInt(fileInput.getAttribute('data-ube-image-input'), 10);

      // File selection change handler
      fileInput.onchange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const encoded = await compressAndEncodeImage(file);
          if (encoded && this.currentData.blocks[bIdx]) {
            this.syncCurrentInputValues();
            this.currentData.blocks[bIdx].src = encoded;
            this.refreshModalBody();
          }
          fileInput.value = '';
        }
      };

      // Drag-and-drop on image block dropzone
      const dropzone = this.activeModal.querySelector(`[data-ube-image-dropzone="${bIdx}"]`);
      if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('border-ucu-blue', 'bg-blue-100/60');
        });
        dropzone.addEventListener('dragleave', () => {
          dropzone.classList.remove('border-ucu-blue', 'bg-blue-100/60');
        });
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-ucu-blue', 'bg-blue-100/60');
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const applyDrop = async () => {
              const enc = await compressAndEncodeImage(e.dataTransfer.files[0]);
              if (enc && this.currentData.blocks[bIdx]) {
                this.syncCurrentInputValues();
                this.currentData.blocks[bIdx].src = enc;
                this.refreshModalBody();
              }
            };
            applyDrop();
          }
        });
      }
    });

    // Image Block Direct File Explorer Button (Triggered natively via <label for="...">)
    // No JS onclick required.

    // Content Block Image File Input Change Listener (Handle the selection)
    this.activeModal.querySelectorAll('[data-ube-image-input]').forEach(input => {
      input.onchange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const bIdx = parseInt(input.getAttribute('data-ube-image-input'), 10);
          const encoded = await compressAndEncodeImage(e.target.files[0]);
          if (encoded && this.currentData.blocks[bIdx]) {
            this.syncCurrentInputValues();
            this.currentData.blocks[bIdx].src = encoded;
            this.refreshModalBody();
          }
          input.value = ''; // Reset input
        }
      };
    });

    // Table Cell Image Upload Listeners
    this.activeModal.querySelectorAll('input[data-ube-cell-image-upload]').forEach(input => {
      input.onchange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const ids = input.getAttribute('data-ube-cell-image-upload').split('-');
          const bIdx = parseInt(ids[0], 10);
          const rIdx = parseInt(ids[1], 10);
          const cIdx = parseInt(ids[2], 10);
          const encoded = await compressAndEncodeImage(e.target.files[0]);
          if (encoded && this.currentData.blocks[bIdx]) {
            this.syncCurrentInputValues();
            const block = this.currentData.blocks[bIdx];
            if (block.rows && block.rows[rIdx]) {
              const cells = block.rows[rIdx].split('|').map(c => c.trim());
              cells[cIdx] = encoded;
              block.rows[rIdx] = cells.join(' | ');
              this.refreshModalBody();
            }
          }
          input.value = '';
        }
      };
    });

    // Image Block Paste Button
    this.activeModal.querySelectorAll('[data-ube-image-paste]').forEach(btn => {
      btn.onclick = async () => {
        const bIdx = parseInt(btn.getAttribute('data-ube-image-paste'), 10);
        this._lastFocusedBlockIndex = bIdx;
        if (navigator.clipboard && navigator.clipboard.read) {
          try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
              for (const type of item.types) {
                if (type.startsWith('image/')) {
                  const blob = await item.getType(type);
                  const enc = await compressAndEncodeImage(blob);
                  if (enc && this.currentData.blocks[bIdx]) {
                    this.syncCurrentInputValues();
                    this.currentData.blocks[bIdx].src = enc;
                    this.refreshModalBody();
                    return;
                  }
                }
              }
            }
          } catch (err) {}
        }
        alert("Clipboard Image Paste:\nPress Ctrl + V on your keyboard right now to paste your screenshot into this photo block!");
      };
    });

    // Image block remove buttons
    this.activeModal.querySelectorAll('[data-ube-image-remove]').forEach(btn => {
      const bIdx = parseInt(btn.getAttribute('data-ube-image-remove'), 10);
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentData.blocks[bIdx]) {
          this.syncCurrentInputValues();
          this.currentData.blocks[bIdx].src = '';
          this.refreshModalBody();
        }
      };
    });

    // Track focused block for clipboard pasting
    this.activeModal.querySelectorAll('[data-block-card-index]').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-block-card-index'), 10);
        this._lastFocusedBlockIndex = idx;
      });
    });

    // --- SEARCHABLE COMBOBOX EVENT PICKER LISTENERS ---
    this.activeModal.querySelectorAll('[data-ube-combobox-wrapper]').forEach(wrapper => {
      const bIdx = parseInt(wrapper.getAttribute('data-ube-combobox-wrapper'), 10);
      const searchInp = wrapper.querySelector(`[data-ube-combobox-search="${bIdx}"]`);
      const dropdown = wrapper.querySelector(`[data-ube-combobox-dropdown="${bIdx}"]`);
      const toggleBtn = wrapper.querySelector(`[data-ube-combobox-toggle-btn="${bIdx}"]`);

      if (!searchInp || !dropdown) return;

      const openDropdown = () => {
        dropdown.classList.remove('hidden');
      };

      searchInp.addEventListener('focus', openDropdown);
      searchInp.addEventListener('click', openDropdown);

      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('hidden');
        });
      }

      // Live search input filtering
      searchInp.addEventListener('input', (e) => {
        openDropdown();
        const query = e.target.value.toLowerCase().trim();
        const items = dropdown.querySelectorAll('[data-ube-select-event-item]');
        let visibleCount = 0;

        items.forEach(item => {
          const text = item.textContent.toLowerCase();
          if (!query || text.includes(query)) {
            item.classList.remove('hidden');
            visibleCount++;
          } else {
            item.classList.add('hidden');
          }
        });

        let noMatchEl = dropdown.querySelector('.ube-no-match');
        if (visibleCount === 0) {
          if (!noMatchEl) {
            noMatchEl = document.createElement('div');
            noMatchEl.className = 'ube-no-match p-4 text-center text-xs text-slate-400';
            dropdown.appendChild(noMatchEl);
          }
          noMatchEl.textContent = `No aligned events matching "${query}"`;
          noMatchEl.classList.remove('hidden');
        } else if (noMatchEl) {
          noMatchEl.classList.add('hidden');
        }
      });

      // Item selection
      dropdown.querySelectorAll('[data-ube-select-event-item]').forEach(item => {
        item.addEventListener('click', () => {
          const eventId = item.getAttribute('data-ube-select-event-item');
          this.syncCurrentInputValues();
          if (this.currentData.blocks && this.currentData.blocks[bIdx]) {
            this.currentData.blocks[bIdx].eventId = eventId;
            this.refreshModalBody();
          }
        });
      });
    });

    // Change selected event (re-opens search)
    this.activeModal.querySelectorAll('[data-ube-event-toggle-change]').forEach(btn => {
      btn.addEventListener('click', () => {
        const bIdx = parseInt(btn.getAttribute('data-ube-event-toggle-change'), 10);
        this.syncCurrentInputValues();
        if (this.currentData.blocks && this.currentData.blocks[bIdx]) {
          this.currentData.blocks[bIdx].eventId = '';
          this.refreshModalBody();
        }
      });
    });

    // Clear selected event
    this.activeModal.querySelectorAll('[data-ube-event-clear]').forEach(btn => {
      btn.addEventListener('click', () => {
        const bIdx = parseInt(btn.getAttribute('data-ube-event-clear'), 10);
        this.syncCurrentInputValues();
        if (this.currentData.blocks && this.currentData.blocks[bIdx]) {
          this.currentData.blocks[bIdx].eventId = '';
          this.refreshModalBody();
        }
      });
    });

    // + Add Block Action Listeners
    this.activeModal.querySelectorAll('[data-ube-add-block]').forEach(btn => {
      btn.onclick = () => {
        this.syncCurrentInputValues();
        const bType = btn.getAttribute('data-ube-add-block');
        this.addNewBlock(bType);
      };
    });

    // Block Reorder & Delete Listeners
    this.activeModal.querySelectorAll('[data-ube-move-block]').forEach(btn => {
      btn.onclick = () => {
        this.syncCurrentInputValues();
        const bIdx = parseInt(btn.getAttribute('data-ube-move-block'), 10);
        const dir = btn.getAttribute('data-ube-dir');
        this.moveBlock(bIdx, dir);
      };
    });

    this.activeModal.querySelectorAll('[data-ube-delete-block]').forEach(btn => {
      btn.onclick = async () => {
        const bIdx = parseInt(btn.getAttribute('data-ube-delete-block'), 10);
        const block = this.currentData.blocks?.[bIdx];
        const typeLabels = {
          paragraph: "Text Paragraph",
          heading: "Section Heading",
          image: "Evidence Photo",
          callout: "Highlight Metric",
          chart: "Data Chart",
          table: "Evidence Table",
          metric_cards: "Metric Cards Grid",
          event_card: "Community Project Card"
        };
        const bLabel = block ? (typeLabels[block.type] || block.type) : "Block";

        const confirmed = typeof window.cmsConfirm === 'function' ? await window.cmsConfirm({
          title: "Delete Content Block?",
          description: `Are you sure you want to remove this ${bLabel} block? This cannot be undone.`,
          icon: "🗑️",
          iconBg: "bg-red-500/20 text-red-500",
          confirmText: "Delete Block",
          confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold"
        }) : confirm(`Delete this ${bLabel} block?`);

        if (confirmed) {
          this.syncCurrentInputValues();
          this.deleteBlock(bIdx);
        }
      };
    });

    // Paragraph Toolbar Buttons (Bold, Italic, Link, List)
    this.activeModal.querySelectorAll('[data-ube-toolbar]').forEach(btn => {
      btn.onclick = () => {
        const action = btn.getAttribute('data-ube-toolbar');
        const bIdx = parseInt(btn.getAttribute('data-block-index'), 10);
        const textarea = this.activeModal.querySelector(`textarea[data-ube-block-field="content"][data-block-index="${bIdx}"]`);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);
        let replacement = '';

        if (action === 'bold') {
          replacement = `**${selected || 'bold text'}**`;
        } else if (action === 'italic') {
          replacement = `*${selected || 'italic text'}*`;
        } else if (action === 'link') {
          replacement = `[${selected || 'link text'}](https://...)`;
        } else if (action === 'list') {
          replacement = `\n- ${selected || 'list item'}`;
        }

        textarea.value = text.substring(0, start) + replacement + text.substring(end);
        if (this.currentData.blocks[bIdx]) {
          this.currentData.blocks[bIdx].content = textarea.value;
        }
        textarea.focus();
      };
    });

    // Chart Item Listeners
    this.activeModal.querySelectorAll('[data-ube-add-chart-point]').forEach(btn => {
      btn.onclick = () => {
        this.syncCurrentInputValues();
        const bIdx = parseInt(btn.getAttribute('data-ube-add-chart-point'), 10);
        if (this.currentData.blocks[bIdx]) {
          if (!Array.isArray(this.currentData.blocks[bIdx].payload)) {
            this.currentData.blocks[bIdx].payload = [];
          }
          this.currentData.blocks[bIdx].payload.push({ label: "New Metric", percentage: 50, value: 50 });
          this.refreshModalBody();
        }
      };
    });

    this.activeModal.querySelectorAll('[data-ube-delete-chart-point]').forEach(btn => {
      btn.onclick = async () => {
        const pIdx = parseInt(btn.getAttribute('data-ube-delete-chart-point'), 10);
        const bIdx = parseInt(btn.getAttribute('data-block-index'), 10);
        const item = this.currentData.blocks?.[bIdx]?.payload?.[pIdx];
        const pLabel = item?.label || `Point #${pIdx + 1}`;

        const confirmed = typeof window.cmsConfirm === 'function' ? await window.cmsConfirm({
          title: "Delete Chart Metric?",
          description: `Are you sure you want to delete "${pLabel}"?`,
          icon: "🗑️",
          iconBg: "bg-red-500/20 text-red-500",
          confirmText: "Delete",
          confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold"
        }) : confirm(`Delete "${pLabel}"?`);

        if (confirmed) {
          this.syncCurrentInputValues();
          if (this.currentData.blocks[bIdx] && Array.isArray(this.currentData.blocks[bIdx].payload)) {
            this.currentData.blocks[bIdx].payload.splice(pIdx, 1);
            this.refreshModalBody();
          }
        }
      };
    });

    // Table Column Listeners
    this.activeModal.querySelectorAll('[data-ube-add-table-col]').forEach(btn => {
      btn.onclick = () => {
        this.syncCurrentInputValues();
        const bIdx = parseInt(btn.getAttribute('data-ube-add-table-col'), 10);
        if (this.currentData.blocks[bIdx]) {
          if (!Array.isArray(this.currentData.blocks[bIdx].headers)) {
            this.currentData.blocks[bIdx].headers = ["Column 1", "Column 2"];
          }
          this.currentData.blocks[bIdx].headers.push(`Column ${this.currentData.blocks[bIdx].headers.length + 1}`);
          
          if (Array.isArray(this.currentData.blocks[bIdx].rows)) {
            for (let i = 0; i < this.currentData.blocks[bIdx].rows.length; i++) {
               const cells = this.currentData.blocks[bIdx].rows[i].split('|').map(c => c.trim());
               cells.push("");
               this.currentData.blocks[bIdx].rows[i] = cells.join(' | ');
            }
          }
          this.refreshModalBody();
        }
      };
    });

    this.activeModal.querySelectorAll('[data-ube-delete-table-col]').forEach(btn => {
      btn.onclick = async () => {
        const [bIdx, cIdx] = btn.getAttribute('data-ube-delete-table-col').split('-').map(Number);
        const colName = this.currentData.blocks?.[bIdx]?.headers?.[cIdx] || `Column ${cIdx + 1}`;

        const confirmed = typeof window.cmsConfirm === 'function' ? await window.cmsConfirm({
          title: "Delete Table Column?",
          description: `Are you sure you want to delete "${colName}" and its data across all rows?`,
          icon: "🗑️",
          iconBg: "bg-red-500/20 text-red-500",
          confirmText: "Delete Column",
          confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold"
        }) : confirm(`Delete "${colName}"?`);

        if (confirmed) {
          this.syncCurrentInputValues();
          if (this.currentData.blocks[bIdx] && Array.isArray(this.currentData.blocks[bIdx].headers)) {
            this.currentData.blocks[bIdx].headers.splice(cIdx, 1);
            
            if (Array.isArray(this.currentData.blocks[bIdx].rows)) {
              for (let i = 0; i < this.currentData.blocks[bIdx].rows.length; i++) {
                 const cells = this.currentData.blocks[bIdx].rows[i].split('|').map(c => c.trim());
                 if (cells.length > cIdx) {
                   cells.splice(cIdx, 1);
                 }
                 this.currentData.blocks[bIdx].rows[i] = cells.join(' | ');
              }
            }
            this.refreshModalBody();
          }
        }
      };
    });

    // Table Cell Image Remove Listener
    this.activeModal.querySelectorAll('[data-ube-remove-cell-img]').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.syncCurrentInputValues();
        const [bIdx, rIdx, cIdx] = btn.getAttribute('data-ube-remove-cell-img').split('-').map(Number);
        const block = this.currentData.blocks[bIdx];
        if (block && Array.isArray(block.rows) && block.rows[rIdx]) {
           const cells = block.rows[rIdx].split('|').map(c => c.trim());
           cells[cIdx] = "";
           block.rows[rIdx] = cells.join(' | ');
           this.refreshModalBody();
        }
      };
    });

    // Table Row Listeners
    this.activeModal.querySelectorAll('[data-ube-add-table-row]').forEach(btn => {
      btn.onclick = () => {
        this.syncCurrentInputValues();
        const bIdx = parseInt(btn.getAttribute('data-ube-add-table-row'), 10);
        if (this.currentData.blocks[bIdx]) {
          if (!Array.isArray(this.currentData.blocks[bIdx].rows)) {
            this.currentData.blocks[bIdx].rows = [];
          }
          this.currentData.blocks[bIdx].rows.push("Item Name | Description text | Verified 2025");
          this.refreshModalBody();
        }
      };
    });

    this.activeModal.querySelectorAll('[data-ube-delete-table-row]').forEach(btn => {
      btn.onclick = async () => {
        const rIdx = parseInt(btn.getAttribute('data-ube-delete-table-row'), 10);
        const bIdx = parseInt(btn.getAttribute('data-block-index'), 10);

        const confirmed = typeof window.cmsConfirm === 'function' ? await window.cmsConfirm({
          title: "Delete Table Row?",
          description: `Are you sure you want to delete Row #${rIdx + 1}?`,
          icon: "🗑️",
          iconBg: "bg-red-500/20 text-red-500",
          confirmText: "Delete Row",
          confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold"
        }) : confirm(`Delete Row #${rIdx + 1}?`);

        if (confirmed) {
          this.syncCurrentInputValues();
          if (this.currentData.blocks[bIdx] && Array.isArray(this.currentData.blocks[bIdx].rows)) {
            this.currentData.blocks[bIdx].rows.splice(rIdx, 1);
            this.refreshModalBody();
          }
        }
      };
    });

    // Metric Cards Add/Delete/Icon Pick Listeners
    this.activeModal.querySelectorAll('[data-ube-pick-metric-icon]').forEach(btn => {
      btn.onclick = () => {
        this.syncCurrentInputValues();
        const [bIdx, mIdx] = btn.getAttribute('data-ube-pick-metric-icon').split('-').map(Number);
        if (this.currentData.blocks[bIdx] && Array.isArray(this.currentData.blocks[bIdx].metrics) && this.currentData.blocks[bIdx].metrics[mIdx]) {
          const currentMetric = this.currentData.blocks[bIdx].metrics[mIdx];
          const currentIconKey = currentMetric.icon || currentMetric.iconName || 'award';

          lucideIconPicker.open({
            currentIcon: currentIconKey,
            onSelect: (iconName, svgHtml) => {
              currentMetric.icon = iconName;
              currentMetric.svgIcon = svgHtml;
              this.refreshModalBody();
            }
          });
        }
      };
    });

    this.activeModal.querySelectorAll('[data-ube-add-metric-card]').forEach(btn => {
      btn.onclick = () => {
        this.syncCurrentInputValues();
        const bIdx = parseInt(btn.getAttribute('data-ube-add-metric-card'), 10);
        if (this.currentData.blocks[bIdx]) {
          if (!Array.isArray(this.currentData.blocks[bIdx].metrics)) {
            this.currentData.blocks[bIdx].metrics = [];
          }
          const defaultIcons = ['award', 'globe', 'book-open', 'users', 'handshake', 'trending-up', 'leaf', 'activity'];
          const chosenIcon = defaultIcons[this.currentData.blocks[bIdx].metrics.length % defaultIcons.length];
          const chosenSvg = lucideIconPicker.getSvg(chosenIcon, 24, 2);

          this.currentData.blocks[bIdx].metrics.push({ 
            value: "0", 
            label: "Metric Label", 
            theme: "navy",
            icon: chosenIcon,
            svgIcon: chosenSvg
          });
          this.refreshModalBody();
        }
      };
    });

    this.activeModal.querySelectorAll('[data-ube-delete-metric-card]').forEach(btn => {
      btn.onclick = async () => {
        const [bIdx, mIdx] = btn.getAttribute('data-ube-delete-metric-card').split('-').map(Number);
        const metric = this.currentData.blocks?.[bIdx]?.metrics?.[mIdx];
        const mLabel = metric?.label || `Metric #${mIdx + 1}`;

        const confirmed = typeof window.cmsConfirm === 'function' ? await window.cmsConfirm({
          title: "Remove Metric Card?",
          description: `Are you sure you want to remove "${mLabel}"?`,
          icon: "🗑️",
          iconBg: "bg-red-500/20 text-red-500",
          confirmText: "Remove Metric",
          confirmClass: "bg-red-600 hover:bg-red-700 text-white font-bold"
        }) : confirm(`Remove "${mLabel}"?`);

        if (confirmed) {
          this.syncCurrentInputValues();
          if (this.currentData.blocks[bIdx] && Array.isArray(this.currentData.blocks[bIdx].metrics)) {
            this.currentData.blocks[bIdx].metrics.splice(mIdx, 1);
            this.refreshModalBody();
          }
        }
      };
    });
  }

  /**
   * Add a new content block to this item
   */
  addNewBlock(type) {
    if (!Array.isArray(this.currentData.blocks)) {
      this.currentData.blocks = [];
    }

    let newBlock = { type };

    if (type === 'paragraph') {
      newBlock.content = "";
    } else if (type === 'heading') {
      newBlock.level = "h2";
      newBlock.title = "";
    } else if (type === 'callout') {
      newBlock.value = "";
      newBlock.label = "";
      newBlock.description = "";
    } else if (type === 'image') {
      newBlock.src = "";
      newBlock.caption = "";
      newBlock.maxHeight = "450px";
    } else if (type === 'chart') {
      newBlock.chartType = "progress";
      newBlock.title = "";
      newBlock.subtitle = "";
      newBlock.payload = [];
    } else if (type === 'metric_cards' || type === 'metrics') {
      newBlock.type = 'metric_cards';
      newBlock.metrics = [
        { value: "1,920", label: "Beneficiaries Reached", theme: "navy", icon: "users", svgIcon: lucideIconPicker.getSvg("users", 24, 2) },
        { value: "45", label: "Active Programs", theme: "red", icon: "award", svgIcon: lucideIconPicker.getSvg("award", 24, 2) },
        { value: "15", label: "Research Publications", theme: "navy", icon: "book-open", svgIcon: lucideIconPicker.getSvg("book-open", 24, 2) }
      ];
    } else if (type === 'event_card' || type === 'event') {
      newBlock.type = 'event_card';
      newBlock.eventId = "";
    } else if (type === 'table') {
      newBlock.headers = ["Column 1", "Column 2"];
      newBlock.rows = [];
    }

    this.currentData.blocks.push(newBlock);
    this._lastFocusedBlockIndex = this.currentData.blocks.length - 1;
    this.refreshModalBody();
  }

  /**
   * Move block up or down
   */
  moveBlock(index, direction) {
    const list = this.currentData.blocks;
    if (!list || !list[index]) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const item = list.splice(index, 1)[0];
    list.splice(targetIdx, 0, item);
    this._lastFocusedBlockIndex = targetIdx;
    this.refreshModalBody();
  }

  /**
   * Delete block
   */
  deleteBlock(index) {
    const list = this.currentData.blocks;
    if (!list || !list[index]) return;
    list.splice(index, 1);
    this._lastFocusedBlockIndex = null;
    this.refreshModalBody();
  }

  /**
   * Refresh the scrollable modal body without re-opening
   */
  refreshModalBody() {
    const body = this.activeModal?.querySelector('#ube-modal-body');
    const badge = this.activeModal?.querySelector('#ube-block-count-badge');
    if (body) {
      const scrollPos = body.scrollTop;
      body.innerHTML = this.renderFormSections();
      body.scrollTop = scrollPos;
      this.bindModalEvents();
    }
    if (badge) {
      badge.textContent = `${this.currentData.blocks.length} Content Block${this.currentData.blocks.length === 1 ? '' : 's'}`;
    }
  }

  /**
   * Validate and submit data back to caller
   */
  saveAndSubmit() {
    this.syncCurrentInputValues();

    if (this.config.type === 'sdg_drawer') {
      const drawerTitle = (this.currentData.title || this.currentData.drawerTitle || '').trim() || 'Added New Drawer';
      this.currentData.title = drawerTitle;
      this.currentData.drawerTitle = drawerTitle;
    }

    if (this.config.showMetadata && (!this.currentData.title || this.currentData.title.trim().length === 0)) {
      alert("Please provide a Title / Headline for this item.");
      const titleInput = this.activeModal.querySelector('#ube-field-title');
      if (titleInput) titleInput.focus();
      return;
    }

    // Auto-extract first paragraph snippet for card excerpt if desc is empty
    if (!this.currentData.desc && this.currentData.blocks && this.currentData.blocks.length > 0) {
      const firstPara = this.currentData.blocks.find(b => b.type === 'paragraph' && b.content);
      if (firstPara) {
        this.currentData.desc = firstPara.content.replace(/[*_#[\]()]/g, '').slice(0, 160) + '...';
      }
    }

    const payload = JSON.parse(JSON.stringify(this.currentData));
    this.closeModal(payload);
  }

  /**
   * Close the modal and resolve promise
   */
  closeModal(result) {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
    document.body.classList.remove('overflow-hidden');
    this._lastFocusedBlockIndex = null;
    if (typeof this.resolvePromise === 'function') {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
  }
}

export const universalBlockEditor = new UniversalBlockEditor();
