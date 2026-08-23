// admin/js/modules/partnerships-manager.js
// Modular Feature Manager for Strategic Linkages & Partnerships (CMS Studio)

import { cmsState } from '../cms-state.js';
import { previewBridge } from '../preview-bridge.js';
import { lucideIconPicker } from '../lucide-icon-picker.js';

const defaultPartnerMetricDefs = [
  {
    metricId: 'localAcademicCount',
    label: 'Local Academic Partners',
    categoryKey: 'local-academic',
    theme: 'white',
    icon: 'graduation-cap',
    svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'
  },
  {
    metricId: 'localIndustryCount',
    label: 'Local Industry Partners',
    categoryKey: 'local-industry',
    theme: 'white',
    icon: 'map-pin',
    svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'
  },
  {
    metricId: 'intlAcademicCount',
    label: 'International Academic Partners',
    categoryKey: 'international-academic',
    theme: 'white',
    icon: 'globe',
    svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>'
  },
  {
    metricId: 'intlIndustryCount',
    label: 'International Industry Partners',
    categoryKey: 'international-industry',
    theme: 'white',
    icon: 'briefcase',
    svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'
  },
  {
    metricId: 'membershipCount',
    label: 'Memberships',
    categoryKey: 'membership',
    theme: 'white',
    icon: 'award',
    svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>'
  },
  {
    metricId: 'countriesCount',
    label: 'Represented Countries',
    categoryKey: 'countries',
    theme: 'white',
    icon: 'flag',
    svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>'
  }
];

export class PartnershipsManager {
  constructor() {
    this.filterCategory = 'all';
    this.sortBy = 'recent'; // 'recent' | 'alphabetical'
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
   * Resolve logo path for Admin Studio context
   */
  resolveLogoSrc(src) {
    if (!src) return '';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
      return src;
    }
    if (src.startsWith('../')) return src;
    if (src.startsWith('./')) return '../' + src.slice(2);
    return '../' + src;
  }

  /**
   * Get Human-Readable Category Label & Style
   */
  getCategoryMeta(cat) {
    const map = {
      'local-academic': { label: 'Local Academic', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'local-industry': { label: 'Local Industry', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      'international-academic': { label: 'International Academic', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      'international-industry': { label: 'International Industry', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      'membership': { label: 'Memberships', color: 'bg-teal-100 text-teal-800 border-teal-200' }
    };
    return map[cat] || { label: cat || 'General Partner', color: 'bg-slate-100 text-slate-800 border-slate-200' };
  }

  /**
   * Render filtered cards grid HTML
   */
  renderPartnerCardsHtml(filteredPartners) {
    if (filteredPartners.length === 0) {
      return `
        <div class="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50/50">
          <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h4 class="text-xs font-bold text-slate-700 font-sans">No partner organizations found</h4>
          <p class="text-[11px] text-slate-400 max-w-sm mx-auto font-sans leading-relaxed">Try clearing your search query or selecting a different category tab.</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${filteredPartners.map(p => {
          const catMeta = this.getCategoryMeta(p.category);
          const logoSrc = p.logoSrc || '';
          const resolvedLogo = this.resolveLogoSrc(logoSrc);

          return `
            <div class="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between gap-3 group hover:border-slate-300 hover:shadow-xs transition-all">
              <div class="space-y-3">
                <div class="w-full h-24 rounded-xl bg-slate-50 border border-slate-200/80 p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                  ${logoSrc ? `
                    <img src="${resolvedLogo}" alt="${this.escape(p.name)}" class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" onerror="this.src='data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 60\\'%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%23f1f5f9\\'/ %3E%3Ctext x=\\'50%25\\' y=\\'55%25\\' text-anchor=\\'middle\\' font-size=\\'12\\' fill=\\'%2394a3b8\\'%3ELogo%3C/text%3E%3C/svg%3E'">
                  ` : `
                    <div class="text-xs font-bold text-slate-400 flex items-center gap-1.5 font-sans">
                      <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                      <span>No Logo</span>
                    </div>
                  `}
                </div>
                <div>
                  <div class="flex items-center gap-1 mb-1">
                    <span class="px-2 py-0.5 text-[9px] font-bold rounded-md border ${catMeta.color} font-sans">
                      ${catMeta.label}
                    </span>
                  </div>
                  <h4 class="text-xs font-bold text-slate-800 line-clamp-2 leading-tight font-sans" title="${this.escape(p.name)}">
                    ${this.escape(p.name)}
                  </h4>
                  ${p.url ? `
                    <a href="${this.escape(p.url)}" target="_blank" class="inline-flex items-center gap-1 text-[10px] font-semibold text-ucu-blue hover:text-ucu-blue-dark hover:underline truncate max-w-full mt-1 font-sans">
                      <svg class="w-3 h-3 text-ucu-blue shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      <span class="truncate">${this.escape(p.url.replace(/^https?:\/\//, ''))}</span>
                    </a>
                  ` : ''}
                </div>
              </div>
              <div class="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                <button type="button" data-partner-edit="${p.originalIndex}" class="flex-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 font-sans">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>Edit</span>
                </button>
                <button type="button" data-partner-delete="${p.originalIndex}" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer" title="Delete Partner">
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
   * Render Partnerships CMS Management View
   */
  render(draft) {
    if (!draft) draft = {};
    if (!Array.isArray(draft.partnersList)) {
      draft.partnersList = (typeof window !== 'undefined' && Array.isArray(window.UCU_PARTNERS)) 
        ? JSON.parse(JSON.stringify(window.UCU_PARTNERS)) 
        : [];
    }

    const partners = draft.partnersList;
    const countries = Array.isArray(draft.countries) ? draft.countries : [];

    // Live Auto-Calculation for the 6 Metric Cards
    const getComputedValue = (def) => {
      if (def.categoryKey === 'countries') {
        return String(countries.length > 0 ? countries.length : 22);
      }
      const count = partners.filter(p => p.category === def.categoryKey).length;
      return String(count);
    };

    if (!Array.isArray(draft.metrics) || draft.metrics.length !== 6) {
      draft.metrics = defaultPartnerMetricDefs.map(def => ({
        metricId: def.metricId,
        label: def.label,
        value: getComputedValue(def),
        theme: def.theme || 'white',
        icon: def.icon || 'award',
        svgIcon: def.svgIcon
      }));
    } else {
      defaultPartnerMetricDefs.forEach((def, idx) => {
        if (!draft.metrics[idx]) draft.metrics[idx] = { ...def };
        draft.metrics[idx].label = def.label;
        draft.metrics[idx].value = getComputedValue(def);
        if (!draft.metrics[idx].theme) draft.metrics[idx].theme = def.theme || 'white';
        if (!draft.metrics[idx].icon && !draft.metrics[idx].svgIcon) {
          draft.metrics[idx].icon = def.icon;
          draft.metrics[idx].svgIcon = def.svgIcon;
        }
      });
    }

    const metrics = draft.metrics;

    // Filter partners
    let filteredPartners = partners.map((p, originalIndex) => ({ ...p, originalIndex })).filter(p => {
      const matchCat = this.filterCategory === 'all' || p.category === this.filterCategory;
      const matchSearch = !this.searchQuery || (p.name && p.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });

    if (this.sortBy === 'alphabetical') {
      filteredPartners.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    }

    const categoryCounts = {
      'all': partners.length,
      'local-academic': partners.filter(p => p.category === 'local-academic').length,
      'local-industry': partners.filter(p => p.category === 'local-industry').length,
      'international-academic': partners.filter(p => p.category === 'international-academic').length,
      'international-industry': partners.filter(p => p.category === 'international-industry').length,
      'membership': partners.filter(p => p.category === 'membership').length,
    };

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        <!-- Studio Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">Header Page</span>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">partnership.html</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight font-sans">Partnerships Studio</h2>
          </div>
          <button type="button" id="btn-add-partner" class="px-4 py-2 text-xs font-bold rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 font-sans">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add New Partner</span>
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
              <input type="text" data-bind="heroEyebrow" value="${this.escape(draft.heroEyebrow || 'Trusted Connections. Global Vision.')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Main Headline</label>
              <input type="text" data-bind="heroHeadline" value="${this.escape(draft.heroHeadline || 'UCU Beyond')}" class="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Highlight Word / Accent</label>
              <input type="text" data-bind="heroHighlight" value="${this.escape(draft.heroHighlight || 'Borders')}" class="w-full px-3 py-1.5 text-xs font-bold text-ucu-blue bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Hero Description Paragraph</label>
            <textarea data-bind="heroDescription" rows="2" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">${this.escape(draft.heroDescription || 'Creating lasting partnerships that empower education, elevate standards, and connect Urdaneta City University to opportunities across the world.')}</textarea>
          </div>
        </div>

        <!-- Section 2: Metrics Cards Builder (Auto-Calculated) -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 2</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span>Metrics Cards (${metrics.length})</span>
              </h3>
            </div>
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 text-[10px] font-bold font-sans">
              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Values &amp; Names Auto-Calculated</span>
            </div>
          </div>

          <div class="space-y-3" id="partnerships-metrics-container">
            ${metrics.map((m, idx) => {
              const iconKey = m.icon || '';
              const iconSvg = iconKey 
                ? lucideIconPicker.getSvg(iconKey, 20, 2)
                : (m.svgIcon && m.svgIcon.includes('<svg') ? m.svgIcon : lucideIconPicker.getSvg('award', 20, 2));

              return `
                <div class="p-4 bg-slate-50/80 border border-slate-200/90 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-slate-300">
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="w-7 h-7 rounded-lg bg-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 font-sans">
                      #${idx + 1}
                    </div>
                    
                    <!-- Lucide Icon Selector Button -->
                    <button 
                      type="button" 
                      data-pick-partner-metric-icon="${idx}" 
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
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Value (Auto-Calculated)</label>
                      <div class="relative">
                        <input type="text" value="${this.escape(m.value || '')}" readonly disabled class="w-full px-3 py-1.5 text-xs font-black text-ucu-blue-dark bg-slate-100/90 border border-slate-200 rounded-lg cursor-not-allowed select-none font-sans">
                        <span class="absolute right-2.5 top-1.5 text-[10px] font-bold text-slate-400 font-sans">Fixed</span>
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Metric Label</label>
                      <div class="relative">
                        <input type="text" value="${this.escape(m.label || '')}" readonly disabled class="w-full px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100/90 border border-slate-200 rounded-lg cursor-not-allowed select-none font-sans">
                        <span class="absolute right-2.5 top-1.5 text-[10px] font-bold text-slate-400 font-sans">Fixed</span>
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Theme Color</label>
                      <select data-partner-metric-field="theme" data-metric-idx="${idx}" class="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue cursor-pointer font-sans">
                        <option value="white" ${(m.theme === 'white' || !m.theme) ? 'selected' : ''}>White</option>
                        <option value="blue" ${(m.theme === 'blue' || m.theme === 'navy') ? 'selected' : ''}>Blue</option>
                        <option value="red" ${m.theme === 'red' ? 'selected' : ''}>Red</option>
                      </select>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Section 3: Partners & Alliances Directory -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 3</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                <span>Partners Directory (${filteredPartners.length} of ${partners.length})</span>
              </h3>
            </div>
            <div class="flex flex-wrap items-center gap-2.5">
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
                <button type="button" data-partner-sort="recent" class="px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 font-sans ${this.sortBy === 'recent' ? 'bg-white text-ucu-blue-dark shadow-2xs' : 'text-slate-500 hover:text-slate-800'}">
                  <svg class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Recent</span>
                </button>
                <button type="button" data-partner-sort="alphabetical" class="px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 font-sans ${this.sortBy === 'alphabetical' ? 'bg-white text-ucu-blue-dark shadow-2xs' : 'text-slate-500 hover:text-slate-800'}">
                  <svg class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10M4 18h6"/></svg>
                  <span>Name (A-Z)</span>
                </button>
              </div>
              <div class="relative flex-1 sm:max-w-xs">
                <svg class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="partner-search-input" value="${this.escape(this.searchQuery)}" placeholder="Search partner name..." class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
              </div>
            </div>
          </div>
          <div id="partners-tabs-container" class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto">
            ${[
              { id: 'all', label: 'All Partners' },
              { id: 'local-academic', label: 'Local Academic' },
              { id: 'local-industry', label: 'Local Industry' },
              { id: 'international-academic', label: 'International Academic' },
              { id: 'international-industry', label: 'International Industry' },
              { id: 'membership', label: 'Memberships' }
            ].map(tab => {
              const isActive = this.filterCategory === tab.id;
              const count = categoryCounts[tab.id] || 0;
              return `
                <button type="button" data-partner-tab="${tab.id}" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 font-sans ${isActive ? 'bg-white text-ucu-blue-dark shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                  <span>${tab.label}</span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-ucu-blue/10 text-ucu-blue-dark' : 'bg-slate-200 text-slate-600'} font-bold">${count}</span>
                </button>
              `;
            }).join('')}
          </div>
          <div id="partners-grid-container">
            ${this.renderPartnerCardsHtml(filteredPartners)}
          </div>
        </div>

        <!-- Section 4: Represented Countries -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 4</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              <span>Represented Countries (${countries.length})</span>
            </h3>
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Partner Countries (Comma-Separated)</label>
            <textarea id="countries-input" rows="2" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-medium leading-relaxed font-sans">${this.escape(countries.join(', '))}</textarea>
          </div>
          <div class="pt-1">
            <span class="text-[10px] font-bold uppercase text-slate-400 block mb-2 font-sans">Live Flag Chips:</span>
            <div id="countries-flags-preview" class="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              ${countries.map(c => {
                const flagMap = { Philippines: "ph", Turkey: "tr", Bangladesh: "bd", Indonesia: "id", Japan: "jp", Oman: "om", "South Korea": "kr", Thailand: "th", Taiwan: "tw", Vietnam: "vn", Malaysia: "my", China: "cn", "Bosnia and Herzegovina": "ba", "United Kingdom": "gb", Switzerland: "ch", Poland: "pl", Germany: "de", USA: "us", Canada: "ca", India: "in", France: "fr", Spain: "es" };
                const iso = flagMap[c.trim()] || 'un';
                return `
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs font-sans">
                    <span class="fi fi-${iso}"></span>
                    <span>${this.escape(c.trim())}</span>
                  </span>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Section 5: Direct Linkage Portals & Inquiries -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 5</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <span>Direct Linkage Portals &amp; Inquiries</span>
            </h3>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Alliance Section Title</label>
              <input type="text" data-bind="allianceTitle" value="${this.escape(draft.allianceTitle || 'Forge a Strategic Alliance')}" class="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Partnership Inquiry Google Form URL</label>
              <input type="text" data-bind="partnershipFormUrl" value="${this.escape(draft.partnershipFormUrl || 'https://forms.google.com/your-form-id-here')}" class="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Alliance Narrative Description</label>
            <textarea data-bind="allianceDescription" rows="3" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-sans">${this.escape(draft.allianceDescription || 'Urdaneta City University (UCU) actively seeks to expand its global and local network through high-impact institutional linkages. We invite esteemed academic organizations and industry leaders to initialize formal collaboration proposals via our centralized portal.')}</textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">Directorate of External Linkages Email</label>
              <input type="email" data-bind="emailExternal" value="${this.escape(draft.emailExternal || 'externalaffairsandlinkages@ucu.edu.ph')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-medium font-sans">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-sans">University General Administration Email</label>
              <input type="email" data-bind="emailOfficial" value="${this.escape(draft.emailOfficial || 'officeofthepresident@ucu.edu.ph')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-medium font-sans">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update only the cards grid view without destroying search input focus
   */
  updatePartnersListView(container, parentFormEngine) {
    const draft = cmsState.currentDraft || {};
    const partners = draft.partnersList || [];

    let filteredPartners = partners.map((p, originalIndex) => ({ ...p, originalIndex })).filter(p => {
      const matchCat = this.filterCategory === 'all' || p.category === this.filterCategory;
      const matchSearch = !this.searchQuery || (p.name && p.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });

    if (this.sortBy === 'alphabetical') {
      filteredPartners.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    }

    const gridContainer = container.querySelector('#partners-grid-container');
    if (gridContainer) {
      gridContainer.innerHTML = this.renderPartnerCardsHtml(filteredPartners);
      this.bindCardActions(gridContainer, parentFormEngine);
    }
  }

  /**
   * Bind edit and delete button actions for cards
   */
  bindCardActions(scope, parentFormEngine) {
    const draft = cmsState.currentDraft || {};

    scope.querySelectorAll('[data-partner-edit]').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.partnerEdit, 10);
        const partner = draft.partnersList[idx];
        if (partner) {
          this.openPartnerEditor({
            item: JSON.parse(JSON.stringify(partner)),
            isNew: false,
            index: idx,
            parentFormEngine
          });
        }
      };
    });

    scope.querySelectorAll('[data-partner-delete]').forEach(btn => {
      btn.onclick = async () => {
        const idx = parseInt(btn.dataset.partnerDelete, 10);
        const partner = draft.partnersList[idx];
        if (!partner) return;

        const confirmed = typeof window.cmsConfirm === 'function'
          ? await window.cmsConfirm({
              title: "Delete Partner Organization?",
              description: `Are you sure you want to remove "${partner.name}" from the institutional partners directory?`,
              icon: "🏛️",
              iconBg: "bg-red-500/20 text-red-400",
              confirmText: "Delete Partner",
              confirmClass: "bg-red-600 hover:bg-red-500 text-white"
            })
          : confirm(`Are you sure you want to remove "${partner.name}" from institutional partners?`);

        if (!confirmed) return;

        draft.partnersList.splice(idx, 1);
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(draft);
        if (parentFormEngine) parentFormEngine.render();
      };
    });
  }

  /**
   * Bind event listeners for Partnerships section
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

    // 2. Metric Cards Theme Selector
    container.querySelectorAll('[data-partner-metric-field="theme"]').forEach(select => {
      select.onchange = () => {
        const idx = parseInt(select.dataset.metricIdx, 10);
        if (draft.metrics && draft.metrics[idx]) {
          draft.metrics[idx].theme = select.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(draft);
        }
      };
    });

    // 3. Metric Cards Lucide Icon Picker
    container.querySelectorAll('[data-pick-partner-metric-icon]').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.pickPartnerMetricIcon, 10);
        const currentMetric = draft.metrics ? draft.metrics[idx] : null;
        if (!currentMetric) return;

        lucideIconPicker.open({
          currentIcon: currentMetric.icon || 'award',
          onSelect: (chosenIcon) => {
            currentMetric.icon = chosenIcon;
            const defaultSvg = lucideIconPicker.getSvg(chosenIcon, 28, 2);
            currentMetric.svgIcon = defaultSvg;
            
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            previewBridge.sendLiveUpdate(draft);
            if (parentFormEngine) parentFormEngine.render();
          }
        });
      };
    });

    // 4. Sorting Toggle (Date Modified vs Alphabetical)
    container.querySelectorAll('[data-partner-sort]').forEach(btn => {
      btn.onclick = () => {
        this.sortBy = btn.dataset.partnerSort;
        container.querySelectorAll('[data-partner-sort]').forEach(b => {
          const isCurrent = b.dataset.partnerSort === this.sortBy;
          b.className = `px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${isCurrent ? 'bg-white text-ucu-blue-dark shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`;
        });
        this.updatePartnersListView(container, parentFormEngine);
      };
    });

    // 5. Category Filter Tabs
    container.querySelectorAll('[data-partner-tab]').forEach(btn => {
      btn.onclick = () => {
        this.filterCategory = btn.dataset.partnerTab;
        if (parentFormEngine) parentFormEngine.render();
      };
    });

    // 6. Partner Search Input (Smooth Real-Time Filtering without losing focus)
    const searchInput = container.querySelector('#partner-search-input');
    if (searchInput) {
      searchInput.oninput = () => {
        this.searchQuery = searchInput.value.trim();
        this.updatePartnersListView(container, parentFormEngine);
      };
    }

    // 7. Add Partner Button
    const btnAdd = container.querySelector('#btn-add-partner');
    if (btnAdd) {
      btnAdd.onclick = () => {
        this.openPartnerEditor({
          item: {
            name: '',
            category: this.filterCategory !== 'all' ? this.filterCategory : 'local-academic',
            logoSrc: '',
            url: ''
          },
          isNew: true,
          index: -1,
          parentFormEngine
        });
      };
    }

    // 8. Bind Card Action Buttons
    this.bindCardActions(container, parentFormEngine);

    // 9. Countries Input Binding
    const countriesInput = container.querySelector('#countries-input');
    if (countriesInput) {
      countriesInput.oninput = () => {
        const parsed = countriesInput.value.split(',').map(c => c.trim()).filter(Boolean);
        draft.countries = parsed;

        // Auto-update countries metric count live
        if (draft.metrics && draft.metrics[5]) {
          draft.metrics[5].value = String(parsed.length);
        }

        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(draft);

        // Update live flags preview
        const flagsPreview = container.querySelector('#countries-flags-preview');
        if (flagsPreview) {
          const flagMap = { Philippines: "ph", Turkey: "tr", Bangladesh: "bd", Indonesia: "id", Japan: "jp", Oman: "om", "South Korea": "kr", Thailand: "th", Taiwan: "tw", Vietnam: "vn", Malaysia: "my", China: "cn", "Bosnia and Herzegovina": "ba", "United Kingdom": "gb", Switzerland: "ch", Poland: "pl", Germany: "de", USA: "us", Canada: "ca", India: "in", France: "fr", Spain: "es" };
          flagsPreview.innerHTML = parsed.map(c => {
            const iso = flagMap[c.trim()] || 'un';
            return `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs font-sans">
                <span class="fi fi-${iso}"></span>
                <span>${this.escape(c.trim())}</span>
              </span>
            `;
          }).join('');
        }
      };
    }
  }

  /**
   * Center Modal Dedicated Partner Organization Editor
   */
  openPartnerEditor({ item, isNew, index, parentFormEngine }) {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }

    const modalData = { ...item };

    const modalEl = document.createElement('div');
    modalEl.id = 'partner-modal-overlay';
    modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn';

    const renderModal = () => {
      const resolvedLogo = this.resolveLogoSrc(modalData.logoSrc);

      modalEl.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
          
          <!-- Modal Header -->
          <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-ucu-yellow shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <h3 class="text-sm font-bold text-white font-sans">${isNew ? 'Add Partner Organization' : 'Edit Partner Details'}</h3>
            </div>
            <button type="button" id="btn-close-partner-modal" class="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer font-sans" title="Close Modal">
              ✕
            </button>
          </div>

          <!-- Modal Body Form -->
          <div class="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs">
            
            <!-- Logo / Emblem Square Dropzone -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-slate-700 font-sans">Organization Logo / Emblem</label>
                ${modalData.logoSrc ? `
                  <button type="button" id="btn-remove-logo" class="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors cursor-pointer font-sans" title="Remove attached logo">
                    Remove Logo
                  </button>
                ` : ''}
              </div>
              
              <div id="partner-logo-dropzone" class="group relative w-full h-28 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-ucu-blue/40 flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all">
                ${modalData.logoSrc ? `
                  <img src="${resolvedLogo}" alt="Partner Logo Preview" class="w-full h-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-95">
                  <!-- Hover Overlay -->
                  <div class="absolute inset-0 bg-slate-900/75 backdrop-blur-2xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all p-2 text-center text-white">
                    <svg class="w-5 h-5 mb-1 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span class="text-[11px] font-bold">Replace Logo</span>
                  </div>
                ` : `
                  <div class="flex flex-col items-center justify-center p-2 text-center text-slate-400 group-hover:text-ucu-blue transition-colors">
                    <svg class="w-6 h-6 mb-1 text-slate-400 group-hover:text-ucu-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span class="text-[11px] font-bold font-sans">Upload Logo</span>
                    <span class="text-[9px] text-slate-400 mt-0.5 font-sans">or Drag &amp; Drop (PNG, JPG, SVG, WEBP)</span>
                  </div>
                `}
                <input type="file" id="partner-logo-input" accept="image/*" class="hidden">
              </div>
            </div>

            <!-- Partner Name -->
            <div class="space-y-1">
              <label class="block text-[10px] font-bold uppercase text-slate-500 font-sans">Organization / Institution Name <span class="text-red-500">*</span></label>
              <input type="text" id="pf-name" value="${this.escape(modalData.name)}" placeholder="e.g. Ateneo De Davao University" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-bold font-sans">
            </div>

            <!-- Category Selector -->
            <div class="space-y-1">
              <label class="block text-[10px] font-bold uppercase text-slate-500 font-sans">Partnership Category <span class="text-red-500">*</span></label>
              <select id="pf-category" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold font-sans cursor-pointer">
                <option value="local-academic" ${modalData.category === 'local-academic' ? 'selected' : ''}>Local Academic (Universities &amp; Colleges)</option>
                <option value="local-industry" ${modalData.category === 'local-industry' ? 'selected' : ''}>Local Industry (Government, NGOs &amp; Industry)</option>
                <option value="international-academic" ${modalData.category === 'international-academic' ? 'selected' : ''}>International Academic (Global Universities)</option>
                <option value="international-industry" ${modalData.category === 'international-industry' ? 'selected' : ''}>International Industry (Global Organizations)</option>
                <option value="membership" ${modalData.category === 'membership' ? 'selected' : ''}>Memberships (Global Alliances)</option>
              </select>
            </div>

            <!-- Official Website URL -->
            <div class="space-y-1">
              <label class="block text-[10px] font-bold uppercase text-slate-500 font-sans">Official Website URL (Optional)</label>
              <input type="url" id="pf-url" value="${this.escape(modalData.url)}" placeholder="https://example.edu.ph" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-mono">
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
            <button type="button" id="btn-cancel-partner-modal" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer font-sans">
              Cancel
            </button>

            <button type="button" id="btn-save-partner-modal" class="px-5 py-2.5 rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              <span>Save Partner</span>
            </button>
          </div>

        </div>
      `;

      // Modal Events
      const closeBtn = modalEl.querySelector('#btn-close-partner-modal');
      const cancelBtn = modalEl.querySelector('#btn-cancel-partner-modal');
      const closeModal = () => {
        modalEl.remove();
        this.activeModal = null;
      };
      if (closeBtn) closeBtn.onclick = closeModal;
      if (cancelBtn) cancelBtn.onclick = closeModal;

      // Dropzone & File Input Handler
      const dropzone = modalEl.querySelector('#partner-logo-dropzone');
      const fileInput = modalEl.querySelector('#partner-logo-input');

      const captureFields = () => {
        const nameInput = modalEl.querySelector('#pf-name');
        const catSelect = modalEl.querySelector('#pf-category');
        const urlInput = modalEl.querySelector('#pf-url');
        if (nameInput) modalData.name = nameInput.value;
        if (catSelect) modalData.category = catSelect.value;
        if (urlInput) modalData.url = urlInput.value;
      };

      if (dropzone && fileInput) {
        dropzone.onclick = (e) => {
          if (e.target.closest('#btn-remove-logo')) return;
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
              captureFields();
              const reader = new FileReader();
              reader.onload = (ev) => {
                modalData.logoSrc = ev.target.result;
                renderModal();
              };
              reader.readAsDataURL(file);
            }
          }
        };

        fileInput.onchange = (e) => {
          if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            captureFields();
            const reader = new FileReader();
            reader.onload = (ev) => {
              modalData.logoSrc = ev.target.result;
              renderModal();
            };
            reader.readAsDataURL(file);
          }
        };
      }

      // Remove Logo
      const removeLogoBtn = modalEl.querySelector('#btn-remove-logo');
      if (removeLogoBtn) {
        removeLogoBtn.onclick = (e) => {
          e.stopPropagation();
          captureFields();
          modalData.logoSrc = '';
          renderModal();
        };
      }

      // Save Partner Action
      const saveBtn = modalEl.querySelector('#btn-save-partner-modal');
      if (saveBtn) {
        saveBtn.onclick = () => {
          captureFields();

          const finalName = (modalData.name || '').trim();
          const finalCategory = modalData.category || 'local-academic';
          const finalUrl = (modalData.url || '').trim();

          if (!finalName) {
            alert('Please provide the Organization / Institution Name.');
            const nameInput = modalEl.querySelector('#pf-name');
            if (nameInput) nameInput.focus();
            return;
          }

          const draft = cmsState.currentDraft;
          if (!draft.partnersList) draft.partnersList = [];

          const updatedPartner = {
            name: finalName,
            category: finalCategory,
            logoSrc: modalData.logoSrc || '',
            url: finalUrl,
            updatedAt: new Date().toISOString()
          };

          if (isNew) {
            draft.partnersList.unshift(updatedPartner);
          } else {
            draft.partnersList[index] = updatedPartner;
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

export const partnershipsManager = new PartnershipsManager();
