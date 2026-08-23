// admin/js/modules/rankings-manager.js
// Modular Feature Manager for Institutional Rankings & Trajectory Studio (CMS Studio)

import { cmsState } from '../cms-state.js';
import { previewBridge } from '../preview-bridge.js';

export class RankingsManager {
  constructor() {
    this.filterOrg = 'all';
    this.sortBy = 'year'; // 'year' | 'alphabetical'
    this.searchQuery = '';
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
   * Resolve media image paths for Admin Studio context
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
   * Get default hex color for known or custom ranking bodies
   */
  getDefaultBadgeColor(org) {
    const map = {
      'WURI': '#0f4088',
      'UI GreenMetric': '#00993d',
      'THE Impact': '#201f1f',
      'THE': '#201f1f',
      'AppliedHE': '#f26422',
      'QS': '#e5a823',
      'QS World University Rankings': '#e5a823',
      'Times Higher Education World': '#201f1f',
      'Webometrics': '#005a9c'
    };
    return map[org] || '#24305e';
  }

  /**
   * Get default logo path for known ranking bodies
   */
  getDefaultLogoForOrg(org) {
    const map = {
      'AppliedHE': 'images/rankings-logo/applied-he.png',
      'THE Impact': 'images/rankings-logo/the-impact.png',
      'THE': 'images/rankings-logo/the-impact.png',
      'Times Higher Education': 'images/rankings-logo/the-impact.png',
      'Times Higher Education World': 'images/rankings-logo/the-impact.png',
      'UI GreenMetric': 'images/rankings-logo/ui-green.png',
      'WURI': 'images/rankings-logo/wuri.png',
      'HE HIGHER EDUCATION': 'images/rankings-logo/higher-education.png'
    };
    return map[org] || '';
  }

  /**
   * Render filtered ranking cards HTML
   */
  renderRankingCardsHtml(filteredRankings) {
    if (filteredRankings.length === 0) {
      return `
        <div class="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50/50">
          <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
          </div>
          <h4 class="text-xs font-bold text-slate-700 font-sans">No ranking records found</h4>
          <p class="text-[11px] text-slate-400 max-w-sm mx-auto font-sans leading-relaxed">Try clearing your search query or selecting a different organization tab.</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        ${filteredRankings.map(item => {
          const defaultLogo = this.getDefaultLogoForOrg(item.org);
          const rawLogo = item.logo || defaultLogo || '';
          const logoSrc = this.resolveAdminImageSrc(rawLogo);
          const badgeColor = item.badgeColor || this.getDefaultBadgeColor(item.org);
          const metrics = Array.isArray(item.metrics) ? item.metrics : [];
          let rawPub = (item.publicationUrl || item.publicationLink || item.url || '').trim();
          let pubUrl = rawPub;
          if (pubUrl && pubUrl !== '#' && !pubUrl.startsWith('http://') && !pubUrl.startsWith('https://') && !pubUrl.startsWith('mailto:') && !pubUrl.startsWith('tel:')) {
            pubUrl = 'https://' + pubUrl;
          }
          const hasPublication = Boolean(pubUrl && pubUrl.length > 3 && pubUrl !== '#' && (pubUrl.startsWith('http://') || pubUrl.startsWith('https://')));

          return `
            <div class="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between gap-4 group hover:border-slate-300 hover:shadow-xs transition-all">
              
              <!-- Card Header -->
              <div class="space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md shadow-2xs text-white font-sans" style="background-color: ${badgeColor};">
                    ${this.escape(item.org || 'Ranking Body')}
                  </span>
                  <span class="text-xs font-black text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 font-sans">
                    ${this.escape(item.year || '2025')}
                  </span>
                </div>

                <!-- Main Rank & Logo Preview -->
                <div class="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div class="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    ${logoSrc ? `
                      <img src="${logoSrc}" alt="${this.escape(item.org)}" class="max-h-full max-w-full object-contain">
                    ` : `
                      <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                    `}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-2xl font-black text-ucu-blue-dark tracking-tight leading-none truncate font-sans">
                      ${this.escape(item.mainRank || '#1')}
                    </div>
                    <div class="text-[11px] font-bold text-slate-500 truncate mt-0.5 font-sans">
                      ${this.escape(item.mainRankLabel || item.category || 'Ranking Scope')}
                    </div>
                  </div>
                </div>

                <!-- Short Description -->
                ${item.shortDescription ? `
                  <p class="text-xs text-slate-600 leading-relaxed line-clamp-2 italic font-sans">
                    "${this.escape(item.shortDescription)}"
                  </p>
                ` : ''}

                <!-- Sub-metrics Breakdown Pills with exact colors -->
                ${metrics.length > 0 ? `
                  <div class="space-y-1.5 pt-2 border-t border-slate-100">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-sans">Pillar Ranks (${metrics.length}):</span>
                    <div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      ${metrics.map(m => `
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] text-slate-700 font-semibold shadow-2xs font-sans" title="${this.escape(m.subtext || m.label)}">
                          <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${m.color || '#394a8a'};"></span>
                          <span class="font-bold text-ucu-blue-dark font-sans">${this.escape(m.value)}</span>
                          <span class="text-slate-500 truncate max-w-[110px] font-sans">${this.escape(m.label)}</span>
                        </span>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Publication Link Badge -->
                ${hasPublication ? `
                  <div class="pt-1">
                    <a href="${this.escape(pubUrl)}" target="_blank" class="inline-flex items-center gap-1 text-[11px] font-bold text-ucu-blue hover:text-ucu-blue-dark hover:underline truncate font-sans">
                      <svg class="w-3 h-3 text-ucu-blue shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                      <span>See Official Publication</span>
                      <svg class="w-2.5 h-2.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  </div>
                ` : ''}
              </div>

              <!-- Card Action Buttons -->
              <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button type="button" data-rank-edit="${item.originalIndex}" class="flex-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 font-sans">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>Edit</span>
                </button>
                <button type="button" data-rank-delete="${item.originalIndex}" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer" title="Delete Record">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render Rankings CMS Studio Management View
   */
  render(draft) {
    if (!draft) draft = {};
    if (!Array.isArray(draft.rankingsList)) {
      draft.rankingsList = (typeof window !== 'undefined' && Array.isArray(window.UCU_RANKINGS))
        ? JSON.parse(JSON.stringify(window.UCU_RANKINGS))
        : [];
    }

    const rankingsList = draft.rankingsList;

    // Filter by Organization & Search
    let filteredRankings = rankingsList.map((item, originalIndex) => ({ ...item, originalIndex })).filter(item => {
      const matchOrg = this.filterOrg === 'all' || item.org === this.filterOrg;
      const matchSearch = !this.searchQuery || 
        (item.org && item.org.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (item.mainRank && item.mainRank.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (item.mainRankLabel && item.mainRankLabel.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (item.shortDescription && item.shortDescription.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (item.year && String(item.year).includes(this.searchQuery));
      return matchOrg && matchSearch;
    });

    // Apply Sorting: Year (Newest First) vs Alphabetical (A-Z)
    if (this.sortBy === 'alphabetical') {
      filteredRankings.sort((a, b) => (a.org || '').localeCompare(b.org || '', undefined, { sensitivity: 'base' }));
    } else {
      // Sort by Year descending
      filteredRankings.sort((a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0));
    }

    // Dynamic Filter Tabs list based on existing orgs
    const uniqueOrgs = Array.from(new Set(rankingsList.map(r => r.org).filter(Boolean)));
    const tabCounts = { 'all': rankingsList.length };
    uniqueOrgs.forEach(org => {
      tabCounts[org] = rankingsList.filter(r => r.org === org).length;
    });

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        
        <!-- Studio Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">Header Page</span>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">rankings.html</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight font-sans">Rankings Studio</h2>
          </div>

          <button type="button" id="btn-add-ranking" class="px-4 py-2 text-xs font-bold rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 font-sans">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Ranking Record</span>
          </button>
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
              <input type="text" data-bind="heroEyebrow" value="${this.escape(draft.heroEyebrow || 'A Network of Excellence')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Main Headline</label>
              <input type="text" data-bind="heroHeadline" value="${this.escape(draft.heroHeadline || 'Connecting UCU')}" class="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Highlight Word / Accent</label>
              <input type="text" data-bind="heroHighlight" value="${this.escape(draft.heroHighlight || 'Globally.')}" class="w-full px-3 py-1.5 text-xs font-bold text-ucu-blue bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Hero Description Paragraph</label>
            <textarea data-bind="heroDescription" rows="2" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">${this.escape(draft.heroDescription || 'Forging high-impact relationships with global academic institutions and premier industry leaders to elevate the educational standard of Urdaneta City University.')}</textarea>
          </div>
        </div>

        <!-- Section 2: Headings & Terminus Vision -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 2</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span>Headings &amp; Terminus Vision</span>
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Current Standing Title</label>
              <input type="text" data-bind="standingTitle" value="${this.escape(draft.standingTitle || 'Current Global Standing')}" class="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Historical Trajectory Eyebrow</label>
              <input type="text" data-bind="trajectoryEyebrow" value="${this.escape(draft.trajectoryEyebrow || 'Institutional Trajectory')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Historical Trajectory Title</label>
              <input type="text" data-bind="trajectoryTitle" value="${this.escape(draft.trajectoryTitle || 'Historical Performance')}" class="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Terminus Vision Statement (Closing Quote at Timeline End)</label>
            <textarea data-bind="terminusStatement" rows="2" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-serif italic">${this.escape(draft.terminusStatement || '"We will continue our commitment to relentless innovation and real-world impact, ensuring the little giant UCU rises to meet the titans on the global stage."')}</textarea>
          </div>
        </div>

        <!-- Section 3: Rankings Directory -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 3</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                <span>Rankings Directory (${filteredRankings.length} of ${rankingsList.length})</span>
              </h3>
            </div>

            <!-- Toolbar: Sorting Switcher & Search Bar -->
            <div class="flex flex-wrap items-center gap-2.5">
              <!-- Sorting Segmented Control -->
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
                <button type="button" data-rank-sort="year" class="px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 font-sans ${this.sortBy === 'year' ? 'bg-white text-ucu-blue-dark shadow-2xs' : 'text-slate-500 hover:text-slate-800'}">
                  <svg class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Year (Newest)</span>
                </button>
                <button type="button" data-rank-sort="alphabetical" class="px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 font-sans ${this.sortBy === 'alphabetical' ? 'bg-white text-ucu-blue-dark shadow-2xs' : 'text-slate-500 hover:text-slate-800'}">
                  <svg class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10M4 18h6"/></svg>
                  <span>Org (A-Z)</span>
                </button>
              </div>

              <!-- Search Bar -->
              <div class="relative flex-1 sm:max-w-xs">
                <svg class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="ranking-search-input" value="${this.escape(this.searchQuery)}" placeholder="Search ranking, rank, year..." class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
              </div>
            </div>
          </div>

          <!-- Dynamic Filter Tabs Segmented Track -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto">
            <button type="button" data-rank-tab="all" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 font-sans ${this.filterOrg === 'all' ? 'bg-white text-ucu-blue-dark shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
              <span>All Rankings</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full ${this.filterOrg === 'all' ? 'bg-ucu-blue/10 text-ucu-blue-dark' : 'bg-slate-200 text-slate-600'} font-bold">${tabCounts.all || 0}</span>
            </button>
            ${uniqueOrgs.map(org => {
              const isActive = this.filterOrg === org;
              const count = tabCounts[org] || 0;
              return `
                <button type="button" data-rank-tab="${this.escape(org)}" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 font-sans ${isActive ? 'bg-white text-ucu-blue-dark shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                  <span>${this.escape(org)}</span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-ucu-blue/10 text-ucu-blue-dark' : 'bg-slate-200 text-slate-600'} font-bold">${count}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Ranking Cards Grid Container -->
          <div id="rankings-grid-container">
            ${this.renderRankingCardsHtml(filteredRankings)}
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Update only the cards grid view without destroying search input focus
   */
  updateRankingsListView(container, parentFormEngine) {
    const draft = cmsState.currentDraft || {};
    const rankingsList = draft.rankingsList || [];

    let filteredRankings = rankingsList.map((item, originalIndex) => ({ ...item, originalIndex })).filter(item => {
      const matchOrg = this.filterOrg === 'all' || item.org === this.filterOrg;
      const matchSearch = !this.searchQuery || 
        (item.org && item.org.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (item.mainRank && item.mainRank.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (item.mainRankLabel && item.mainRankLabel.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (item.shortDescription && item.shortDescription.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (item.year && String(item.year).includes(this.searchQuery));
      return matchOrg && matchSearch;
    });

    if (this.sortBy === 'alphabetical') {
      filteredRankings.sort((a, b) => (a.org || '').localeCompare(b.org || '', undefined, { sensitivity: 'base' }));
    } else {
      filteredRankings.sort((a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0));
    }

    const gridContainer = container.querySelector('#rankings-grid-container');
    if (gridContainer) {
      gridContainer.innerHTML = this.renderRankingCardsHtml(filteredRankings);
      this.bindCardActions(gridContainer, parentFormEngine);
    }
  }

  /**
   * Bind card edit and delete actions
   */
  bindCardActions(scope, parentFormEngine) {
    const draft = cmsState.currentDraft || {};

    scope.querySelectorAll('[data-rank-edit]').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.rankEdit, 10);
        const item = draft.rankingsList[idx];
        if (item) {
          this.openRankingEditor({
            item: JSON.parse(JSON.stringify(item)),
            isNew: false,
            index: idx,
            parentFormEngine
          });
        }
      };
    });

    scope.querySelectorAll('[data-rank-delete]').forEach(btn => {
      btn.onclick = async () => {
        const idx = parseInt(btn.dataset.rankDelete, 10);
        const item = draft.rankingsList[idx];
        if (!item) return;

        const confirmed = typeof window.cmsConfirm === 'function'
          ? await window.cmsConfirm({
              title: "Delete Ranking Record?",
              description: `Are you sure you want to remove the ${item.year} ${item.org} ranking record?`,
              icon: `<svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
              iconBg: "bg-red-500/10 text-red-500",
              confirmText: "Delete Record",
              confirmClass: "bg-red-600 hover:bg-red-500 text-white"
            })
          : confirm(`Are you sure you want to remove the ${item.year} ${item.org} ranking record?`);

        if (!confirmed) return;

        draft.rankingsList.splice(idx, 1);
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(draft);
        if (parentFormEngine) parentFormEngine.render();
      };
    });
  }

  /**
   * Bind event listeners for Rankings Studio
   */
  bindEvents(container, parentFormEngine) {
    if (!container) return;

    const draft = cmsState.currentDraft || {};

    // 1. Two-way data binding for standard text inputs and textareas
    container.querySelectorAll('[data-bind]').forEach(el => {
      el.oninput = () => {
        const key = el.dataset.bind;
        draft[key] = el.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(draft);
      };
    });

    // 2. Sorting Toggle
    container.querySelectorAll('[data-rank-sort]').forEach(btn => {
      btn.onclick = () => {
        this.sortBy = btn.dataset.rankSort;
        container.querySelectorAll('[data-rank-sort]').forEach(b => {
          const isCurrent = b.dataset.rankSort === this.sortBy;
          b.className = `px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${isCurrent ? 'bg-white text-ucu-blue-dark shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`;
        });
        this.updateRankingsListView(container, parentFormEngine);
      };
    });

    // 3. Organization Filter Tabs
    container.querySelectorAll('[data-rank-tab]').forEach(btn => {
      btn.onclick = () => {
        this.filterOrg = btn.dataset.rankTab;
        if (parentFormEngine) parentFormEngine.render();
      };
    });

    // 4. Search Input with Smooth Real-Time Filtering
    const searchInput = container.querySelector('#ranking-search-input');
    if (searchInput) {
      searchInput.oninput = () => {
        this.searchQuery = searchInput.value.trim();
        this.updateRankingsListView(container, parentFormEngine);
      };
    }

    // 5. Add Ranking Record Button
    const btnAdd = container.querySelector('#btn-add-ranking');
    if (btnAdd) {
      btnAdd.onclick = () => {
        const draftRankings = draft.rankingsList || [];
        const existingOrgs = Array.from(new Set(draftRankings.map(r => r.org).filter(Boolean)));
        const defaultOrg = this.filterOrg !== 'all' ? this.filterOrg : (existingOrgs[0] || 'WURI');

        this.openRankingEditor({
          item: {
            org: defaultOrg,
            year: String(new Date().getFullYear()),
            mainRankLabel: '',
            mainRank: '',
            category: '',
            badgeColor: this.getDefaultBadgeColor(defaultOrg),
            shortDescription: '',
            publicationUrl: '',
            publicationDate: '',
            logo: '',
            metrics: []
          },
          isNew: true,
          index: -1,
          parentFormEngine
        });
      };
    }

    // 6. Bind Card Action Buttons
    this.bindCardActions(container, parentFormEngine);
  }

  /**
   * Center Modal Dedicated Ranking Record Editor
   */
  openRankingEditor({ item, isNew, index, parentFormEngine }) {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }

    const modalData = { ...item };
    if (!Array.isArray(modalData.metrics)) modalData.metrics = [];

    // Derive ONLY currently saved organizations from database/draft
    const draft = cmsState.currentDraft || {};
    const draftRankings = draft.rankingsList || [];
    const savedOrgs = Array.from(new Set(draftRankings.map(r => r.org).filter(Boolean)));
    
    // Fallback if no orgs exist yet
    if (savedOrgs.length === 0) {
      savedOrgs.push('WURI', 'UI GreenMetric', 'THE Impact', 'AppliedHE');
    }

    // Determine if current item's org is in savedOrgs
    let isCustomOrg = modalData.org === '__custom__' || (modalData.org !== '' && !savedOrgs.includes(modalData.org));
    if (isNew && !modalData.org && savedOrgs.length > 0) {
      modalData.org = savedOrgs[0];
      modalData.badgeColor = this.getDefaultBadgeColor(modalData.org);
    }

    if (!modalData.badgeColor) {
      modalData.badgeColor = this.getDefaultBadgeColor(modalData.org);
    }

    const modalEl = document.createElement('div');
    modalEl.id = 'ranking-modal-overlay';
    modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn';

    const renderModal = () => {
      // 1. Capture current scroll positions before DOM replacement
      const oldModalBody = modalEl.querySelector('#ranking-modal-body');
      const oldSubmetricsList = modalEl.querySelector('#submetrics-list-container');
      const savedBodyScrollTop = oldModalBody ? oldModalBody.scrollTop : 0;
      const savedListScrollTop = oldSubmetricsList ? oldSubmetricsList.scrollTop : 0;

      const defaultLogo = this.getDefaultLogoForOrg(modalData.org);
      const rawLogo = modalData.logo || defaultLogo || '';
      const resolvedLogo = this.resolveAdminImageSrc(rawLogo);
      const badgeColor = modalData.badgeColor || this.getDefaultBadgeColor(modalData.org);

      // Preset palette swatches for quick color selection
      const presetColors = ['#0f4088', '#00993d', '#201f1f', '#f26422', '#e5a823', '#c43643', '#394a8a', '#702082', '#00a8cc'];
      const metricPresetColors = ['#394a8a', '#c43643', '#E5243B', '#4C9F38', '#C5192D', '#FF3A21', '#00689D', '#19486A', '#00993d', '#fbef4b', '#201f1f'];

      modalEl.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
          
          <!-- Modal Header -->
          <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-ucu-yellow shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              </div>
              <h3 class="text-sm font-bold text-white font-sans">${isNew ? 'Add Institutional Ranking Record' : 'Edit Ranking Record'}</h3>
            </div>
            <button type="button" id="btn-close-ranking-modal" class="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer font-sans" title="Close Modal">
              ✕
            </button>
          </div>

          <!-- Modal Body Form (7 Structured Rows) -->
          <div id="ranking-modal-body" class="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-xs">
            
            <!-- 1st Row: Logo / Emblem & Ranking Organization -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              
              <!-- Logo / Emblem Square with Drag and Drop -->
              <div class="sm:col-span-4 space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-slate-700 font-sans">Logo / Emblem</label>
                  ${modalData.logo ? `
                    <button type="button" id="btn-reset-rank-logo" class="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors cursor-pointer font-sans" title="Reset to default emblem">
                      Reset
                    </button>
                  ` : ''}
                </div>
                
                <div id="ranking-logo-dropzone" class="group relative w-full h-28 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-ucu-blue/40 flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all">
                  ${resolvedLogo ? `
                    <img src="${resolvedLogo}" alt="Emblem Preview" class="w-full h-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-95">
                    <!-- Hover Overlay -->
                    <div class="absolute inset-0 bg-slate-900/75 backdrop-blur-2xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all p-2 text-center text-white">
                      <svg class="w-5 h-5 mb-1 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      <span class="text-[11px] font-bold">Replace Logo</span>
                    </div>
                  ` : `
                    <div class="flex flex-col items-center justify-center p-2 text-center text-slate-400 group-hover:text-ucu-blue transition-colors">
                      <svg class="w-6 h-6 mb-1 text-slate-400 group-hover:text-ucu-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      <span class="text-[11px] font-bold">Upload Logo</span>
                      <span class="text-[9px] text-slate-400 mt-0.5">or Drag &amp; Drop</span>
                    </div>
                  `}
                  <input type="file" id="ranking-logo-input" accept="image/*" class="hidden">
                </div>
              </div>

              <!-- Ranking Organization -->
              <div class="sm:col-span-8 space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-slate-700 font-sans">Ranking Organization <span class="text-red-500">*</span></label>
                  ${isCustomOrg ? `
                    <button type="button" id="btn-back-to-presets" class="text-[10px] font-bold text-ucu-blue hover:underline cursor-pointer font-sans">
                      ↩ Choose from Presets
                    </button>
                  ` : ''}
                </div>
                
                ${!isCustomOrg ? `
                  <select id="rf-org-select" class="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-bold font-sans cursor-pointer h-11">
                    ${savedOrgs.map(orgName => `
                      <option value="${this.escape(orgName)}" ${modalData.org === orgName ? 'selected' : ''}>${this.escape(orgName)}</option>
                    `).join('')}
                    <option value="__custom__">+ Custom Organization...</option>
                  </select>
                ` : `
                  <input type="text" id="rf-custom-org-input" value="${this.escape(modalData.org === '__custom__' ? '' : modalData.org)}" placeholder="Enter Custom Organization Name..." class="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-bold font-sans h-11" autofocus>
                `}
              </div>

            </div>

            <!-- 2nd Row: Theme Color -->
            <div class="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-slate-700 font-sans">Theme Color</label>
                <span id="rf-badge-preview" class="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs transition-colors font-sans" style="background-color: ${badgeColor};">Preview Badge</span>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-2">
                  <input type="color" id="rf-badge-color" value="${badgeColor}" class="w-8 h-8 p-0.5 bg-white border border-slate-200 rounded-lg cursor-pointer shrink-0 shadow-2xs" title="Choose Badge Theme Color">
                  <input type="text" id="rf-badge-color-hex" value="${badgeColor}" placeholder="#0f4088" class="w-24 px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg font-bold uppercase focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
                </div>

                <!-- Quick Swatches -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] text-slate-400 font-medium font-sans">Quick:</span>
                  ${presetColors.map(c => `
                    <button type="button" data-set-badge-color="${c}" class="w-6 h-6 rounded-lg border-2 ${badgeColor.toLowerCase() === c.toLowerCase() ? 'border-slate-800 scale-110' : 'border-white'} shadow-2xs cursor-pointer transition-transform hover:scale-110" style="background-color: ${c};" title="${c}"></button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 3rd Row: Label, Rank Value, Category / Scope -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Label</label>
                <input type="text" id="rf-mainRankLabel" value="${this.escape(modalData.mainRankLabel || '')}" placeholder="e.g. World University Ranking" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold font-sans">
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Rank Value <span class="text-red-500">*</span></label>
                <input type="text" id="rf-mainRank" value="${this.escape(modalData.mainRank || '')}" placeholder="e.g. #44 or 241-260" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-black text-ucu-blue-dark font-sans">
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Category / Scope</label>
                <input type="text" id="rf-category" value="${this.escape(modalData.category || '')}" placeholder="e.g. World Rankings, All Asia" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
              </div>
            </div>

            <!-- 4th Row: Year & Publication Date -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Year <span class="text-red-500">*</span></label>
                <input type="text" id="rf-year" value="${this.escape(modalData.year || '2025')}" placeholder="2025" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-bold font-sans">
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Publication Date</label>
                <input type="text" id="rf-publicationDate" value="${this.escape(modalData.publicationDate || '')}" placeholder="e.g. June 12, 2025" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
              </div>
            </div>

            <!-- 5th Row: Description -->
            <div class="space-y-1">
              <label class="block text-[10px] font-bold uppercase text-slate-500 font-sans">Description</label>
              <textarea id="rf-shortDescription" rows="2" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue leading-relaxed font-sans" placeholder="Brief milestone summary for the marquee carousel and cards...">${this.escape(modalData.shortDescription || '')}</textarea>
            </div>

            <!-- 6th Row: Publication URL -->
            <div class="space-y-1">
              <label class="block text-[10px] font-bold uppercase text-slate-500 font-sans">Publication URL</label>
              <input type="url" id="rf-publicationUrl" value="${this.escape(modalData.publicationUrl || '')}" placeholder="https://www.facebook.com/... or https://university-release.com/..." class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-mono">
            </div>

            <!-- 7th Row: Pillar & Category Sub-Metrics -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-slate-700 font-sans">Pillar &amp; Category Sub-Metrics (${modalData.metrics.length})</label>
                <button type="button" id="btn-add-submetric" class="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer font-sans">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Add Pillar Rank</span>
                </button>
              </div>

              ${modalData.metrics.length === 0 ? `
                <div class="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-[11px] text-slate-400 font-sans">
                  No sub-metrics added yet. Click "+ Add Pillar Rank" to add category rankings (e.g. Industrial Application, SDG 1, etc.)
                </div>
              ` : `
                <div class="space-y-3 max-h-72 overflow-y-auto pr-1" id="submetrics-list-container">
                  ${modalData.metrics.map((m, mIdx) => {
                    const mColor = m.color || '#394a8a';
                    return `
                      <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5" data-metric-card="${mIdx}">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div class="sm:col-span-2">
                            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-0.5 font-sans">Pillar / Indicator Label</label>
                            <input type="text" data-metric-field="label" data-metric-idx="${mIdx}" value="${this.escape(m.label)}" placeholder="e.g. A3 Industrial Application" class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold font-sans">
                          </div>
                          <div>
                            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-0.5 font-sans">Rank Value</label>
                            <input type="text" data-metric-field="value" data-metric-idx="${mIdx}" value="${this.escape(m.value)}" placeholder="e.g. #1 or PH #6" class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-bold text-ucu-blue-dark font-sans">
                          </div>
                        </div>

                        <div>
                          <label class="block text-[10px] font-bold uppercase text-slate-500 mb-0.5 font-sans">Project Title / Subtext (Optional)</label>
                          <input type="text" data-metric-field="subtext" data-metric-idx="${mIdx}" value="${this.escape(m.subtext || '')}" placeholder="Optional project title / subtext..." class="w-full px-2.5 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
                        </div>

                        <!-- Sub-metric Color Picker Row -->
                        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                          <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold text-slate-500 font-sans">Theme:</span>
                            <input type="color" data-metric-field="color" data-metric-idx="${mIdx}" value="${mColor}" class="w-5 h-5 p-0.5 bg-white border border-slate-200 rounded cursor-pointer shrink-0 shadow-2xs" title="Pillar Background Color">
                            <input type="text" data-metric-field="color-hex" data-metric-idx="${mIdx}" value="${mColor}" placeholder="#394a8a" class="w-20 px-2 py-0.5 text-[10px] font-mono uppercase bg-white border border-slate-200 rounded-md font-bold">
                            
                            <!-- Mini Swatches for metric -->
                            <div class="hidden sm:flex items-center gap-1">
                              ${metricPresetColors.slice(0, 6).map(mc => `
                                <button type="button" data-set-metric-color="${mc}" data-metric-idx="${mIdx}" class="w-4 h-4 rounded border ${mColor.toLowerCase() === mc.toLowerCase() ? 'border-slate-800 scale-110' : 'border-white'} shadow-2xs cursor-pointer transition-transform hover:scale-110" style="background-color: ${mc};" title="${mc}"></button>
                              `).join('')}
                            </div>
                          </div>

                          <button type="button" data-remove-submetric="${mIdx}" class="px-2 py-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 font-sans">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
            <button type="button" id="btn-cancel-ranking-modal" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer font-sans">
              Cancel
            </button>

            <button type="button" id="btn-save-ranking-modal" class="px-5 py-2.5 rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              <span>Save Ranking Record</span>
            </button>
          </div>

        </div>
      `;

      // 2. Restore scroll positions
      const newModalBody = modalEl.querySelector('#ranking-modal-body');
      const newSubmetricsList = modalEl.querySelector('#submetrics-list-container');
      if (newModalBody && savedBodyScrollTop) newModalBody.scrollTop = savedBodyScrollTop;
      if (newSubmetricsList && savedListScrollTop) newSubmetricsList.scrollTop = savedListScrollTop;

      // Sync form fields into modalData before re-rendering or saving
      const syncModalInputs = () => {
        if (isCustomOrg) {
          const customOrgInput = modalEl.querySelector('#rf-custom-org-input');
          if (customOrgInput) modalData.org = customOrgInput.value.trim();
        } else {
          const orgSelect = modalEl.querySelector('#rf-org-select');
          if (orgSelect) {
            if (orgSelect.value === '__custom__') {
              modalData.org = '';
            } else {
              modalData.org = orgSelect.value;
            }
          }
        }

        const badgeColorHexInput = modalEl.querySelector('#rf-badge-color-hex');
        const badgeColorPicker = modalEl.querySelector('#rf-badge-color');
        if (badgeColorHexInput) {
          modalData.badgeColor = badgeColorHexInput.value.trim() || (badgeColorPicker ? badgeColorPicker.value : '#24305e');
        }

        const yearInput = modalEl.querySelector('#rf-year');
        const mainRankInput = modalEl.querySelector('#rf-mainRank');
        const mainRankLabelInput = modalEl.querySelector('#rf-mainRankLabel');
        const categoryInput = modalEl.querySelector('#rf-category');
        const publicationDateInput = modalEl.querySelector('#rf-publicationDate');
        const publicationUrlInput = modalEl.querySelector('#rf-publicationUrl');
        const shortDescInput = modalEl.querySelector('#rf-shortDescription');

        if (yearInput) modalData.year = yearInput.value.trim();
        if (mainRankInput) modalData.mainRank = mainRankInput.value.trim();
        if (mainRankLabelInput) modalData.mainRankLabel = mainRankLabelInput.value.trim();
        if (categoryInput) modalData.category = categoryInput.value.trim();
        if (publicationDateInput) modalData.publicationDate = publicationDateInput.value.trim();
        if (publicationUrlInput) modalData.publicationUrl = publicationUrlInput.value.trim();
        if (shortDescInput) modalData.shortDescription = shortDescInput.value.trim();

        // Sync Sub-metrics
        modalEl.querySelectorAll('[data-metric-field]').forEach(input => {
          const field = input.dataset.metricField;
          const idx = parseInt(input.dataset.metricIdx, 10);
          if (modalData.metrics[idx]) {
            if (field === 'color' || field === 'color-hex') {
              modalData.metrics[idx].color = input.value.trim();
            } else {
              modalData.metrics[idx][field] = input.value;
            }
          }
        });
      };

      // Modal Events
      const closeBtn = modalEl.querySelector('#btn-close-ranking-modal');
      const cancelBtn = modalEl.querySelector('#btn-cancel-ranking-modal');
      const closeModal = () => {
        modalEl.remove();
        this.activeModal = null;
      };
      if (closeBtn) closeBtn.onclick = closeModal;
      if (cancelBtn) cancelBtn.onclick = closeModal;

      // Org Dropdown Change Listener
      const orgSelect = modalEl.querySelector('#rf-org-select');
      if (orgSelect) {
        orgSelect.onchange = () => {
          syncModalInputs();
          if (orgSelect.value === '__custom__') {
            isCustomOrg = true;
            modalData.org = '';
            modalData.badgeColor = '#24305e';
          } else {
            isCustomOrg = false;
            modalData.org = orgSelect.value;
            modalData.badgeColor = this.getDefaultBadgeColor(modalData.org);
          }
          renderModal();
        };
      }

      // Back to Presets from Custom Org
      const btnBackPresets = modalEl.querySelector('#btn-back-to-presets');
      if (btnBackPresets) {
        btnBackPresets.onclick = () => {
          syncModalInputs();
          isCustomOrg = false;
          modalData.org = savedOrgs[0] || 'WURI';
          modalData.badgeColor = this.getDefaultBadgeColor(modalData.org);
          renderModal();
        };
      }

      // Custom Org Input
      const customOrgInput = modalEl.querySelector('#rf-custom-org-input');
      if (customOrgInput) {
        customOrgInput.oninput = () => {
          modalData.org = customOrgInput.value.trim();
        };
      }

      // Badge Color Picker Listeners (Instant in-place update, NO full re-render)
      const badgeColorPicker = modalEl.querySelector('#rf-badge-color');
      const badgeColorHex = modalEl.querySelector('#rf-badge-color-hex');
      const badgePreview = modalEl.querySelector('#rf-badge-preview');

      const updateBadgeColorInPlace = (newColor) => {
        modalData.badgeColor = newColor;
        if (badgeColorPicker) badgeColorPicker.value = newColor;
        if (badgeColorHex) badgeColorHex.value = newColor;
        if (badgePreview) badgePreview.style.backgroundColor = newColor;
        modalEl.querySelectorAll('[data-set-badge-color]').forEach(b => {
          const isMatch = b.dataset.setBadgeColor.toLowerCase() === newColor.toLowerCase();
          b.className = `w-6 h-6 rounded-lg border-2 ${isMatch ? 'border-slate-800 scale-110' : 'border-white'} shadow-2xs cursor-pointer transition-transform hover:scale-110`;
        });
      };

      if (badgeColorPicker && badgeColorHex) {
        badgeColorPicker.oninput = () => updateBadgeColorInPlace(badgeColorPicker.value);
        badgeColorHex.oninput = () => {
          const val = badgeColorHex.value.trim();
          modalData.badgeColor = val;
          if (/^#[0-9A-F]{6}$/i.test(val)) {
            if (badgeColorPicker) badgeColorPicker.value = val;
            if (badgePreview) badgePreview.style.backgroundColor = val;
          }
        };
      }

      // Quick Badge Color Preset Swatches (Instant in-place update, NO full re-render)
      modalEl.querySelectorAll('[data-set-badge-color]').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          updateBadgeColorInPlace(btn.dataset.setBadgeColor);
        };
      });

      // Sub-metric In-Place Color Swatch Buttons & Pickers (Zero Scroll-Jump, Zero Re-render)
      modalEl.querySelectorAll('[data-set-metric-color]').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          const mIdx = parseInt(btn.dataset.metricIdx, 10);
          const newColor = btn.dataset.setMetricColor;
          if (modalData.metrics[mIdx]) {
            modalData.metrics[mIdx].color = newColor;
          }
          const card = modalEl.querySelector(`[data-metric-card="${mIdx}"]`);
          if (card) {
            const picker = card.querySelector('input[type="color"][data-metric-field="color"]');
            const hex = card.querySelector('input[data-metric-field="color-hex"]');
            if (picker) picker.value = newColor;
            if (hex) hex.value = newColor;
            card.querySelectorAll('[data-set-metric-color]').forEach(b => {
              const isMatch = b.dataset.setMetricColor.toLowerCase() === newColor.toLowerCase();
              b.className = `w-4 h-4 rounded border ${isMatch ? 'border-slate-800 scale-110' : 'border-white'} shadow-2xs cursor-pointer transition-transform hover:scale-110`;
            });
          }
        };
      });

      // Sub-metric Color Pickers sync (In-place, no re-render)
      modalEl.querySelectorAll('input[type="color"][data-metric-field="color"]').forEach(picker => {
        const idx = parseInt(picker.dataset.metricIdx, 10);
        const card = modalEl.querySelector(`[data-metric-card="${idx}"]`);
        const hexInput = card ? card.querySelector('input[data-metric-field="color-hex"]') : null;
        
        picker.oninput = () => {
          const newColor = picker.value;
          if (hexInput) hexInput.value = newColor;
          if (modalData.metrics[idx]) modalData.metrics[idx].color = newColor;
          if (card) {
            card.querySelectorAll('[data-set-metric-color]').forEach(b => {
              const isMatch = b.dataset.setMetricColor.toLowerCase() === newColor.toLowerCase();
              b.className = `w-4 h-4 rounded border ${isMatch ? 'border-slate-800 scale-110' : 'border-white'} shadow-2xs cursor-pointer transition-transform hover:scale-110`;
            });
          }
        };

        if (hexInput) {
          hexInput.oninput = () => {
            const val = hexInput.value.trim();
            if (modalData.metrics[idx]) modalData.metrics[idx].color = val;
            if (/^#[0-9A-F]{6}$/i.test(val)) {
              picker.value = val;
              if (card) {
                card.querySelectorAll('[data-set-metric-color]').forEach(b => {
                  const isMatch = b.dataset.setMetricColor.toLowerCase() === val.toLowerCase();
                  b.className = `w-4 h-4 rounded border ${isMatch ? 'border-slate-800 scale-110' : 'border-white'} shadow-2xs cursor-pointer transition-transform hover:scale-110`;
                });
              }
            }
          };
        }
      });

      // Add Sub-metric (Preserves scroll position)
      const btnAddSubmetric = modalEl.querySelector('#btn-add-submetric');
      if (btnAddSubmetric) {
        btnAddSubmetric.onclick = () => {
          syncModalInputs();
          modalData.metrics.push({
            label: '',
            value: '#1',
            subtext: '',
            color: '#394a8a'
          });
          renderModal();
        };
      }

      // Remove Sub-metric (Preserves scroll position)
      modalEl.querySelectorAll('[data-remove-submetric]').forEach(btn => {
        btn.onclick = () => {
          syncModalInputs();
          const mIdx = parseInt(btn.dataset.removeSubmetric, 10);
          modalData.metrics.splice(mIdx, 1);
          renderModal();
        };
      });

      // Logo Dropzone Drag & Drop and File Picker
      const dropzone = modalEl.querySelector('#ranking-logo-dropzone');
      const fileInput = modalEl.querySelector('#ranking-logo-input');

      if (dropzone && fileInput) {
        dropzone.onclick = (e) => {
          if (e.target.closest('#btn-reset-rank-logo')) return;
          fileInput.click();
        };

        dropzone.ondragover = (e) => {
          e.preventDefault();
          dropzone.classList.add('border-ucu-blue', 'bg-ucu-blue/5');
        };
        dropzone.ondragleave = () => {
          dropzone.classList.remove('border-ucu-blue', 'bg-ucu-blue/5');
        };
        dropzone.ondrop = (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-ucu-blue', 'bg-ucu-blue/5');
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
              syncModalInputs();
              const reader = new FileReader();
              reader.onload = (ev) => {
                modalData.logo = ev.target.result;
                renderModal();
              };
              reader.readAsDataURL(file);
            }
          }
        };

        fileInput.onchange = (e) => {
          if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            syncModalInputs();
            const reader = new FileReader();
            reader.onload = (ev) => {
              modalData.logo = ev.target.result;
              renderModal();
            };
            reader.readAsDataURL(file);
          }
        };
      }

      // Reset Logo to Default
      const resetLogoBtn = modalEl.querySelector('#btn-reset-rank-logo');
      if (resetLogoBtn) {
        resetLogoBtn.onclick = (e) => {
          e.stopPropagation();
          syncModalInputs();
          modalData.logo = '';
          renderModal();
        };
      }

      // Save Ranking Action
      const saveBtn = modalEl.querySelector('#btn-save-ranking-modal');
      if (saveBtn) {
        saveBtn.onclick = () => {
          syncModalInputs();

          if (!modalData.org) {
            alert('Please select or provide the Ranking Organization Name.');
            return;
          }
          if (!modalData.year) {
            alert('Please specify the Assessment Year.');
            return;
          }
          if (!modalData.mainRank) {
            alert('Please provide the Main Rank Value.');
            return;
          }

          const draft = cmsState.currentDraft;
          if (!Array.isArray(draft.rankingsList)) draft.rankingsList = [];

          if (isNew) {
            draft.rankingsList.unshift(modalData);
          } else {
            draft.rankingsList[index] = modalData;
          }

          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(draft);
          closeModal();

          if (parentFormEngine) parentFormEngine.render();
        };
      }
    };

    renderModal();
    document.body.appendChild(modalEl);
    this.activeModal = modalEl;
  }
}

export const rankingsManager = new RankingsManager();
