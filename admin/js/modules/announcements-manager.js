// admin/js/modules/announcements-manager.js
// Modular Feature Manager for Announcements & News (CMS Studio)

import { cmsState } from '../cms-state.js';
import { previewBridge } from '../preview-bridge.js';
import { universalBlockEditor } from '../universal-block-editor.js';
import { escapeHtml, resolveAssetUrl, SDG_METADATA } from '../shared-utils.js';

export const SDG_COLORS = Object.fromEntries(
  Object.entries(SDG_METADATA).map(([num, data]) => [num, data.color])
);

export class AnnouncementsManager {
  constructor() {
    this.filter = {
      preset: 'all',
      keyword: '',
      fromDate: '',
      toDate: ''
    };
    this.currentPage = 1;
    this.itemsPerPage = 9; // 3x3 Grid
  }

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
   * Render SDG Coordinated Color Box Badges
   */
  renderSdgBoxes(relatedSdgs) {
    if (!Array.isArray(relatedSdgs) || relatedSdgs.length === 0) return '';
    return `
      <div class="flex flex-wrap items-center gap-1.5">
        ${relatedSdgs.map(num => {
          const color = SDG_COLORS[num] || '#19486A';
          return `<span style="background-color: ${color};" class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shadow-2xs shrink-0 select-none" title="SDG ${num}">${num}</span>`;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render the Announcements CMS Management View
   * @param {Object} draft Active section draft
   * @returns {string} HTML markup
   */
  render(draft) {
    const rawList = draft.announcementsList || [];

    // 1. Separate Featured Announcement
    const featuredItem = rawList.find(a => a.isFeatured) || draft.featured || null;
    const nonFeaturedList = rawList.filter(a => !a.isFeatured);

    // 2. Apply Filters to non-featured list
    const filteredList = this.filterAnnouncements(nonFeaturedList);

    // 3. Paginate 3x3 Grid
    const totalItems = filteredList.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / this.itemsPerPage));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const paginatedItems = filteredList.slice(startIndex, startIndex + this.itemsPerPage);

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        
        <!-- Header & Top Action -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Header Page</span>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">announcement.html</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Announcements Studio</h2>
          </div>

          <button type="button" id="btn-create-announcement" class="px-4 py-2 text-xs font-bold rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Create Announcement</span>
          </button>
        </div>

        <!-- Filter & Search Card -->
        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            <!-- Quick Preset Pills -->
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filter:
              </span>
              <button type="button" data-ann-filter="all" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${this.filter.preset === 'all' ? 'bg-ucu-blue text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">All (${rawList.length})</button>
              <button type="button" data-ann-filter="7days" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${this.filter.preset === '7days' ? 'bg-ucu-blue text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">Last 7 Days</button>
              <button type="button" data-ann-filter="30days" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${this.filter.preset === '30days' ? 'bg-ucu-blue text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">Last 30 Days</button>
              <button type="button" data-ann-filter="2025" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${this.filter.preset === '2025' ? 'bg-ucu-blue text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">Year 2025</button>
            </div>

            <!-- Search Keyword Input -->
            <div class="relative w-full md:w-72">
              <input type="text" id="ann-search-input" value="${this.escape(this.filter.keyword)}" placeholder="Search headline or keyword..." class="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue text-slate-800 outline-none">
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>
        </div>

        <!-- Section 1: Pinned Featured Announcement -->
        <div class="space-y-3">
          <div class="flex items-center gap-2.5">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 1</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Featured</span>
            </h3>
          </div>

          ${featuredItem ? this.renderFeaturedCard(featuredItem, rawList.indexOf(featuredItem)) : `
            <div class="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
              </div>
              <h4 class="text-sm font-bold text-slate-700">No Announcement Currently Featured</h4>
              <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Pin an article by clicking the <strong>"Feature"</strong> button on any card below to display it as the hero article across the Announcements page and Homepage Headline.
              </p>
            </div>
          `}
        </div>

        <!-- Section 2: Recent Announcements 3x3 Card Grid -->
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 2</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                <span>Recent</span>
              </h3>
            </div>
            
            <div class="text-xs font-bold text-slate-400 font-mono">
              Page ${this.currentPage} of ${totalPages}
            </div>
          </div>

          ${paginatedItems.length === 0 ? `
            <div class="p-12 text-center bg-white border border-slate-200 rounded-2xl">
              <p class="text-sm font-semibold text-slate-600">No announcements match the selected filter.</p>
              <button type="button" data-ann-filter="all" class="mt-3 px-4 py-1.5 text-xs font-bold text-ucu-blue bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
                Reset Filters
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${paginatedItems.map((item) => {
                const globalIndex = rawList.indexOf(item);
                return this.renderGridCard(item, globalIndex);
              }).join('')}
            </div>
          `}

          <!-- Pagination Controls -->
          ${totalPages > 1 ? `
            <div class="pt-4 flex items-center justify-between border-t border-slate-200">
              <button type="button" id="ann-prev-page" class="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer ${this.currentPage === 1 ? 'opacity-40 pointer-events-none' : ''}">
                &larr; Previous Page
              </button>

              <div class="flex items-center gap-1">
                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
                  <button type="button" data-ann-goto-page="${page}" class="w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${page === this.currentPage ? 'bg-ucu-blue text-white shadow-2xs font-bold' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}">
                    ${page}
                  </button>
                `).join('')}
              </div>

              <button type="button" id="ann-next-page" class="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer ${this.currentPage === totalPages ? 'opacity-40 pointer-events-none' : ''}">
                Next Page &rarr;
              </button>
            </div>
          ` : ''}

        </div>

      </div>
    `;
  }

  /**
   * Render Featured Hero Card in CMS (SDG Reports Blue Gradient + SDG Alignment Boxes on Far Right)
   */
  renderFeaturedCard(item, index) {
    const imgSrc = this.resolveAdminImageSrc(item.img || item.src || '');
    const blockCount = (item.blocks || []).length;
    const relatedSdgs = Array.isArray(item.relatedSdgs) ? item.relatedSdgs : [];

    return `
      <div class="group relative flex flex-col lg:flex-row bg-gradient-to-br from-ucu-blue-dark via-[#1e293b] to-ucu-blue rounded-2xl overflow-hidden shadow-xl border border-white/15 lg:min-h-[320px]">
        
        <!-- Left Content Preview -->
        <div class="flex-1 flex flex-col justify-between p-6 sm:p-8 text-white z-10 space-y-4 lg:max-w-[58%]">
          <div class="space-y-3">
            
            <!-- Top Metadata Row: Badge & Date on Left, SDG Box Numbers on Far Right End -->
            <div class="flex items-center justify-between gap-3 w-full">
              <div class="flex items-center gap-2.5">
                <span class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-ucu-yellow text-ucu-blue-dark rounded-md shadow-2xs flex items-center gap-1">
                  <svg class="w-3 h-3 text-ucu-blue-dark" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  <span>Featured Active</span>
                </span>
                
                <span class="text-xs font-semibold text-slate-300">
                  ${this.escape(item.date || 'May 20, 2025')}
                </span>
                
                <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800/80 text-slate-300 border border-white/10 hidden sm:inline-block">
                  ${blockCount} Block${blockCount === 1 ? '' : 's'}
                </span>
              </div>

              <!-- Aligned SDG Badges Placed at Right Corner / End -->
              <div class="ml-auto flex items-center">
                ${this.renderSdgBoxes(relatedSdgs)}
              </div>
            </div>

            <h4 class="text-xl sm:text-2xl font-black text-white leading-tight">
              ${this.escape(item.title || 'Untitled Headline')}
            </h4>

            <p class="text-xs sm:text-sm text-slate-200 line-clamp-3 leading-relaxed font-normal">
              ${this.escape(item.desc || 'No summary excerpt provided.')}
            </p>
          </div>

          <!-- 3 CMS Action Buttons -->
          <div class="pt-4 flex flex-wrap items-center gap-2.5 border-t border-white/15">
            <button type="button" data-ann-action="edit" data-ann-index="${index}" class="px-3.5 py-2 rounded-xl bg-ucu-red hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Edit Full Article</span>
            </button>

            <button type="button" data-ann-action="unfeature" data-ann-index="${index}" class="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-400/40 transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Unfeature</span>
            </button>

            <button type="button" data-ann-action="delete" data-ann-index="${index}" class="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 font-bold text-xs border border-red-800/50 transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Delete</span>
            </button>
          </div>
        </div>

        <!-- Right Image Area (Absolute on desktop so it never stretches the card) -->
        <div class="w-full lg:w-[42%] h-56 sm:h-64 lg:h-auto lg:absolute lg:inset-y-0 lg:right-0 overflow-hidden bg-slate-950 shrink-0">
          ${imgSrc ? `
            <img src="${imgSrc}" alt="Cover" class="w-full h-full object-cover object-center">
          ` : `
            <div class="w-full h-full flex items-center justify-center text-slate-500 text-xs font-semibold">No Image Provided</div>
          `}
        </div>

      </div>
    `;
  }

  /**
   * Render Recent 3x3 Card in CMS (Clean White Card Layout)
   * Top: Category Pill on Left, Date on Right
   * Bottom: SDG Boxes on Left, Action Buttons on Right
   */
  renderGridCard(item, index) {
    const imgSrc = this.resolveAdminImageSrc(item.img || item.src || '');
    const relatedSdgs = Array.isArray(item.relatedSdgs) ? item.relatedSdgs : [];
    const blockCount = (item.blocks || []).length;

    return `
      <article class="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200 hover:border-ucu-red/30 hover:shadow-md transition-all">
        
        <!-- Card Cover Photo -->
        <div class="w-full h-48 overflow-hidden bg-slate-100 relative shrink-0">
          ${imgSrc ? `
            <img src="${imgSrc}" alt="Thumbnail" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          ` : `
            <div class="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">No Cover Photo</div>
          `}
          
          <span class="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold rounded bg-slate-900/80 text-white border border-white/10 backdrop-blur-xs">
            ${blockCount} Block${blockCount === 1 ? '' : 's'}
          </span>
        </div>

        <!-- Card Body (Clean White Canvas) -->
        <div class="flex-1 flex flex-col justify-between p-5 bg-white text-slate-800 space-y-3">
          <div class="space-y-2.5">
            
            <!-- Top Row: Category Pill on Left, Date on Right (Single Line) -->
            <div class="flex items-center justify-between gap-2 min-w-0">
              <span class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-red-50 text-ucu-red border border-red-100 shadow-2xs whitespace-nowrap shrink-0">
                ${this.escape(item.category || item.badge || 'News')}
              </span>
              
              <span class="text-[10px] font-semibold text-slate-400 ml-auto whitespace-nowrap shrink-0">
                ${this.escape(item.date || '')}
              </span>
            </div>

            <h4 class="text-base font-black text-ucu-blue-dark leading-snug line-clamp-2 group-hover:text-ucu-red transition-colors">
              ${this.escape(item.title || 'Untitled Announcement')}
            </h4>

            <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed font-normal">
              ${this.escape(item.desc || 'No summary excerpt.')}
            </p>
          </div>

          <!-- Bottom Footer Area: Two Dedicated Lines -->
          <div class="pt-3.5 mt-auto border-t border-slate-100 space-y-2.5">
            
            <!-- Line 1: SDG Coordinated Number Boxes (Full Width) -->
            <div class="flex flex-wrap items-center gap-1.5 min-h-[22px]">
              ${this.renderSdgBoxes(relatedSdgs)}
            </div>

            <!-- Line 2: CMS Action Buttons Full Row -->
            <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/70">
              <button type="button" data-ann-action="feature" data-ann-index="${index}" class="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 transition-all flex items-center gap-1 cursor-pointer shadow-2xs" title="Set as Featured Headline">
                <svg class="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>Feature</span>
              </button>

              <div class="flex items-center gap-1.5">
                <button type="button" data-ann-action="edit" data-ann-index="${index}" class="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-ucu-blue hover:text-white transition-all flex items-center gap-1 cursor-pointer">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>Edit</span>
                </button>

                <button type="button" data-ann-action="delete" data-ann-index="${index}" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete Announcement">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>

          </div>

        </div>

      </article>
    `;
  }

  /**
   * Filter announcements list based on preset and keyword
   */
  filterAnnouncements(list) {
    let result = [...list];

    // Search keyword filter
    if (this.filter.keyword.trim().length > 0) {
      const kw = this.filter.keyword.toLowerCase().trim();
      result = result.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(kw);
        const descMatch = (item.desc || '').toLowerCase().includes(kw);
        const catMatch = (item.category || item.badge || '').toLowerCase().includes(kw);
        return titleMatch || descMatch || catMatch;
      });
    }

    // Preset filters (Year 2025, 7days, 30days)
    if (this.filter.preset === '2025') {
      result = result.filter(item => (item.date || '').includes('2025'));
    }

    return result;
  }

  /**
   * Bind interactive listeners for Announcements section
   */
  bindEvents(container, parentFormEngine) {
    if (!container) return;

    // Filter Buttons
    container.querySelectorAll('[data-ann-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filter.preset = btn.getAttribute('data-ann-filter');
        this.currentPage = 1;
        parentFormEngine.render();
      });
    });

    // Search Input
    const searchInput = container.querySelector('#ann-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filter.keyword = e.target.value;
        this.currentPage = 1;
        parentFormEngine.render();
      });
    }

    // Pagination
    const prevBtn = container.querySelector('#ann-prev-page');
    const nextBtn = container.querySelector('#ann-next-page');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          parentFormEngine.render();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentPage++;
        parentFormEngine.render();
      });
    }

    container.querySelectorAll('[data-ann-goto-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.getAttribute('data-ann-goto-page'), 10);
        parentFormEngine.render();
      });
    });

    // Create New Announcement Button
    const btnCreate = container.querySelector('#btn-create-announcement');
    if (btnCreate) {
      btnCreate.addEventListener('click', async () => {
        const newItem = {
          id: `ann_${Date.now()}`,
          title: '',
          category: 'News',
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          img: '',
          src: '',
          desc: '',
          relatedSdgs: [],
          isFeatured: false,
          blocks: []
        };

        const result = await universalBlockEditor.open({
          title: "Create Announcement",
          type: "announcement",
          isNew: true,
          item: newItem
        });

        if (result) {
          if (!Array.isArray(cmsState.currentDraft.announcementsList)) {
            cmsState.currentDraft.announcementsList = [];
          }
          cmsState.currentDraft.announcementsList.unshift(result);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    }

    // Card Action Buttons (Edit, Feature, Unfeature, Delete)
    container.querySelectorAll('[data-ann-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-ann-action');
        const idx = parseInt(btn.getAttribute('data-ann-index'), 10);
        const list = cmsState.currentDraft.announcementsList || [];
        const item = list[idx];
        if (!item) return;

        // 1. EDIT ACTION (Opens Center Modal Universal Block Editor)
        if (action === 'edit') {
          const updated = await universalBlockEditor.open({
            title: `Edit: ${item.title || 'Announcement'}`,
            type: "announcement",
            isNew: false,
            item: item
          });

          if (updated) {
            list[idx] = updated;
            if (updated.isFeatured) {
              cmsState.currentDraft.featured = { ...updated };
            }
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }

        // 2. FEATURE / UNFEATURE ACTION
        else if (action === 'feature' || action === 'unfeature') {
          const makeFeatured = action === 'feature';
          
          // Clear all existing featured flags
          list.forEach(a => a.isFeatured = false);
          item.isFeatured = makeFeatured;

          if (makeFeatured) {
            cmsState.currentDraft.featured = { ...item };
          } else {
            cmsState.currentDraft.featured = null;
          }

          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }

        // 3. DELETE ACTION
        else if (action === 'delete') {
          const confirmed = await window.cmsConfirm({
            title: "Delete Announcement?",
            description: `Are you sure you want to permanently delete "${item.title || 'Untitled'}"?`,
            icon: "trash",
            iconBg: "bg-red-500/20 text-red-400",
            confirmText: "Delete Article",
            confirmClass: "bg-red-600 hover:bg-red-500 text-white"
          });

          if (confirmed) {
            list.splice(idx, 1);
            if (item.isFeatured) {
              cmsState.currentDraft.featured = null;
            }
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

export const announcementsManager = new AnnouncementsManager();
