// admin/js/modules/events-manager.js
// Modular Feature Manager for Impact & Events (CMS Studio)

import { cmsState } from '../cms-state.js';
import { previewBridge } from '../preview-bridge.js';
import { universalBlockEditor } from '../universal-block-editor.js';
import { lucideIconPicker } from '../lucide-icon-picker.js';
import { escapeHtml, resolveAssetUrl, SDG_METADATA } from '../shared-utils.js';

export const SDG_COLORS = Object.fromEntries(
  Object.entries(SDG_METADATA).map(([num, data]) => [num, data.color])
);

if (typeof window !== 'undefined' && !window.UCU_SDG_COLORS) {
  window.UCU_SDG_COLORS = SDG_COLORS;
}

export class EventsManager {
  constructor() {
    this.filterKeyword = '';
    this.filterSdg = 'all';
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
   * Render Impact & Events CMS Management View
   */
  render(draft) {
    const eventsList = Array.isArray(draft.eventsList) ? draft.eventsList : [];
    const metrics = Array.isArray(draft.metrics) ? draft.metrics : [];
    const colors = window.UCU_SDG_COLORS || SDG_COLORS;
    
    // Separate Highlighted / Featured Event
    const featuredItem = eventsList.find(e => e.isHighlights || e.isFeatured) || null;

    // Filter events by keyword and SDG
    let displayList = eventsList;
    if (this.filterKeyword.trim().length > 0) {
      const kw = this.filterKeyword.toLowerCase().trim();
      displayList = displayList.filter(e => {
        return (e.title || '').toLowerCase().includes(kw) ||
               (e.desc || '').toLowerCase().includes(kw) ||
               (e.date || '').toLowerCase().includes(kw);
      });
    }

    if (this.filterSdg !== 'all') {
      const targetNum = parseInt(this.filterSdg, 10);
      displayList = displayList.filter(e => (e.relatedSdgs || []).includes(targetNum));
    }

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        
        <!-- Header & Top Action -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Header Page</span>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">impact.html</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Impact &amp; Events Studio</h2>
          </div>

          <button type="button" id="btn-create-event" class="px-4 py-2 text-xs font-bold rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Impact Event</span>
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
              <input type="text" data-bind="heroEyebrow" value="${this.escape(draft.heroEyebrow || 'News & Documentation')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Main Headline</label>
              <input type="text" data-bind="heroHeadline" value="${this.escape(draft.heroHeadline || 'Impact & Events')}" class="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Highlight Word / Accent</label>
              <input type="text" data-bind="heroHighlight" value="${this.escape(draft.heroHighlight || 'Engagements.')}" class="w-full px-3 py-1.5 text-xs font-bold text-ucu-blue bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Hero Description Paragraph</label>
            <textarea data-bind="heroDescription" rows="2" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:bg-white focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">${this.escape(draft.heroDescription || "Documenting UCU's institutional milestones, community engagements, and sustainable development initiatives.")}</textarea>
          </div>
        </div>

        <!-- Section 2: Metrics Cards Builder -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 2</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span>Metrics Cards (${metrics.length})</span>
              </h3>
            </div>
            <button type="button" id="btn-add-event-metric" class="px-3 py-1.5 text-xs font-bold rounded-xl bg-ucu-blue text-white hover:bg-ucu-blue-dark transition-all flex items-center gap-1 shadow-2xs cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Add Metric Card</span>
            </button>
          </div>

          <div class="space-y-3" id="events-metrics-container">
            ${metrics.map((m, idx) => {
              const iconKey = m.icon || m.iconName || '';
              const iconSvg = iconKey 
                ? lucideIconPicker.getSvg(iconKey, 20, 2)
                : (m.svgIcon && m.svgIcon.includes('<svg') ? m.svgIcon : lucideIconPicker.getSvg('award', 20, 2));

              return `
                <div class="p-4 bg-slate-50/80 border border-slate-200/90 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-slate-300">
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="w-7 h-7 rounded-lg bg-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      #${idx + 1}
                    </div>
                    
                    <!-- Lucide Icon Selector Button -->
                    <button 
                      type="button" 
                      data-pick-metric-icon="${idx}" 
                      class="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:border-ucu-blue text-ucu-blue-dark hover:text-ucu-blue flex items-center justify-center shadow-2xs hover:shadow-xs transition-all cursor-pointer group" 
                      title="Click to Choose Lucide Icon (${iconKey || 'default'})"
                    >
                      <div class="w-5 h-5 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform">
                        ${iconSvg}
                      </div>
                    </button>
                  </div>
                  
                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    <div>
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Value (e.g. 48 / 100% / 1,920)</label>
                      <input type="text" data-metric-field="value" data-metric-index="${idx}" value="${this.escape(m.value || '')}" placeholder="e.g. 48" class="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Metric Label</label>
                      <input type="text" data-metric-field="label" data-metric-index="${idx}" value="${this.escape(m.label || '')}" placeholder="e.g. Total Engagements" class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Theme Color</label>
                      <select data-metric-field="theme" data-metric-index="${idx}" class="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue cursor-pointer">
                        <option value="white" ${(m.theme === 'white' || !m.theme) ? 'selected' : ''}>White</option>
                        <option value="navy" ${(m.theme === 'navy' || m.theme === 'blue') ? 'selected' : ''}>Blue</option>
                        <option value="red" ${m.theme === 'red' ? 'selected' : ''}>Red</option>
                      </select>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
                    <button type="button" data-event-action="delete-metric" data-metric-index="${idx}" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer" title="Remove Metric">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
            
            ${(!metrics || metrics.length === 0) ? `
              <div class="py-8 text-center bg-slate-50 border border-slate-200 rounded-xl border-dashed">
                <p class="text-xs font-semibold text-slate-500">No impact metrics created yet. Click "Add Metric Card" above.</p>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Section 3: Highlighted Event (Featured Hero Card matching Announcement Studio) -->
        <div class="space-y-3">
          <div class="flex items-center gap-2.5">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 3</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Highlighted Event</span>
            </h3>
          </div>

          ${featuredItem ? this.renderFeaturedCard(featuredItem, eventsList.indexOf(featuredItem)) : `
            <div class="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
              </div>
              <h4 class="text-sm font-bold text-slate-700">No Impact Event Currently Highlighted</h4>
              <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Highlight an event by clicking the <strong>"Highlight"</strong> button on any card below to display it as the hero card across the Impact page.
              </p>
            </div>
          `}
        </div>

        <!-- Section 4: Events Repository -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 4</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>Events Repository (${displayList.length} of ${eventsList.length})</span>
              </h3>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase text-slate-500">SDG Filter:</span>
              <select id="events-sdg-filter" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue cursor-pointer">
                <option value="all" ${this.filterSdg === 'all' ? 'selected' : ''}>All 17 SDGs</option>
                ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(num => `
                  <option value="${num}" ${this.filterSdg === String(num) ? 'selected' : ''}>SDG ${num}</option>
                `).join('')}
              </select>
            </div>

            <div class="relative flex-1 sm:max-w-xs">
              <svg class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="events-search-input" value="${this.escape(this.filterKeyword)}" placeholder="Search title, date, excerpt..." class="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 text-slate-700 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
            </div>
          </div>

          <!-- Events Grid -->
          ${displayList.length === 0 ? `
            <div class="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl">
              <p class="text-xs font-bold text-slate-600">No events found matching your filter.</p>
              <p class="text-[11px] text-slate-400 mt-1">Try selecting "All 17 SDGs" or click "Add Impact Event" above.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${displayList.map((item) => {
                const globalIndex = eventsList.indexOf(item);
                return this.renderEventCard(item, globalIndex);
              }).join('')}
            </div>
          `}
        </div>

      </div>
    `;
  }

  /**
   * Render Highlighted Hero Card in CMS (Matching Announcement Studio Featured Card Design)
   */
  renderFeaturedCard(item, index) {
    const imgSrc = this.resolveAdminImageSrc(item.img || item.src || '');
    const blockCount = (item.blocks || []).length;
    const relatedSdgs = Array.isArray(item.relatedSdgs) ? item.relatedSdgs : [];
    const colors = window.UCU_SDG_COLORS || SDG_COLORS;

    return `
      <div class="group relative flex flex-col lg:flex-row bg-gradient-to-br from-ucu-blue-dark via-[#1e293b] to-ucu-blue rounded-2xl overflow-hidden shadow-xl border border-white/15 lg:min-h-[320px]">
        
        <!-- Left Content Preview -->
        <div class="flex-1 flex flex-col justify-between p-6 sm:p-8 text-white z-10 space-y-4 lg:max-w-[58%]">
          <div class="space-y-3">
            
            <!-- Top Metadata Row: Badge & Date on Left, SDG Box Numbers on Far Right End -->
            <div class="flex items-center justify-between gap-3 w-full">
              <div class="flex items-center gap-2.5">
                <span class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-ucu-yellow text-ucu-blue-dark rounded-md shadow-2xs flex items-center gap-1 font-sans">
                  <svg class="w-3 h-3 text-ucu-blue-dark fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  <span>Featured Active</span>
                </span>
                
                <span class="text-xs font-semibold text-slate-300 font-sans">
                  ${this.escape(item.date || '2025')}
                </span>
                
                <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800/80 text-slate-300 border border-white/10 hidden sm:inline-block font-sans">
                  ${blockCount} Block${blockCount === 1 ? '' : 's'}
                </span>
              </div>

              <!-- Aligned SDG Badges Placed at Right Corner / End -->
              <div class="ml-auto flex items-center gap-1.5">
                ${relatedSdgs.map(num => `
                  <span style="background-color: ${colors[num] || '#19486A'};" class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shadow-2xs shrink-0 select-none font-sans" title="SDG ${num}">${num}</span>
                `).join('')}
              </div>
            </div>

            <h4 class="text-xl sm:text-2xl font-black text-white leading-tight font-sans">
              ${this.escape(item.title || 'Untitled Headline')}
            </h4>

            <p class="text-xs sm:text-sm text-slate-200 line-clamp-3 leading-relaxed font-normal font-sans">
              ${this.escape(item.desc || 'No summary excerpt provided.')}
            </p>
          </div>

          <!-- 3 CMS Action Buttons -->
          <div class="pt-4 flex flex-wrap items-center gap-2.5 border-t border-white/15">
            <button type="button" data-event-action="edit" data-event-index="${index}" class="px-3.5 py-2 rounded-xl bg-ucu-red hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer font-sans">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Edit Full Event</span>
            </button>

            <button type="button" data-event-action="unhighlight" data-event-index="${index}" class="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-400/40 transition-all flex items-center gap-1.5 cursor-pointer font-sans" title="Remove as Featured Highlight">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Unhighlight</span>
            </button>

            <button type="button" data-event-action="delete" data-event-index="${index}" class="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 font-bold text-xs border border-red-800/50 transition-all flex items-center gap-1.5 cursor-pointer font-sans" title="Delete Event Record">
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
            <div class="w-full h-full flex items-center justify-center text-slate-500 text-xs font-semibold">No Image Attached</div>
          `}
        </div>

      </div>
    `;
  }

  /**
   * Render Individual Event Card in CMS (Matching Announcement Studio Recent Card Design)
   */
  renderEventCard(item, index) {
    const imgSrc = this.resolveAdminImageSrc(item.img || item.src || '');
    const relatedSdgs = Array.isArray(item.relatedSdgs) ? item.relatedSdgs : [];
    const blockCount = (item.blocks || []).length;
    const isHighlight = item.isHighlights === true || item.isFeatured === true;
    const colors = window.UCU_SDG_COLORS || SDG_COLORS;

    return `
      <article class="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 ${isHighlight ? 'bg-white border-2 border-amber-400/90 ring-2 ring-amber-300/40 shadow-sm' : 'bg-white border border-slate-200 shadow-xs hover:border-ucu-red/30 hover:shadow-md'}">
        
        <!-- Card Cover Photo -->
        <div class="w-full h-48 overflow-hidden bg-slate-100 relative shrink-0">
          ${imgSrc ? `
            <img src="${imgSrc}" alt="${this.escape(item.title || 'Event Cover')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.onerror=null; this.src='../images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png';">
          ` : `
            <div class="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold bg-slate-100">
              No Cover Photo
            </div>
          `}

          ${isHighlight ? `
            <span class="absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1">
              <svg class="w-3 h-3 text-slate-950 fill-slate-950" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Featured Active</span>
            </span>
          ` : ''}

          <span class="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold rounded bg-slate-900/80 text-white border border-white/10 backdrop-blur-xs">
            ${blockCount} Block${blockCount === 1 ? '' : 's'}
          </span>
        </div>

        <!-- Card Body (Clean White Canvas) -->
        <div class="flex-1 flex flex-col justify-between p-5 bg-white text-slate-800 space-y-3">
          <div class="space-y-2.5">
            
            <!-- Top Row: Category / Badge on Left, Date on Right (Single Line) -->
            <div class="flex items-center justify-between gap-2 min-w-0">
              <span class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md ${isHighlight ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-red-50 text-ucu-red border border-red-100'} shadow-2xs whitespace-nowrap shrink-0">
                ${this.escape(item.category || item.badge || 'Event')}
              </span>
              
              <span class="text-[10px] font-semibold text-slate-400 ml-auto whitespace-nowrap shrink-0">
                ${this.escape(item.date || '')}
              </span>
            </div>

            <h4 class="text-base font-black text-ucu-blue-dark leading-snug line-clamp-2 group-hover:text-ucu-red transition-colors">
              ${this.escape(item.title || 'Untitled Event')}
            </h4>

            <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed font-normal">
              ${this.escape(item.desc || 'No summary excerpt provided.')}
            </p>
          </div>

          <!-- Bottom Footer Area: Two Dedicated Lines -->
          <div class="pt-3.5 mt-auto border-t border-slate-100 space-y-2.5">
            
            <!-- Line 1: SDG Coordinated Number Boxes (Full Width) -->
            <div class="flex flex-wrap items-center gap-1.5 min-h-[22px]">
              ${(relatedSdgs || []).map(num => {
                const color = colors[num] || '#19486A';
                return `<span style="background-color: ${color};" class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shadow-2xs shrink-0 select-none" title="SDG ${num}">${num}</span>`;
              }).join('')}
            </div>

            <!-- Line 2: CMS Action Buttons Full Row -->
            <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/70">
              <button type="button" data-event-action="toggle-highlight" data-event-index="${index}" class="px-2.5 py-1.5 text-[10px] font-bold rounded-lg ${isHighlight ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 font-black border border-amber-400/50' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80'} transition-all flex items-center gap-1 cursor-pointer shadow-2xs" title="${isHighlight ? 'Featured Active' : 'Set as Featured Highlight'}">
                <svg class="w-3 h-3 ${isHighlight ? 'text-amber-600 fill-amber-500' : 'text-amber-600'}" viewBox="0 0 24 24" ${isHighlight ? '' : 'fill="none" stroke="currentColor" stroke-width="2"'}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>${isHighlight ? 'Highlighted' : 'Highlight'}</span>
              </button>

              <div class="flex items-center gap-1.5">
                <button type="button" data-event-action="edit" data-event-index="${index}" class="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-ucu-blue hover:text-white transition-all flex items-center gap-1 cursor-pointer">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>Edit</span>
                </button>

                <button type="button" data-event-action="delete" data-event-index="${index}" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete Event">
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
   * Bind event listeners for Events section
   */
  bindEvents(container, parentFormEngine) {
    if (!container) return;

    // 1. Hero Properties Bindings
    container.querySelectorAll('[data-bind]').forEach(el => {
      el.addEventListener('input', (e) => {
        const prop = e.target.getAttribute('data-bind');
        cmsState.currentDraft[prop] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // 2. Metrics Card Add
    const btnAddMetric = container.querySelector('#btn-add-event-metric');
    if (btnAddMetric) {
      btnAddMetric.addEventListener('click', () => {
        if (!cmsState.currentDraft.metrics) cmsState.currentDraft.metrics = [];
        cmsState.currentDraft.metrics.push({
          value: '',
          label: '',
          theme: 'white',
          icon: 'award',
          svgIcon: lucideIconPicker.getSvg('award', 28, 2)
        });
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        parentFormEngine.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    // 3. Metrics Card Fields Input
    container.querySelectorAll('[data-metric-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-metric-index'), 10);
        const field = e.target.getAttribute('data-metric-field');
        if (cmsState.currentDraft.metrics && cmsState.currentDraft.metrics[idx]) {
          cmsState.currentDraft.metrics[idx][field] = e.target.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // 4. Lucide Icon Trigger Button
    container.querySelectorAll('[data-pick-metric-icon]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(btn.getAttribute('data-pick-metric-icon'), 10);
        const currentMetric = cmsState.currentDraft.metrics?.[idx];
        const currentIcon = currentMetric?.icon || currentMetric?.iconName || 'award';

        lucideIconPicker.open({
          currentIcon: currentIcon,
          title: `Choose Metric Icon (#${idx + 1})`,
          onSelect: (chosenIcon) => {
            if (!cmsState.currentDraft.metrics) cmsState.currentDraft.metrics = [];
            if (!cmsState.currentDraft.metrics[idx]) cmsState.currentDraft.metrics[idx] = {};
            
            const defaultSvg = lucideIconPicker.getSvg(chosenIcon, 28, 2);
            cmsState.currentDraft.metrics[idx].icon = chosenIcon;
            cmsState.currentDraft.metrics[idx].iconName = chosenIcon;
            cmsState.currentDraft.metrics[idx].svgIcon = defaultSvg;
            
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        });
      });
    });

    // 5. Metrics Card Delete
    container.querySelectorAll('[data-event-action="delete-metric"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-metric-index'), 10);
        const confirmed = await window.cmsConfirm({
          title: "Delete Metric Card?",
          description: "Are you sure you want to remove this metric card from the top of the impact page?",
          icon: "trash",
          iconBg: "bg-red-500/20 text-red-400",
          confirmText: "Delete Metric",
          confirmClass: "bg-red-600 hover:bg-red-500 text-white"
        });

        if (confirmed) {
          cmsState.currentDraft.metrics.splice(idx, 1);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // 6. Search & SDG Filter Inputs
    const searchInput = container.querySelector('#events-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterKeyword = e.target.value;
        parentFormEngine.render();
      });
    }

    const sdgSelect = container.querySelector('#events-sdg-filter');
    if (sdgSelect) {
      sdgSelect.addEventListener('change', (e) => {
        this.filterSdg = e.target.value;
        parentFormEngine.render();
      });
    }

    // 7. Create New Event Button
    const btnCreate = container.querySelector('#btn-create-event');
    if (btnCreate) {
      btnCreate.addEventListener('click', async () => {
        const currentYear = String(cmsState.currentDraft.year || '2025');
        const newEvent = {
          id: `event_${Date.now()}`,
          title: '',
          date: `${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${currentYear}`,
          img: '',
          src: '',
          desc: '',
          relatedSdgs: [1],
          isHighlights: false,
          blocks: []
        };

        const result = await universalBlockEditor.open({
          title: "Create New Impact Event",
          type: "event",
          isNew: true,
          item: newEvent
        });

        if (result) {
          if (!Array.isArray(cmsState.currentDraft.eventsList)) {
            cmsState.currentDraft.eventsList = [];
          }
          cmsState.currentDraft.eventsList.unshift(result);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    }

    // 8. Card Action Buttons
    container.querySelectorAll('[data-event-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-event-action');
        const idx = parseInt(btn.getAttribute('data-event-index'), 10);
        const list = cmsState.currentDraft.eventsList || [];
        const item = list[idx];
        if (!item) return;

        // EDIT ACTION (Center Modal Universal Block Editor)
        if (action === 'edit') {
          const updated = await universalBlockEditor.open({
            title: `Edit Event: ${item.title || 'Event Record'}`,
            type: "event",
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

        // TOGGLE HIGHLIGHT / FEATURE
        else if (action === 'toggle-highlight') {
          if (!item.isHighlights) {
            // Unhighlight other events so this one becomes the active featured hero card
            list.forEach(e => { e.isHighlights = false; e.isFeatured = false; });
            item.isHighlights = true;
            item.isFeatured = true;
          } else {
            item.isHighlights = false;
            item.isFeatured = false;
          }
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }

        // UNHIGHLIGHT ACTION (from Featured Card)
        else if (action === 'unhighlight') {
          item.isHighlights = false;
          item.isFeatured = false;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }

        // DELETE ACTION
        else if (action === 'delete') {
          const confirmed = await window.cmsConfirm({
            title: "Delete Event Record?",
            description: `Are you sure you want to permanently delete "${item.title || 'Untitled'}"?`,
            icon: "trash",
            iconBg: "bg-red-500/20 text-red-400",
            confirmText: "Delete Event",
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
}

export const eventsManager = new EventsManager();

