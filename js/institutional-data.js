/**
 * js/institutional-data.js
 * Components for rankings, partnerships, and global footprint data visualization.
 */

/* ==========================================================================
   3. DATA CAROUSEL & GRID COMPONENTS
   ========================================================================== */

class UcuRankingCarousel extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const rankings = window.UCU_RANKINGS || [];
    const highlights = rankings.filter((r) => r.shortDescription && r.shortDescription.trim() !== "");
    const renderList = highlights.length > 0 ? highlights : rankings;
    if (renderList.length === 0) {
      this.innerHTML = '';
      return;
    }

    const formatCrownRank = (val) => {
      if (typeof val === "string" && val.includes("#")) {
        return val.replace(/#/g, '<span class="text-ucu-red text-[0.7em] mr-[3px] relative -top-[0.08em] inline-block font-black">#</span>');
      }
      return val;
    };

    const logoMap = {
      "AppliedHE": "images/rankings-logo/applied-he.png",
      "THE Impact": "images/rankings-logo/the-impact.png",
      "UI GreenMetric": "images/rankings-logo/ui-green.png",
      "WURI": "images/rankings-logo/wuri.png",
      "HE HIGHER EDUCATION": "images/rankings-logo/higher-education.png"
    };

    const generateCard = (rank) => {
      const badgeStyle = rank.badgeColor ? `style="background-color: ${rank.badgeColor}; color: #ffffff;"` : '';
      return `
        <div class="flex-none w-[320px] md:w-[380px] group/card cursor-pointer">
          <div class="h-full bg-white border border-gray-200 p-8 md:p-10 rounded-[1.5rem] flex flex-col justify-between transition-all duration-500 hover:border-ucu-blue/30 shadow-[0_8px_20px_rgba(36,48,94,0.04)] hover:shadow-[0_15px_40px_rgba(36,48,94,0.08)] relative overflow-hidden">
            <div>
              <div class="flex justify-between items-center mb-6">
                <span class="text-[10px] font-bold px-3 py-1 rounded-[6px] uppercase tracking-widest ${rank.crownBadgeClass || rank.badgeClass || 'bg-ucu-blue-dark text-white'}" ${badgeStyle}>${rank.org}</span>
                <span class="text-ucu-blue-dark text-sm font-black">${rank.year}</span>
              </div>
              <h3 class="text-6xl font-black mb-1 text-ucu-blue-dark transition-transform flex items-baseline tracking-tighter leading-none">${formatCrownRank(rank.mainRank)}</h3>
              <p class="text-ucu-blue-dark text-[10px] font-bold mb-4 uppercase tracking-[0.15em] mt-3">${rank.category || rank.mainRankLabel || ''}</p>
              <div class="flex items-center gap-1.5 mt-4"><div class="w-7 h-1 rounded-full bg-ucu-blue"></div><div class="w-3 h-1 rounded-full bg-ucu-red"></div></div>
            </div>
            <div class="mt-8 border-t border-black/5 pt-6"><p class="text-muted/90 text-xs font-medium leading-relaxed">${rank.shortDescription || rank.mainRankLabel || ''}</p></div>
          </div>
        </div>
      `;
    };

    const marqueeItems = renderList.length < 4 ? [...renderList, ...renderList, ...renderList] : [...renderList, ...renderList];
    const marqueeHtml = marqueeItems.map(generateCard).join("");

    this.innerHTML = `
      <style>
        .ucu-custom-scroll::-webkit-scrollbar { height: 8px; }
        .ucu-custom-scroll::-webkit-scrollbar-track { background: rgba(36,48,94,0.05); border-radius: 10px; margin-inline: 16px; }
        .ucu-custom-scroll::-webkit-scrollbar-thumb { background: rgba(36,48,94,0.25); border-radius: 10px; cursor: pointer; }
        .ucu-custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(196,54,67,0.8); }
        .ucu-custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(36,48,94,0.25) rgba(36,48,94,0.05); }
      </style>
      <div class="w-full relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div id="carousel-track" class="flex gap-6 overflow-x-auto pb-6 ucu-custom-scroll will-change-scroll">
          ${marqueeHtml}
        </div>
      </div>
    `;

    setTimeout(() => {
      const track = this.querySelector("#carousel-track");
      if (!track) return;
      let isHovered = false;
      const speed = 1.5;
      const autoScroll = () => {
        if (!isHovered) {
          track.scrollLeft += speed;
          const singleSetWidth = track.scrollWidth / (renderList.length < 4 ? 3 : 2);
          if (track.scrollLeft >= singleSetWidth) { track.scrollLeft -= singleSetWidth; }
        }
        requestAnimationFrame(autoScroll);
      };
      track.addEventListener("mouseenter", () => (isHovered = true));
      track.addEventListener("mouseleave", () => (isHovered = false));
      requestAnimationFrame(autoScroll);
    }, 100);
  }
}

class UcuRankingTimeline extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const rankings = window.UCU_RANKINGS || [];
    if (rankings.length === 0) {
      this.innerHTML = `<p class="text-muted text-sm italic text-center w-full">Ranking data currently initializing...</p>`;
      return;
    }

    const formatRankValue = (val) => {
      if (typeof val === "string" && val.includes("#")) {
        return val.replace(/#/g, '<span class="text-[0.6em] text-white/60 font-bold mr-[1px] relative -top-[0.05em]">#</span>');
      }
      return val;
    };

    const logoMap = {
      "AppliedHE": "images/rankings-logo/applied-he.png",
      "THE Impact": "images/rankings-logo/the-impact.png",
      "UI GreenMetric": "images/rankings-logo/ui-green.png",
      "WURI": "images/rankings-logo/wuri.png",
      "HE HIGHER EDUCATION": "images/rankings-logo/higher-education.png"
    };

    let currentYearTracker = "";

    const timelineHtml = rankings.map((rank, index) => {
      const isRightAligned = index % 2 === 0;
      const alignClass = isRightAligned ? "md:pr-14 md:text-right" : "md:pl-14 md:order-last text-left";
      const pointerClass = isRightAligned ? "md:before:-right-[9px] md:before:border-r md:before:border-t" : "before:-left-[9px] before:border-l before:border-b";

      let yearMilestoneHtml = "";
      if (rank.year !== currentYearTracker) {
        currentYearTracker = rank.year;
        yearMilestoneHtml = `
          <div class="relative w-full h-12 z-20 mb-8 mt-4 timeline-reveal opacity-0 translate-y-8 transition-all duration-700">
             <div class="absolute left-0 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                 <span class="bg-white text-ucu-blue-dark text-xs font-black px-6 py-2.5 rounded-full shadow-[0_4px_15px_rgba(36,48,94,0.08)] border border-gray-200 tracking-[0.2em] uppercase">${currentYearTracker}</span>
             </div>
          </div>
        `;
      }

      const metricsHtml = (rank.metrics || []).map((metric) => {
        const bgColor = metric.color || "#394a8a";
        return `
          <div class="relative overflow-hidden p-5 rounded-[12px] shadow-sm hover:shadow-md transition-shadow duration-300 group/metric text-left" style="background-color: ${bgColor};">
            <div class="absolute -bottom-5 -right-5 w-20 h-20 rounded-full bg-white/10 pointer-events-none group-hover/metric:scale-110 transition-transform duration-500"></div>
            <div class="relative z-10">
              <p class="text-[9px] font-bold uppercase text-white/80 tracking-widest mb-1.5 leading-tight">${metric.label}</p>
              <p class="text-3xl md:text-4xl font-black text-white leading-none tracking-tight flex items-baseline">${formatRankValue(metric.value)}</p>
              ${metric.subtext ? `<p class="text-[10px] text-white/70 font-medium mt-2.5 leading-snug">${metric.subtext}</p>` : ""}
            </div>
          </div>
        `;
      }).join("");

      const rawLogo = rank.logo || logoMap[rank.org] || "";
      const logoSrc = window.ucuResolveMediaSrc ? window.ucuResolveMediaSrc(rawLogo) : rawLogo;
      const dropBannerHtml = logoSrc ? `
        <div class="absolute top-0 right-6 md:right-10 bg-white shadow-[0_12px_30px_rgba(36,48,94,0.12)] rounded-b-[1.25rem] w-24 md:w-32 h-28 md:h-36 border-2 border-t-0 border-ucu-yellow z-20 flex items-center justify-center transform origin-top transition-transform duration-500 group-hover:scale-[1.03]">
          <img src="${logoSrc}" alt="${rank.org} Logo" class="w-full h-full object-contain p-3 drop-shadow-sm" aria-hidden="true" loading="lazy" onerror="this.style.display='none'">
        </div>
      ` : "";

      let rawPub = (rank.publicationUrl || rank.publicationLink || rank.url || rank.link || '').trim();
      let pubUrl = rawPub;
      if (pubUrl && pubUrl !== '#' && !pubUrl.startsWith('http://') && !pubUrl.startsWith('https://') && !pubUrl.startsWith('mailto:') && !pubUrl.startsWith('tel:')) {
        pubUrl = 'https://' + pubUrl;
      }
      const hasPublicationLink = Boolean(pubUrl && pubUrl.length > 3 && pubUrl !== '#' && (pubUrl.startsWith('http://') || pubUrl.startsWith('https://')));
      const badgeStyle = rank.badgeColor ? `style="background-color: ${rank.badgeColor}; color: #ffffff;"` : '';

      return `
        ${yearMilestoneHtml}
        <div class="timeline-item timeline-reveal opacity-0 translate-y-12 group relative flex flex-col md:flex-row items-center transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom mb-16" data-org="${rank.org}">
          <div class="absolute left-0 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-10 top-6 md:top-1/2 md:-translate-y-1/2">
            <div class="timeline-dot w-4 h-4 rounded-full bg-white border-4 border-ucu-blue-dark/90 transition-all duration-300 shadow-sm scale-100"></div>
          </div>
          <div class="w-full md:w-1/2 ${alignClass}">
            <div class="bg-white border border-gray-200 p-8 md:p-10 rounded-[1.5rem] shadow-[0_8px_30px_rgba(36,48,94,0.04)] hover:shadow-[0_15px_40px_rgba(36,48,94,0.08)] transition-all duration-300 relative before:content-[''] before:absolute before:top-6 md:before:top-1/2 before:-translate-y-1/2 ${pointerClass} before:w-4 before:h-4 before:bg-white before:rotate-45 before:border-gray-200 text-left">
              ${dropBannerHtml}
              <div class="relative z-10">
                <div class="flex items-center gap-3 mb-8 pr-24 md:pr-32">
                  <span class="text-ucu-blue-dark text-sm font-black">${rank.year}</span>
                  <span class="text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest ${rank.badgeClass || 'bg-ucu-blue-dark text-white'} shadow-sm" ${badgeStyle}>${rank.org}</span>
                </div>
                <div class="mb-8">
                  <p class="text-[10px] font-bold text-muted/90 uppercase tracking-[0.15em] mb-1.5">${rank.mainRankLabel || 'Rank'}</p>
                  <h4 class="text-6xl md:text-7xl font-black text-ucu-blue-dark tracking-tighter leading-none">${rank.mainRank}</h4>
                  <p class="text-[10px] font-bold text-muted/90 uppercase tracking-[0.15em] mt-3">${rank.category || ''}</p>
                  <div class="flex items-center gap-1.5 mt-5"><div class="w-9 h-1 rounded-full bg-ucu-blue"></div><div class="w-5 h-1 rounded-full bg-ucu-red"></div></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 w-full pt-2">${metricsHtml}</div>
                
                <!-- Footer with Category, Date & See Publication Button -->
                <div class="border-t border-black/5 mt-10 pt-5 flex flex-wrap justify-between items-center gap-3 w-full">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black text-ucu-blue-dark/80 uppercase tracking-widest">${rank.category || 'Accreditation & Ranking'}</span>
                    <span class="text-gray-300 font-bold">&bull;</span>
                    <span class="text-[9px] font-bold text-muted/60 uppercase tracking-widest">${rank.publicationDate || rank.year}</span>
                  </div>

                  ${hasPublicationLink ? `
                    <a href="${pubUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-ucu-blue hover:text-white text-ucu-blue-dark text-[11px] font-bold transition-all shadow-2xs group/btn cursor-pointer">
                      <span>See Publication</span>
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
          <div class="hidden md:block w-1/2"></div>
        </div>
      `;
    }).join("");

    const terminusQuote = window.UCU_TERMINUS_STATEMENT || `"We will continue our commitment to relentless innovation and real-world impact, ensuring the little giant UCU rises to meet the titans on the global stage."`;

    this.innerHTML = `
      <style>
        @keyframes ucuTimelinePulse {
          0% { box-shadow: 0 0 0 0 rgba(196, 54, 67, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(196, 54, 67, 0); }
          100% { box-shadow: 0 0 0 0 rgba(196, 54, 67, 0); }
        }
        .animate-timeline-pulse {
          animation: ucuTimelinePulse 2s infinite;
        }
      </style>
      <div class="relative pl-8 md:pl-0 w-full" id="timeline-container">
        <div id="timeline-track-container" class="absolute left-8 md:left-1/2 top-4 w-[2px] bg-gray-200 -translate-x-1/2 rounded-full overflow-hidden z-0">
          <div id="timeline-progress-fill" class="absolute top-0 left-0 w-full h-full bg-ucu-red origin-top transform scale-y-0 transition-transform duration-75 ease-out will-change-transform"></div>
        </div>
        
        <div class="relative w-full" id="timeline-list">${timelineHtml}</div>
        
        <div id="terminus-statement-block" class="w-full relative z-10 pt-20 pb-12 text-center timeline-reveal opacity-0 translate-y-12 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div class="terminus-pill w-12 h-1.5 bg-ucu-red mx-auto mb-6 rounded-full transition-all duration-300 origin-center border-0 border-ucu-red"></div>
          <p id="terminus-text-content" class="max-w-[65ch] mx-auto text-[15px] md:text-base leading-[1.65] font-medium text-muted text-balance italic">${terminusQuote}</p>
        </div>
        <div id="empty-state" class="hidden py-16 text-center w-full relative z-10"><p class="text-muted text-sm font-black uppercase tracking-[0.2em] bg-white/50 border border-white inline-block px-6 py-3 rounded-xl shadow-sm">No rankings found for this category.</p></div>
      </div>
    `;

    // Engine Initialization
    setTimeout(() => {
      // 1. Reveal Observer
      const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.remove("opacity-0", "translate-y-12", "translate-y-8"); obs.unobserve(entry.target); } });
      }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
      this.querySelectorAll(".timeline-reveal").forEach((el) => revealObserver.observe(el));

      // 2. High-Performance Hit Detection for Dots
      const dots = this.querySelectorAll('.timeline-dot');
      const hitObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('bg-white', 'border-ucu-blue-dark/90', 'scale-100');
            entry.target.classList.add('bg-ucu-yellow', 'border-ucu-red', 'scale-125', 'animate-timeline-pulse');
          } else {
            if (entry.boundingClientRect.top > window.innerHeight / 2) {
              entry.target.classList.add('bg-white', 'border-ucu-blue-dark/90', 'scale-100');
              entry.target.classList.remove('bg-ucu-yellow', 'border-ucu-red', 'scale-125', 'animate-timeline-pulse');
            }
          }
        });
      }, { root: null, rootMargin: "-50% 0px -50% 0px", threshold: 0 });
      dots.forEach(dot => hitObserver.observe(dot));

      // 3. Enterprise Scroll Engine & Resize Observer
      const container = this.querySelector('#timeline-container');
      const trackContainer = this.querySelector('#timeline-track-container');
      const fillLine = this.querySelector('#timeline-progress-fill');
      const terminusBlock = this.querySelector('#terminus-statement-block');
      const terminusPill = this.querySelector('.terminus-pill');
      const timelineItems = this.querySelectorAll('.timeline-item');
      
      let containerTop = 0;
      let scrollableHeight = 0;

      const calculateMetrics = () => {
        if (!container) return;
        
        // Dynamic Filter Detection
        let visibleCount = 0;
        timelineItems.forEach(item => {
          if (item.offsetParent !== null) visibleCount++;
        });
        const isFiltered = visibleCount > 0 && visibleCount < timelineItems.length;

        // Auto-Hide Terminus when Filtered
        if (terminusBlock) {
          terminusBlock.style.display = isFiltered ? 'none' : '';
        }

        const rect = container.getBoundingClientRect();
        containerTop = rect.top + window.scrollY; 
        
        // Calculate Track Geometry
        if (trackContainer && terminusPill && terminusBlock && !isFiltered) {
          const pillRect = terminusPill.getBoundingClientRect();
          const heightDownToPill = (pillRect.top + window.scrollY) - containerTop + (pillRect.height / 2) - 16; 
          trackContainer.style.height = `${heightDownToPill}px`;
          scrollableHeight = heightDownToPill;
        } else {
          // Strict fallback height if filtered or terminus is deleted by user
          trackContainer.style.height = `calc(100% - 32px)`;
          scrollableHeight = rect.height;
        }
        
        // Force a scroll update
        if (typeof this.scrollHandler === 'function') this.scrollHandler();
      };

      // Highly performant native observer for dynamic height changes
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => calculateMetrics());
      });
      if (container) resizeObserver.observe(container);

      // Clean Math Logic for the Scroll Line
      this.scrollHandler = () => {
        if (!fillLine || scrollableHeight === 0) return;
        
        const viewportCenter = window.innerHeight / 2;
        const currentScroll = window.scrollY;
        const start = (containerTop - currentScroll) - viewportCenter;
        
        let progress = -start / scrollableHeight;
        progress = Math.max(0, Math.min(1, progress));
        
        fillLine.style.transform = `scaleY(${progress})`;

        // Static Terminus Hit Logic (No Animation)
        if (terminusPill && terminusBlock && terminusBlock.style.display !== 'none') {
          if (progress >= 0.99) {
            terminusPill.classList.remove('w-12', 'bg-ucu-red', 'h-1.5', 'border-0');
            terminusPill.classList.add('w-24', 'bg-ucu-yellow', 'h-2.5', 'border-2', 'scale-110');
          } else {
            terminusPill.classList.add('w-12', 'bg-ucu-red', 'h-1.5', 'border-0');
            terminusPill.classList.remove('w-24', 'bg-ucu-yellow', 'h-2.5', 'border-2', 'scale-110');
          }
        }
      };

      this.scrollHandler();
      window.addEventListener('scroll', () => requestAnimationFrame(this.scrollHandler), { passive: true });
      
      // Setup cleanup
      this.cleanupObserver = () => resizeObserver.disconnect();

    }, 100);
  }

  disconnectedCallback() {
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
    if (this.cleanupObserver) this.cleanupObserver();
  }
}

class UcuPartnerCarousel extends HTMLElement {
  connectedCallback() {
    const partners = window.UCU_PARTNERS || [];
    const validPartners = partners.filter(p => p.logoSrc && p.logoSrc !== "");
    const renderList = validPartners.length > 0 ? validPartners : Array(10).fill({name: "Partner", logoSrc: "./images/partner-placeholder.png"});
    
    const generateLogos = () => renderList.map(p => `
      <div class="group/logo flex-none w-48 md:w-56 h-24 md:h-28 bg-white/80 backdrop-blur-sm border border-white rounded-2xl flex items-center justify-center p-2 shadow-[0_4px_15px_rgba(36,48,94,0.03)] hover:shadow-[0_8px_25px_rgba(36,48,94,0.08)] transition-all duration-300 grayscale hover:grayscale-0">
        <img src="${p.logoSrc}" alt="${p.name} Logo" class="w-full h-full object-contain transition-transform duration-300 group-hover/logo:scale-[1.05]" loading="lazy" onerror="this.style.display='none'">
      </div>
    `).join("");
    
    this.innerHTML = `
      <style>@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: marquee 75s linear infinite; } .animate-marquee:hover { animation-play-state: paused; }</style>
      <div class="w-full overflow-hidden relative group">
        <div class="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-canvas to-transparent z-10 pointer-events-none"></div>
        <div class="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-canvas to-transparent z-10 pointer-events-none"></div>
        <div class="flex w-max animate-marquee py-2"><div class="flex gap-6 pr-6">${generateLogos()}</div><div class="flex gap-6 pr-6">${generateLogos()}</div></div>
      </div>
    `;
  }
}

class UcuPartnerGrid extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const category = this.getAttribute("category");
    const partners = window.UCU_PARTNERS ? window.UCU_PARTNERS.filter((p) => p.category === category) : [];
    if (partners.length === 0) { this.innerHTML = `<p class="text-muted text-sm italic">Partner data currently initializing...</p>`; return; }
    
    // Strictly sort alphabetically (A-Z) by partner name
    partners.sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    
    const gridHtml = partners.map((partner) => {
      const resolvedLogo = window.ucuResolveMediaSrc ? window.ucuResolveMediaSrc(partner.logoSrc) : partner.logoSrc;
      const innerHtml = `
        <img src="${resolvedLogo}" alt="${partner.name} Logo" class="w-full h-full object-contain transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[0.70] group-hover:opacity-15 relative z-10" loading="lazy" onerror="this.style.display='none'" />
        <div class="absolute inset-0 flex items-center justify-center p-3 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none z-10"><span class="text-center text-[0.65rem] font-black text-ucu-blue-dark uppercase tracking-widest whitespace-normal leading-tight text-balance drop-shadow-sm">${partner.name}</span></div>
        <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-ucu-blue to-ucu-red transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-center z-20"></div>
      `;
      const baseClasses = "bg-white/80 backdrop-blur-sm border border-white p-2 rounded-2xl shadow-[0_4px_15px_rgba(36,48,94,0.03)] hover:shadow-[0_8px_25px_rgba(36,48,94,0.08)] transition-all duration-300 flex items-center justify-center aspect-[2/1] group relative overflow-hidden";
      return partner.url ? `<a href="${partner.url}" target="_blank" rel="noopener noreferrer" class="${baseClasses} cursor-pointer">${innerHtml}</a>` : `<div class="${baseClasses} cursor-default">${innerHtml}</div>`;
    }).join("");
    
    this.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">${gridHtml}</div>`;
  }
}

class UcuCountryGrid extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const countries = window.UCU_COUNTRIES || [];
    if (countries.length === 0) { this.innerHTML = `<p class="text-muted text-sm italic text-center w-full">Country data currently initializing...</p>`; return; }
    const flagMap = { Philippines: "ph", Turkey: "tr", Bangladesh: "bd", Indonesia: "id", Japan: "jp", Oman: "om", "South Korea": "kr", Thailand: "th", Taiwan: "tw", Vietnam: "vn", Malaysia: "my", China: "cn", "Bosnia and Herzegovina": "ba", "United Kingdom": "gb", Switzerland: "ch", Poland: "pl", Germany: "de", USA: "us", Canada: "ca", India: "in", France: "fr", Spain: "es" };
    const pillsHtml = countries.map((country) => {
      const isoCode = flagMap[country] || "un"; 
      return `
      <div class="group inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-white/50 rounded-full shadow-[0_2px_10px_rgba(36,48,94,0.04)] hover:shadow-[0_8px_20px_rgba(36,48,94,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-default">
        <span class="fi fi-${isoCode} shrink-0 text-base transform transition-all duration-300 group-hover:scale-125 group-hover:-translate-y-0.5 drop-shadow-sm origin-center rounded-sm overflow-hidden"></span>
        <span class="text-[0.65rem] font-bold text-ucu-blue-dark uppercase tracking-widest">${country}</span>
      </div>
    `;
    }).join("");
    this.innerHTML = `<div class="flex flex-wrap items-center justify-center gap-3 md:gap-4 p-4 md:p-8 bg-slate-100/50 rounded-[2rem] border border-black/5">${pillsHtml}</div>`;
  }
}

/* ==========================================================================
   4. COMPONENT REGISTRATION
   ========================================================================== */

if (!customElements.get("ucu-ranking-carousel")) customElements.define("ucu-ranking-carousel", UcuRankingCarousel);
if (!customElements.get("ucu-ranking-timeline")) customElements.define("ucu-ranking-timeline", UcuRankingTimeline);
if (!customElements.get("ucu-partner-carousel")) customElements.define("ucu-partner-carousel", UcuPartnerCarousel);
if (!customElements.get("ucu-partner-grid")) customElements.define("ucu-partner-grid", UcuPartnerGrid);
if (!customElements.get("ucu-country-grid")) customElements.define("ucu-country-grid", UcuCountryGrid);