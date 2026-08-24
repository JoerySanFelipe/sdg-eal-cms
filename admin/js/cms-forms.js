// admin/js/cms-forms.js
/**
 * Modern Streamlined CMS Forms Controller
 * Modular Dispatcher & Delegated Event Engine for UCU SDG CMS Studio
 */

import { cmsState } from './cms-state.js';
import { previewBridge } from './preview-bridge.js';
import { getFirebaseConfig, saveFirebaseConfig, resetFirebaseConfig, isFirebaseConfigured } from './firebase-config.js';
import { databaseSeeder } from './database-seeder.js';
import { homeManager } from './modules/home-manager.js';
import { announcementsManager } from './modules/announcements-manager.js';
import { eventsManager } from './modules/events-manager.js';
import { researchManager } from './modules/research-manager.js';
import { rankingsManager } from './modules/rankings-manager.js';
import { partnershipsManager } from './modules/partnerships-manager.js';
import { smartEcoManager } from './modules/smarteco-manager.js';
import { indicatorsManager } from './modules/indicators-manager.js';
import { sdgReportsManager } from './modules/sdg-reports-manager.js';
import { lucideIconPicker } from './lucide-icon-picker.js';
import { escapeHtml, resolveAssetUrl, SDG_METADATA, INDICATOR_PILLARS } from './shared-utils.js';

export { SDG_METADATA, INDICATOR_PILLARS };

export class CMSForms {
  constructor(containerElement) {
    this.container = containerElement;
    this.boundDraft = null;
    this.sdgCardFilter = 'all';
    this._abortController = null;
    window.cmsForms = this;
  }

  /**
   * Helper: Resolve relative image src paths for Admin Studio context
   */
  resolveAdminImageSrc(src) {
    return resolveAssetUrl(src, { isAdmin: true });
  }

  /**
   * Helper: Escape HTML string safely
   */
  escape(str) {
    return escapeHtml(str);
  }

  /**
   * Render the form for the currently active CMS section
   */
  render() {
    if (!this.container) return;

    const { type, id, year } = cmsState.activeSection;
    const draft = cmsState.currentDraft || {};
    this.boundDraft = draft;

    let html = '';

    switch (type) {
      case 'sdg':
        html = sdgReportsManager.render(id, year, draft);
        break;
      case 'home':
        html = homeManager.render(draft);
        break;
      case 'sdg_dashboard':
        html = this.buildSdgDashboardForm(draft);
        break;
      case 'impact':
      case 'events':
        html = eventsManager.render(draft);
        break;
      case 'research':
        html = researchManager.render(draft);
        break;
      case 'rankings':
        html = rankingsManager.render(draft);
        break;
      case 'partnership':
      case 'partnerships':
        html = partnershipsManager.render(draft);
        break;
      case 'smarteco':
      case 'smart_eco':
        html = smartEcoManager.render(draft);
        break;
      case 'announcement':
      case 'announcements':
        html = announcementsManager.render(draft);
        break;
      case 'indicator':
        html = indicatorsManager.render(id, draft);
        break;
      case 'settings':
        html = this.buildSettingsForm();
        break;
      default:
        html = `<div class="p-8 text-center text-slate-400">Select a section from the left navigation to edit content.</div>`;
    }

    this.container.innerHTML = html;
    this.bindEvents();
  }

  /**
   * Cleanly bind and delegate events with automatic cleanup of previous listeners
   */
  bindEvents() {
    if (!this.container) return;

    // Clean up previous event listeners via AbortController to prevent memory leaks
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();
    const { signal } = this._abortController;

    const { type } = cmsState.activeSection;

    // 1. Delegate to active feature manager
    const managerMap = {
      sdg: sdgReportsManager,
      home: homeManager,
      impact: eventsManager,
      events: eventsManager,
      research: researchManager,
      rankings: rankingsManager,
      partnership: partnershipsManager,
      partnerships: partnershipsManager,
      smarteco: smartEcoManager,
      smart_eco: smartEcoManager,
      announcement: announcementsManager,
      announcements: announcementsManager,
      indicator: indicatorsManager
    };

    if (managerMap[type]?.bindEvents) {
      managerMap[type].bindEvents(this.container, this);
    }

    // 2. Global Delegated Field Binding (`data-bind`)
    this.container.addEventListener('input', (e) => {
      const target = e.target.closest('[data-bind]');
      if (!target) return;
      const field = target.getAttribute('data-bind');
      cmsState.updateDraftField(field, target.value);
      previewBridge.sendLiveUpdate(cmsState.currentDraft);
    }, { signal });

    // 3. SDG Dashboard Page Bindings
    if (type === 'sdg_dashboard') {
      this.bindSdgDashboardEvents(signal);
    }

    // 4. Settings Page Bindings
    if (type === 'settings') {
      this.bindSettingsEvents(signal);
    }
  }

  /**
   * Bind event listeners specific to SDG Dashboard (17 Goals Grid & Metrics)
   */
  bindSdgDashboardEvents(signal) {
    const container = this.container;

    // A. Add Dashboard Metric
    const btnAddMetric = container.querySelector('#btn-add-dashboard-metric') || container.querySelector('#btn-add-metric');
    if (btnAddMetric) {
      btnAddMetric.addEventListener('click', () => {
        if (!cmsState.currentDraft.metrics) cmsState.currentDraft.metrics = [];
        const defaultIcons = ['award', 'globe', 'book-open', 'users', 'handshake', 'trending-up', 'leaf'];
        const chosenIcon = defaultIcons[cmsState.currentDraft.metrics.length % defaultIcons.length];
        const defaultSvg = lucideIconPicker.getSvg(chosenIcon, 20, 2);

        cmsState.currentDraft.metrics.push({
          value: "17",
          label: "New Metric",
          theme: "white",
          icon: chosenIcon,
          svgIcon: defaultSvg
        });
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      }, { signal });
    }

    // B. Metric Field Inputs
    container.querySelectorAll('[data-metric-field]').forEach(input => {
      const handler = (e) => {
        const idx = parseInt(input.getAttribute('data-metric-index'), 10);
        const field = input.getAttribute('data-metric-field');
        if (!cmsState.currentDraft.metrics) cmsState.currentDraft.metrics = [];
        if (!cmsState.currentDraft.metrics[idx]) cmsState.currentDraft.metrics[idx] = {};
        cmsState.currentDraft.metrics[idx][field] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      };
      input.addEventListener('input', handler, { signal });
      input.addEventListener('change', handler, { signal });
    });

    // C. Lucide Icon Picker for Dashboard Metrics
    container.querySelectorAll('[data-pick-dashboard-metric-icon]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-pick-dashboard-metric-icon'), 10);
        if (!Array.isArray(cmsState.currentDraft.metrics) || !cmsState.currentDraft.metrics[idx]) return;

        const currentMetric = cmsState.currentDraft.metrics[idx];
        const currentIconKey = currentMetric.icon || currentMetric.iconName || '';

        lucideIconPicker.open({
          currentIcon: currentIconKey,
          onSelect: (iconName, svgHtml) => {
            currentMetric.icon = iconName;
            currentMetric.svgIcon = svgHtml;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            this.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        });
      }, { signal });
    });

    // D. Delete Metric
    container.querySelectorAll('[data-delete-dashboard-metric]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-delete-dashboard-metric'), 10);
        if (Array.isArray(cmsState.currentDraft.metrics)) {
          cmsState.currentDraft.metrics.splice(idx, 1);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          this.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      }, { signal });
    });

    // E. Goal Filter Tabs
    container.querySelectorAll('[data-sdg-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sdgCardFilter = btn.getAttribute('data-sdg-filter');
        this.render();
      }, { signal });
    });

    // F. SDG Goal Card Inputs
    container.querySelectorAll('[data-sdgcard-field]').forEach(input => {
      const handler = (e) => {
        const idx = parseInt(input.getAttribute('data-sdgcard-index'), 10);
        const field = input.getAttribute('data-sdgcard-field');
        if (!cmsState.currentDraft.sdgCards) cmsState.currentDraft.sdgCards = [];
        if (!cmsState.currentDraft.sdgCards[idx]) cmsState.currentDraft.sdgCards[idx] = {};
        cmsState.currentDraft.sdgCards[idx][field] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      };
      input.addEventListener('input', handler, { signal });
      input.addEventListener('change', handler, { signal });
    });

    // G. Single Image Uploaders (Background & Logo)
    container.querySelectorAll('.single-image-uploader-zone').forEach(zone => {
      const targetType = zone.getAttribute('data-target-type');
      const targetIndex = parseInt(zone.getAttribute('data-target-index'), 10);
      const targetProp = zone.getAttribute('data-target-prop');
      const dropzone = zone.querySelector('.single-dropzone');
      const fileInput = zone.querySelector('.single-file-input');

      const triggerUpload = () => {
        if (fileInput) fileInput.click();
      };

      if (dropzone && fileInput) {
        dropzone.addEventListener('click', triggerUpload, { signal });
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('border-ucu-blue', 'bg-blue-50/50');
        }, { signal });
        dropzone.addEventListener('dragleave', () => {
          dropzone.classList.remove('border-ucu-blue', 'bg-blue-50/50');
        }, { signal });
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-ucu-blue', 'bg-blue-50/50');
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            cmsState.uploadSingleImageToTarget(targetType, targetIndex, targetProp, e.dataTransfer.files[0]);
          }
        }, { signal });
        fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files.length > 0) {
            cmsState.uploadSingleImageToTarget(targetType, targetIndex, targetProp, e.target.files[0]);
          }
        }, { signal });
      }

      const replaceBtn = zone.querySelector('[data-replace-single-image]');
      if (replaceBtn && fileInput) {
        replaceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.click();
        }, { signal });
      }
    });
  }

  /**
   * Bind event listeners specific to Firebase Cloud Settings & Seeder
   */
  bindSettingsEvents(signal) {
    const container = this.container;

    // A. Firebase Config Save Form
    const cfgForm = container.querySelector('#firebase-config-form');
    if (cfgForm) {
      cfgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newCfg = {
          projectId: container.querySelector('#cfg-projectId')?.value?.trim() || '',
          apiKey: container.querySelector('#cfg-apiKey')?.value?.trim() || '',
          authDomain: container.querySelector('#cfg-authDomain')?.value?.trim() || '',
          storageBucket: container.querySelector('#cfg-storageBucket')?.value?.trim() || '',
          messagingSenderId: container.querySelector('#cfg-messagingSenderId')?.value?.trim() || '',
          appId: container.querySelector('#cfg-appId')?.value?.trim() || ''
        };
        saveFirebaseConfig(newCfg);
      }, { signal });
    }

    // B. Reset Config Button
    const btnReset = container.querySelector('#btn-reset-config');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm("Reset Firebase credentials back to defaults?")) {
          resetFirebaseConfig();
        }
      }, { signal });
    }

    // C. 1-Click Database Seeder Migration Button
    const btnRunSeeder = container.querySelector('#btn-run-seeder');
    if (btnRunSeeder) {
      btnRunSeeder.addEventListener('click', async () => {
        const progContainer = container.querySelector('#seeder-progress-container');
        const progBar = container.querySelector('#seeder-progress-bar');
        const statusMsg = container.querySelector('#seeder-status-msg');
        const statusPercent = container.querySelector('#seeder-status-percent');
        const seederBtnText = container.querySelector('#seeder-btn-text');

        if (progContainer) progContainer.classList.remove('hidden');
        btnRunSeeder.disabled = true;
        if (seederBtnText) seederBtnText.textContent = "Migrating Data...";

        try {
          const res = await databaseSeeder.runMigration((progress) => {
            if (statusMsg) statusMsg.textContent = progress.message;
            if (statusPercent) statusPercent.textContent = `${progress.percent}%`;
            if (progBar) progBar.style.width = `${progress.percent}%`;
          });

          if (seederBtnText) seederBtnText.textContent = "Migration Completed! ✅";
          alert(`🎉 Migration Successful!\n\n• ${res.sdgs} SDG Reports Seeded\n• ${res.rankings} Institutional Rankings Seeded\n• ${res.events} Events Seeded\n• ${res.partners} Partners Seeded\n• ${res.indicators} Indicators & ${res.evidence} Evidence Items Seeded\n• ${res.research} Research Articles Seeded\n• Global Portal Settings Initialized`);
        } catch (err) {
          console.error("Migration failed:", err);
          alert("Migration Error: " + err.message);
          if (seederBtnText) seederBtnText.textContent = "Retry Migration";
          btnRunSeeder.disabled = false;
        }
      }, { signal });
    }
  }

  /**
   * SDG Dashboard Form Builder (sdg-reports/2025.html)
   */
  buildSdgDashboardForm(draft) {
    const metrics = draft.metrics || [];
    const sdgCards = draft.sdgCards || [];
    if (!this.sdgCardFilter) this.sdgCardFilter = 'all';

    const filteredCards = this.sdgCardFilter === 'all'
      ? sdgCards.map((card, idx) => ({ card, idx }))
      : sdgCards.map((card, idx) => ({ card, idx })).filter(({ card, idx }) => String(card.goalNum || (idx + 1)) === String(this.sdgCardFilter));

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Header Page</span>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">sdg-reports.html</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">SDG Reports Studio</h2>
          </div>
        </div>

        <!-- Section 1: Hero Banner -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 1</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              <span>Hero Banner &amp; Header</span>
            </h3>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Eyebrow Badge</label>
              <input type="text" data-bind="heroEyebrow" value="${escapeHtml(draft.heroEyebrow || 'Local Action. Global Impact.')}" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-ucu-blue outline-none">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Headline Text</label>
              <input type="text" data-bind="heroHeadline" value="${escapeHtml(draft.heroHeadline || 'SDG Reports')}" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold outline-none">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Highlight Word / Year</label>
              <input type="text" data-bind="heroHighlight" value="${escapeHtml(draft.heroHighlight || '2025')}" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 text-ucu-blue rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold outline-none">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Description / Subtitle</label>
            <textarea data-bind="heroDescription" rows="2" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-blue outline-none">${escapeHtml(draft.heroDescription || 'Documenting Urdaneta City University’s measurable contributions to the United Nations Sustainable Development Goals through education, research, partnerships, and community-driven initiatives in 2025.')}</textarea>
          </div>
        </div>

        <!-- Section 2: Metrics Cards -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 2</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                <span>Metrics Cards (${metrics.length})</span>
              </h3>
            </div>

            <button type="button" id="btn-add-dashboard-metric" class="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-ucu-blue text-white hover:bg-ucu-blue-dark transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              <span>Add Metric</span>
            </button>
          </div>
          
          <div class="space-y-3">
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
                    
                    <!-- Lucide Icon Trigger Button -->
                    <button 
                      type="button" 
                      data-pick-dashboard-metric-icon="${idx}" 
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
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Value (e.g. 17 / 100% / 1,920)</label>
                      <input type="text" data-metric-field="value" data-metric-index="${idx}" value="${escapeHtml(m.value || '')}" placeholder="e.g. 17" class="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Metric Label</label>
                      <input type="text" data-metric-field="label" data-metric-index="${idx}" value="${escapeHtml(m.label || '')}" placeholder="e.g. UN SDGs Addressed" class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold">
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

                  <button type="button" data-delete-dashboard-metric="${idx}" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-center cursor-pointer" title="Delete Metric">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Section 3: SDG Goal Cards Grid (17 Goals) -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 3</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                <span>SDG Goal Cards Grid (${sdgCards.length})</span>
              </h3>
            </div>
          </div>

          <!-- Quick Filter / Goal Jump Bar -->
          <div class="flex flex-wrap items-center gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span class="text-[10px] font-bold text-slate-500 uppercase mr-1">Filter Goal:</span>
            <button type="button" data-sdg-filter="all" class="px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${this.sdgCardFilter === 'all' ? 'bg-ucu-blue text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'}">All (17)</button>
            ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(n => {
              const isActive = this.sdgCardFilter === String(n);
              const metaColor = SDG_METADATA[n]?.color || '#394a8a';
              return `
                <button type="button" data-sdg-filter="${n}" class="w-7 h-7 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center ${isActive ? 'text-white shadow-sm ring-2 ring-offset-1 ring-slate-400' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}" style="${isActive ? `background-color: ${metaColor};` : ''}">${n}</button>
              `;
            }).join('')}
          </div>

          <div class="space-y-4">
            ${filteredCards.map(({ card, idx }) => {
              const goalNumber = card.goalNum || (idx + 1);
              const cardColor = card.color || SDG_METADATA[goalNumber]?.color || '#394a8a';
              return `
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition-all">
                  <div class="flex items-center justify-between gap-3 pb-2 border-b border-slate-200">
                    <div class="flex items-center gap-2.5">
                      <span class="w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center shadow-xs" style="background-color: ${cardColor};">
                        ${goalNumber}
                      </span>
                      <span class="text-xs font-bold text-slate-800">SDG ${goalNumber}: ${escapeHtml(card.title || '')}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Goal Number</label>
                      <input type="text" data-sdgcard-field="goalNum" data-sdgcard-index="${idx}" value="${escapeHtml(card.goalNum || '')}" class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold outline-none">
                    </div>
                    <div class="lg:col-span-3">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Goal Title</label>
                      <input type="text" data-sdgcard-field="title" data-sdgcard-index="${idx}" value="${escapeHtml(card.title || '')}" class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold outline-none">
                    </div>
                  </div>

                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description / Subtitle</label>
                    <textarea data-sdgcard-field="subtitle" data-sdgcard-index="${idx}" rows="2" class="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue leading-relaxed outline-none">${escapeHtml(card.subtitle || '')}</textarea>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <!-- Background Image Upload -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Background Image</label>
                      <div class="single-image-uploader-zone" data-target-type="sdgCard" data-target-index="${idx}" data-target-prop="bgImg">
                        ${card.bgImg ? `
                          <div class="single-image-preview relative w-full h-24 rounded-lg overflow-hidden border border-slate-300 bg-slate-900 group shadow-2xs cursor-pointer hover:border-ucu-blue transition-all" title="Click or drag new image to replace">
                            <input type="file" accept="image/*" class="hidden single-file-input">
                            <img src="${card.bgImg}" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-bold">
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span>Click or drop to replace</span>
                            </div>
                            <button type="button" data-replace-single-image class="absolute top-1.5 right-1.5 bg-slate-900/90 hover:bg-ucu-blue text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all border border-white/20" title="Replace Background Image">
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span>Replace</span>
                            </button>
                          </div>
                        ` : `
                          <div class="single-dropzone border-2 border-dashed border-slate-300 rounded-lg p-3 text-center cursor-pointer hover:border-ucu-blue bg-white transition-colors">
                            <input type="file" accept="image/*" class="hidden single-file-input">
                            <div class="flex flex-col items-center justify-center gap-1 py-2 text-slate-400 hover:text-slate-600">
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span class="text-[11px] font-medium">Click or drag background image to upload</span>
                            </div>
                          </div>
                        `}
                      </div>
                    </div>

                    <!-- SDG Logo / Icon Upload -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">SDG Logo / Icon</label>
                      <div class="single-image-uploader-zone" data-target-type="sdgCard" data-target-index="${idx}" data-target-prop="logoImg">
                        ${card.logoImg ? `
                          <div class="single-image-preview relative w-full h-24 rounded-lg overflow-hidden border border-slate-300 bg-slate-50 flex items-center justify-center p-2 group shadow-2xs cursor-pointer hover:border-ucu-blue transition-all" title="Click or drag new logo to replace">
                            <input type="file" accept="image/*" class="hidden single-file-input">
                            <img src="${card.logoImg}" class="max-h-full max-w-full object-contain">
                            <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-bold">
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span>Click or drop to replace</span>
                            </div>
                            <button type="button" data-replace-single-image class="absolute top-1.5 right-1.5 bg-slate-900/90 hover:bg-ucu-blue text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all border border-white/20" title="Replace SDG Logo">
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span>Replace</span>
                            </button>
                          </div>
                        ` : `
                          <div class="single-dropzone border-2 border-dashed border-slate-300 rounded-lg p-3 text-center cursor-pointer hover:border-ucu-blue bg-white transition-colors">
                            <input type="file" accept="image/*" class="hidden single-file-input">
                            <div class="flex flex-col items-center justify-center gap-1 py-2 text-slate-400 hover:text-slate-600">
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span class="text-[11px] font-medium">Click or drag logo icon to upload</span>
                            </div>
                          </div>
                        `}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  }

  /**
   * System Settings & Cloud Connection Form Builder
   */
  buildSettingsForm() {
    const cfg = getFirebaseConfig();
    const isConfigured = isFirebaseConfigured();

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn max-w-4xl">
        <div class="pb-6 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">System</span>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${isConfigured ? '🟢 Live Firestore Connected' : '🟡 Local / Demo Mode Active'}
            </span>
          </div>
          <h2 class="text-xl font-bold text-slate-800">Firebase Cloud Configuration &amp; Database Migration</h2>
        </div>

        <!-- 1-Click Database Seeder & Migration Card -->
        <div class="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-ucu-blue-dark to-slate-900 text-white shadow-xl space-y-4 border border-white/10 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-ucu-yellow/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="flex items-start justify-between gap-4 relative z-10">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ucu-yellow/20 text-ucu-yellow text-[10px] font-bold uppercase tracking-wider mb-2">
                ⚡ Initial Setup &amp; Bulk Migration
              </div>
              <h3 class="text-lg font-black tracking-tight">One-Click Database Seeder &amp; Content Migration</h3>
              <p class="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Scan all 17 SDG reports, rankings, events, 50+ institutional partners, research papers, and indicator registries from the current website and upload them directly into your Cloud Firestore database.
              </p>
            </div>
            
            <button type="button" id="btn-run-seeder" class="px-6 py-3 bg-ucu-yellow text-ucu-blue-dark font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-lg hover:shadow-ucu-yellow/20 flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <span id="seeder-btn-icon">🚀</span>
              <span id="seeder-btn-text">Seed / Migrate All Data</span>
            </button>
          </div>

          <!-- Progress Bar & Status Feed -->
          <div id="seeder-progress-container" class="hidden space-y-2 pt-3 border-t border-white/10 relative z-10">
            <div class="flex justify-between text-xs font-mono text-slate-300">
              <span id="seeder-status-msg">Initializing migration...</span>
              <span id="seeder-status-percent" class="font-bold text-ucu-yellow">0%</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div id="seeder-progress-bar" class="bg-gradient-to-r from-ucu-yellow to-emerald-400 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs leading-relaxed text-blue-900">
          <p class="font-bold mb-1">ℹ️ Active Firebase Credentials</p>
          <p>The CMS is currently connected to project <strong>${escapeHtml(cfg.projectId || 'sdg-web-d07ac')}</strong>. All edits and publications are synchronized live across the database.</p>
        </div>

        <form id="firebase-config-form" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Firebase Project ID</label>
              <input type="text" id="cfg-projectId" value="${escapeHtml(cfg.projectId || '')}" placeholder="e.g. ucu-sdg-portal" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">API Key</label>
              <input type="text" id="cfg-apiKey" value="${escapeHtml(cfg.apiKey || '')}" placeholder="AIzaSy..." class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Auth Domain</label>
              <input type="text" id="cfg-authDomain" value="${escapeHtml(cfg.authDomain || '')}" placeholder="ucu-sdg-portal.firebaseapp.com" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Storage Bucket</label>
              <input type="text" id="cfg-storageBucket" value="${escapeHtml(cfg.storageBucket || '')}" placeholder="ucu-sdg-portal.appspot.com" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Messaging Sender ID</label>
              <input type="text" id="cfg-messagingSenderId" value="${escapeHtml(cfg.messagingSenderId || '')}" placeholder="1234567890" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">App ID</label>
              <input type="text" id="cfg-appId" value="${escapeHtml(cfg.appId || '')}" placeholder="1:1234567890:web:abcdef" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
          </div>

          <div class="pt-4 flex items-center justify-between border-t border-slate-200">
            <button type="button" id="btn-reset-config" class="px-4 py-2 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
              Reset to Defaults
            </button>
            <button type="submit" class="px-6 py-2 text-xs font-bold rounded-lg bg-ucu-blue-dark text-white hover:bg-ucu-red transition-colors shadow-md cursor-pointer">
              Save &amp; Connect Firebase
            </button>
          </div>
        </form>
      </div>
    `;
  }
}
