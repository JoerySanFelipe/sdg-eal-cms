/**
 * js/core-ui.js
 * Mission-critical structural components for the UCU External Office website.
 */

/* ==========================================================================
   0. INSTITUTIONAL BRANDING (GLOBAL DATA)
   ========================================================================== */

window.UCU_SDG_COLORS = {
  1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D", 5: "#FF3A21", 
  6: "#26BDE2", 7: "#FCC30B", 8: "#A21942", 9: "#FD6925", 10: "#DD1367", 
  11: "#FD9D24", 12: "#BF8B2E", 13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B", 
  16: "#00689D", 17: "#19486A"
};

window.ucuGetBasePath = () => {
  const header = document.querySelector('ucu-header');
  if (header) return header.getAttribute('base-path') || './';
  const footer = document.querySelector('ucu-footer');
  if (footer) return footer.getAttribute('base-path') || './';
  return './';
};

window.ucuResolveMediaSrc = (src, basePath = null) => {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//') || src.startsWith('blob:')) {
    return src;
  }
  const base = basePath !== null ? basePath : (window.ucuGetBasePath ? window.ucuGetBasePath() : './');
  let clean = src;
  while (clean.startsWith('../')) clean = clean.substring(3);
  if (clean.startsWith('./')) clean = clean.substring(2);
  if (clean.startsWith('/')) clean = clean.substring(1);
  return `${base}${clean}`;
};

window.ucuHandleImageError = (imgEl) => {
  imgEl.onerror = null; // Prevent infinite loop if fallback fails
  imgEl.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='100%25' height='100%25' fill='%2324305e'/%3E%3Ccircle cx='400' cy='225' r='180' fill='none' stroke='%23fbef4b' stroke-width='1.5' stroke-opacity='0.15'/%3E%3Ccircle cx='400' cy='225' r='120' fill='none' stroke='%23c43643' stroke-width='1.5' stroke-opacity='0.2'/%3E%3Ctext x='50%25' y='46%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='900' font-size='26' fill='%23ffffff' letter-spacing='4'%3EURDANETA CITY UNIVERSITY%3C/text%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='700' font-size='14' fill='%23fbef4b' letter-spacing='6'%3EEXTERNAL AFFAIRS %26 LINKAGES%3C/text%3E%3C/svg%3E";
};

window.ucuOpenPdfDocument = (pdfSrc, title = 'Research Document - Urdaneta City University') => {
  if (!pdfSrc || pdfSrc === '#') {
    alert('No PDF document is currently attached to this publication.');
    return;
  }

  // 1. If it's a real HTTP / HTTPS or relative path URL, open natively
  if (pdfSrc.startsWith('http://') || pdfSrc.startsWith('https://') || (!pdfSrc.startsWith('data:') && !pdfSrc.startsWith('blob:'))) {
    const resolved = window.ucuResolveMediaSrc ? window.ucuResolveMediaSrc(pdfSrc) : pdfSrc;
    window.open(resolved, '_blank', 'noopener,noreferrer');
    return;
  }

  // 2. Handle Base64 / Blob URLs via an embedded viewer window
  // This bypasses Chrome/Brave's "about:blank#blocked" restriction against top-frame blob/data navigation.
  try {
    let blobUrl = pdfSrc;
    if (pdfSrc.startsWith('data:')) {
      const parts = pdfSrc.split(',');
      const base64Data = parts.length > 1 ? parts[1] : parts[0];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: 'application/pdf' });
      blobUrl = URL.createObjectURL(blob);
    }

    const win = window.open('', '_blank');
    if (win) {
      const safeTitle = (title || 'Research Document - Urdaneta City University').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      win.document.write(`<!DOCTYPE html>
<html lang="en" style="height:100%;width:100%;margin:0;padding:0;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    html, body { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; background-color: #525659; font-family: system-ui, sans-serif; }
    iframe { border: none; width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  <iframe src="${blobUrl}" title="${safeTitle}" allowfullscreen></iframe>
</body>
</html>`);
      win.document.close();
      return;
    }
  } catch (e) {
    console.error('[UCU PDF Reader] Error opening embedded PDF document:', e);
  }

  // Fallback download if popup blocked
  const a = document.createElement('a');
  a.href = pdfSrc;
  a.target = '_blank';
  a.download = (title || 'research-document').replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/* ==========================================================================
   1. NAVIGATION & STRUCTURAL COMPONENTS (RESPONSIVE + SMART BREADCRUMBS)
   ========================================================================== */

class UcuHeader extends HTMLElement {
  connectedCallback() {
    this.style.display = "block";
    this.style.width = "100%";
    this.style.position = "sticky";
    this.style.top = "0";
    this.style.zIndex = "50";

    if (this.hasRendered) return;
    this.hasRendered = true;

    const base = this.getAttribute("base-path") || "./";
    const currentPath = window.location.pathname;

    const mainNavLinks = [
      { name: "Home", url: "index.html" },
      { name: "Announcements", url: "announcement.html" },
      { name: "SDG Reports", url: "sdg-reports.html" },
      { name: "Research", url: "research.html" },
      { name: "Impact & Events", url: "impact.html" },
      { name: "Rankings", url: "rankings.html" },
      { name: "Partnerships", url: "partnership.html" },
      { name: "Smart Eco Campus", url: "smart-eco-campus.html" },
    ];

    const isActive = (url) => {
      if (url === "index.html") return currentPath.endsWith("/") || currentPath.endsWith("index.html");
      const pageBase = url.replace(".html", "");
      return currentPath.includes(pageBase);
    };

    /* ── GENERATE MOBILE HTML LINKS (ACCORDION STRUCTURE) ── */
    const mobileNavLinksHtml = mainNavLinks.map(link => {
      if (link.dropdown) {
        return `
        <div class="flex flex-col border-b border-white/10">
          <button class="mobile-dropdown-btn flex items-center justify-between w-full px-6 py-4 text-left text-sm font-medium text-white hover:bg-white/5 transition-colors focus:outline-none">
            <span class="${link.dropdown.some(d => isActive(d.url)) ? 'text-ucu-yellow' : ''}">${link.name}</span>
            <svg class="w-4 h-4 text-ucu-yellow transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div class="mobile-dropdown-content max-h-0 overflow-hidden transition-all duration-300 bg-black/20">
            ${link.dropdown.map(drop => `
              <a href="${base}${drop.url}" class="block pl-10 pr-6 py-3.5 text-sm text-white hover:text-ucu-yellow hover:bg-white/5 transition-colors border-l-[3px] border-transparent hover:border-ucu-yellow ${isActive(drop.url) ? 'text-ucu-yellow border-ucu-yellow bg-white/5' : ''}">${drop.name}</a>
            `).join("")}
          </div>
        </div>`;
      } else {
        return `<a href="${base}${link.url}" class="block px-6 py-4 border-b border-white/10 text-sm font-medium text-white hover:bg-white/5 hover:text-ucu-yellow transition-colors ${isActive(link.url) ? 'text-ucu-yellow bg-white/5 border-l-[3px] border-ucu-yellow' : 'border-l-[3px] border-transparent'}">${link.name}</a>`;
      }
    }).join("");

    /* ── START STATELESS BREADCRUMB ENGINE ── */
    const PATH_DICTIONARY = {
      "announcement": "Announcements",
      "rankings": "Rankings",
      "partnership": "Partnerships",
      "infrastructure": "Setting & Infrastructure",
      "energy": "Energy & Climate Change",
      "waste": "Waste",
      "water": "Water",
      "transportation": "Transportation",
      "education": "Education & Research",
      "digitalization": "Digitalization",
      "sdg-reports": "SDG Reports",
      "impact": "Impact & Events",
      "events": "Events",
      "research": "Research",
      "sdg1": "SDG 1: No Poverty",
      "sdg2": "SDG 2: Zero Hunger",
      "sdg3": "SDG 3: Good Health and Well-being",
      "sdg4": "SDG 4: Quality Education",
      "sdg5": "SDG 5: Gender Equality",
      "sdg6": "SDG 6: Clean Water and Sanitation",
      "sdg7": "SDG 7: Affordable and Clean Energy",
      "sdg8": "SDG 8: Decent Work & Economic Growth",
      "sdg9": "SDG 9: Industry, Innovation and Infrastructure",
      "sdg10": "SDG 10: Reduced Inequalities",
      "sdg11": "SDG 11: Sustainable Cities and Communities",
      "sdg12": "SDG 12: Responsible Consumption and Production",
      "sdg13": "SDG 13: Climate Action",
      "sdg14": "SDG 14: Life Below Water",
      "sdg15": "SDG 15: Life on Land",
      "sdg16": "SDG 16: Peace, Justice and Strong Institutions",
      "sdg17": "SDG 17: Partnerships for the Goals"
    };

    const SILENT_FOLDERS = []; 

    let pathArray = currentPath.split("/").filter(Boolean);
    const depth = base.split('/').filter(p => p === '..').length;
    let appPath = pathArray.slice(pathArray.length - (depth + 1));

    let breadcrumbTrail = [{ label: "Home", url: base + "index.html" }];

    const validSegments = [
      'announcement', 'sdg-reports', 'research', 'impact', 'events', 'indicators', 'smart-eco-campus', 'rankings', 'partnership',
      '2025', '2024', '2023', 'index'
    ];
    const indicatorsList = ["infrastructure", "energy", "waste", "water", "transportation", "education", "digitalization"];
    const isValidSegment = (seg) => {
      if (validSegments.includes(seg)) return true;
      if (seg.startsWith('sdg') && !isNaN(seg.replace('sdg', ''))) return true;
      if (!isNaN(seg)) return true;
      if (indicatorsList.includes(seg)) return true;
      return false;
    };

    appPath.forEach((p, index) => {
      let segment = p.replace(".html", "").replace(".php", "");
      if (segment === "index" || segment === "") return;
      if (!isValidSegment(segment)) return;
      if (SILENT_FOLDERS.includes(segment)) return;

      let label = PATH_DICTIONARY[segment];
      if (!label) {
        label = segment.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      }
      
      let href = "";

      if (segment === "indicators" || (segment === "smart-eco-campus" && index < appPath.length - 1)) {
        label = "Smart Eco Campus"; 
        href = base + "smart-eco-campus.html"; 
      } else if (!isNaN(segment)) {
        let prevFolder = appPath[index - 1];
        if (prevFolder === "events") prevFolder = "impact"; 
        if (prevFolder) href = `${base}${prevFolder}/${segment}.html`;
      } else if (["rankings", "partnership", "smart-eco-campus", "announcement"].includes(segment)) {
        href = base + segment + ".html";
      }

      breadcrumbTrail.push({ label, url: href });
    });

    const breadcrumbElementsHtml = breadcrumbTrail.map((item, index) => {
      let isLast = index === breadcrumbTrail.length - 1;
      if (isLast) {
        return `<span class="text-ucu-yellow font-normal tracking-wide cursor-default drop-shadow-sm">${item.label}</span>`;
      } else if (item.url) {
        return `<a href="${item.url}" class="text-white/60 hover:text-ucu-yellow transition-colors duration-300 font-normal tracking-wide cursor-pointer">${item.label}</a>`;
      } else {
        return `<span class="text-white/60 font-normal tracking-wide cursor-default">${item.label}</span>`;
      }
    });

    const separatorSvg = `<svg class="w-4 h-4 mx-4 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>`;
    const breadcrumbsHtml = breadcrumbElementsHtml.join(separatorSvg);
    /* ── END STATELESS BREADCRUMB ENGINE ── */

    this.innerHTML = `
      <header class="bg-dark-red border-t-4 border-ucu-blue shadow-[0_15px_35px_rgba(161,5,5,0.2),_0_5px_15px_rgba(0,0,0,0.15)] sticky top-0 flex flex-col w-full font-[family-name:var(--font-sans)]" style="background-clip: padding-box;">
        
        <div class="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-20 bg-dark-red">
          <div class="flex items-center justify-between py-2">
            <a href="${base}index.html" class="shrink-0">
              <img src="${base}images/ucu-landscape-dark.png" alt="UCU Logo" class="h-9 w-auto drop-shadow-sm hover:scale-105 hover:-rotate-1 transition-transform duration-500 ease-out" onerror="this.style.display='none'" />
            </a>
            
            <nav class="hidden lg:flex items-center gap-1">
              ${mainNavLinks
                .map((link) => {
                  if (link.dropdown) {
                    return `
                    <div class="relative group">
                      <button class="flex items-center w-full justify-center text-xs font-normal tracking-wide px-3 py-1.5 rounded-lg transition-all duration-300 hover:bg-white/10 hover:backdrop-blur-md group-hover:bg-white/10 group-hover:backdrop-blur-md ${link.dropdown.some((d) => isActive(d.url)) ? "text-ucu-yellow" : "text-white"}" aria-expanded="false">
                        <span class="group-hover:text-ucu-yellow transition-colors duration-300">${link.name}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 max-w-0 opacity-0 overflow-hidden transition-all duration-300 ease-out group-hover:max-w-[12px] group-hover:ml-1 group-hover:opacity-100 group-hover:text-ucu-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                      <div class="absolute top-full left-0 pt-[12px] min-w-[220px] origin-top scale-y-0 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-hover:opacity-100 z-50">
                        <div class="bg-dark-red border border-white/10 shadow-2xl overflow-hidden flex flex-col py-1 backdrop-blur-md">
                          ${link.dropdown.map((drop) => `<a href="${base}${drop.url}" class="px-4 py-2.5 text-left text-xs font-normal tracking-wide text-white hover:bg-white/20 hover:text-ucu-yellow transition-colors duration-200 block border-b border-white/5 last:border-none">${drop.name}</a>`).join("")}
                        </div>
                      </div>
                    </div>
                  `;
                  } else {
                    return `<a href="${base}${link.url}" class="text-xs font-normal tracking-wide px-3 py-1.5 rounded-lg transition-all duration-300 hover:bg-white/10 hover:backdrop-blur-md hover:text-ucu-yellow ${isActive(link.url) ? "text-ucu-yellow" : "text-white"}">${link.name}</a>`;
                  }
                })
                .join("")}
            </nav>

            <button id="mobile-menu-btn" class="lg:hidden text-white hover:text-ucu-yellow p-2 focus:outline-none transition-colors duration-300" aria-label="Toggle Menu">
              <svg class="menu-icon w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              <svg class="close-icon w-7 h-7 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        
        <div id="mobile-menu" class="lg:hidden absolute top-full left-0 w-full bg-dark-red shadow-2xl border-t border-white/10 overflow-hidden transition-all duration-300 ease-out max-h-0 opacity-0 invisible z-10">
          <nav class="flex flex-col w-full pb-4 shadow-[inset_0_10px_20px_rgba(0,0,0,0.2)]">
            ${mobileNavLinksHtml}
          </nav>
        </div>

        <div class="bg-black/20 border-t border-white/10 w-full relative z-10 py-2.5 shadow-inner">
          <div class="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <nav class="flex items-center text-sm font-normal tracking-wide">
              ${breadcrumbsHtml}
            </nav>
          </div>
        </div>
      </header>
    `;

    /* ── START NATIVE MOBILE INTERACTION LOGIC ── */
    // Trigger logic after DOM insertion
    setTimeout(() => {
      const mobileBtn = this.querySelector('#mobile-menu-btn');
      const mobileMenu = this.querySelector('#mobile-menu');
      const menuIcon = mobileBtn.querySelector('.menu-icon');
      const closeIcon = mobileBtn.querySelector('.close-icon');

      // Toggle Main Menu
      mobileBtn.addEventListener('click', () => {
        const isClosed = mobileMenu.classList.contains('max-h-0');
        
        if (isClosed) {
          mobileMenu.classList.remove('max-h-0', 'opacity-0', 'invisible');
          mobileMenu.classList.add('max-h-[75vh]', 'opacity-100', 'visible', 'overflow-y-auto');
          menuIcon.classList.add('hidden');
          closeIcon.classList.remove('hidden');
        } else {
          mobileMenu.classList.add('max-h-0', 'opacity-0', 'invisible');
          mobileMenu.classList.remove('max-h-[75vh]', 'opacity-100', 'visible', 'overflow-y-auto');
          menuIcon.classList.remove('hidden');
          closeIcon.classList.add('hidden');
        }
      });

      // Toggle Accordion Dropdowns
      const dropBtns = this.querySelectorAll('.mobile-dropdown-btn');
      dropBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const content = btn.nextElementSibling;
          const icon = btn.querySelector('svg');
          const isOpen = !content.classList.contains('max-h-0');

          // Close all other dropdowns first for a clean experience
          dropBtns.forEach(otherBtn => {
            if (otherBtn !== btn) {
              const otherContent = otherBtn.nextElementSibling;
              const otherIcon = otherBtn.querySelector('svg');
              otherContent.classList.add('max-h-0');
              otherContent.classList.remove('max-h-96');
              otherIcon.classList.remove('rotate-180');
            }
          });

          // Toggle clicked dropdown
          if (isOpen) {
            content.classList.add('max-h-0');
            content.classList.remove('max-h-96');
            icon.classList.remove('rotate-180');
          } else {
            content.classList.remove('max-h-0');
            content.classList.add('max-h-96'); // Standard fixed height class for CSS transition to target
            icon.classList.add('rotate-180');
          }
        });
      });
    }, 0);
  }
}

/* ==========================================================================
   2. FOOTER COMPONENT
   ========================================================================== */

class UcuFooter extends HTMLElement {
  connectedCallback() {
    this.style.display = "block";
    this.style.width = "100%";

    if (this.hasRendered) return;
    this.hasRendered = true;

    const base = this.getAttribute("base-path") || "./";

    this.innerHTML = `
      <footer class="mt-10 w-full relative overflow-hidden border-t-[4px] border-ucu-red font-sans pb-8" style="
  background-clip: padding-box;
  background-color: #111827;
  background-image:
    linear-gradient(160deg, #0d1433 0%, #1a2550 30%, #24305e 55%, #1e1a40 80%, #0d1020 100%),
    radial-gradient(ellipse 100% 50% at 50% 0%, rgba(57,74,138,0.55) 0%, transparent 60%),
    radial-gradient(ellipse 50% 80% at 90% 90%, rgba(196,54,67,0.18) 0%, transparent 55%),
    radial-gradient(ellipse 30% 40% at 10% 70%, rgba(80,100,180,0.2) 0%, transparent 60%);
  background-blend-mode: normal, screen, screen, screen;
">
        
        <div class="absolute top-[10%] left-[5%] w-[32vw] h-[32vw] bg-[radial-gradient(circle,rgba(196,54,67,0.06)_0%,transparent_60%)] rounded-full pointer-events-none z-0"></div>
        <div class="absolute -bottom-[10%] -right-[5%] w-[360px] h-[360px] bg-contain bg-no-repeat bg-center opacity-5 pointer-events-none z-0" style="background-image: url('${base}images/ucu-portrait-dark.png');"></div>

        <div class="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row lg:justify-between gap-10 lg:gap-8 relative z-10">
          
          <div class="flex flex-col lg:min-w-[150px]">
            <h3 class="text-ucu-yellow mb-4 font-bold tracking-widest uppercase text-[11px]">Quick Links</h3>
            <nav class="flex flex-col gap-2.5">
              <a href="${base}index.html" class="text-white/80 hover:text-ucu-yellow text-[13px] font-medium transition-colors">Home</a>
              <a href="${base}announcement.html" class="text-white/80 hover:text-ucu-yellow text-[13px] font-medium transition-colors">Announcements</a>
              <a href="${base}sdg-reports.html" class="text-white/80 hover:text-ucu-yellow text-[13px] font-medium transition-colors">SDG Reports</a>
              <a href="${base}research.html" class="text-white/80 hover:text-ucu-yellow text-[13px] font-medium transition-colors">Research</a>
              <a href="${base}impact.html" class="text-white/80 hover:text-ucu-yellow text-[13px] font-medium transition-colors">Impact & Events</a>
              <a href="${base}rankings.html" class="text-white/80 hover:text-ucu-yellow text-[13px] font-medium transition-colors">Rankings</a>
              <a href="${base}partnership.html" class="text-white/80 hover:text-ucu-yellow text-[13px] font-medium transition-colors">Partnerships</a>
              <a href="${base}smart-eco-campus.html" class="text-white/80 hover:text-ucu-yellow text-[13px] font-medium transition-colors">Smart Eco Campus</a>
            </nav>
          </div>

          <div class="flex flex-col lg:min-w-[240px]">
            <h3 class="text-ucu-yellow mb-4 font-bold tracking-widest uppercase text-[11px]">Institutional Portals</h3>
            <nav class="flex flex-col gap-3">
              <a href="https://ucu.edu.ph" target="_blank" rel="noopener noreferrer" class="group flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 transition-all duration-300 backdrop-blur-sm">
                <span class="text-white/90 text-xs font-medium tracking-wide">UCU Official Website</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-ucu-yellow opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </a>
              <a href="${base}sdg-reports.html" class="group flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 transition-all duration-300 backdrop-blur-sm">
                <span class="text-white/90 text-xs font-medium tracking-wide">SDG Reports Hub</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-ucu-yellow opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </a>
              <a href="https://forms.google.com/your-form-id-here" target="_blank" rel="noopener noreferrer" class="group flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 transition-all duration-300 backdrop-blur-sm">
                <span class="text-white/90 text-xs font-medium tracking-wide">Partnership Inquiry Form</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-ucu-yellow opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </a>
            </nav>
          </div>

          <div class="flex flex-col lg:min-w-[200px]">
            <h3 class="text-ucu-yellow mb-4 font-bold tracking-widest uppercase text-[11px]">Follow Us</h3>
            <div class="flex flex-col gap-4">
              <a href="https://www.facebook.com/UCUOfficial" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 text-white/80 hover:text-ucu-yellow transition-colors group">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" class="shrink-0 group-hover:-translate-y-1 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                <span class="text-[13px] font-medium leading-snug">Urdaneta City University</span>
              </a>
              <a href="https://www.facebook.com/profile.php?id=100085270500358" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 text-white/80 hover:text-ucu-yellow transition-colors group">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" class="shrink-0 group-hover:-translate-y-1 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                <span class="text-[13px] font-medium leading-snug">External Affairs and Linkages</span>
              </a>
            </div>
          </div>

          <div class="flex flex-col lg:min-w-[240px]">
            <div class="flex justify-center w-full mb-5">
              <img src="${base}images/ucu-portrait-dark.png" alt="UCU Logo" class="h-24 w-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-all duration-500 ease-out hover:-translate-y-1 hover:scale-105" onerror="this.style.display='none'" />
            </div>
            <div class="flex flex-col gap-3 text-white/80 text-[13px] font-medium items-start text-left">
              <div class="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="mt-0.5 shrink-0 text-ucu-yellow/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <p class="leading-relaxed">1 San Vicente West<br />Urdaneta City, Pangasinan 2428</p>
              </div>
              <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="shrink-0 text-ucu-yellow/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <p>(075) 529-5223</p>
              </div>
            </div>
          </div>

        </div>

        <div class="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="border-t border-white/10 pt-6 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 text-center lg:text-left">
            
            <div class="text-white/60 text-[11px] tracking-[0.05em] font-medium lg:w-1/3">
              &copy; 2026 Urdaneta City University. All rights reserved.
            </div>
            
            <div class="flex flex-wrap justify-center lg:justify-end gap-x-2 gap-y-1 text-[10px] text-white/40 uppercase tracking-wider font-semibold lg:w-2/3">
              <span class="hover:text-white/80 transition-colors cursor-default">UCU SDG</span>
              <span>|</span>
              <span class="hover:text-white/80 transition-colors cursor-default">UCU Sustainable Development Goals</span>
              <span>|</span>
              <span class="hover:text-white/80 transition-colors cursor-default">UCU Linkages</span>
              <span>|</span>
              <span class="hover:text-white/80 transition-colors cursor-default">Smart Eco Campus</span>
              <span>|</span>
              <span class="hover:text-white/80 transition-colors cursor-default">Times Higher Education Impact Rankings</span>
            </div>
            
          </div>
        </div>

      </footer>
    `;
  }
}

class UcuSectionHeader extends HTMLElement {
  static get observedAttributes() {
    return ['eyebrow', 'title', 'link-text', 'link-url', 'delay'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) {
      this.connectedCallback();
    }
  }

  connectedCallback() {
    const eyebrow = this.getAttribute("eyebrow") || "";
    const title = this.getAttribute("title") || "";
    const linkText = this.getAttribute("link-text") || "";
    const linkUrl = this.getAttribute("link-url") || "#";
    const delay = this.getAttribute("delay") || "0ms";

    const linkMarkup = linkText ? `
      <a href="${linkUrl}" class="text-xs font-bold tracking-[0.15em] uppercase text-ucu-blue border-b border-ucu-blue pb-0.5 hover:text-ucu-red hover:border-ucu-red transition-colors duration-200 self-start sm:self-auto">
        ${linkText} &rarr;
      </a>
    ` : "";

    this.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 reveal-on-scroll is-visible" style="transition-delay: ${delay};">
        <div>
          ${eyebrow ? `<p class="text-[10px] font-bold tracking-[0.25em] uppercase text-ucu-red mb-2">${eyebrow}</p>` : ""}
          <h2 class="text-3xl md:text-4xl font-black text-ucu-blue-dark">${title}</h2>
        </div>
        ${linkMarkup}
      </div>
    `;
    this.hasRendered = true;
  }
}

/* ==========================================================================
   5. GLOBAL UTILITIES & ANIMATION ENGINE
   ========================================================================== */

// Global Scroll Reveal Engine
window.ucuInitScrollReveal = function(container = document) {
  const revealElements = container.querySelectorAll(".reveal-on-scroll:not(.is-visible)");
  if (!revealElements.length) return;

  const isIframe = window.self !== window.top || window.location.search.includes('cms_preview=true');
  if (isIframe || !('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01, rootMargin: "100px 0px" });

  revealElements.forEach(el => observer.observe(el));

  // Safety fallback: ensure elements become visible
  setTimeout(() => {
    revealElements.forEach(el => el.classList.add('is-visible'));
  }, 400);
};

document.addEventListener("DOMContentLoaded", () => {
  // 1. Standardized Scroll Reveal Observer
  window.ucuInitScrollReveal();

  // 2. Dynamic, Responsive "Back to Top" Button
  const backToTopBtn = document.createElement("button");
  backToTopBtn.id = "ucu-back-to-top";
  backToTopBtn.className = "fixed bottom-6 right-6 z-50 flex items-center justify-center p-3 md:px-5 md:py-3 md:gap-2 rounded-full bg-ucu-red text-white shadow-[0_4px_20px_rgba(196,54,67,0.3)] opacity-0 pointer-events-none transition-all duration-300 hover:bg-ucu-blue-dark hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ucu-yellow translate-y-4 cursor-pointer font-[family-name:var(--font-sans)] font-bold text-xs uppercase tracking-wider";
  backToTopBtn.setAttribute("aria-label", "Back to top");
  backToTopBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
    </svg>
    <span class="hidden md:inline leading-none select-none">Back to Top</span>
  `;
  document.body.appendChild(backToTopBtn);

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const toggleBackToTop = () => {
    const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
    const currentScroll = window.scrollY;

    if (isScrollable && currentScroll > 300) {
      backToTopBtn.classList.remove("opacity-0", "pointer-events-none", "translate-y-4");
      backToTopBtn.classList.add("pointer-events-auto", "translate-y-0");

      // Calculate scroll fraction to scale opacity (0.6 subtle -> 1.0 full clear at the bottom)
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollRange = maxScroll - 300;
      let opacity = 0.6; // Start with 60% opacity at threshold

      if (scrollRange > 0) {
        const fraction = (currentScroll - 300) / scrollRange;
        opacity = 0.6 + fraction * 0.4;
      }

      backToTopBtn.style.opacity = Math.min(1.0, Math.max(0.6, opacity));
    } else {
      backToTopBtn.classList.add("opacity-0", "pointer-events-none", "translate-y-4");
      backToTopBtn.classList.remove("pointer-events-auto", "translate-y-0");
      backToTopBtn.style.opacity = ""; // Clear inline style
    }
  };

  window.addEventListener("scroll", toggleBackToTop);
  window.addEventListener("resize", toggleBackToTop);
  setTimeout(toggleBackToTop, 200);
});

/* ==========================================================================
   4. COMPONENT REGISTRATION
   ========================================================================== */

if (!customElements.get("ucu-header")) customElements.define("ucu-header", UcuHeader);
if (!customElements.get("ucu-footer")) customElements.define("ucu-footer", UcuFooter);
if (!customElements.get("ucu-section-header")) customElements.define("ucu-section-header", UcuSectionHeader);
