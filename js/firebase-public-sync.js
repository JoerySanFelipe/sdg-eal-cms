// js/firebase-public-sync.js
// Client-side Live Preview Listener and Cloud Firestore Public Hydration Bridge for UCU SDG Portal

(function() {
  'use strict';

  const isIframe = window.self !== window.top;
  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewMode = isIframe || urlParams.get('cms_preview') === 'true';

  console.log(`[UCU Public Sync] Mode: ${isPreviewMode ? 'Live Preview (Iframe/New Tab)' : 'Public Production'}`);

  // Broadcast Channel setup for cross-tab synchronization
  let liveBroadcastChannel = null;
  if (typeof window.BroadcastChannel === 'function') {
    try {
      liveBroadcastChannel = new BroadcastChannel('UCU_CMS_LIVE_CHANNEL');
    } catch (e) {
      console.warn("[UCU Public Sync] BroadcastChannel init error:", e);
    }
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveAssetPath(src) {
    if (!src) return '';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
      return src;
    }
    const isSubfolder = window.location.pathname.includes('/indicators/') || window.location.pathname.includes('/evidence/');
    if (isSubfolder) {
      if (src.startsWith('../')) return src;
      if (src.startsWith('./')) return `../${src.slice(2)}`;
      if (src.startsWith('/')) return `..${src}`;
      return `../${src}`;
    } else {
      if (src.startsWith('../')) return src.slice(3);
      if (src.startsWith('./')) return src.slice(2);
      if (src.startsWith('/')) return src.slice(1);
      return src;
    }
  }

  function getCurrentPageSection() {
    const path = window.location.pathname;
    const currentParams = new URLSearchParams(window.location.search);
    const layoutEl = document.querySelector('ucu-sdg-layout');
    const defaultYear = typeof window.ucuGetGlobalDefaultYear === 'function' 
      ? window.ucuGetGlobalDefaultYear() 
      : '2025';
    let sectionType = '';
    let sectionId = '';
    let sectionYear = currentParams.get('year') || (layoutEl ? layoutEl.getAttribute('year') : null) || defaultYear;

    // 1. Check DOM elements first (most resilient)
    if (layoutEl) {
      sectionType = 'sdg';
      sectionId = layoutEl.getAttribute('sdg') || '1';
      return { type: sectionType, id: sectionId, year: sectionYear };
    }

    const indicatorEl = document.querySelector('ucu-indicator-layout');
    if (indicatorEl) {
      sectionType = 'indicator';
      const indMatch = path.match(/indicators\/([^.]+)\.html/i);
      sectionId = indMatch ? indMatch[1] : (indicatorEl.getAttribute('indicator') || '');
      return { type: sectionType, id: sectionId, year: sectionYear };
    }

    // 2. Path matching
    const sdgMatch = path.match(/sdg(\d+)\.html/i);
    if (sdgMatch) {
      sectionType = 'sdg';
      sectionId = sdgMatch[1];
    } else if (path.includes('indicators/')) {
      const match = path.match(/indicators\/([^.]+)\.html/i);
      sectionType = 'indicator';
      sectionId = match ? match[1] : '';
    } else if (path.includes('sdg-reports.html') || path.includes('sdg-reports/2025.html') || path.includes('sdg-reports/2024.html') || path.includes('sdg-reports/2023.html') || (path.includes('sdg-reports') && !path.includes('.html'))) {
      sectionType = 'sdg_dashboard';
      sectionId = sectionYear;
    } else if (path.includes('impact.html') || path.includes('impact/')) {
      sectionType = 'impact';
      sectionId = sectionYear;
    } else if (path.includes('research.html') || path.includes('research/')) {
      sectionType = 'research';
      sectionId = sectionYear;
    } else if (path.includes('rankings.html')) {
      sectionType = 'rankings';
      sectionId = 'main';
    } else if (path.includes('partnership.html')) {
      sectionType = 'partnership';
      sectionId = 'main';
    } else if (path.includes('smart-eco-campus.html')) {
      sectionType = 'smarteco';
      sectionId = 'main';
    } else if (path.includes('announcement.html')) {
      sectionType = 'announcement';
      sectionId = 'main';
    } else if (path.endsWith('index.html') || path.endsWith('/')) {
      sectionType = 'home';
      sectionId = 'main';
    }

    return { type: sectionType, id: sectionId, year: sectionYear };
  }

  function isSectionMatchingCurrentPage(section) {
    if (!section) return false;
    const current = getCurrentPageSection();
    if (section.type !== current.type) return false;
    if (current.id && section.id && current.id !== section.id) return false;
    if (current.type === 'sdg' && (section.year || '2025') !== (current.year || '2025')) return false;
    return true;
  }

  function handleLiveMessage(msg) {
    if (!msg || typeof msg !== 'object' || msg.type !== 'UCU_CMS_LIVE_PREVIEW') return;
    const { section, data } = msg;
    if (!data || !isSectionMatchingCurrentPage(section)) return;
    applyLiveUpdate(section, data);
  }

  /**
   * 1. LIVE PREVIEW BRIDGE LISTENER (postMessage, BroadcastChannel, localStorage)
   */
  if (isPreviewMode) {
    // Notify parent / opener / BroadcastChannel that preview is ready with active section
    function notifyPreviewReady() {
      const currentSection = getCurrentPageSection();
      const message = {
        type: 'UCU_CMS_PREVIEW_READY',
        section: currentSection,
        path: window.location.pathname,
        url: window.location.href
      };

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(message, '*');
      }
      if (liveBroadcastChannel) {
        liveBroadcastChannel.postMessage(message);
      }
    }

    // A. Listen via window postMessage (from iframe parent or window.opener)
    window.addEventListener('message', function(event) {
      handleLiveMessage(event.data);
    });

    // B. Listen via BroadcastChannel across tabs
    if (liveBroadcastChannel) {
      liveBroadcastChannel.onmessage = function(event) {
        handleLiveMessage(event.data);
      };
    }

    // C. Listen via storage event (cross-tab fallback)
    window.addEventListener('storage', function(event) {
      if (event.key === 'UCU_CMS_ACTIVE_PREVIEW_DRAFT' && event.newValue) {
        try {
          const msg = JSON.parse(event.newValue);
          handleLiveMessage(msg);
        } catch (e) {}
      }
    });

    // D. Immediate on-load draft hydration: Check active preview draft from localStorage
    function hydrateInitialPreview() {
      let applied = false;
      try {
        const storedActive = localStorage.getItem('UCU_CMS_ACTIVE_PREVIEW_DRAFT');
        if (storedActive) {
          const msg = JSON.parse(storedActive);
          if (msg && msg.section && msg.data && isSectionMatchingCurrentPage(msg.section)) {
            applyLiveUpdate(msg.section, msg.data);
            applied = true;
          }
        }
      } catch (e) {}

      // If no active matching draft applied, fall back to published data
      if (!applied) {
        checkAndHydratePublishedData();
      }

      notifyPreviewReady();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hydrateInitialPreview);
    } else {
      hydrateInitialPreview();
    }

  } else {
    // 2. PRODUCTION PUBLIC HYDRATION
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndHydratePublishedData);
    } else {
      checkAndHydratePublishedData();
    }
  }

  /**
   * Apply live DOM changes based on CMS draft data
   */
  function applyLiveUpdate(section, data) {
    if (!section || !data) return;
    if (!isSectionMatchingCurrentPage(section)) return;

    // A. SDG Narrative Pages
    if (section.type === 'sdg') {
      // 1. Hero banner
      const hero = document.querySelector('ucu-sdg-page-hero');
      const heroData = data.heroHeader || data;
      if (hero) {
        if (typeof hero.updateWithLiveDraft === 'function') {
          hero.updateWithLiveDraft(heroData);
        } else {
          if (heroData.goalName || data.goalName) hero.setAttribute('goal-name', heroData.goalName || data.goalName);
          if (heroData.goalTitle || data.title) hero.setAttribute('title', heroData.goalTitle || data.title);
          if (heroData.subtitle || data.subtitle) hero.setAttribute('subtitle', heroData.subtitle || data.subtitle);
          if (heroData.themeColor || data.colorHex) hero.setAttribute('hex', heroData.themeColor || data.colorHex);
          if (heroData.heroBackground || data.heroBgImage) hero.setAttribute('bg-image', heroData.heroBackground || data.heroBgImage);
          if (heroData.heroIconImage || data.heroIconImage) hero.setAttribute('icon-image', heroData.heroIconImage || data.heroIconImage);
          if (typeof hero.connectedCallback === 'function') hero.connectedCallback();
        }
      }

      // 2. Delegate directly to UcuSdgLayout
      const layout = document.querySelector('ucu-sdg-layout');
      if (layout) {
        if (section.year) layout.setAttribute('year', section.year);
        if (typeof layout.updateWithLiveDraft === 'function') {
          layout.updateWithLiveDraft(data);
        } else if (typeof layout.doRender === 'function') {
          layout._liveData = data;
          layout.doRender();
        }
      }
    }

    // A2. Indicator Evidence Pages
    if (section.type === 'indicator') {
      const layout = document.querySelector('ucu-indicator-layout');
      if (layout) {
        if (data.evidenceList && Array.isArray(data.evidenceList)) {
          layout.setAttribute('data-evidence', JSON.stringify(data.evidenceList));
          if (typeof layout.connectedCallback === 'function') {
            layout.hasRendered = false;
            layout.connectedCallback();
          }
        }
      }
    }

    // B. Homepage
    if (section.type === 'home') {
      // 1. Hero Slider
      const heroSlider = document.querySelector('ucu-home-hero-slider');
      if (heroSlider) {

        if (data.sliderImages && Array.isArray(data.sliderImages)) {
          heroSlider.setAttribute('images', JSON.stringify(data.sliderImages));
        }
        if (typeof heroSlider.connectedCallback === 'function') heroSlider.connectedCallback();
      }

      // 2. Section Header ("Headline / Our Commitment" - DRY single source of truth from Featured Announcement)
      if (data.featuredAnnouncement || data.featured) {
        applyFeaturedHeadline(data.featuredAnnouncement || data.featured);
      }

      // 4. Strength in Numbers Metrics
      const metricsHeader = document.getElementById('ucu-metrics-header');
      if (metricsHeader) {
        if (data.metricsEyebrow) metricsHeader.setAttribute('eyebrow', data.metricsEyebrow);
        if (data.metricsTitle) metricsHeader.setAttribute('title', data.metricsTitle);
      }

      const metricCards = document.querySelector('ucu-metric-cards');
      if (metricCards && data.metrics && Array.isArray(data.metrics)) {
        metricCards.setAttribute('data-metrics', JSON.stringify(data.metrics));
      }

      // 5. Strategic Alliances & Inquiries (Now sourced from Partnership Studio as Single Source of Truth)
      const localPartnerships = localStorage.getItem('UCU_PUBLISHED_pages__partnerships') || 
                                localStorage.getItem('UCU_PUBLISHED_partnerships') ||
                                localStorage.getItem('UCU_DRAFT_pages__partnerships');
      if (localPartnerships) {
        try {
          const pData = JSON.parse(localPartnerships).data || JSON.parse(localPartnerships);
          applyAllianceData(pData);
        } catch (e) {}
      } else {
        fetchDoc('pages', 'partnerships').then(partnershipData => {
          if (partnershipData) {
            const pData = partnershipData.data || partnershipData;
            applyAllianceData(pData);
          }
        });
      }

      function applyAllianceData(pData) {
        if (!pData) return;
        if (pData.allianceTitle) {
          const h2 = document.getElementById('alliance-title') || document.querySelector('h2.text-3xl.text-white');
          if (h2) h2.textContent = pData.allianceTitle;
        }
        if (pData.allianceDescription) {
          const p = document.getElementById('alliance-description') || document.querySelector('p.text-white\\/80');
          if (p) p.textContent = pData.allianceDescription;
        }
        if (pData.partnershipFormUrl) {
          const formBtn = document.querySelector('a[href*="forms.google.com"], a[href*="partnership-inquiry"]');
          if (formBtn) formBtn.href = pData.partnershipFormUrl;
        }
        if (pData.emailExternal) {
          const emailExtEl = document.getElementById('email-external');
          if (emailExtEl) emailExtEl.textContent = pData.emailExternal;
        }
        if (pData.emailOfficial) {
          const emailOffEl = document.getElementById('email-official');
          if (emailOffEl) emailOffEl.textContent = pData.emailOfficial;
        }
        if (pData.countries) {
          let parsedCountries = pData.countries;
          if (typeof parsedCountries === 'string') {
            parsedCountries = parsedCountries.split(',').map(c => c.trim()).filter(Boolean);
          }
          if (Array.isArray(parsedCountries) && parsedCountries.length > 0) {
            window.UCU_COUNTRIES = parsedCountries;
            const cg = document.querySelector('ucu-country-grid');
            if (cg && typeof cg.connectedCallback === 'function') cg.connectedCallback();
          }
        }
      }
    }

    // C. Universal Hero Banner for Any Page
    const heroBanner = document.querySelector('ucu-hero-banner');
    if (heroBanner && (data.heroEyebrow || data.heroHeadline || data.heroHighlight || data.heroDescription)) {
      if (data.heroEyebrow !== undefined) heroBanner.setAttribute('eyebrow', data.heroEyebrow);
      if (data.heroHeadline !== undefined) heroBanner.setAttribute('headline', data.heroHeadline);
      if (data.heroHighlight !== undefined) heroBanner.setAttribute('highlight', data.heroHighlight);
      if (data.heroDescription !== undefined) heroBanner.setAttribute('description', data.heroDescription);
      if (typeof heroBanner.connectedCallback === 'function') heroBanner.connectedCallback();
    }

    // D. Universal Metric Cards for Dashboard / Impact / Partnerships
    if (['sdg_dashboard', 'impact', 'partnership'].includes(section.type)) {
      const metricCards = document.querySelector('ucu-metric-cards');
      if (metricCards && data.metrics && Array.isArray(data.metrics)) {
        metricCards.setAttribute('data-metrics', JSON.stringify(data.metrics));
        if (typeof metricCards.connectedCallback === 'function') metricCards.connectedCallback();
      }
    }

    // D2. SDG Grid Cards on SDG Dashboard
    if (section.type === 'sdg_dashboard' && data.sdgCards && Array.isArray(data.sdgCards)) {
      const cards = document.querySelectorAll('sdg-card');
      data.sdgCards.forEach((c, i) => {
        if (cards[i]) {
          if (c.goalNum !== undefined) cards[i].setAttribute('goal-num', c.goalNum);
          if (c.title !== undefined) cards[i].setAttribute('title', c.title);
          if (c.subtitle !== undefined) cards[i].setAttribute('subtitle', c.subtitle);
          if (c.bgImg !== undefined) cards[i].setAttribute('bg-img', c.bgImg);
          if (c.logoImg !== undefined) cards[i].setAttribute('logo-img', c.logoImg);
          if (c.color !== undefined) cards[i].setAttribute('color', c.color);
          if (typeof cards[i].connectedCallback === 'function') cards[i].connectedCallback();
        }
      });
    }

    // D3. Impact Events Feed & Modals on Impact Page
    if (section.type === 'impact' && data.eventsList && Array.isArray(data.eventsList)) {
      window.UCU_EVENTS = data.eventsList;
      const impactFeed = document.querySelector('ucu-impact-feed');
      if (impactFeed && typeof impactFeed.render === 'function') {
        impactFeed.render();
      }
    }

    // D4. Research Publications Feed on Research Page
    if (section.type === 'research' && data.researchList && Array.isArray(data.researchList)) {
      window.UCU_RESEARCH = data.researchList;
      const researchFeed = document.querySelector('ucu-research-feed');
      if (researchFeed && typeof researchFeed.render === 'function') {
        researchFeed.render();
      }
    }

    // E. Rankings Page
    if (section.type === 'rankings') {
      const hero = document.querySelector('ucu-hero-banner');
      if (hero) {
        if (data.heroEyebrow) hero.setAttribute('eyebrow', data.heroEyebrow);
        if (data.heroHeadline) hero.setAttribute('headline', data.heroHeadline);
        if (data.heroHighlight) hero.setAttribute('highlight', data.heroHighlight);
        if (data.heroDescription) hero.setAttribute('description', data.heroDescription);
        if (typeof hero.connectedCallback === 'function') hero.connectedCallback();
      }

      if (data.standingTitle !== undefined) {
        const h2 = document.getElementById('standing-title') || document.querySelector('section h2.text-ucu-blue-dark');
        if (h2) h2.textContent = data.standingTitle;
      }
      if (data.trajectoryEyebrow !== undefined) {
        const ey = document.getElementById('trajectory-eyebrow') || document.querySelector('section h2.tracking-\\[0\\.2em\\]');
        if (ey) ey.textContent = data.trajectoryEyebrow;
      }
      if (data.trajectoryTitle !== undefined) {
        const tt = document.getElementById('trajectory-title') || document.querySelector('section h3.text-ucu-blue-dark');
        if (tt) tt.textContent = data.trajectoryTitle;
      }

      if (data.terminusStatement) {
        window.UCU_TERMINUS_STATEMENT = data.terminusStatement;
        const termText = document.getElementById('terminus-text-content');
        if (termText) termText.textContent = data.terminusStatement;
      }

      if (data.rankingsList && Array.isArray(data.rankingsList)) {
        window.UCU_RANKINGS = data.rankingsList;
        const carousel = document.querySelector('ucu-ranking-carousel');
        if (carousel && typeof carousel.render === 'function') carousel.render();
        const timeline = document.querySelector('ucu-ranking-timeline');
        if (timeline && typeof timeline.render === 'function') timeline.render();

        // Dynamically update filter buttons on rankings.html
        const filterGroup = document.getElementById('filter-group');
        if (filterGroup) {
          const uniqueOrgs = ['all', ...new Set(data.rankingsList.map(r => r.org).filter(Boolean))];
          const currentActiveBtn = filterGroup.querySelector('.filter-btn[data-active="true"]');
          const currentActive = currentActiveBtn ? currentActiveBtn.getAttribute('data-filter') : 'all';

          const orgStyles = {
            'all': 'data-[active=true]:bg-ucu-blue-dark data-[active=true]:border-ucu-blue-dark',
            'WURI': 'data-[active=true]:bg-[#0f4088] data-[active=true]:border-[#0f4088]',
            'UI GreenMetric': 'data-[active=true]:bg-[#00993d] data-[active=true]:border-[#00993d]',
            'THE Impact': 'data-[active=true]:bg-[#201f1f] data-[active=true]:border-[#201f1f]',
            'THE': 'data-[active=true]:bg-[#201f1f] data-[active=true]:border-[#201f1f]',
            'AppliedHE': 'data-[active=true]:bg-[#f26422] data-[active=true]:border-[#f26422]'
          };

          filterGroup.innerHTML = uniqueOrgs.map(org => {
            const label = org === 'all' ? 'All Rankings' : org;
            const style = orgStyles[org] || 'data-[active=true]:bg-ucu-blue data-[active=true]:border-ucu-blue';
            const isActive = currentActive === org || (org === 'all' && !uniqueOrgs.includes(currentActive));
            return `<button data-filter="${org}" class="filter-btn px-4 py-2 rounded-full text-xs font-bold border border-white/50 bg-white/60 transition-all hover:bg-white hover:shadow-sm data-[active=true]:text-white ${style} text-main2" data-active="${isActive}">${label}</button>`;
          }).join('');

          filterGroup.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = () => {
              const filter = btn.getAttribute('data-filter');
              filterGroup.querySelectorAll('.filter-btn').forEach(b => b.setAttribute('data-active', 'false'));
              btn.setAttribute('data-active', 'true');
              
              const items = document.querySelectorAll('ucu-ranking-timeline .timeline-item');
              const emptyState = document.getElementById('empty-state');
              let visibleCount = 0;
              items.forEach(item => {
                const org = item.getAttribute('data-org');
                if (filter === 'all' || org === filter) {
                  item.style.display = 'flex';
                  visibleCount++;
                } else {
                  item.style.display = 'none';
                }
              });
              if (emptyState) emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
            };
          });
        }
      }
    }

    // F. Partnerships Page
    if (section.type === 'partnership') {
      const hero = document.querySelector('ucu-hero-banner');
      if (hero) {
        if (data.heroEyebrow) hero.setAttribute('eyebrow', data.heroEyebrow);
        if (data.heroHeadline) hero.setAttribute('headline', data.heroHeadline);
        if (data.heroHighlight) hero.setAttribute('highlight', data.heroHighlight);
        if (data.heroDescription) hero.setAttribute('description', data.heroDescription);
        if (typeof hero.connectedCallback === 'function') hero.connectedCallback();
      }

      if (data.allianceTitle) {
        const h2 = document.querySelector('#strategic-alliance h2');
        if (h2) h2.textContent = data.allianceTitle;
      }
      if (data.allianceDescription) {
        const p = document.querySelector('#strategic-alliance p');
        if (p) p.textContent = data.allianceDescription;
      }

      if (data.partnershipFormUrl) {
        const formBtn = document.querySelector('#strategic-alliance a[href*="http"]');
        if (formBtn) formBtn.href = data.partnershipFormUrl;
        const links = document.querySelectorAll('a[href*="forms.google.com"], a[href*="partnership-inquiry"]');
        links.forEach(l => {
          if (l.getAttribute('href') && l.getAttribute('href').startsWith('http')) l.href = data.partnershipFormUrl;
        });
      }
      if (data.emailExternal) {
        const el = document.getElementById('email-external');
        if (el) el.textContent = data.emailExternal;
      }
      if (data.emailOfficial) {
        const el = document.getElementById('email-official');
        if (el) el.textContent = data.emailOfficial;
      }

      if (data.partnersList && Array.isArray(data.partnersList)) {
        window.UCU_PARTNERS = data.partnersList;
        document.querySelectorAll('ucu-partner-grid').forEach(g => {
          if (typeof g.render === 'function') g.render();
        });
      }
      if (data.countries) {
        let parsedCountries = data.countries;
        if (typeof parsedCountries === 'string') {
          parsedCountries = parsedCountries.split(',').map(c => c.trim()).filter(Boolean);
        }
        if (Array.isArray(parsedCountries) && parsedCountries.length > 0) {
          window.UCU_COUNTRIES = parsedCountries;
          const cg = document.querySelector('ucu-country-grid');
          if (cg && typeof cg.connectedCallback === 'function') cg.connectedCallback();
          if (cg && typeof cg.render === 'function') cg.render();
        }
      }

      // Automatically recalculate and refresh the 6 live metric cards with custom theme & icon
      const currentPartners = window.UCU_PARTNERS || [];
      const currentCountries = window.UCU_COUNTRIES || [];
      const customMetrics = Array.isArray(data.metrics) ? data.metrics : [];

      const defaultDefs = [
        { metricId: "localAcademicCount", label: "Local Academic Partners", categoryKey: 'local-academic', defaultIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>` },
        { metricId: "localIndustryCount", label: "Local Industry Partners", categoryKey: 'local-industry', defaultIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>` },
        { metricId: "intlAcademicCount", label: "International Academic Partners", categoryKey: 'international-academic', defaultIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>` },
        { metricId: "intlIndustryCount", label: "International Industry Partners", categoryKey: 'international-industry', defaultIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>` },
        { metricId: "membershipCount", label: "Memberships", categoryKey: 'membership', defaultIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>` },
        { metricId: "countriesCount", label: "Represented Countries", categoryKey: 'countries', defaultIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>` }
      ];

      const autoMetrics = defaultDefs.map((def, i) => {
        const custom = customMetrics.find(m => m.metricId === def.metricId) || customMetrics[i] || {};
        const val = def.categoryKey === 'countries'
          ? String(currentCountries.length > 0 ? currentCountries.length : 22)
          : String(currentPartners.filter(p => p.category === def.categoryKey).length);
        
        return {
          metricId: def.metricId,
          label: def.label,
          value: val,
          theme: custom.theme || "white",
          icon: custom.icon || "",
          svgIcon: custom.svgIcon || def.defaultIcon
        };
      });

      const metricContainer = document.querySelector('ucu-metric-cards');
      if (metricContainer) {
        metricContainer.setAttribute('data-metrics', JSON.stringify(autoMetrics));
        if (typeof metricContainer.connectedCallback === 'function') metricContainer.connectedCallback();
      }
    }

    // G. Smart Eco Campus Page
    if (section.type === 'smarteco' || section.type === 'smart_eco') {
      const hero = document.querySelector('ucu-hero-banner');
      if (hero) {
        if (data.heroEyebrow) hero.setAttribute('eyebrow', data.heroEyebrow);
        if (data.heroHeadline) hero.setAttribute('headline', data.heroHeadline);
        if (data.heroHighlight) hero.setAttribute('highlight', data.heroHighlight);
        if (data.heroDescription) hero.setAttribute('description', data.heroDescription);
        if (typeof hero.connectedCallback === 'function') hero.connectedCallback();
      }

      const prose = document.querySelector('.ucu-prose-narrative');
      if (prose) {
        const h3 = prose.querySelector('h3');
        if (h3 && data.recognitionEyebrow) h3.textContent = data.recognitionEyebrow;
        const h2 = prose.querySelector('h2');
        if (h2 && data.recognitionTitle) h2.textContent = data.recognitionTitle;
        
        // Dynamic multi-paragraph sync from single consolidated narrative
        const narrativeContainer = document.getElementById('smart-eco-narrative-paragraphs');
        const rawNarrative = data.introNarrative || (data.introParagraph1 ? (data.introParagraph1 + (data.introParagraph2 ? ('\n\n' + data.introParagraph2) : '')) : '');
        
        if (narrativeContainer && rawNarrative) {
          const pList = rawNarrative.split('\n').map(p => p.trim()).filter(Boolean);
          narrativeContainer.innerHTML = pList.map(pText => `<p>${escapeHtml(pText)}</p>`).join('');
        } else if (rawNarrative) {
          const paragraphs = prose.querySelectorAll('p:not(#smart-eco-callout)');
          const pList = rawNarrative.split('\n').map(p => p.trim()).filter(Boolean);
          pList.forEach((pText, idx) => {
            if (paragraphs[idx]) paragraphs[idx].textContent = pText;
          });
        }

        const callout = document.getElementById('smart-eco-callout') || prose.querySelector('p[style*="color"]');
        if (callout) {
          if (data.introCallout) callout.textContent = data.introCallout;
          else if (data.introParagraph3) callout.textContent = data.introParagraph3;
        }
      }

      if (data.awardImages && Array.isArray(data.awardImages) && data.awardImages.length > 0) {
        const awardContainer = document.getElementById('smart-eco-award-container') || document.querySelector('.metrics-section .aspect-\\[3\\/4\\]') || document.querySelector('.metrics-section .aspect-\\[4\\/5\\]');
        if (awardContainer) {
          awardContainer.innerHTML = data.awardImages.map((imgUrl, i) => `
            <img src="${imgUrl}" alt="UI GreenMetric Award ${i + 1}" loading="lazy"
              class="slider-img absolute inset-0 h-full w-full object-contain p-2 ${i === 0 ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 ease-in-out" />
          `).join('');
          if (typeof window.initSmartEcoSlider === 'function') {
            window.initSmartEcoSlider();
          }
        }
      }

      if (data.standingHeader) {
        const sh = document.querySelector('.metrics-section h4');
        if (sh) sh.textContent = data.standingHeader;
      }

      if (data.milestones && Array.isArray(data.milestones)) {
        const gridContainer = document.getElementById('smart-eco-milestones-grid') || document.querySelector('.metrics-section .rounded-2xl .grid');
        if (gridContainer) {
          gridContainer.innerHTML = data.milestones.map((m, i) => {
            const theme = m.theme || (i === 0 ? 'blue' : (i === data.milestones.length - 1 ? 'red' : 'white'));
            
            if (theme === 'blue') {
              return `
                <div class="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-ucu-yellow/30 bg-ucu-blue-dark p-8 text-center shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-xl md:col-span-2 lg:col-span-1 lg:row-span-2 lg:p-10">
                  <span class="mb-3 bg-gradient-to-br from-ucu-yellow to-[#d4c51e] bg-clip-text text-6xl font-extrabold leading-none text-transparent md:text-7xl">${escapeHtml(m.rank || '#1')}</span>
                  <span class="text-base font-bold uppercase tracking-wide text-white">${escapeHtml(m.label || '')}</span>
                </div>
              `;
            } else if (theme === 'red') {
              return `
                <div class="group relative flex flex-col justify-center overflow-hidden rounded-2xl border border-black/5 bg-ucu-red p-6 shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-lg">
                  <span class="mb-1.5 text-4xl font-extrabold leading-none text-white">${escapeHtml(m.rank || '#1')}</span>
                  <span class="text-xs font-extrabold uppercase leading-snug tracking-wide text-ucu-yellow">${escapeHtml(m.label || '')}</span>
                </div>
              `;
            } else {
              // White theme
              return `
                <div class="group relative flex flex-col justify-center overflow-hidden rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-lg">
                  <span class="mb-1.5 text-4xl font-extrabold leading-none text-ucu-red">${escapeHtml(m.rank || '#1')}</span>
                  <span class="text-xs font-semibold uppercase leading-snug text-muted">${escapeHtml(m.label || '')}</span>
                </div>
              `;
            }
          }).join('');
        }
      }

      // Sustainability Indicators Section Title
      if (data.sustainabilityTitle) {
        const titleH2 = document.querySelector('section.reveal-on-scroll > h2.text-ucu-red');
        if (titleH2) titleH2.textContent = data.sustainabilityTitle;
      }

      // 7 Sustainability Pillars Gallery
      if (data.sustainabilityIndicators && Array.isArray(data.sustainabilityIndicators)) {
        const pillarLinks = document.querySelectorAll('.group\\/gallery > a');
        data.sustainabilityIndicators.forEach((ind, i) => {
          if (pillarLinks[i]) {
            if (ind.link) pillarLinks[i].href = ind.link;
            const img = pillarLinks[i].querySelector('img');
            const targetImg = ind.thumb_image || ind.img;
            if (img && targetImg) {
              img.src = resolveAssetPath(targetImg);
              if (ind.title) img.alt = `${ind.title} Pillar`;
            }
            const numSpan = pillarLinks[i].querySelector('span.rounded-md');
            if (numSpan && ind.num) numSpan.textContent = ind.num;
            const titleH4 = pillarLinks[i].querySelector('h4');
            if (titleH4 && ind.title) titleH4.textContent = ind.title;
          }
        });
      }

      // Sustainability Framework Closing Paragraph
      if (data.sustainabilityParagraph) {
        const closeP = document.querySelector('.group\\/gallery + .ucu-prose-narrative p');
        if (closeP) closeP.textContent = data.sustainabilityParagraph;
      }
    }

    // H. Announcements Page & Homepage Featured Headline Sync
    if (section.type === 'announcement' || section.type === 'announcements') {
      renderAnnouncementPage(data, 1);
      
      // Dynamic sync Section 2 Headline if we are currently on the homepage!
      const featured = (data.announcementsList || data.list || []).find(a => a.isFeatured) || data.featured;
      if (featured) {
        applyFeaturedHeadline(featured);
      }
    }

    // I. UI GreenMetric Indicator Pillar Pages
    if (section.type === 'indicator') {
      const layout = document.querySelector('ucu-indicator-layout');
      const title = data.indicatorTitle || data.pillarTitle;
      const thumb = data.thumb_image || data.thumbnailImg;
      const metrics = data.metricsCard || data.metrics;
      const narrative = data.narrative;
      const evidences = data.evidences || data.evidenceList;
      const num = data.indicatorNum || data.activeNum || data.pillarNum || (layout ? layout.getAttribute('active-num') : '01');

      const pillarIcons = {
        "01": "images/indicator-icons/infrastructure.png",
        "02": "images/indicator-icons/energy.png",
        "03": "images/indicator-icons/waste.png",
        "04": "images/indicator-icons/water.png",
        "05": "images/indicator-icons/transportation.png",
        "06": "images/indicator-icons/education.png",
        "07": "images/indicator-icons/digitalization.png",
      };
      const defaultIcon = resolveAssetPath(data.evidence_thumb || data.thumb_evidence || pillarIcons[num] || 'images/smart-eco-assets/ui-green-seal.png');

      if (layout) {
        if (title) {
          layout.setAttribute('pillar-title', title);
          const h2 = layout.querySelector('#indicator-narrative h2');
          if (h2) {
            h2.innerHTML = `
              ${escapeHtml(title)}
              <span class="absolute -bottom-[12px] left-0 h-[5px] w-[64px] rounded-full bg-gradient-to-r from-ucu-blue-dark to-ucu-red transition-all duration-500 ease-out group-hover:w-[100px]"></span>
            `;
          }
        }

        // Thumbnail update on nav strip
        if (thumb) {
          const navImg = layout.querySelector(`nav a[data-nav-pillar="${num}"] img`) || layout.querySelector(`nav a[href*="${section.id}"] img`);
          if (navImg) {
            navImg.src = resolveAssetPath(thumb);
          }
        }

        // Force remove opacity-0 / translate-y-8 on all reveal wrappers in layout
        layout.querySelectorAll('.reveal').forEach(el => {
          el.classList.remove('opacity-0', 'translate-y-8');
        });

        // Metrics update
        if (metrics && Array.isArray(metrics) && metrics.length > 0) {
          let metricCards = layout.querySelector('ucu-metric-cards');
          if (!metricCards) {
            const container = layout.querySelector('#indicator-narrative .space-y-6') || layout.querySelector('#indicator-narrative') || layout.querySelector('[slot="description"]');
            if (container) {
              metricCards = document.createElement('ucu-metric-cards');
              metricCards.className = 'block w-full reveal-on-scroll is-visible';
              metricCards.setAttribute('style', 'transition-delay: 200ms;');
              container.prepend(metricCards);
            }
          }
          if (metricCards) {
            metricCards.classList.add('is-visible');
            const defaultIcons = [
              '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
              '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>',
              '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>'
            ];
            const mappedMetrics = metrics.map((m, i) => ({
              value: m.value || '',
              label: m.title || m.label || '',
              evidenceId: m.url || m.evidenceId || '',
              theme: m.theme || 'navy',
              svgIcon: m.svgIcon || defaultIcons[i % defaultIcons.length]
            }));
            metricCards.setAttribute('data-metrics', JSON.stringify(mappedMetrics));
            if (typeof metricCards.connectedCallback === 'function') metricCards.connectedCallback();
          }
        }

        // Narrative update with resilient fallback
        if (typeof narrative === 'string' && narrative.trim().length > 0) {
          let prose = layout.querySelector('.ucu-prose-narrative');
          if (!prose) {
            const container = layout.querySelector('#indicator-narrative .space-y-6') || layout.querySelector('#indicator-narrative') || layout.querySelector('[slot="description"]');
            if (container) {
              prose = document.createElement('div');
              prose.className = 'ucu-prose-narrative mt-8 reveal-on-scroll is-visible';
              prose.setAttribute('style', 'transition-delay: 300ms;');
              container.appendChild(prose);
            }
          }
          if (prose) {
            prose.classList.add('is-visible');
            const paragraphs = narrative.split(/\n\n+/).filter(Boolean);
            prose.innerHTML = paragraphs.map(p => `<p class="mb-4">${escapeHtml(p.trim())}</p>`).join('');
          }
        }

        if (typeof window.ucuInitScrollReveal === 'function') {
          window.ucuInitScrollReveal(layout);
        }

        // Evidence list update (only if array has items)
        if (evidences && Array.isArray(evidences) && evidences.length > 0) {
          // Deduplicate and sort evidences using natural numerical sorting
          const seen = new Set();
          const uniqueEvidences = [];
          for (const ev of evidences) {
            if (!ev) continue;
            const key = (ev.codeID || ev.id || '').trim();
            if (key && !seen.has(key)) {
              seen.add(key);
              uniqueEvidences.push(ev);
            } else if (!key) {
              uniqueEvidences.push(ev);
            }
          }
          const sortedEvidences = uniqueEvidences.sort((a, b) => {
            const codeA = (a.codeID || a.id || '').replace(/^modal-/, '').replace(/_/g, '.');
            const codeB = (b.codeID || b.id || '').replace(/^modal-/, '').replace(/_/g, '.');
            return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
          });

          layout.setAttribute('data-evidence', JSON.stringify(sortedEvidences));
          const listContainer = layout.querySelector('#evidence-scroll-list');
          if (listContainer) {
            listContainer.innerHTML = sortedEvidences.map(ev => {
              const code = ev.codeID || ev.id || '';
              const sdgsString = ev.relatedSdgs ? JSON.stringify(ev.relatedSdgs) : '';
              const hasCustomThumb = ev.thumb_evidence && 
                ev.thumb_evidence !== 'images/smart-eco-assets/ui-green-seal.png' && 
                !ev.thumb_evidence.startsWith('images/indicator-icons/') &&
                !ev.thumb_evidence.startsWith('../images/indicator-icons/');
              const rawImg = hasCustomThumb ? ev.thumb_evidence : defaultIcon;
              const cardImg = resolveAssetPath(rawImg);

              return `
                <ucu-evidence-card 
                  title="${escapeHtml(ev.title)}" 
                  meta="UI GreenMetric" 
                  img="${cardImg}" 
                  evidence-id="${escapeHtml(code)}"
                  data-sdgs='${sdgsString}'>
                </ucu-evidence-card>
              `;
            }).join('');
          }

          // Update Modals
          const existingModals = layout.querySelectorAll('ucu-modal-shell');
          existingModals.forEach(m => m.remove());

          sortedEvidences.forEach(ev => {
            const docId = ev.id ? ev.id.replace(/\./g, '_') : (ev.codeID ? ev.codeID.replace(/\./g, '_') : '');
            if (!docId) return;
            const sdgsString = ev.relatedSdgs ? JSON.stringify(ev.relatedSdgs) : '';
            const blocksString = ev.blocks ? JSON.stringify(ev.blocks) : '';
            const modalShell = document.createElement('ucu-modal-shell');
            modalShell.setAttribute('modal-id', docId);
            modalShell.setAttribute('title', ev.title || '');
            modalShell.setAttribute('badge', ev.badge || '');
            modalShell.setAttribute('content-src', ev.src || `../evidence/${section.id}/${docId}.html`);
            modalShell.setAttribute('data-blocks', blocksString);
            modalShell.setAttribute('data-sdgs', sdgsString);
            layout.appendChild(modalShell);
          });
        }
      }

      // Also update gallery image on smart-eco-campus.html if on smart-eco page
      if (thumb && section.id) {
        const galleryImg = document.querySelector(`.group\\/gallery a[href*="${section.id}"] img`);
        if (galleryImg) {
          galleryImg.src = resolveAssetPath(thumb);
        }
      }
    }
  }

  /**
   * Helper: Apply Featured Announcement to Homepage Section 2 Headline (DRY)
   */
  function applyFeaturedHeadline(featured) {
    if (!featured) return;

    const commitmentHeader = document.getElementById('ucu-commitment-header');
    if (commitmentHeader) {
      if (featured.category || featured.badge) commitmentHeader.setAttribute('eyebrow', featured.category || featured.badge);
      if (featured.title) commitmentHeader.setAttribute('title', featured.title);
      if (typeof commitmentHeader.connectedCallback === 'function') commitmentHeader.connectedCallback();
    }

    const homeProse = document.querySelector('.ucu-prose-narrative');
    if (homeProse) {
      const summaryText = featured.desc || featured.content || '';
      const ctaContainer = homeProse.querySelector('#ucu-commitment-cta-container');
      const ctaHref = `./announcement.html#${featured.id || 'featured'}`;
      
      const newP = `<p class="text-muted leading-relaxed mb-6">${escapeHtml(summaryText)}</p>`;
      const ctaHtml = `
        <div class="flex flex-wrap gap-4 mt-2" id="ucu-commitment-cta-container">
          <a href="${ctaHref}" id="ucu-commitment-cta" class="inline-flex items-center justify-center px-8 py-3.5 bg-ucu-blue-dark text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-md hover:bg-ucu-red transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none">
            Read More
          </a>
        </div>
      `;
      homeProse.innerHTML = newP + ctaHtml;
    }

    const headlineSlider = document.querySelector('ucu-image-slider');
    if (headlineSlider) {
      const imgSrc = featured.img || featured.image || featured.src;
      if (imgSrc) {
        headlineSlider.setAttribute('images', JSON.stringify([imgSrc]));
        if (typeof headlineSlider.connectedCallback === 'function') headlineSlider.connectedCallback();
      }
    }
  }

  /**
   * Render Announcements Page (1 Featured Hero + 9 Grid Items / Page with Pagination & Modals)
   */
  function renderAnnouncementPage(data, page = 1) {
    if (!data) return;

    // 1. Gather all items into a unified array
    let allItems = [];
    if (Array.isArray(data.announcementsList) && data.announcementsList.length > 0) {
      allItems = [...data.announcementsList];
    } else if (Array.isArray(data.list) && data.list.length > 0) {
      allItems = [...data.list];
    } else if (data.featured) {
      allItems = [{ ...data.featured, isFeatured: true }];
    }

    if (allItems.length === 0) return;

    // 2. Identify the single featured item
    const featuredIndex = allItems.findIndex(i => i.isFeatured === true);
    const featuredItem = featuredIndex >= 0 ? allItems[featuredIndex] : allItems[0];
    const featuredId = featuredItem.id || 'ann-featured';

    const SDG_COLORS = {
      1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D",
      5: "#FF3A21", 6: "#26BDE2", 7: "#FCC30B", 8: "#A21942",
      9: "#FD6925", 10: "#DD1367", 11: "#FD9D24", 12: "#BF8B2E",
      13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B", 16: "#00689D",
      17: "#19486A"
    };

    // Render Featured Hero Banner
    if (featuredItem) {
      const featBadge = document.getElementById('featured-badge');
      const featTitle = document.getElementById('featured-title');
      const featContent = document.getElementById('featured-content');
      const featDate = document.getElementById('featured-date');
      const featImg = document.getElementById('featured-image');
      const featSection = document.getElementById('featured-announcement-section');
      const featSdgs = document.getElementById('featured-sdgs');

      if (featBadge) featBadge.textContent = featuredItem.badge || featuredItem.category || 'Featured';
      if (featTitle) featTitle.textContent = featuredItem.title || '';
      if (featContent) featContent.textContent = featuredItem.desc || featuredItem.content || '';
      if (featDate) featDate.textContent = featuredItem.date || '';
      if (featImg) featImg.src = featuredItem.img || featuredItem.image || featuredItem.src || './images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png';

      // Render Featured Aligned SDGs (Aligned on Far Right / End)
      const featRelated = Array.isArray(featuredItem.relatedSdgs) ? featuredItem.relatedSdgs : [];
      if (featSdgs) {
        featSdgs.innerHTML = featRelated.map(num => `<span style="background-color: ${SDG_COLORS[num] || '#19486A'};" class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shadow-2xs shrink-0 select-none" title="SDG ${num}">${num}</span>`).join('');
      }

      if (featSection) {
        const readBtn = featSection.querySelector('#featured-read-btn') || featSection.querySelector('a');
        if (readBtn) {
          readBtn.setAttribute('href', `#${featuredId}`);
          readBtn.className = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ucu-red text-white font-bold text-xs sm:text-sm hover:bg-red-700 transition-colors shadow-md cursor-pointer";
          readBtn.onclick = (e) => {
            e.preventDefault();
            if (window.ucuOpenModal) {
              window.ucuOpenModal(featuredId);
            }
          };
        }
      }
    }

    // 3. Gather items for the Recent grid (exclude the featured item)
    const recentItems = allItems.filter(item => item !== featuredItem);

    // 4. Paginate Recent Items (3x3 grid: 9 per page)
    const ITEMS_PER_PAGE = 9;
    const totalPages = Math.max(1, Math.ceil(recentItems.length / ITEMS_PER_PAGE));
    let currentPage = Math.max(1, Math.min(page, totalPages));

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = recentItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const grid = document.getElementById('announcements-grid');
    if (grid) {
      if (pageItems.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400">
            <p class="text-sm font-medium">No additional recent announcements archived.</p>
          </div>
        `;
      } else {
        grid.innerHTML = pageItems.map((item, idx) => {
          const itemId = item.id || `ann-item-${startIndex + idx}`;
          const imgSrc = item.img || item.image || item.src || './images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png';
          const relatedSdgs = Array.isArray(item.relatedSdgs) ? item.relatedSdgs : [];

          return `
            <article class="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200 hover:border-ucu-red/40 hover:shadow-lg transition-all duration-300 cursor-pointer" data-ann-open-modal="${itemId}">
              <div class="w-full h-48 sm:h-52 overflow-hidden bg-slate-100 relative shrink-0">
                <img src="${imgSrc}" 
                     alt="${escapeHtml(item.title || 'Announcement')}" 
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                     loading="lazy" onerror="window.ucuHandleImageError(this)">
              </div>
              
              <div class="flex-1 flex flex-col justify-between p-5 sm:p-6 bg-white text-slate-800 space-y-3">
                <div class="space-y-2.5">
                  
                  <!-- Top Row: Category Pill on Left, Date on Right -->
                  <div class="flex items-center justify-between gap-2 min-w-0">
                    <span class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-red-50 text-ucu-red border border-red-100 shadow-2xs whitespace-nowrap shrink-0">
                      ${escapeHtml(item.category || item.badge || 'News')}
                    </span>
                    
                    <span class="text-[10px] font-semibold text-slate-400 ml-auto whitespace-nowrap shrink-0">
                      ${escapeHtml(item.date || '')}
                    </span>
                  </div>

                  <h3 class="text-base sm:text-lg font-black text-ucu-blue-dark leading-snug group-hover:text-ucu-red transition-colors line-clamp-2">
                    ${escapeHtml(item.title || '')}
                  </h3>
                  <p class="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed font-normal">
                    ${escapeHtml(item.desc || item.content || '')}
                  </p>
                </div>
                
                <!-- Bottom Row: SDG Number Boxes on Left, Read more on Right -->
                <div class="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between gap-2">
                  <div class="flex flex-wrap items-center gap-1">
                    ${relatedSdgs.map(num => `<span style="background-color: ${SDG_COLORS[num] || '#19486A'};" class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shadow-2xs shrink-0 select-none" title="SDG ${num}">${num}</span>`).join('')}
                  </div>

                  <span class="text-xs font-bold text-ucu-blue group-hover:text-ucu-red group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 ml-auto">
                    Read more &rarr;
                  </span>
                </div>
              </div>
            </article>
          `;
        }).join('');

        // Attach click listeners to cards
        grid.querySelectorAll('[data-ann-open-modal]').forEach(card => {
          card.addEventListener('click', () => {
            const mId = card.getAttribute('data-ann-open-modal');
            if (window.ucuOpenModal) window.ucuOpenModal(mId);
          });
        });
      }
    }

    // 5. Render Modal Shells for all items
    let modalsContainer = document.getElementById('announcements-modals-container');
    if (!modalsContainer) {
      modalsContainer = document.createElement('div');
      modalsContainer.id = 'announcements-modals-container';
      document.body.appendChild(modalsContainer);
    }

    modalsContainer.innerHTML = '';
    allItems.forEach((item, idx) => {
      const mId = item.id || (item === featuredItem ? featuredId : `ann-item-${idx}`);
      const blocks = item.blocks && item.blocks.length > 0 ? item.blocks : [
        { type: 'paragraph', content: item.desc || item.content || '' }
      ];

      const shell = document.createElement('ucu-modal-shell');
      shell.setAttribute('modal-id', mId);
      shell.setAttribute('title', item.title || 'Announcement');
      shell.setAttribute('badge', item.category || item.badge || 'News & Media');
      shell.setAttribute('data-sdgs', JSON.stringify(item.relatedSdgs || []));
      shell.setAttribute('data-blocks', encodeURIComponent(JSON.stringify(blocks)));
      shell.blocksData = blocks;
      modalsContainer.appendChild(shell);
    });

    // 6. Render Pagination Controls
    const paginationContainer = document.getElementById('announcements-pagination');
    if (paginationContainer) {
      if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
      } else {
        let pagesHtml = '';

        // Previous Button
        pagesHtml += `
          <button type="button" data-ann-page="${currentPage - 1}" class="px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${currentPage === 1 ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'}">
            &larr; Prev
          </button>
        `;

        // Number Buttons
        for (let p = 1; p <= totalPages; p++) {
          pagesHtml += `
            <button type="button" data-ann-page="${p}" class="w-9 h-9 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center ${p === currentPage ? 'bg-ucu-blue text-white border-ucu-blue shadow-md' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}">
              ${p}
            </button>
          `;
        }

        // Next Button
        pagesHtml += `
          <button type="button" data-ann-page="${currentPage + 1}" class="px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${currentPage === totalPages ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'}">
            Next &rarr;
          </button>
        `;

        paginationContainer.innerHTML = pagesHtml;

        // Wire click listeners
        paginationContainer.querySelectorAll('[data-ann-page]').forEach(btn => {
          btn.addEventListener('click', () => {
            const targetPage = parseInt(btn.getAttribute('data-ann-page'), 10);
            if (targetPage >= 1 && targetPage <= totalPages) {
              renderAnnouncementPage(data, targetPage);
              const gridHeader = document.querySelector('#announcements-grid');
              if (gridHeader) {
                gridHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          });
        });
      }
    }
  }

  /**
   * Production Check for Published Local / Cloud Content
   */
  async function checkAndHydratePublishedData(forcedYear) {
    try {
      const currentSection = getCurrentPageSection();
      const currentUrlParams = new URLSearchParams(window.location.search);
      const layoutEl = document.querySelector('ucu-sdg-layout');
      let activeYear = forcedYear || currentUrlParams.get('year') || (layoutEl ? layoutEl.getAttribute('year') : null) || currentSection.year || '2025';

      let collection = 'pages';
      let docId = '';
      let sectionType = currentSection.type;
      let sectionId = currentSection.id;

      if (sectionType === 'sdg') {
        collection = 'sdg_narratives';
        docId = `sdg_${sectionId}_${activeYear}`;
      } else if (sectionType === 'sdg_dashboard') {
        collection = 'pages';
        docId = `sdg_dashboard_${activeYear}`;
      } else if (sectionType === 'impact') {
        collection = 'pages';
        docId = `impact_${activeYear}`;
      } else if (sectionType === 'research') {
        collection = 'pages';
        docId = `research_${activeYear}`;
      } else if (sectionType === 'rankings') {
        collection = 'pages';
        docId = 'rankings';
      } else if (sectionType === 'partnership') {
        collection = 'pages';
        docId = 'partnerships';
      } else if (sectionType === 'smarteco') {
        collection = 'pages';
        docId = 'smart_eco_campus';
      } else if (sectionType === 'indicator') {
        collection = 'indicators';
        docId = sectionId;
      } else if (sectionType === 'announcement') {
        collection = 'pages';
        docId = 'announcements';
      } else if (sectionType === 'home') {
        collection = 'pages';
        docId = 'home';
      }

      if (!docId) return;

      const docKey = `${collection}__${docId}`;
      let hasHydratedIndicatorEvidences = false;

      // 1. Check LocalStorage fallback first
      const localStored = localStorage.getItem(`UCU_PUBLISHED_${docKey}`) || 
                          localStorage.getItem(`UCU_PUBLISHED_${docId}`) ||
                          localStorage.getItem(`UCU_DRAFT_${docKey}`);
      if (localStored) {
        try {
          const payload = JSON.parse(localStored);
          const dataToApply = payload.data || payload;
          applyLiveUpdate({ type: sectionType, id: sectionId, year: activeYear }, dataToApply);
          if (dataToApply.evidences && Array.isArray(dataToApply.evidences) && dataToApply.evidences.length > 0) {
            hasHydratedIndicatorEvidences = true;
          }
        } catch(e) {}
      }

      // 2. Query Cloud Firestore REST endpoint for live published overrides
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/sdg-web-d07ac/databases/(default)/documents/${collection}/${docId}`;
        const res = await fetch(firestoreUrl);
        if (res.ok) {
          const docRes = await res.json();
          if (docRes && docRes.fields) {
            const parsedData = unwrapFirestoreFields(docRes.fields);
            const dataToApply = parsedData.data || parsedData;
            applyLiveUpdate({ type: sectionType, id: sectionId, year: activeYear }, dataToApply);
            if (dataToApply.evidences && Array.isArray(dataToApply.evidences) && dataToApply.evidences.length > 0) {
              hasHydratedIndicatorEvidences = true;
            }
          }
        }
        // 404 = document simply not published yet, no action needed
      } catch (fetchErr) {
        // Network error or CORS — silently skip cloud hydration
      }

      // 3. If homepage, hydrate additional dynamic collections (DRY)
      if (sectionType === 'home') {
        // A. Hydrate Section 2 Headline from Featured Announcement
        const localAnnouncements = localStorage.getItem('UCU_PUBLISHED_pages__announcements') || 
                                   localStorage.getItem('UCU_PUBLISHED_announcements') ||
                                   localStorage.getItem('UCU_DRAFT_pages__announcements') ||
                                   localStorage.getItem('UCU_DRAFT_pages__announcement');
        if (localAnnouncements) {
          try {
            const annData = JSON.parse(localAnnouncements).data || JSON.parse(localAnnouncements);
            const featured = (annData.announcementsList || annData.list || []).find(a => a.isFeatured) || annData.featured;
            if (featured) applyFeaturedHeadline(featured);
          } catch(e) {}
        }

        fetchDoc('pages', 'announcements').then(annData => {
          if (annData) {
            const featured = (annData.announcementsList || annData.list || []).find(a => a.isFeatured) || annData.featured;
            if (featured) applyFeaturedHeadline(featured);
          }
        });

        // B. Hydrate Section 5 Events (Last 3)
        fetchDoc('pages', 'impact_2025').then(impactData => {
          if (impactData && impactData.eventsList && impactData.eventsList.length) {
            const events = impactData.eventsList;
            events.sort((a, b) => new Date(b.date) - new Date(a.date));
            window.UCU_EVENTS = events;
            const ep = document.querySelector('ucu-events-preview');
            if (ep && typeof ep.render === 'function') ep.render();
          }
        });

        // C. Hydrate Section 4 Rankings
        fetchDoc('pages', 'rankings').then(rankingsData => {
          if (rankingsData) {
            const rData = rankingsData.data || rankingsData;
            if (rData.standingTitle) {
              const h2 = document.getElementById('rankings-standing-title') || document.getElementById('standing-title');
              if (h2) h2.textContent = rData.standingTitle;
            }
            if (rData.rankingsList && Array.isArray(rData.rankingsList) && rData.rankingsList.length > 0) {
              window.UCU_RANKINGS = rData.rankingsList;
              const rc = document.querySelector('ucu-ranking-carousel');
              if (rc && typeof rc.render === 'function') rc.render();
            }
          }
        });

        // D. Hydrate Section 6 Partners & Footprint
        fetchCollection('partners').then(partners => {
          if (partners && partners.length) {
            window.UCU_PARTNERS = partners;
            const cg = document.querySelector('ucu-country-grid');
            if (cg && typeof cg.connectedCallback === 'function') cg.connectedCallback();
            const pc = document.querySelector('ucu-partner-carousel');
            if (pc && typeof pc.connectedCallback === 'function') pc.connectedCallback();
          }
        });
      }

      // 4. If impact page, fallback to events collection if eventsList not embedded in page doc
      if (sectionType === 'impact' && (!dataToApply || !dataToApply.eventsList)) {
        fetchCollection('events').then(events => {
          if (events && events.length) {
            window.UCU_EVENTS = events;
            const impactFeed = document.querySelector('ucu-impact-feed');
            if (impactFeed && typeof impactFeed.render === 'function') {
              impactFeed.render();
            }
          }
        });
      }

      // 5. If research page, fallback to research collection if researchList not embedded in page doc
      if (sectionType === 'research' && (!dataToApply || !dataToApply.researchList)) {
        fetchCollection('research').then(research => {
          if (research && research.length) {
            window.UCU_RESEARCH = research;
            const rf = document.querySelector('ucu-research-feed');
            if (rf && typeof rf.render === 'function') {
              rf.render();
            }
          }
        });
      }

      // 6. If smart eco campus page, hydrate 7 indicator pillar gallery thumbnails from indicators collection
      if (sectionType === 'smarteco') {
        fetchCollection('indicators').then(indicators => {
          if (indicators && indicators.length) {
            indicators.forEach(ind => {
              const pId = ind.indicatorId || ind.pillarId || ind.id;
              const targetThumb = ind.thumb_image || ind.thumbnailImg;
              if (pId && targetThumb) {
                const galleryImg = document.querySelector(`.group\\/gallery a[href*="${pId}"] img`);
                if (galleryImg) {
                  galleryImg.src = resolveAssetPath(targetThumb);
                }
              }
            });
          }
        });
      }

      // 7. If indicator page and not already hydrated with evidence from the indicator document, fallback to evidences collection
      if (sectionType === 'indicator' && !hasHydratedIndicatorEvidences) {
        const layout = document.querySelector('ucu-indicator-layout');
        const activeNum = layout ? layout.getAttribute('active-num') : '01';
        fetchCollection('evidences').then(allEvidences => {
          if (allEvidences && allEvidences.length) {
            const filtered = allEvidences.filter(ev => ev.referenceId === activeNum || (ev.codeID && ev.codeID.startsWith(parseInt(activeNum, 10) + '.')) || (ev.id && ev.id.startsWith(parseInt(activeNum, 10) + '_')));
            if (filtered.length > 0) {
              const seen = new Set();
              const unique = [];
              for (const ev of filtered) {
                if (!ev) continue;
                const key = (ev.codeID || ev.id || '').trim();
                if (key && !seen.has(key)) {
                  seen.add(key);
                  unique.push(ev);
                }
              }
              const sorted = unique.sort((a, b) => {
                const codeA = (a.codeID || a.id || '').replace(/^modal-/, '').replace(/_/g, '.');
                const codeB = (b.codeID || b.id || '').replace(/^modal-/, '').replace(/_/g, '.');
                return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
              });
              applyLiveUpdate({ type: 'indicator', id: sectionId }, { evidences: sorted });
            }
          }
        });
      }

      if (window.ucuInitScrollReveal) {
        window.ucuInitScrollReveal();
      }

    } catch (e) {
      console.warn("[UCU Public Sync] Hydration check failed:", e);
    }
  }

  async function fetchDoc(collectionName, docId) {
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/sdg-web-d07ac/databases/(default)/documents/${collectionName}/${docId}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.fields) return null;
      const unwrapped = unwrapFirestoreFields(data.fields);
      return unwrapped.data || unwrapped;
    } catch (e) {
      console.warn(`[UCU Public Sync] Failed to fetch ${collectionName}/${docId}`, e);
      return null;
    }
  }

  async function fetchCollection(collectionName) {
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/sdg-web-d07ac/databases/(default)/documents/${collectionName}?pageSize=500`);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data || !data.documents) return [];
      return data.documents.map(doc => {
        const fields = unwrapFirestoreFields(doc.fields || {});
        return {
          id: doc.name.split('/').pop(),
          ...fields
        };
      });
    } catch (e) {
      console.warn(`[UCU Public Sync] Failed to fetch ${collectionName}`, e);
      return [];
    }
  }

  /**
   * Helper to unwrap Firestore REST API typed values (stringValue, mapValue, arrayValue, etc.)
   */
  function unwrapFirestoreFields(fields) {
    if (!fields || typeof fields !== 'object') return fields;
    const result = {};
    for (const key in fields) {
      result[key] = unwrapValue(fields[key]);
    }
    return result;
  }

  function unwrapValue(val) {
    if (!val || typeof val !== 'object') return val;
    if ('stringValue' in val) return val.stringValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('doubleValue' in val) return parseFloat(val.doubleValue);
    if ('timestampValue' in val) return val.timestampValue;
    if ('mapValue' in val) return unwrapFirestoreFields(val.mapValue.fields || {});
    if ('arrayValue' in val) return (val.arrayValue.values || []).map(unwrapValue);
    if ('nullValue' in val) return null;
    return val;
  }

  function getThemeSvg(theme) {
    if (theme === 'red') {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/></svg>';
  }

  window.ucuHydratePublishedData = checkAndHydratePublishedData;
  window.ucuApplyLiveUpdate = applyLiveUpdate;

})();
