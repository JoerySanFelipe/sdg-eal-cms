/**
 * js/impact-feeds.js
 * Data-driven feed components for Events, Impact, and Research.
 */

/* ==========================================================================
   SHARED CONSTANTS & STYLES (DRY)
   ========================================================================== */

const UCU_SDG_COLORS_MAP = {
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
  window.UCU_SDG_COLORS = UCU_SDG_COLORS_MAP;
}

const IMPACT_FEED_STYLES = `
  <style>
    .filter-btn { display: inline-flex; justify-content: center; align-items: center; }
    .sdg-hover-btn:hover { border-color: var(--sdg-color); color: var(--sdg-color); background-color: color-mix(in srgb, var(--sdg-color) 5%, white); }
    .sdg-hover-btn[data-active="true"] { background-color: var(--sdg-color); border-color: var(--sdg-color); color: white; }
  </style>
`;

/* ==========================================================================
   3. DATA FEED COMPONENTS
   ========================================================================== */

function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

class UcuEventsPreview extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const base = window.ucuGetBasePath ? window.ucuGetBasePath() : './';
    const limit = parseInt(this.getAttribute("limit") || "3", 10);
    const allEvents = window.UCU_EVENTS || [];
    const colors = window.UCU_SDG_COLORS || {};
    
    let previewEvents = allEvents.filter(ev => ev.isHighlights === true).slice(0, limit);
    if (previewEvents.length === 0 && allEvents.length > 0) {
      previewEvents = allEvents.slice(0, limit);
    }

    if (previewEvents.length === 0) {
      this.innerHTML = `<p class="text-muted text-sm italic font-medium">Event data initializing...</p>`;
      return;
    }

    const cardsHtml = previewEvents.map((ev, index) => {
      const delay = index * 100;
      const tagsHtml = (ev.relatedSdgs || []).slice(0, 3).map(num => `
        <div class="w-5 h-5 rounded-sm text-white text-[9px] flex items-center justify-center font-bold shadow-sm" style="background-color: ${colors[num] || '#24305e'};">${num}</div>
      `).join('');
      const imgSrc = (window.ucuResolveMediaSrc ? window.ucuResolveMediaSrc(ev.img, base) : ev.img) || `${base}images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png`;

      return `
        <button type="button" data-modal-trigger="${ev.id}" class="reveal-card opacity-0 translate-y-12 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group flex flex-col text-left border border-gray-200 rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:border-gray-300 hover:-translate-y-2 bg-white focus:outline-none cursor-pointer" style="transition-delay: ${delay}ms;">
          <div class="relative aspect-video w-full overflow-hidden bg-gray-100 border-b border-gray-100 shrink-0">
            <img src="${imgSrc}" alt="${escapeHtml(ev.title)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="window.ucuHandleImageError(this)">
            <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
          <div class="flex flex-col flex-1 p-6 md:p-8">
            <div class="flex items-center justify-between gap-4 mb-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-ucu-red m-0 flex items-center gap-2">
                 <span class="w-1.5 h-1.5 rounded-full bg-ucu-red"></span>
                 ${escapeHtml(ev.date || '2025')}
              </p>
              <div class="flex items-center gap-1.5 shrink-0">${tagsHtml}</div>
            </div>
            <h3 class="text-xl font-black text-ucu-blue-dark leading-snug group-hover:text-ucu-red transition-colors duration-200 m-0 line-clamp-2 mb-3">${escapeHtml(ev.title || '')}</h3>
            <p class="text-muted text-sm font-medium leading-relaxed flex-1 line-clamp-3 m-0">${escapeHtml(ev.desc || '')}</p>
          </div>
        </button>
      `;
    }).join('');

    const modalsHtml = previewEvents.map((ev) => {
      const fallbackBlocks = ev.blocks && ev.blocks.length > 0 ? ev.blocks : [
        { type: 'paragraph', content: ev.desc || '' }
      ];
      const encodedBlocks = encodeURIComponent(JSON.stringify(fallbackBlocks));
      const sdgsJson = JSON.stringify(ev.relatedSdgs || []);
      const contentSrcAttr = ev.src ? `content-src="${window.ucuResolveMediaSrc ? window.ucuResolveMediaSrc(ev.src, base) : ev.src}"` : '';

      return `
        <ucu-modal-shell modal-id="${ev.id}" title="${escapeHtml(ev.title || 'Event Details')}" badge="${escapeHtml(ev.date || 'Impact Event')}" ${contentSrcAttr} data-blocks="${encodedBlocks}" data-sdgs='${sdgsJson}'></ucu-modal-shell>
      `;
    }).join("");

    this.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        ${cardsHtml}
      </div>
      ${modalsHtml}
    `;

    setTimeout(() => {
      const targets = this.querySelectorAll(".reveal-card");
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-12");
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
      targets.forEach(el => observer.observe(el));
    }, 50);
  }
}

class UcuImpactFeed extends HTMLElement {
  connectedCallback() {
    this.selectedYear = 'all';
    this.selectedSdg = 'all';
    this.render();
  }

  render() {
    const base = window.ucuGetBasePath ? window.ucuGetBasePath() : './';
    const allEvents = window.UCU_EVENTS || [];
    const colors = window.UCU_SDG_COLORS || UCU_SDG_COLORS_MAP;

    // 1. Highlighted Event (Hero Card - Blue Gradient)
    const highlightedEvent = allEvents.find(e => e.isHighlights === true || e.isFeatured === true) || (allEvents.length > 0 ? allEvents[0] : null);
    const featuredImgSrc = highlightedEvent 
      ? ((window.ucuResolveMediaSrc ? window.ucuResolveMediaSrc(highlightedEvent.img, base) : highlightedEvent.img) || `${base}images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png`)
      : '';

    // 2. Extract available years dynamically
    const yearsSet = new Set();
    allEvents.forEach(e => {
      if (e.year) yearsSet.add(String(e.year));
      else if (e.date) {
        const match = String(e.date).match(/\b(20\d{2}|19\d{2})\b/);
        if (match) yearsSet.add(match[1]);
      }
    });
    if (yearsSet.size === 0) {
      yearsSet.add('2025');
      yearsSet.add('2024');
      yearsSet.add('2023');
    }
    const availableYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));

    // 3. Filter Recent Events List
    const filteredEvents = this.getFilteredEvents(allEvents);

    // 4. Modals for all events
    const modalsHtml = allEvents.map((ev) => {
      const fallbackBlocks = ev.blocks && ev.blocks.length > 0 ? ev.blocks : [{ type: 'paragraph', content: ev.desc || '' }];
      const encodedBlocks = encodeURIComponent(JSON.stringify(fallbackBlocks));
      const sdgsJson = JSON.stringify(ev.relatedSdgs || []);
      const contentSrcAttr = ev.src ? `content-src="${window.ucuResolveMediaSrc ? window.ucuResolveMediaSrc(ev.src, base) : ev.src}"` : '';
      return `<ucu-modal-shell modal-id="${ev.id}" title="${escapeHtml(ev.title || 'Event Details')}" badge="${escapeHtml(ev.date || 'Impact Event')}" ${contentSrcAttr} data-sdgs='${sdgsJson}' data-blocks="${encodedBlocks}"></ucu-modal-shell>`;
    }).join("");

    this.innerHTML = `
      ${IMPACT_FEED_STYLES}

      <div class="space-y-10 w-full">
        
        <!-- 1. Highlighted Event Hero Card (Blue Gradient matching Announcement Featured Card) -->
        ${highlightedEvent ? `
          <section id="featured-event-section" class="w-full">
            <div class="group relative flex flex-col lg:flex-row bg-gradient-to-br from-ucu-blue-dark via-[#1e293b] to-ucu-blue rounded-2xl overflow-hidden shadow-xl border border-white/15 transition-all duration-500 hover:shadow-2xl lg:min-h-[360px]">
              
              <!-- Left Content Area -->
              <div class="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-10 text-white z-10 space-y-4 lg:max-w-[55%] font-sans">
                <div class="space-y-4">
                  
                  <!-- Top Metadata Row: Badge & Date on Left, SDG Box Numbers on Far Right End -->
                  <div class="flex items-center justify-between gap-3 w-full">
                    <div class="flex items-center gap-3">
                      <span class="px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-ucu-yellow text-ucu-blue-dark rounded-md shadow-2xs font-sans">
                        Highlighted
                      </span>
                      <span class="text-xs font-semibold text-slate-300 font-sans">
                        ${escapeHtml(highlightedEvent.date || '2025')}
                      </span>
                    </div>
                    
                    <!-- Aligned SDG Badges on Far Right End -->
                    <div class="flex flex-wrap items-center gap-1.5 ml-auto">
                      ${(highlightedEvent.relatedSdgs || []).map(num => `
                        <span style="background-color: ${colors[num] || '#19486A'};" class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shadow-2xs shrink-0 select-none font-sans" title="SDG ${num}">${num}</span>
                      `).join('')}
                    </div>
                  </div>
                  
                  <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white leading-tight group-hover:text-ucu-yellow transition-colors duration-300 font-sans">
                    ${escapeHtml(highlightedEvent.title || '')}
                  </h2>
                  
                  <p class="text-sm sm:text-base text-slate-200 font-normal leading-relaxed max-w-2xl font-sans line-clamp-3">
                    ${escapeHtml(highlightedEvent.desc || '')}
                  </p>
                </div>

                <div class="pt-4 lg:pt-6 flex items-center gap-4">
                  <button type="button" data-modal-trigger="${highlightedEvent.id}" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ucu-red text-white font-bold text-xs sm:text-sm hover:bg-red-700 transition-colors shadow-md cursor-pointer font-sans">
                    <span>Read Full Story</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
                </div>
              </div>

              <!-- Right Image Area (Fixed aspect / absolute on desktop so it crops cleanly without stretching card height) -->
              <div class="w-full lg:w-[48%] h-64 sm:h-72 lg:h-auto lg:absolute lg:inset-y-0 lg:right-0 overflow-hidden bg-slate-900 shrink-0">
                <img src="${featuredImgSrc}" 
                     alt="${escapeHtml(highlightedEvent.title)}" 
                     class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" 
                     loading="eager" 
                     onerror="window.ucuHandleImageError(this)">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent lg:hidden"></div>
              </div>

            </div>
          </section>
        ` : ''}

        <!-- 2. Centralized Clean Filter Bar (Horizontal Single-Row Toolbar) -->
        <section class="w-full relative z-20">
          <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            
            <!-- Year Dropdown Filter -->
            <div class="flex items-center gap-2.5 shrink-0">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0 font-sans">Year:</span>
              <div class="relative">
                <select id="impact-year-select" class="pl-3 pr-8 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-ucu-blue/20 focus:border-ucu-blue focus:bg-white cursor-pointer appearance-none font-sans">
                  <option value="all" ${this.selectedYear === 'all' ? 'selected' : ''}>All Years</option>
                  ${availableYears.map(y => `<option value="${y}" ${this.selectedYear === y ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
                <svg class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <!-- SDG Number Box Alignment Filter -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 hidden sm:inline shrink-0 font-sans">SDG:</span>
              
              <button type="button" data-filter="all" class="filter-btn !w-auto min-w-[36px] !h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${this.selectedSdg === 'all' ? 'bg-ucu-blue-dark text-white shadow-2xs border border-ucu-blue-dark' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'} shrink-0 flex items-center justify-center font-sans" data-active="${this.selectedSdg === 'all'}">
                All
              </button>

              ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(num => {
                const color = colors[num] || '#24305e';
                const isActive = this.selectedSdg === String(num);
                const activeStyle = isActive ? `style="background-color: ${color}; color: white; border-color: ${color};"` : '';
                return `
                  <button type="button" data-filter="${num}" data-color="${color}" ${activeStyle} class="filter-btn !w-8 !h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${isActive ? 'shadow-xs font-black scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'} shrink-0 font-sans" data-active="${isActive}" title="SDG ${num}">
                    ${num}
                  </button>
                `;
              }).join('')}
            </div>

          </div>
        </section>

        <!-- 3. Recent Events Feed (Title & 3x3 Card Grid matching Announcement Studio) -->
        <section class="space-y-6 pb-12">
          <div class="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 class="text-xl sm:text-2xl font-black text-ucu-blue-dark tracking-tight font-sans">Recent Events</h2>
          </div>

          <!-- 3x3 Grid of Recent Event Cards -->
          <div id="events-grid-container" class="w-full">
            ${this.renderEventsGrid(filteredEvents)}
          </div>
        </section>

      </div>

      ${modalsHtml}
    `;

    setTimeout(() => this.initEngine(), 30);
  }

  getFilteredEvents(allEvents) {
    let result = [...allEvents];

    // Year filter
    if (this.selectedYear !== 'all') {
      result = result.filter(ev => {
        if (ev.year && String(ev.year) === this.selectedYear) return true;
        return ev.date && String(ev.date).includes(this.selectedYear);
      });
    }

    // SDG filter
    if (this.selectedSdg !== 'all') {
      const numFilter = parseInt(this.selectedSdg, 10);
      result = result.filter(ev => (ev.relatedSdgs || []).includes(numFilter));
    }

    return result;
  }

  renderEventsGrid(events) {
    const base = window.ucuGetBasePath ? window.ucuGetBasePath() : './';
    const colors = window.UCU_SDG_COLORS || UCU_SDG_COLORS_MAP;

    if (!events || events.length === 0) {
      return `
        <div id="events-empty-state" class="py-16 text-center w-full bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="text-slate-700 text-xs font-bold uppercase tracking-wider font-sans">No events found for this specific goal or year.</p>
          <p class="text-slate-400 text-xs mt-1 font-sans">Try selecting "All" or choosing another year.</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        ${events.map((ev, index) => {
          const imgSrc = (window.ucuResolveMediaSrc ? window.ucuResolveMediaSrc(ev.img, base) : ev.img) || `${base}images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png`;
          const relatedSdgs = Array.isArray(ev.relatedSdgs) ? ev.relatedSdgs : [];

          return `
            <article class="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200 hover:border-ucu-red/40 hover:shadow-lg transition-all duration-300 cursor-pointer reveal-card opacity-0 translate-y-8" data-modal-trigger="${ev.id}" style="transition-delay: ${(index % 6) * 50}ms;">
              
              <!-- Card Cover Photo -->
              <div class="w-full h-48 sm:h-52 overflow-hidden bg-slate-100 relative shrink-0">
                <img src="${imgSrc}" 
                     alt="${escapeHtml(ev.title)}" 
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                     loading="lazy" 
                     onerror="window.ucuHandleImageError(this)">
              </div>
              
              <!-- Card Body (Clean White Canvas) -->
              <div class="flex-1 flex flex-col justify-between p-5 sm:p-6 bg-white text-slate-800 space-y-3">
                <div class="space-y-2.5">
                  
                  <!-- Top Row: Category Pill on Left, Date on Right -->
                  <div class="flex items-center justify-between gap-2 min-w-0">
                    <span class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-red-50 text-ucu-red border border-red-100 shadow-2xs whitespace-nowrap shrink-0 font-sans">
                      ${escapeHtml(ev.category || ev.badge || 'Event')}
                    </span>
                    
                    <span class="text-[10px] font-semibold text-slate-400 ml-auto whitespace-nowrap shrink-0 font-sans">
                      ${escapeHtml(ev.date || '2025')}
                    </span>
                  </div>

                  <h3 class="text-base sm:text-lg font-black text-ucu-blue-dark leading-snug group-hover:text-ucu-red transition-colors line-clamp-2 font-sans">
                    ${escapeHtml(ev.title || 'Untitled Event')}
                  </h3>
                  
                  <p class="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed font-normal font-sans">
                    ${escapeHtml(ev.desc || '')}
                  </p>
                </div>
                
                <!-- Bottom Row: SDG Boxes on Left, Read more on Right -->
                <div class="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1 flex-wrap">
                    ${relatedSdgs.map(num => `
                      <span style="background-color: ${colors[num] || '#24305e'};" class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shadow-2xs shrink-0 select-none font-sans" title="SDG ${num}">${num}</span>
                    `).join('')}
                  </div>

                  <span class="text-xs font-bold text-ucu-blue group-hover:text-ucu-red group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 ml-auto font-sans">
                    Read more &rarr;
                  </span>
                </div>

              </div>

            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  initEngine() {
    const observeCards = (container) => {
      const targets = (container || this).querySelectorAll(".reveal-card");
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-8", "translate-y-12");
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
      targets.forEach((el) => observer.observe(el));
    };

    observeCards(this);

    // Year Dropdown Listener
    const yearSelect = this.querySelector('#impact-year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.selectedYear = e.target.value;
        this.updateFeedOnly();
      });
    }

    // SDG Filter Buttons Listener
    const buttons = this.querySelectorAll(".filter-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const selectedFilter = btn.getAttribute("data-filter");
        this.selectedSdg = selectedFilter;

        buttons.forEach((b) => {
          b.setAttribute("data-active", "false");
          b.classList.remove("shadow-2xs", "border-ucu-blue-dark", "bg-ucu-blue-dark", "text-white", "scale-105");
          b.classList.add("bg-slate-100", "text-slate-600", "border-slate-200/80");
          b.style.backgroundColor = "";
          b.style.color = "";
          b.style.borderColor = "";
        });

        btn.setAttribute("data-active", "true");
        if (selectedFilter === "all") {
          btn.classList.remove("bg-slate-100", "text-slate-600", "border-slate-200/80");
          btn.classList.add("bg-ucu-blue-dark", "text-white", "shadow-2xs", "border-ucu-blue-dark");
        } else {
          const color = btn.getAttribute("data-color");
          btn.classList.remove("bg-slate-100", "text-slate-600");
          btn.style.backgroundColor = color;
          btn.style.color = "white";
          btn.style.borderColor = color;
          btn.classList.add("scale-105");
        }

        this.updateFeedOnly();
      });
    });
  }

  updateFeedOnly() {
    const allEvents = window.UCU_EVENTS || [];
    const filteredEvents = this.getFilteredEvents(allEvents);
    const gridContainer = this.querySelector('#events-grid-container');
    if (gridContainer) {
      gridContainer.innerHTML = this.renderEventsGrid(filteredEvents);
      const targets = gridContainer.querySelectorAll(".reveal-card");
      targets.forEach(t => t.classList.remove("opacity-0", "translate-y-8"));
    }
  }
}

class UcuResearchFeed extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const allResearch = window.UCU_RESEARCH || [];
    const colors = window.UCU_SDG_COLORS || UCU_SDG_COLORS_MAP;
    const base = window.ucuGetBasePath ? window.ucuGetBasePath() : './';

    // Extract available years dynamically
    const yearsSet = new Set();
    allResearch.forEach(p => {
      if (p.year) yearsSet.add(String(p.year));
      else if (p.date) {
        const match = String(p.date).match(/\b(20\d{2}|19\d{2})\b/);
        if (match) yearsSet.add(match[1]);
      }
    });
    if (yearsSet.size === 0) {
      yearsSet.add('2025');
      yearsSet.add('2024');
      yearsSet.add('2023');
    }
    const availableYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));

    const cardsHtml = allResearch.map((paper) => {
      const paperYear = paper.year || (paper.date && paper.date.match(/\b(20\d{2}|19\d{2})\b/) ? paper.date.match(/\b(20\d{2}|19\d{2})\b/)[1] : '');
      const dateFormatted = paper.date || (paper.month ? `${paper.month} ${paper.year || '2025'}` : (paper.year || '2025'));
      const sdgDataStr = (paper.sdgs || []).join(" ");
      const sdgBadges = (paper.sdgs || []).map((sdgNum) => `
        <div class="flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-black shadow-2xs shrink-0" style="background-color: ${colors[sdgNum] || "#24305e"};" title="SDG ${sdgNum}">${sdgNum}</div>
      `).join("");

      const keywordPills = (paper.keywords || []).map((kw) => `
        <span class="text-[0.65rem] font-bold text-ucu-blue-dark bg-ucu-blue-dark/5 px-2.5 py-1 rounded-md border border-ucu-blue-dark/10 tracking-widest uppercase">${escapeHtml(kw)}</span>
      `).join("");

      const hasPdf = paper.pdfLink && paper.pdfLink !== '#' && paper.pdfLink.trim().length > 0;

      return `
        <article class="research-card reveal-card opacity-0 translate-y-12 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col font-sans" data-year="${escapeHtml(paperYear)}" data-date-str="${escapeHtml(paper.date || '')}" data-sdgs="${sdgDataStr}">
          <h3 class="text-xl md:text-2xl font-black text-ucu-blue-dark mb-2 leading-tight font-sans">${escapeHtml(paper.title)}</h3>
          
          <div class="flex flex-wrap items-center gap-3 md:gap-4 mb-4 font-sans text-xs text-slate-500">
            <span class="font-semibold text-slate-700 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              ${escapeHtml(paper.authors || 'UCU Faculty')}
            </span>
            <span class="w-1 h-1 rounded-full bg-slate-300"></span>
            <span class="font-medium text-slate-500 flex items-center gap-1 font-sans">
              <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${escapeHtml(dateFormatted)}
            </span>
          </div>

          <p class="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-6 flex-grow font-medium font-sans">${escapeHtml(paper.abstract || '')}</p>
          ${keywordPills ? `<div class="flex flex-wrap gap-2 mb-8">${keywordPills}</div>` : ""}
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-slate-100 pt-5 mt-auto font-sans">
            <div>
              <span class="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider mb-2 block font-sans">SDG Alignment</span>
              <div class="flex flex-wrap gap-1.5">${sdgBadges}</div>
            </div>

            ${hasPdf ? `
              <button type="button" data-pdf-src="${encodeURIComponent(paper.pdfLink)}" data-pdf-title="${escapeHtml(paper.title)}" class="btn-open-research-pdf inline-flex items-center justify-center gap-2 border-2 border-ucu-blue-dark text-ucu-blue-dark hover:bg-ucu-blue-dark hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 shadow-2xs hover:shadow-sm shrink-0 cursor-pointer font-sans">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                <span>View PDF</span>
                <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>
            ` : `
              <span class="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200">
                No PDF Attached
              </span>
            `}
          </div>
        </article>
      `;
    }).join("");

    this.innerHTML = `
      ${IMPACT_FEED_STYLES}
      
      <!-- Centralized Clean Filter Bar (Exact matching width with Cards) -->
      <section class="w-full mb-8 relative z-20 reveal-card opacity-0 translate-y-8 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
        <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          
          <!-- Year Dropdown Filter -->
          <div class="flex items-center gap-2.5 shrink-0">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">Year:</span>
            <div class="relative">
              <select id="research-year-select" class="pl-3 pr-8 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-ucu-blue/20 focus:border-ucu-blue focus:bg-white cursor-pointer appearance-none">
                <option value="all">All Years</option>
                ${availableYears.map(y => `<option value="${y}">${y}</option>`).join('')}
              </select>
              <svg class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>

          <!-- SDG Number Box Alignment Filter -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 hidden sm:inline shrink-0">SDG:</span>
            
            <button type="button" data-filter="all" class="filter-btn !w-auto min-w-[36px] !h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-ucu-blue-dark text-white shadow-2xs border border-ucu-blue-dark shrink-0 flex items-center justify-center" data-active="true">
              All
            </button>

            ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(num => {
              const color = colors[num] || '#24305e';
              return `
                <button type="button" data-filter="${num}" data-color="${color}" class="filter-btn !w-8 !h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80 shrink-0" data-active="false" title="SDG ${num}">
                  ${num}
                </button>
              `;
            }).join('')}
          </div>

        </div>
      </section>

      <!-- Publications Feed -->
      <section class="w-full">
        <div class="flex flex-col gap-6" id="research-feed">
          ${cardsHtml}
          <div id="empty-state" class="hidden py-16 text-center w-full bg-white/70 border border-dashed border-slate-200 rounded-2xl">
            <p class="text-slate-600 text-sm font-bold">No research publications found matching your filter selection.</p>
          </div>
        </div>
      </section>
    `;

    setTimeout(() => {
      const yearSelect = this.querySelector("#research-year-select");
      const buttons = this.querySelectorAll(".filter-btn");
      const cards = this.querySelectorAll(".research-card");
      const emptyState = this.querySelector("#empty-state");

      let selectedYear = "all";
      let selectedSdg = "all";

      const applyFilters = () => {
        let visibleCount = 0;
        cards.forEach((card) => {
          const cardYear = card.getAttribute("data-year") || "";
          const cardDateStr = card.getAttribute("data-date-str") || "";
          const cardSdgs = (card.getAttribute("data-sdgs") || "").split(" ");

          const matchYear = selectedYear === "all" || cardYear === selectedYear || cardDateStr.includes(selectedYear);
          const matchSdg = selectedSdg === "all" || cardSdgs.includes(selectedSdg);

          if (matchYear && matchSdg) {
            card.style.display = "flex";
            card.style.opacity = "0";
            card.style.transform = "translateY(12px)";
            void card.offsetWidth;
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
            visibleCount++;
          } else {
            card.style.display = "none";
          }
        });

        if (emptyState) {
          emptyState.style.display = visibleCount === 0 ? "block" : "none";
        }
      };

      // Bind direct PDF Open listener
      this.querySelectorAll(".btn-open-research-pdf").forEach((btn) => {
        btn.onclick = (e) => {
          e.preventDefault();
          const rawSrc = decodeURIComponent(btn.getAttribute("data-pdf-src"));
          const title = btn.getAttribute("data-pdf-title");
          if (window.ucuOpenPdfDocument) {
            window.ucuOpenPdfDocument(rawSrc, title);
          } else {
            window.open(rawSrc, "_blank");
          }
        };
      });

      // Year Filter Dropdown change
      if (yearSelect) {
        yearSelect.addEventListener("change", (e) => {
          selectedYear = e.target.value;
          applyFilters();
        });
      }

      // SDG Number Box buttons click
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedSdg = btn.getAttribute("data-filter");

          buttons.forEach((b) => {
            b.setAttribute("data-active", "false");
            b.classList.remove("text-white", "shadow-xs", "scale-105", "bg-ucu-blue-dark");
            b.classList.add("bg-slate-100", "text-slate-600", "border-slate-200/80");
            b.style.backgroundColor = "";
            b.style.borderColor = "";
          });

          btn.setAttribute("data-active", "true");
          btn.classList.remove("bg-slate-100", "text-slate-600", "border-slate-200/80");
          btn.classList.add("text-white", "shadow-xs", "scale-105");

          if (selectedSdg === "all") {
            btn.classList.add("bg-ucu-blue-dark", "border-ucu-blue-dark");
          } else {
            const color = btn.getAttribute("data-color") || "#24305e";
            btn.style.backgroundColor = color;
            btn.style.borderColor = color;
          }

          applyFilters();
        });
      });

      this.initObserver();
    }, 50);
  }

  initObserver() {
    const revealTargets = this.querySelectorAll(".reveal-card");
    const observer = new IntersectionObserver((entries, obs) => {
        let delayCounter = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => { entry.target.classList.remove("opacity-0", "translate-y-12", "translate-y-8"); }, delayCounter * 100);
            delayCounter++;
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    revealTargets.forEach((el) => observer.observe(el));
  }
}

/* ==========================================================================
   4. COMPONENT REGISTRATION
   ========================================================================== */

if (!customElements.get("ucu-events-preview")) customElements.define("ucu-events-preview", UcuEventsPreview);
if (!customElements.get("ucu-impact-feed")) customElements.define("ucu-impact-feed", UcuImpactFeed);
if (!customElements.get("ucu-research-feed")) customElements.define("ucu-research-feed", UcuResearchFeed);