// admin/js/preview-bridge.js
// Split-Screen Live Preview postMessage Syncer & Device Frame Controller

import { cmsState } from './cms-state.js';

class PreviewBridge {
  constructor() {
    this.iframe = null;
    this.deviceMode = 'desktop'; // 'desktop' | 'tablet' | 'mobile'
    this.isConnected = false;
    this.targetUrl = '';
    this.debounceTimer = null;
    this.listeners = new Set();
    this.openedTabs = new Set();
    this.broadcastChannel = null;

    // Cross-tab broadcast channel for real-time live preview in external tabs/windows
    if (typeof window.BroadcastChannel === 'function') {
      try {
        this.broadcastChannel = new BroadcastChannel('UCU_CMS_LIVE_CHANNEL');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'UCU_CMS_PREVIEW_READY') {
            this.sendLiveUpdate(cmsState.currentDraft);
          }
        };
      } catch (e) {
        console.warn("[Preview Bridge] BroadcastChannel init error:", e);
      }
    }
  }

  init(iframeElement) {
    this.iframe = iframeElement;

    // Listen for incoming messages from child preview iframe or external tabs
    window.addEventListener('message', (event) => {
      this.handleIncomingMessage(event);
    });

    // When iframe finishes loading
    this.iframe.addEventListener('load', () => {
      this.isConnected = true;
      this.notifyListeners({ status: 'connected' });
      this.sendLiveUpdate(cmsState.currentDraft);
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach(fn => {
      try {
        fn(data);
      } catch (e) {
        console.error("[Preview Bridge] Listener error:", e);
      }
    });
  }

  /**
   * Determine target URL for the active CMS section
   */
  getPreviewUrlForSection(section) {
    const { type, id, year } = section;
    const base = '../';

    const effectiveYear = year || '2025';

    if (type === 'home') {
      return `${base}index.html?cms_preview=true`;
    }
    if (type === 'sdg') {
      return `${base}sdg-reports/sdg${id}.html?year=${effectiveYear}&cms_preview=true`;
    }
    if (type === 'sdg_dashboard') {
      return `${base}sdg-reports.html?year=${effectiveYear}&cms_preview=true`;
    }
    if (type === 'impact') {
      return `${base}impact.html?year=${effectiveYear}&cms_preview=true`;
    }
    if (type === 'research') {
      return `${base}research.html?year=${effectiveYear}&cms_preview=true`;
    }
    if (type === 'rankings') {
      return `${base}rankings.html?cms_preview=true`;
    }
    if (type === 'partnership') {
      return `${base}partnership.html?cms_preview=true`;
    }
    if (type === 'smarteco' || type === 'smart_eco') {
      return `${base}smart-eco-campus.html?cms_preview=true`;
    }
    if (type === 'announcement' || type === 'announcements') {
      return `${base}announcement.html?cms_preview=true`;
    }
    if (type === 'indicator') {
      return `${base}indicators/${id}.html?cms_preview=true`;
    }
    return `${base}index.html?cms_preview=true`;
  }

  /**
   * Navigate preview iframe to match active section
   */
  syncLocationToSection(section) {
    const url = this.getPreviewUrlForSection(section);
    if (this.targetUrl !== url) {
      this.targetUrl = url;
      this.isConnected = false;
      this.notifyListeners({ status: 'loading', url });
      if (this.iframe) {
        this.iframe.src = url;
      }
    }
  }

  /**
   * Send live draft changes to preview iframe, external tabs, and BroadcastChannel
   */
  sendLiveUpdate(draftData) {
    if (!draftData) return;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      try {
        const message = {
          type: 'UCU_CMS_LIVE_PREVIEW',
          section: cmsState.activeSection,
          data: draftData,
          timestamp: Date.now()
        };

        // 1. Internal split-screen iframe
        if (this.iframe && this.iframe.contentWindow) {
          this.iframe.contentWindow.postMessage(message, '*');
        }

        // 2. BroadcastChannel across all browser tabs
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage(message);
        }

        // 3. Tracked external window references
        this.openedTabs.forEach(tab => {
          if (tab && !tab.closed) {
            try {
              tab.postMessage(message, '*');
            } catch (e) {}
          } else {
            this.openedTabs.delete(tab);
          }
        });

        // 4. LocalStorage draft mirror for instant hydration when tabs open
        try {
          localStorage.setItem('UCU_CMS_ACTIVE_PREVIEW_DRAFT', JSON.stringify(message));
          const docKey = cmsState.getDocKey();
          localStorage.setItem(`UCU_DRAFT_${docKey}`, JSON.stringify(draftData));
        } catch (e) {}

        this.notifyListeners({ status: 'synced', timestamp: Date.now() });
      } catch (err) {
        console.warn("[Preview Bridge] postMessage dispatch failed:", err);
      }
    }, 50); // Fast 50ms debounce for ultra-smooth typing response
  }

  /**
   * Handle incoming handshake and status messages from preview iframe or external tabs
   */
  handleIncomingMessage(event) {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'UCU_CMS_PREVIEW_READY') {
      this.isConnected = true;
      this.notifyListeners({ status: 'connected' });

      // If preview iframe navigated to a different section, sync CMS Studio without reloading iframe
      if (data.section && data.section.type && data.section.id) {
        const cur = cmsState.activeSection;
        const isSame = cur.type === data.section.type && cur.id === data.section.id && (cur.year || '') === (data.section.year || '');

        if (!isSame) {
          this.targetUrl = this.getPreviewUrlForSection(data.section);
          if (typeof window.cmsNavigateToSection === 'function') {
            window.cmsNavigateToSection(data.section.type, data.section.id, data.section.year || cur.year, false);
          }
          return;
        }
      }

      // If same section, push active draft
      if (cmsState.currentDraft) {
        this.sendLiveUpdate(cmsState.currentDraft);
      }
    }
  }

  /**
   * Change responsive frame view mode
   */
  setDeviceMode(mode, frameContainer) {
    this.deviceMode = mode;
    if (!frameContainer) return;

    frameContainer.classList.remove('device-frame-desktop', 'device-frame-tablet', 'device-frame-mobile');
    
    if (mode === 'tablet') {
      frameContainer.classList.add('device-frame-tablet');
    } else if (mode === 'mobile') {
      frameContainer.classList.add('device-frame-mobile');
    } else {
      frameContainer.classList.add('device-frame-desktop');
    }

    this.notifyListeners({ status: 'mode_change', mode });
  }

  /**
   * Force reload preview frame with cache-busting timestamp
   */
  reload() {
    if (this.iframe) {
      this.isConnected = false;
      this.notifyListeners({ status: 'reloading' });
      try {
        const currentUrl = new URL(this.iframe.src, window.location.href);
        currentUrl.searchParams.set('_t', Date.now());
        this.iframe.src = currentUrl.toString();
      } catch (e) {
        this.iframe.src = this.iframe.src;
      }
    }
  }

  /**
   * Open current preview target in a new window/tab
   */
  openInNewTab() {
    if (this.targetUrl) {
      // Mirror active draft before opening tab
      if (cmsState.currentDraft) {
        try {
          const message = {
            type: 'UCU_CMS_LIVE_PREVIEW',
            section: cmsState.activeSection,
            data: cmsState.currentDraft,
            timestamp: Date.now()
          };
          localStorage.setItem('UCU_CMS_ACTIVE_PREVIEW_DRAFT', JSON.stringify(message));
        } catch (e) {}
      }

      const newTab = window.open(this.targetUrl, '_blank');
      if (newTab) {
        this.openedTabs.add(newTab);
      }
    }
  }
}

export const previewBridge = new PreviewBridge();
