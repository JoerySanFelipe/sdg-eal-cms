// js/modals.js
/**
 * Universal Modal Shell & Evidence Viewer for UCU SDG Web.
 * Supports: Database Rich Content Blocks (UcuBlockRenderer), HTML fragment fetching,
 * Image Lightbox, and International Rankings Deep-Linking Proof URLs.
 */

class UcuModalShell extends HTMLElement {
  static get observedAttributes() {
    return ['modal-id', 'title', 'badge', 'content-src', 'data-sdgs', 'data-blocks'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal && this.hasRendered) {
      this.hasRendered = false;
      this.connectedCallback();
    }
  }

  connectedCallback() {
    if (this.hasRendered) return;
    this.hasRendered = true;
    
    this.modalId = this.getAttribute('modal-id') || 'modal'; 
    const title = this.getAttribute('title') || 'Institutional Documentation';
    const badge = this.getAttribute('badge') || 'Verified Document';
    this.contentSrc = this.getAttribute('content-src');
    this.sdgsData = this.getAttribute('data-sdgs'); 
    this.blocksData = this.getAttribute('data-blocks');
    
    this.isLoaded = false; 
    
    let tagsHtml = '';
    this.hasSdgs = false;

    if (this.sdgsData && this.sdgsData !== '[]') {
      try {
        const rawSdgs = typeof this.sdgsData === 'string' ? JSON.parse(this.sdgsData) : this.sdgsData;
        const sdgs = Array.isArray(rawSdgs) ? rawSdgs.sort((a, b) => a - b) : [];
        const colors = window.UCU_SDG_COLORS || {
          1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
          6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
          11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
          16: '#00689D', 17: '#19486A'
        };
        
        const basePath = window.ucuGetBasePath ? window.ucuGetBasePath() : './';

        if (sdgs.length > 0) {
          tagsHtml = sdgs.map(num => `
            <a href="${basePath}sdg-reports/sdg${num}.html" class="flex items-center justify-center w-8 h-8 rounded-lg text-white text-xs font-black shadow-sm transition-transform hover:-translate-y-0.5 no-underline hover:text-white" style="background-color: ${colors[num] || '#24305e'};" title="SDG ${num}">${num}</a>
          `).join('');
          this.hasSdgs = true;
        }
      } catch (e) {
        console.error("[UCU Architecture] Invalid SDG array passed to modal:", e);
      }
    }

    const footerClass = "shrink-0 sticky bottom-0 z-20 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-4 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]";

    const footerHtml = `
      <footer class="${footerClass}">
        <!-- Navigation Buttons (for both Desktop and Mobile) -->
        <div class="flex items-center gap-2">
          <button type="button" class="prev-btn flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-ucu-blue-dark hover:text-white transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-sm" aria-label="Previous item">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button type="button" class="next-btn flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-ucu-blue-dark hover:text-white transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-sm" aria-label="Next item">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <!-- SDG Alignment Tags -->
        <div class="flex items-center gap-3 justify-end flex-grow">
          ${this.hasSdgs ? `
            <span class="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap hidden sm:inline">SDG Alignment</span>
            <div class="flex flex-wrap gap-1.5">${tagsHtml}</div>
          ` : ''}
        </div>
      </footer>
    `;

    this.innerHTML = `
      <dialog id="modal-${this.modalId}" class="main-evidence-modal backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm bg-white w-full max-w-3xl m-auto p-0 rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden open:animate-[pop-in_0.3s_ease-out_forwards]">
        <div class="flex flex-col w-full max-h-[90vh] relative">
          <header class="flex items-start justify-between px-6 py-4 border-b border-slate-100 sticky top-0 z-20 bg-white/95 backdrop-blur-sm shrink-0">
            <div class="flex flex-col gap-2">
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full w-fit shadow-xs">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-ucu-blue-dark opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-ucu-blue-dark"></span>
                </span>
                <span class="text-[0.65rem] font-black uppercase tracking-[0.1em] text-ucu-blue-dark">${badge}</span>
              </div>
              <h1 class="text-base md:text-lg font-black tracking-tight pr-4 m-0 text-ucu-blue-dark">${title}</h1>
            </div>
            <form method="dialog" class="pt-2">
              <button type="button" class="close-btn group flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 shrink-0 shadow-sm bg-slate-100 hover:bg-ucu-red text-slate-500 hover:text-white" aria-label="Close modal">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          </header>
          <article class="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-grow min-h-0 bg-white">
            <div class="ucu-prose-evidence evidence-content-container flex flex-col"></div>
          </article>
          ${footerHtml}
        </div>
      </dialog>
      
      <dialog id="lightbox-${this.modalId}" class="lightbox-dialog backdrop:bg-slate-900/90 backdrop:backdrop-blur-sm bg-transparent border-0 p-0 m-auto max-w-[95vw] max-h-[95vh] cursor-zoom-out shadow-2xl open:animate-[pop-in_0.2s_ease-out_forwards]">
        <img src="" alt="Expanded Media View" class="lightbox-img w-auto h-auto max-w-[95vw] max-h-[95vh] object-contain rounded-xl" />
      </dialog>
    `;

    this.dialog = this.querySelector(`#modal-${this.modalId}`);
    this.lightbox = this.querySelector(`#lightbox-${this.modalId}`);
    this.lightboxImg = this.querySelector('.lightbox-img');
    this.contentContainer = this.querySelector('.evidence-content-container');
    this.closeBtn = this.querySelector('.close-btn');
    this.scrollContainer = this.querySelector('article');

    this.initEvents();
  }

  // --- PUBLIC API ---

  async open() {
    if (this.dialog.open) return; 
    
    // 1. Strict Body-Scroll Locking
    document.body.style.overflow = 'hidden';
    
    // 2. State Management (URL Deep-Link Injection)
    const url = new URL(window.location);
    const isEvidence = url.pathname.includes('indicator') || url.searchParams.has('evidence');
    const paramName = isEvidence ? 'evidence' : 'event';
    const currentId = url.searchParams.get(paramName);
    
    if (currentId !== this.modalId) {
      url.searchParams.set(paramName, this.modalId);
      window.history.pushState({}, '', url);
    }

    // 3. Open Dialog
    this.dialog.showModal();
    if (this.scrollContainer) {
      this.scrollContainer.scrollTop = 0;
    }

    // 4. Update Navigation Buttons
    this.updateNavButtons();

    // 5. Await Content Render
    await this.loadContent();
  }

  close(isPopState = false) {
    if (!this.dialog.open) return;
    
    this.dialog.close();
    
    // 1. Safe Body-Scroll Locking
    if (document.querySelectorAll('.main-evidence-modal[open]').length <= 1) {
      document.body.style.overflow = '';
    }
    
    // 2. State Management (URL Cleanup)
    if (!isPopState) {
      const url = new URL(window.location);
      url.searchParams.delete('event');
      url.searchParams.delete('evidence');
      url.searchParams.delete('modal');
      window.history.pushState({}, '', url);
    }
  }

  // --- INTERNAL LOGIC ---

  updateNavButtons() {
    const parent = this.parentElement || document;
    const shells = Array.from(parent.querySelectorAll('ucu-modal-shell'));
    const currentIndex = shells.findIndex(shell => shell.modalId === this.modalId);

    const prevBtns = this.querySelectorAll('.prev-btn');
    const nextBtns = this.querySelectorAll('.next-btn');

    if (shells.length <= 1) {
      prevBtns.forEach(btn => btn.style.display = 'none');
      nextBtns.forEach(btn => btn.style.display = 'none');
      
      const footer = this.querySelector('footer');
      if (footer && !this.hasSdgs) {
        footer.style.display = 'none';
      }
      return;
    } else {
      prevBtns.forEach(btn => btn.style.display = '');
      nextBtns.forEach(btn => btn.style.display = '');
      
      const footer = this.querySelector('footer');
      if (footer) {
        footer.style.display = '';
      }
    }

    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex !== -1 && currentIndex < shells.length - 1;

    prevBtns.forEach(btn => {
      btn.disabled = !hasPrev;
    });

    nextBtns.forEach(btn => {
      btn.disabled = !hasNext;
    });
  }

  async loadContent() {
    if (this.isLoaded) return;
    const basePath = window.ucuGetBasePath ? window.ucuGetBasePath() : './';

    // A. PRIORITY 1: DATABASE RICH CONTENT BLOCKS (Option B)
    const rawBlocks = this.blocksData || this.getAttribute('data-blocks');
    if (rawBlocks) {
      try {
        let blocks = rawBlocks;
        if (typeof blocks === 'string') {
          if (blocks.startsWith('%5B') || blocks.startsWith('%7B')) {
            blocks = decodeURIComponent(blocks);
          }
          blocks = JSON.parse(blocks);
        }
        if (Array.isArray(blocks) && blocks.length > 0) {
          if (window.UcuBlockRenderer) {
            this.contentContainer.innerHTML = window.UcuBlockRenderer.renderBlocks(blocks, basePath);
            this.isLoaded = true;
            return;
          }
        }
      } catch (e) {
        console.warn("[UCU Architecture] Failed to parse modal blocks:", e);
      }
    }

    // B. PRIORITY 2: FETCH EXTERNAL HTML FRAGMENT (Fallback)
    const isBaseDir = !this.contentSrc || 
                      this.contentSrc.endsWith('/') || 
                      this.contentSrc === '.' || 
                      this.contentSrc === '..' || 
                      this.contentSrc.endsWith('/.') || 
                      this.contentSrc.endsWith('/..') ||
                      this.contentSrc.split('/').pop() === '';

    if (isBaseDir) {
      this.contentContainer.innerHTML = `
        <div class="p-8 text-center flex flex-col items-center justify-center gap-3">
          <svg class="w-12 h-12 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h4 class="text-sm font-bold text-ucu-blue-dark">Documentation Pending</h4>
          <p class="text-xs text-[var(--color-muted)] max-w-sm leading-relaxed mx-auto">Official coverage and full documentation for this item are currently being compiled by the External Affairs and Linkages Office.</p>
        </div>
      `;
      this.isLoaded = true;
      return;
    }

    this.contentContainer.innerHTML = `
      <div class="w-full flex flex-col items-center justify-center py-16 gap-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-ucu-blue-dark"></div>
        <p class="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Loading Document...</p>
      </div>
    `;

    try {
      const response = await fetch(this.contentSrc + '?t=' + Date.now());
      if (response.ok) {
        this.contentContainer.innerHTML = await response.text();
        const evidenceBaseUrl = response.url;
        this.contentContainer.querySelectorAll('img[src], video[src], source[src]').forEach(el => {
          const src = el.getAttribute('src');
          if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('blob:')) {
            try { el.setAttribute('src', new URL(src, evidenceBaseUrl).href); } catch(e) {}
          }
        });
        this.isLoaded = true;
      } else {
        this.contentContainer.innerHTML = `<p class="text-ucu-red font-bold">Failed to load documentation (HTTP ${response.status}).</p>`;
      }
    } catch (error) {
      this.contentContainer.innerHTML = `<p class="text-ucu-red font-bold">Fetch Error. Local server required.</p>`;
    }
  }

  initEvents() {
    this.closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.close();
    });

    this.dialog.addEventListener('cancel', (e) => {
      e.preventDefault(); 
      this.close();
    });

    this.dialog.addEventListener('click', (e) => {
      const img = e.target.closest('.ucu-prose-evidence img, figure img');
      if (img) {
        this.lightboxImg.src = img.src;
        this.lightboxImg.alt = img.alt || 'Expanded Image';
        this.lightbox.showModal();
        return; 
      }
      
      if (e.target === this.dialog) {
        this.close();
      }
    });

    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox || e.target === this.lightboxImg) {
        this.lightbox.close();
      }
    });

    // Navigation Buttons Event Listeners
    const handleNavClick = (direction) => {
      const parent = this.parentElement || document;
      const shells = Array.from(parent.querySelectorAll('ucu-modal-shell'));
      const currentIndex = shells.findIndex(shell => shell.modalId === this.modalId);
      
      if (currentIndex !== -1) {
        const targetIndex = currentIndex + direction;
        if (targetIndex >= 0 && targetIndex < shells.length) {
          const targetShell = shells[targetIndex];
          this.close(true);
          targetShell.open();
        }
      }
    };

    this.querySelectorAll('.prev-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleNavClick(-1);
      });
    });

    this.querySelectorAll('.next-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleNavClick(1);
      });
    });
  }
}

if (!customElements.get("ucu-modal-shell")) {
  customElements.define("ucu-modal-shell", UcuModalShell);
}

/* =========================================
   GLOBAL MODAL OPENER & ROUTER
   ========================================= */
window.ucuOpenModal = function(targetId) {
  if (!targetId) return;
  const cleanId = String(targetId).trim().replace(/^modal-/, '');
  const underscoreId = cleanId.replace(/\./g, '_');
  const dotId = cleanId.replace(/_/g, '.');

  const shells = Array.from(document.querySelectorAll('ucu-modal-shell'));
  const targetShell = shells.find(s => {
    const mId = (s.getAttribute('modal-id') || s.modalId || '').replace(/^modal-/, '');
    return mId === cleanId || mId === underscoreId || mId === dotId;
  }) || document.querySelector(`ucu-modal-shell[modal-id="${cleanId}"]`)
     || document.querySelector(`ucu-modal-shell[modal-id="${underscoreId}"]`)
     || document.querySelector(`ucu-modal-shell[modal-id="${dotId}"]`)
     || document.querySelector(`dialog#modal-${cleanId}`)?.closest('ucu-modal-shell')
     || document.querySelector(`dialog#modal-${underscoreId}`)?.closest('ucu-modal-shell');

  if (targetShell && typeof targetShell.open === 'function') {
    targetShell.open();
  } else {
    console.warn(`[UCU Architecture] Modal Shell for ID '${targetId}' (resolved '${underscoreId}') not found.`);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  
  const checkUrlForModals = () => {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('evidence') || params.get('event') || params.get('modal');
    
    if (targetId) {
      setTimeout(() => {
        window.ucuOpenModal(targetId);
      }, 150);
    }
  };

  checkUrlForModals();

  window.addEventListener('popstate', () => {
    document.querySelectorAll('ucu-modal-shell').forEach(shell => {
      if (shell.dialog && shell.dialog.open) shell.close(true);
    });
    checkUrlForModals();
  });

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.ucu-event-trigger, [data-modal-trigger], [data-ann-open-modal], .ucu-evidence-trigger, [data-evidence-id]');
    if (!trigger) return;

    e.preventDefault();
    const targetId = trigger.getAttribute('data-event-id') || 
                     trigger.getAttribute('data-modal-trigger') || 
                     trigger.getAttribute('data-ann-open-modal') ||
                     trigger.getAttribute('data-evidence-id');
    if (targetId) {
      window.ucuOpenModal(targetId);
    }
  });
});