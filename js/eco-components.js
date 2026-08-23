// js/eco-components.js

class UcuIndicatorLayout extends HTMLElement {
  connectedCallback() {
    if (this.hasRendered) return;
    this.hasRendered = true;

    const descriptionContent = this.querySelector('[slot="description"]')?.innerHTML || '';
    
    const base = this.getAttribute("base-path") || "../";
    const activeNum = this.getAttribute("active-num") || "01";
    const pillarTitle = this.getAttribute("pillar-title") || "Sustainability Pillar";
    
    // 1. Parse the Manifest
    const evidenceManifest = JSON.parse(this.getAttribute("data-evidence") || "[]");

    const pillars = [
      { num: "01", title: "Setting & Infrastructure", img: "images/smart-eco-assets/setting_and_infrastructure.jpg", link: "infrastructure.html" },
      { num: "02", title: "Energy & Climate", img: "images/smart-eco-assets/energy_and_climate_change.jpg", link: "energy.html" },
      { num: "03", title: "Waste", img: "images/smart-eco-assets/waste.jpg", link: "waste.html" },
      { num: "04", title: "Water", img: "images/smart-eco-assets/water.jpg", link: "water.html" },
      { num: "05", title: "Transportation", img: "images/smart-eco-assets/transportation.jpg", link: "transportation.html" },
      { num: "06", title: "Education & Research", img: "images/smart-eco-assets/education_and_research.jpg", link: "education.html" },
      { num: "07", title: "Digitalization", img: "images/smart-eco-assets/digitalization.jpg", link: "digitalization.html" },
    ];

    const isPreview = window.location.search.includes('cms_preview=true') || (window.self !== window.top);
    const previewParam = isPreview ? '?cms_preview=true' : '';

    const navHtml = pillars.map(pillar => {
      const isActive = pillar.num === activeNum;
      return `
        <a href="${base}indicators/${pillar.link}${previewParam}" data-nav-pillar="${pillar.num}" class="group relative flex-1 aspect-square md:aspect-auto md:h-[148px] overflow-hidden block" title="${pillar.title}">
          <div class="h-full w-full overflow-hidden bg-black">
            <img src="${base}${pillar.img}" alt="${pillar.title}" loading="lazy" decoding="async" class="h-full w-full object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${isActive ? 'scale-100 grayscale-0 brightness-100 opacity-100' : 'scale-110 grayscale-[100%] brightness-50 opacity-60 group-hover:scale-105 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100'}" />
          </div>
          ${isActive ? `<div class="absolute bottom-0 left-0 h-[5px] w-full bg-gradient-to-r from-ucu-blue-dark to-ucu-red z-10"></div>` : ''}
        </a>
      `;
    }).join("");

    const activeIcons = {
      "01": "images/indicator-icons/infrastructure.png",
      "02": "images/indicator-icons/energy.png",
      "03": "images/indicator-icons/waste.png",
      "04": "images/indicator-icons/water.png",
      "05": "images/indicator-icons/transportation.png",
      "06": "images/indicator-icons/education.png",
      "07": "images/indicator-icons/digitalization.png",
    };
    const attrEvidenceThumb = this.getAttribute('evidence-thumb');
    const defaultIcon = attrEvidenceThumb 
      ? (attrEvidenceThumb.startsWith('data:') || attrEvidenceThumb.startsWith('http') || attrEvidenceThumb.startsWith('blob:') ? attrEvidenceThumb : (base + attrEvidenceThumb.replace(/^\.\.\//, '').replace(/^\.\//, '')))
      : (activeIcons[activeNum] ? (base + activeIcons[activeNum]) : (base + "images/smart-eco-assets/ui-green-seal.png"));

    // Deduplicate and natural numerical sort on evidence items
    const seen = new Set();
    const uniqueManifest = [];
    for (const ev of evidenceManifest) {
      if (!ev) continue;
      const key = (ev.codeID || ev.id || '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueManifest.push(ev);
      } else if (!key) {
        uniqueManifest.push(ev);
      }
    }
    const sortedManifest = uniqueManifest.sort((a, b) => {
      const codeA = (a.codeID || a.id || '').replace(/^modal-/, '').replace(/_/g, '.');
      const codeB = (b.codeID || b.id || '').replace(/^modal-/, '').replace(/_/g, '.');
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });

    const cardsHtml = sortedManifest.map(ev => {
      const sdgsString = ev.relatedSdgs ? JSON.stringify(ev.relatedSdgs) : '';
      const hasCustomThumb = ev.thumb_evidence && 
        ev.thumb_evidence !== 'images/smart-eco-assets/ui-green-seal.png' && 
        !ev.thumb_evidence.startsWith('images/indicator-icons/') &&
        !ev.thumb_evidence.startsWith('../images/indicator-icons/');
      const rawImg = hasCustomThumb ? ev.thumb_evidence : defaultIcon;
      const cardImg = rawImg.startsWith('http') || rawImg.startsWith('data:') || rawImg.startsWith('blob:') || rawImg.startsWith(base) 
        ? rawImg 
        : (base + rawImg.replace(/^\.\.\//, '').replace(/^\.\//, ''));

      return `
      <ucu-evidence-card 
        title="${ev.title}" 
        meta="UI GreenMetric" 
        img="${cardImg}" 
        evidence-id="${ev.id}"
        data-sdgs='${sdgsString}'>
      </ucu-evidence-card>
      `;
    }).join("");

    const modalsHtml = sortedManifest.map(ev => {
      const sdgsString = ev.relatedSdgs ? JSON.stringify(ev.relatedSdgs) : '';
      const blocksString = ev.blocks ? JSON.stringify(ev.blocks) : '';
      return `
      <ucu-modal-shell 
        modal-id="${ev.id}" 
        title="${ev.title}" 
        badge="${ev.badge}" 
        content-src="${ev.src}"
        data-blocks='${blocksString}'
        data-sdgs='${sdgsString}'>
      </ucu-modal-shell>
      `;
    }).join("");

    this.innerHTML = `
      <div class="flex w-full flex-col items-center py-12 bg-canvas min-h-screen font-sans">
        <div class="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav class="reveal translate-y-8 opacity-0 transition-all duration-900 ease-out relative z-10 flex w-full justify-center rounded-t-[1.2rem] bg-ucu-blue-dark shadow-2xl overflow-hidden flex-wrap md:flex-nowrap">
            ${navHtml}
          </nav>
          <section class="grid grid-cols-1 lg:grid-cols-[6.5fr_3.5fr] w-full items-stretch shadow-2xl rounded-b-[1.5rem] overflow-hidden">
            <div class="reveal translate-y-8 opacity-0 transition-all duration-900 ease-out bg-white p-6 md:p-12 z-20" id="indicator-narrative">
              <span class="block text-xs font-extrabold uppercase tracking-[0.2rem] text-ucu-red mb-4">Sustainable Indicator</span>
              <h2 class="group relative inline-block text-3xl md:text-[3rem] font-black leading-[1.05] tracking-[-0.03em] text-ucu-blue-dark mb-10">
                ${pillarTitle}
                <span class="absolute -bottom-[12px] left-0 h-[5px] w-[64px] rounded-full bg-gradient-to-r from-ucu-blue-dark to-ucu-red transition-all duration-500 ease-out group-hover:w-[100px]"></span>
              </h2>
              <div class="space-y-6">
                ${descriptionContent}
              </div>
            </div>
            <aside class="reveal translate-y-8 opacity-0 transition-all duration-900 ease-out relative flex flex-col gap-8 bg-gray-50 p-6 md:p-8 border-t-2 lg:border-t-0 lg:border-l-2 border-dashed border-black/5 z-20 lg:max-h-[1px] lg:min-h-full overflow-hidden" id="indicator-evidence-aside">
              <h3 class="flex items-center gap-3 text-sm font-extrabold uppercase tracking-[0.15rem] text-ucu-blue-dark z-10 relative shrink-0">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-ucu-red opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-ucu-red"></span>
                </span>
                Evidence & Documentation
              </h3>
              <div class="flex flex-col gap-5 relative z-10 w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-3 custom-scrollbar [&>*]:shrink-0" id="evidence-scroll-list">
                ${cardsHtml}
              </div>
            </aside>
          </section>
        </div>
      </div>
      ${modalsHtml}
    `;

    this.initReveal();
    if (typeof window.ucuInitScrollReveal === 'function') {
      window.ucuInitScrollReveal(this);
    }
  }

  initReveal() {
    const revealTargets = this.querySelectorAll(".reveal");
    if (revealTargets.length > 0) {
      const isIframe = window.self !== window.top || window.location.search.includes('cms_preview=true');
      if (isIframe || !('IntersectionObserver' in window)) {
        revealTargets.forEach(el => el.classList.remove("opacity-0", "translate-y-8"));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-8");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.01, rootMargin: "100px 0px" });

      revealTargets.forEach((el) => observer.observe(el));

      // Safety fallback to guarantee elements are revealed
      setTimeout(() => {
        revealTargets.forEach(el => el.classList.remove("opacity-0", "translate-y-8"));
      }, 300);
    }
  }
}

class UcuEvidenceCard extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || '';
    const meta = this.getAttribute('meta') || '';
    const img = this.getAttribute('img') || '';
    const evidenceId = this.getAttribute('evidence-id');
    const sdgsData = this.getAttribute('data-sdgs'); 

    let tagsHtml = '';

    if (sdgsData && sdgsData !== '[]') {
      try {
        const sdgs = JSON.parse(sdgsData).sort((a, b) => a - b);
        const SDG_COLORS = ['#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21', '#26BDE2', '#FCC30B', '#A21942', '#FD6925', '#DD1367', '#FD9D24', '#BF8B2E', '#3F7E44', '#0A97D9', '#56C02B', '#00689D', '#19486A'];
        
        const tags = sdgs.map(num => `
          <div class="flex items-center justify-center w-5 h-5 rounded-[3px] text-white text-[9px] font-black shadow-sm transition-transform hover:-translate-y-0.5 duration-300" style="background-color: ${SDG_COLORS[num-1] || '#24305e'};" title="SDG ${num}">
            ${num}
          </div>
        `).join('');

        // 2. EVIDENCE CARD POLISH: Added justify-end and pushed it to the bottom
        tagsHtml = `
          <div class="mt-auto pt-2 flex flex-wrap gap-1 justify-end w-full">
            ${tags}
          </div>
        `;
      } catch (e) {
        console.error("Invalid SDG array on evidence card.");
      }
    }

    this.innerHTML = `
      <button type="button" data-modal-trigger="${evidenceId}" data-evidence-id="${evidenceId}" class="ucu-evidence-trigger group relative w-full text-left flex items-stretch gap-4 bg-white p-4 rounded-2xl border border-black/5 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-gray-50 hover:-translate-y-1 hover:translate-x-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] cursor-pointer">
        <span class="absolute left-0 top-0 h-full w-[4px] bg-gradient-to-b from-ucu-blue-dark to-ucu-red origin-bottom scale-y-0 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100"></span>
        <div class="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
          <img src="${img}" alt="${title} Documentation" loading="lazy" decoding="async" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        </div>
        <div class="flex flex-col flex-1 overflow-hidden h-full">
          <span class="text-[0.8rem] font-extrabold leading-[1.3] tracking-[-0.01em] text-ucu-blue-dark transition-colors duration-300 group-hover:text-ucu-red line-clamp-2">${title}</span>
          <span class="flex items-center gap-1.5 mt-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted whitespace-nowrap">
            <span class="block h-1 w-1 shrink-0 rounded-full bg-ucu-red"></span>${meta}
          </span>
          ${tagsHtml}
        </div>
      </button>
    `;

    const btn = this.querySelector('.ucu-evidence-trigger');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.ucuOpenModal(evidenceId);
      });
    }
  }
}

if (!customElements.get("ucu-indicator-layout")) customElements.define("ucu-indicator-layout", UcuIndicatorLayout);
if (!customElements.get("ucu-evidence-card")) customElements.define("ucu-evidence-card", UcuEvidenceCard);