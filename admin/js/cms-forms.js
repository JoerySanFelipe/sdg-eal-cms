import { cmsState, SDG_METADATA, INDICATOR_PILLARS } from './cms-state.js';
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

export class CMSForms {
  constructor(containerElement) {
    this.container = containerElement;
    this.boundDraft = null;
    this.announcementFilter = {
      preset: 'all', // default to showing all with quick 7days / 30days / 2025 filters
      keyword: '',
      fromDate: '',
      toDate: ''
    };
    window.cmsForms = this;
  }

  /**
   * Helper: Resolve relative image src paths for Admin Studio context
   */
  resolveAdminImageSrc(src) {
    if (!src) return '';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
      return src;
    }
    if (src.startsWith('../')) return src;
    if (src.startsWith('./')) return '../' + src.slice(2);
    return '../' + src;
  }

  /**
   * Render the form for current active CMS section
   */
  render() {
    if (!this.container) return;

    const { type, id, year } = cmsState.activeSection;
    const draft = cmsState.currentDraft || {};
    this.boundDraft = draft;

    let html = '';

    if (type === 'sdg') {
      html = sdgReportsManager.render(id, year, draft);
    } else if (type === 'home') {
      html = homeManager.render(draft);
    } else if (type === 'sdg_dashboard') {
      html = this.buildSdgDashboardForm(draft);
    } else if (type === 'impact' || type === 'events') {
      html = eventsManager.render(draft);
    } else if (type === 'research') {
      html = researchManager.render(draft);
    } else if (type === 'rankings') {
      html = rankingsManager.render(draft);
    } else if (type === 'partnership') {
      html = partnershipsManager.render(draft);
    } else if (type === 'smarteco' || type === 'smart_eco') {
      html = smartEcoManager.render(draft);
    } else if (type === 'announcement' || type === 'announcements') {
      html = announcementsManager.render(draft);
    } else if (type === 'indicator') {
      html = indicatorsManager.render(id, draft);
    } else if (type === 'settings') {
      html = this.buildSettingsForm();
    } else {
      html = `<div class="p-8 text-center text-slate-400">Select a section from the left navigation to edit content.</div>`;
    }

    this.container.innerHTML = html;
    this.bindEvents();
  }

  /**
   * 1. SDG Narrative Form Builder
   */
  buildSdgForm(sdgNum, year, draft) {
    const meta = SDG_METADATA[sdgNum] || { title: `SDG ${sdgNum}`, subtitle: "", color: "#394a8a" };
    const metrics = draft.metrics || [];
    const sections = draft.sections || [];

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        
        <!-- Header Banner -->
        <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md" style="background-color: ${draft.colorHex || meta.color};">
              ${sdgNum}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500">SDG ${sdgNum} Narrative</span>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-ucu-blue-dark">Year ${year}</span>
              </div>
              <h2 class="text-xl font-bold text-slate-800">${draft.title || meta.title}</h2>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <label class="text-xs font-semibold text-slate-600">Year Archive:</label>
            <select id="sdg-year-select" class="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm focus:ring-2 focus:ring-ucu-blue">
              <option value="2025" ${year === '2025' ? 'selected' : ''}>2025 (Current)</option>
              <option value="2024" ${year === '2024' ? 'selected' : ''}>2024</option>
              <option value="2023" ${year === '2023' ? 'selected' : ''}>2023</option>
            </select>
          </div>
        </div>

        <!-- Hero Properties -->
        <div class="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <span>🎨</span> Hero Banner &amp; Visual Identity
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">SDG Goal Title</label>
              <input type="text" data-bind="title" value="${this.escape(draft.title || meta.title)}" class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue focus:border-transparent">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Hero Subtitle / UN Descriptor</label>
              <input type="text" data-bind="subtitle" value="${this.escape(draft.subtitle || meta.subtitle)}" class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue focus:border-transparent">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Official Brand Color (Hex)</label>
              <div class="flex items-center gap-2">
                <input type="color" data-bind="colorHex" value="${draft.colorHex || meta.color}" class="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer">
                <input type="text" data-bind="colorHex" value="${draft.colorHex || meta.color}" class="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-mono">
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Hero Background Image Path</label>
              <input type="text" data-bind="heroBgImage" value="${this.escape(draft.heroBgImage || `../images/sdg-banner/sdg${sdgNum}.jpg`)}" class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-mono text-xs">
            </div>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>📝</span> Executive Summary / Lead Narrative
            </label>
            <span class="text-[11px] text-slate-400">Appears directly below key metrics</span>
          </div>
          <textarea data-bind="executiveSummary" rows="4" class="w-full p-3.5 text-sm bg-white border border-slate-300 rounded-xl leading-relaxed text-slate-800 focus:ring-2 focus:ring-ucu-blue focus:border-transparent">${this.escape(draft.executiveSummary || '')}</textarea>
        </div>

        <!-- Key Metrics Cards Builder -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>📊</span> Top Impact Metrics Cards (${metrics.length})
            </h3>
            <button type="button" id="btn-add-metric" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-ucu-blue text-white hover:bg-ucu-blue-dark transition-colors flex items-center gap-1.5 shadow-sm">
              <span>+ Add Metric</span>
            </button>
          </div>

          <div class="space-y-3" id="metrics-container">
            ${metrics.map((m, idx) => `
              <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4 transition-all hover:border-slate-300">
                <div class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  #${idx + 1}
                </div>
                
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-0.5">Value (e.g. 1,920 / ₱2.4M)</label>
                    <input type="text" data-metric-field="value" data-metric-index="${idx}" value="${this.escape(m.value || '')}" class="w-full px-3 py-1.5 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-0.5">Metric Label</label>
                    <input type="text" data-metric-field="label" data-metric-index="${idx}" value="${this.escape(m.label || '')}" class="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-0.5">Theme Accent</label>
                    <select data-metric-field="theme" data-metric-index="${idx}" class="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                      <option value="navy" ${m.theme === 'navy' ? 'selected' : ''}>Navy (Institutional)</option>
                      <option value="red" ${m.theme === 'red' ? 'selected' : ''}>Red (Accent)</option>
                      <option value="white" ${m.theme === 'white' ? 'selected' : ''}>White / Clean</option>
                    </select>
                  </div>
                </div>

                <button type="button" data-delete-metric="${idx}" class="p-2 text-slate-400 hover:text-red-500 transition-colors self-end md:self-center" title="Delete Metric">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Narrative Subsections (Accordions) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>📑</span> Narrative Sub-Sections &amp; Accordions (${sections.length})
            </h3>
            <button type="button" id="btn-add-section" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-ucu-blue text-white hover:bg-ucu-blue-dark transition-colors flex items-center gap-1.5 shadow-sm">
              <span>+ Add Sub-Section</span>
            </button>
          </div>

          <div class="space-y-4" id="sections-container">
            ${sections.map((sec, sIdx) => `
              <div class="p-5 bg-white border-2 border-slate-200 rounded-xl space-y-4 shadow-sm hover:border-slate-300 transition-all">
                <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div class="flex items-center gap-2 flex-1">
                    <span class="w-6 h-6 rounded-md bg-ucu-red text-white flex items-center justify-center text-xs font-bold">${sIdx + 1}</span>
                    <input type="text" data-section-title="${sIdx}" value="${this.escape(sec.title || '')}" placeholder="Sub-section Title (H2)" class="w-full px-3 py-1.5 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                  </div>
                  <button type="button" data-delete-section="${sIdx}" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete Section">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-1">Body Text Paragraphs (Separate multiple paragraphs with empty lines)</label>
                  <textarea data-section-prose="${sIdx}" rows="5" placeholder="Enter paragraph narrative here..." class="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-blue">${this.escape(Array.isArray(sec.paragraphs) ? sec.paragraphs.join('\n\n') : (sec.paragraphs || ''))}</textarea>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Linked Event Modal Trigger ID (Optional)</label>
                    <input type="text" data-section-modal="${sIdx}" value="${this.escape(sec.eventModalId || '')}" placeholder="e.g. kalahi-cidss" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-mono">
                  </div>
                </div>

                <!-- Sub-Section Modular Content Blocks (Option B) -->
                ${this.renderBlockBuilder(sec.blocks || [], 'sdg', sIdx)}
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }

  /**
   * 2. Homepage Form Builder
   */
  buildHomeForm(draft) {
    const metrics = draft.metrics || [
      { label: "Total Events", value: "48", id: "totalEvents" },
      { label: "Research & Pubs", value: "124", id: "totalResearch" },
      { label: "Univ Rankings", value: "6", id: "universityRankings" },
      { label: "Local Partners", value: "85", id: "localPartners" },
      { label: "Global Partners", value: "24", id: "globalPartners" },
      { label: "Active MOUs", value: "42", id: "activeMous" }
    ];

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        <div class="pb-6 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Page Content</span>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-ucu-blue-dark">Landing Gateway</span>
          </div>
          <h2 class="text-xl font-bold text-slate-800">Homepage &amp; Global Banners</h2>
          <!-- 1. Hero Configuration -->
        <div class="bg-slate-900 p-5 rounded-2xl border border-slate-700 space-y-4">
          <div class="flex items-center gap-3 mb-2 border-b border-slate-800 pb-3">
            <span class="px-2 py-0.5 rounded-full bg-ucu-yellow text-ucu-blue-dark text-[10px] font-bold uppercase tracking-wider">Hero</span>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200">🖼️ Image Slider</h3>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-[11px] font-semibold text-slate-400 mb-1">Hero Slider Images (Drag & Drop to Upload)</label>
              <div class="image-uploader-zone" data-uploader-field="sliderImages">
                <div class="dropzone border-2 border-dashed border-slate-500 rounded-lg p-6 text-center cursor-pointer hover:border-ucu-yellow transition-colors relative">
                  <input type="file" multiple accept="image/*" class="hidden file-input">
                  <span class="text-slate-400 text-xs">Drag & drop images here or click to browse</span>
                </div>
                <div class="preview-container mt-4 flex flex-wrap gap-2">
                  ${(draft.sliderImages || []).map((url, i) => `
                    <div class="relative group w-20 h-20 rounded-md overflow-hidden border border-slate-600 bg-slate-800">
                      <img src="${url}" class="w-full h-full object-cover">
                      <button data-uploader-remove="${i}" class="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-100 transition-opacity">&times;</button>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- 2. Headline Section -->
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>🎯</span> Headline
          </h3>
          
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Eyebrow Badge</label>
                <input type="text" data-bind="commitmentEyebrow" value="${this.escape(draft.commitmentEyebrow || 'Our Commitment')}" class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Section Title</label>
                <input type="text" data-bind="commitmentTitle" value="${this.escape(draft.commitmentTitle || 'Global Standards, Local Impact')}" class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold">
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Narrative Paragraph 1</label>
              <textarea data-bind="introParagraph1" rows="3" class="w-full p-3 text-sm bg-white border border-slate-300 rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-blue">${this.escape(draft.introParagraph1 || 'Urdaneta City University stands at the intersection of international academic excellence and localized sustainable development. We are committed to dismantling geographical boundaries through strategic global linkages, robust research collaboration, and an unwavering dedication to the United Nations Agenda 2030.')}</textarea>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Narrative Paragraph 2 (Optional)</label>
              <textarea data-bind="introParagraph2" rows="3" class="w-full p-3 text-sm bg-white border border-slate-300 rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-blue">${this.escape(draft.introParagraph2 || 'By forging active partnerships across multiple continents, we subject our academic frameworks to rigorous global evaluations. This international exposure translates into cutting-edge pedagogy and facilities, empowering our External Office to drive true socio-economic mobility through evidence-based community outreach.')}</textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Headline Slider Images (Drag & Drop to Upload, max 5)</label>
              <div class="image-uploader-zone" data-uploader-field="headlineSliders">
                <div class="dropzone border-2 border-dashed border-slate-300 bg-white rounded-lg p-6 text-center cursor-pointer hover:border-ucu-blue transition-colors relative">
                  <input type="file" multiple accept="image/*" class="hidden file-input">
                  <span class="text-slate-400 text-xs">Drag & drop images here or click to browse</span>
                </div>
                <div class="preview-container mt-4 flex flex-wrap gap-2">
                  ${(draft.headlineSliders || []).map((url, i) => `
                    <div class="relative group w-20 h-20 rounded-md overflow-hidden border border-slate-300 bg-white">
                      <img src="${url}" class="w-full h-full object-cover">
                      <button data-uploader-remove="${i}" class="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-100 transition-opacity">&times;</button>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Stat Numbers -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>📊</span> Stat Numbers (${metrics.length})
            </h3>
            <span class="text-[11px] text-slate-400">Animated counters on viewport entry</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Metrics Eyebrow Badge</label>
              <input type="text" data-bind="metricsEyebrow" value="${this.escape(draft.metricsEyebrow || 'Institutional Impact')}" class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Metrics Section Title</label>
              <input type="text" data-bind="metricsTitle" value="${this.escape(draft.metricsTitle || 'Stat Numbers')}" class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold">
            </div>
          </div>
          
          <div class="space-y-3">
            ${metrics.map((m, idx) => `
              <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4 transition-all hover:border-slate-300">
                <div class="w-8 h-8 shrink-0 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  #${idx + 1}
                </div>
                
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-0.5">Value</label>
                    <input type="text" data-metric-field="value" data-metric-index="${idx}" value="${this.escape(m.value || '')}" class="w-full px-3 py-1.5 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-0.5">Metric Label</label>
                    <input type="text" data-metric-field="label" data-metric-index="${idx}" value="${this.escape(m.label || '')}" class="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-0.5">Theme</label>
                    <select data-metric-field="theme" data-metric-index="${idx}" class="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                      <option value="navy" ${m.theme === 'navy' ? 'selected' : ''}>Navy (Institutional)</option>
                      <option value="red" ${m.theme === 'red' ? 'selected' : ''}>Red (Accent)</option>
                      <option value="white" ${m.theme === 'white' ? 'selected' : ''}>White / Clean</option>
                    </select>
                  </div>
                </div>

                <button type="button" data-delete-metric="${idx}" class="p-2 text-slate-400 hover:text-red-500 transition-colors self-end md:self-center" title="Delete Metric">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 4. Strategic Alliances & Inquiries -->
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>🤝</span> Strategic Alliance &amp; Direct Inquiry Channels
          </h3>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Alliance Section Title</label>
                <input type="text" data-bind="allianceTitle" value="${this.escape(draft.allianceTitle || 'Forge a Strategic Alliance')}" class="w-full px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Partnership Inquiry Google Form URL</label>
                <input type="text" data-bind="partnershipFormUrl" value="${this.escape(draft.partnershipFormUrl || 'https://forms.google.com/your-form-id-here')}" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Alliance Narrative Description</label>
              <textarea data-bind="allianceDescription" rows="3" class="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue leading-relaxed">${this.escape(draft.allianceDescription || 'Urdaneta City University (UCU) actively seeks to expand its global and local network through high-impact institutional linkages. We invite esteemed academic organizations and industry leaders to initialize formal collaboration proposals via our centralized portal.')}</textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Directorate of External Linkages Email</label>
                <input type="email" data-bind="emailExternal" value="${this.escape(draft.emailExternal || 'externalaffairsandlinkages@ucu.edu.ph')}" class="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-medium">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">University General Administration Email</label>
                <input type="email" data-bind="emailOfficial" value="${this.escape(draft.emailOfficial || 'officeofthepresident@ucu.edu.ph')}" class="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-medium">
              </div>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Universal Block-Based Modular Content Builder (Option B: Database Rich Content)
   */
  renderBlockBuilder(blocks = [], targetType, targetIndex) {
    const blockIcons = {
      paragraph: '📝',
      heading: '🏷️',
      image: '🖼️',
      callout: '⭐',
      chart: '📊',
      table: '📋',
      document: '📄'
    };

    const blockLabels = {
      paragraph: 'Paragraph / Rich Text',
      heading: 'Section Heading / Title',
      image: 'Image / Media Figure',
      callout: 'Big Metric Callout Stat',
      chart: 'Data Visualization Chart',
      table: 'Structured Evidence Table',
      document: 'Official Document Download'
    };

    return `
      <div class="p-4 bg-slate-100/90 rounded-2xl border border-slate-200 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>🧩</span> Modal / Narrative Blocks (${blocks.length})
            </h4>
            <p class="text-[10px] text-slate-500 mt-0.5">Build interactive sections with rich text, charts, callouts, and tables</p>
          </div>

          <!-- Add Block Dropdown Menu -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] font-bold text-slate-500 uppercase">+ Add:</span>
            <button type="button" data-add-block="paragraph" data-target-type="${targetType}" data-target-index="${targetIndex}" class="px-2 py-1 text-[11px] font-bold rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer">📝 Text</button>
            <button type="button" data-add-block="heading" data-target-type="${targetType}" data-target-index="${targetIndex}" class="px-2 py-1 text-[11px] font-bold rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer">🏷️ Title</button>
            <button type="button" data-add-block="image" data-target-type="${targetType}" data-target-index="${targetIndex}" class="px-2 py-1 text-[11px] font-bold rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer">🖼️ Image</button>
            <button type="button" data-add-block="callout" data-target-type="${targetType}" data-target-index="${targetIndex}" class="px-2 py-1 text-[11px] font-bold rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer">⭐ Stat</button>
            <button type="button" data-add-block="chart" data-target-type="${targetType}" data-target-index="${targetIndex}" class="px-2 py-1 text-[11px] font-bold rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer">📊 Chart</button>
            <button type="button" data-add-block="table" data-target-type="${targetType}" data-target-index="${targetIndex}" class="px-2 py-1 text-[11px] font-bold rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer">📋 Table</button>
            <button type="button" data-add-block="document" data-target-type="${targetType}" data-target-index="${targetIndex}" class="px-2 py-1 text-[11px] font-bold rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer">📄 PDF</button>
          </div>
        </div>

        <!-- Blocks Stream -->
        <div class="space-y-3">
          ${blocks.length === 0 ? `
            <div class="p-6 text-center bg-white border border-dashed border-slate-300 rounded-xl text-slate-400">
              <p class="text-xs font-semibold">No content blocks added yet. Click any button above to build this view.</p>
            </div>
          ` : blocks.map((block, bIdx) => {
            const icon = blockIcons[block.type] || '📦';
            const label = blockLabels[block.type] || 'Content Block';

            return `
              <div class="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs hover:border-slate-300 transition-all">
                
                <!-- Block Control Header -->
                <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <span class="text-sm">${icon}</span>
                    <span class="text-xs font-bold text-slate-800">${label} <span class="text-slate-400 font-mono text-[10px]">#${bIdx + 1}</span></span>
                  </div>

                  <div class="flex items-center gap-1">
                    <button type="button" data-move-block="up" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" ${bIdx === 0 ? 'disabled' : ''} class="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100 cursor-pointer" title="Move Up">
                      🔼
                    </button>
                    <button type="button" data-move-block="down" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" ${bIdx === blocks.length - 1 ? 'disabled' : ''} class="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100 cursor-pointer" title="Move Down">
                      🔽
                    </button>
                    <button type="button" data-delete-block="${bIdx}" data-target-type="${targetType}" data-target-index="${targetIndex}" class="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer" title="Delete Block">
                      ❌
                    </button>
                  </div>
                </div>

                <!-- Block Specific Form Inputs -->
                ${this.renderBlockFields(block, targetType, targetIndex, bIdx)}

              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderBlockFields(block, targetType, targetIndex, bIdx) {
    if (block.type === 'paragraph' || block.type === 'text') {
      return `
        <div>
          <!-- Micro-Toolbar -->
          <div class="flex items-center gap-1.5 mb-1.5 p-1 bg-slate-50 border border-slate-200 rounded-lg">
            <button type="button" data-toolbar-btn="bold" data-target-textarea="block-text-${targetType}-${targetIndex}-${bIdx}" class="px-2 py-0.5 text-xs font-black rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer" title="Bold">B</button>
            <button type="button" data-toolbar-btn="italic" data-target-textarea="block-text-${targetType}-${targetIndex}-${bIdx}" class="px-2 py-0.5 text-xs italic font-serif font-bold rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer" title="Italic">I</button>
            <button type="button" data-toolbar-btn="link" data-target-textarea="block-text-${targetType}-${targetIndex}-${bIdx}" class="px-2 py-0.5 text-xs font-bold rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer" title="Link">🔗 Link</button>
            <button type="button" data-toolbar-btn="list" data-target-textarea="block-text-${targetType}-${targetIndex}-${bIdx}" class="px-2 py-0.5 text-xs font-bold rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer" title="Bullet List">• List</button>
          </div>
          <textarea id="block-text-${targetType}-${targetIndex}-${bIdx}" data-block-field="content" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" rows="3" placeholder="Write formatted text..." class="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue leading-relaxed font-sans">${this.escape(block.content || block.text || '')}</textarea>
        </div>
      `;
    }

    if (block.type === 'heading') {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Heading Level</label>
            <select data-block-field="level" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" class="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg">
              <option value="h2" ${block.level === 'h2' ? 'selected' : ''}>H2 (Major Milestone)</option>
              <option value="h3" ${block.level === 'h3' ? 'selected' : ''}>H3 (Sub-Topic)</option>
            </select>
          </div>
          <div class="sm:col-span-3">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Heading Title</label>
            <input type="text" data-block-field="title" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(block.title || block.text || '')}" placeholder="e.g. Community Livelihood Framework" class="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue text-slate-800">
          </div>
        </div>
      `;
    }

    if (block.type === 'image') {
      return `
        <div class="space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Image Path / URL</label>
              <input type="text" data-block-field="src" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(block.src || '')}" placeholder="images/events/... or https://..." class="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max Height</label>
              <input type="text" data-block-field="maxHeight" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(block.maxHeight || '500px')}" placeholder="500px" class="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg">
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descriptive Caption</label>
            <input type="text" data-block-field="caption" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(block.caption || '')}" placeholder="Caption describing verified evidence..." class="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-medium">
          </div>
        </div>
      `;
    }

    if (block.type === 'callout') {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Big Stat / Value</label>
            <input type="text" data-block-field="value" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(block.value || '')}" placeholder="e.g. 39 or 92%" class="w-full px-2.5 py-1.5 text-xs font-black text-ucu-blue-dark bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue text-center">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stat Label</label>
            <input type="text" data-block-field="label" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(block.label || '')}" placeholder="Campus Buildings" class="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
          </div>
          <div class="sm:col-span-2">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Narrative Description</label>
            <textarea data-block-field="description" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" rows="1" placeholder="Detailed explanation..." class="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-blue">${this.escape(block.description || '')}</textarea>
          </div>
        </div>
      `;
    }

    if (block.type === 'chart') {
      const template = block.chartType || 'progress';
      const payload = Array.isArray(block.payload) ? block.payload : [];

      return `
        <div class="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">📊 Chart Template</label>
              <select data-block-field="chartType" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" class="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg">
                <option value="progress" ${template === 'progress' ? 'selected' : ''}>📊 Horizontal Progress Bars</option>
                <option value="vertical" ${template === 'vertical' ? 'selected' : ''}>📈 Vertical YoY Bars</option>
                <option value="stacked" ${template === 'stacked' ? 'selected' : ''}>🥞 Stacked Distribution Bar</option>
                <option value="donut" ${template === 'donut' ? 'selected' : ''}>🍰 Donut / Pie Chart</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chart Title</label>
              <input type="text" data-block-field="title" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(block.title || '')}" placeholder="e.g. Success Rates" class="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subtitle</label>
              <input type="text" data-block-field="subtitle" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(block.subtitle || '')}" placeholder="e.g. Target vs Actual" class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg">
            </div>
          </div>

          <!-- Chart Items Repeater -->
          <div class="space-y-2 pt-2 border-t border-slate-200">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Points (${payload.length})</span>
              <button type="button" data-add-chart-item="${bIdx}" data-target-type="${targetType}" data-target-index="${targetIndex}" class="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded cursor-pointer">+ Add Data Point</button>
            </div>

            <div class="space-y-2">
              ${payload.map((item, pIdx) => `
                <div class="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                  <input type="text" data-chart-item-field="label" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" data-payload-index="${pIdx}" value="${this.escape(item.label || item.year || '')}" placeholder="Label / Year" class="flex-1 px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded font-medium">
                  <input type="number" data-chart-item-field="percentage" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" data-payload-index="${pIdx}" value="${item.percentage || item.value || ''}" placeholder="Value / %" class="w-20 px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded font-black text-ucu-blue-dark text-center">
                  <button type="button" data-delete-chart-item="${pIdx}" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" class="text-slate-400 hover:text-red-500 text-xs p-1" title="Remove point">❌</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (block.type === 'table') {
      const headers = Array.isArray(block.headers) ? block.headers.join(', ') : (block.headers || '');
      const rows = Array.isArray(block.rows) ? block.rows : [];

      return `
        <div class="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Column Headers <span class="font-normal text-slate-400">(comma-separated)</span></label>
            <input type="text" data-block-field="headersCsv" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(headers)}" placeholder="Image, Facility Name, Description, Date" class="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg">
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Table Rows (${rows.length})</span>
              <button type="button" data-add-table-row="${bIdx}" data-target-type="${targetType}" data-target-index="${targetIndex}" class="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded cursor-pointer">+ Add Row</button>
            </div>

            <div class="space-y-2">
              ${rows.map((row, rIdx) => `
                <div class="p-2 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                  <span class="text-[10px] font-bold text-slate-400 w-5">#${rIdx + 1}</span>
                  <input type="text" data-table-row-field="cells" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" data-row-index="${rIdx}" value="${this.escape(Array.isArray(row) ? row.join(' | ') : row)}" placeholder="Col 1 | Col 2 | Col 3 | Col 4" class="flex-1 px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded font-medium font-mono">
                  <button type="button" data-delete-table-row="${rIdx}" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" class="text-slate-400 hover:text-red-500 text-xs p-1" title="Remove row">❌</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (block.type === 'document') {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Document Label / Title</label>
            <input type="text" data-block-field="label" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(block.label || '')}" placeholder="e.g. Campus Master Development Plan (PDF)" class="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">File URL / Document Path</label>
            <input type="text" data-block-field="url" data-target-type="${targetType}" data-target-index="${targetIndex}" data-block-index="${bIdx}" value="${this.escape(block.url || '')}" placeholder="documents/plan.pdf or https://..." class="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
          </div>
        </div>
      `;
    }

    return '';
  }

  /**
   * Helper: Reusable Hero Banner Fields Builder
   */
  buildHeroFields(draft, defaultEyebrow = "", defaultHeadline = "", defaultHighlight = "", defaultDesc = "") {
    return `
      <div class="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div class="flex items-center gap-2 pb-2 border-b border-slate-800">
          <span class="px-2 py-0.5 rounded-full bg-ucu-yellow text-ucu-blue-dark text-[10px] font-bold uppercase tracking-wider">Top Banner</span>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-200">🖼️ Hero Banner &amp; Header</h3>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Eyebrow Badge</label>
            <input type="text" data-bind="heroEyebrow" value="${this.escape(draft.heroEyebrow || defaultEyebrow)}" class="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-ucu-yellow">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Headline Text</label>
            <input type="text" data-bind="heroHeadline" value="${this.escape(draft.heroHeadline || defaultHeadline)}" class="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-ucu-yellow font-bold">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Highlight Word / Year</label>
            <input type="text" data-bind="heroHighlight" value="${this.escape(draft.heroHighlight || defaultHighlight)}" class="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-ucu-yellow rounded-lg focus:ring-2 focus:ring-ucu-yellow font-bold">
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Description / Subtitle</label>
          <textarea data-bind="heroDescription" rows="2" class="w-full p-2.5 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-yellow">${this.escape(draft.heroDescription || defaultDesc)}</textarea>
        </div>
      </div>
    `;
  }

  /**
   * Helper: Reusable Metric Cards Fields Builder
   */
  buildMetricCardsFields(metrics = [], title = "Metric Cards") {
    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>📊</span> ${title} (${metrics.length})
          </h3>
          <span class="text-[11px] text-slate-400">Animated counters on viewport entry</span>
        </div>
        
        <div class="space-y-3">
          ${metrics.map((m, idx) => `
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4 transition-all hover:border-slate-300">
              <div class="w-8 h-8 shrink-0 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                #${idx + 1}
              </div>
              
              <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-0.5">Value</label>
                  <input type="text" data-metric-field="value" data-metric-index="${idx}" value="${this.escape(m.value || '')}" class="w-full px-3 py-1.5 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-0.5">Metric Label</label>
                  <input type="text" data-metric-field="label" data-metric-index="${idx}" value="${this.escape(m.label || '')}" class="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-0.5">Theme</label>
                  <select data-metric-field="theme" data-metric-index="${idx}" class="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                    <option value="navy" ${m.theme === 'navy' ? 'selected' : ''}>Navy (Institutional)</option>
                    <option value="red" ${m.theme === 'red' ? 'selected' : ''}>Red (Accent)</option>
                    <option value="white" ${m.theme === 'white' ? 'selected' : ''}>White / Clean</option>
                  </select>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 3A. SDG Dashboard Form Builder (sdg-reports/2025.html)
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
              <input type="text" data-bind="heroEyebrow" value="${this.escape(draft.heroEyebrow || 'Local Action. Global Impact.')}" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-ucu-blue outline-none">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Headline Text</label>
              <input type="text" data-bind="heroHeadline" value="${this.escape(draft.heroHeadline || 'SDG Reports')}" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold outline-none">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Highlight Word / Year</label>
              <input type="text" data-bind="heroHighlight" value="${this.escape(draft.heroHighlight || '2025')}" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 text-ucu-blue rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold outline-none">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Description / Subtitle</label>
            <textarea data-bind="heroDescription" rows="2" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-blue outline-none">${this.escape(draft.heroDescription || 'Documenting Urdaneta City University’s measurable contributions to the United Nations Sustainable Development Goals through education, research, partnerships, and community-driven initiatives in 2025.')}</textarea>
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
                      <input type="text" data-metric-field="value" data-metric-index="${idx}" value="${this.escape(m.value || '')}" placeholder="e.g. 17" class="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Metric Label</label>
                      <input type="text" data-metric-field="label" data-metric-index="${idx}" value="${this.escape(m.label || '')}" placeholder="e.g. UN SDGs Addressed" class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold">
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
                      <span class="text-xs font-bold text-slate-800">SDG ${goalNumber}: ${this.escape(card.title || '')}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Goal Number</label>
                      <input type="text" data-sdgcard-field="goalNum" data-sdgcard-index="${idx}" value="${this.escape(card.goalNum || '')}" class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold outline-none">
                    </div>
                    <div class="lg:col-span-3">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Goal Title</label>
                      <input type="text" data-sdgcard-field="title" data-sdgcard-index="${idx}" value="${this.escape(card.title || '')}" class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold outline-none">
                    </div>
                  </div>

                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description / Subtitle</label>
                    <textarea data-sdgcard-field="subtitle" data-sdgcard-index="${idx}" rows="2" class="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue leading-relaxed outline-none">${this.escape(card.subtitle || '')}</textarea>
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
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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
   * 3B. Impact & Events Form Builder (impact.html)
   */
  buildImpactForm(draft) {
    const metrics = draft.metrics || [];
    const eventsList = draft.eventsList || [];

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Public Web Page</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-ucu-blue-dark">Engagements</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">Impact &amp; Events Documentation</h2>
            <p class="text-xs text-slate-500 mt-0.5">Manage community outreach events, institutional milestones, and impact metrics</p>
          </div>
          <button type="button" id="btn-add-event" class="px-4 py-2 text-xs font-bold rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white transition-colors flex items-center gap-2 shadow-sm shrink-0 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ Add Engagement Event</span>
          </button>
        </div>

        ${this.buildHeroFields(draft, "News & Documentation", "Impact & Events", "Engagements.", "Documenting UCU's institutional milestones, community engagements, and sustainable development initiatives.")}

        <div class="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          ${this.buildMetricCardsFields(metrics, "Impact Metric Cards (4)")}
        </div>

        <!-- Events & Engagements Manager -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>📅</span> Institutional Events &amp; Engagements (${eventsList.length})
              </h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Activities displayed on the public timeline feed with interactive modal views</p>
            </div>
          </div>

          <div class="space-y-6" id="events-container">
            ${eventsList.length === 0 ? `
              <div class="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                <p class="text-xs font-semibold text-slate-500">No events found. Click "+ Add Engagement Event" to create one.</p>
              </div>
            ` : eventsList.map((ev, idx) => {
              const currentImg = this.resolveAdminImageSrc(ev.img || '');
              const relatedSdgs = Array.isArray(ev.relatedSdgs) ? ev.relatedSdgs : [];

              return `
                <div class="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-5 shadow-xs hover:border-slate-300 transition-all">
                  
                  <!-- Event Card Header -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div class="flex items-center gap-3">
                      <span class="w-7 h-7 rounded-lg bg-ucu-blue-dark text-white font-black text-xs flex items-center justify-center shadow-xs">#${idx + 1}</span>
                      <span class="text-xs font-bold text-slate-800">${this.escape(ev.title || 'Untitled Event')}</span>
                      ${ev.isHighlights ? `<span class="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-100 text-amber-900 border border-amber-200">⭐ Top Story</span>` : `<span class="px-2 py-0.5 text-[9px] font-bold rounded-full bg-slate-200 text-slate-700">Recent Feed</span>`}
                    </div>
                    <button type="button" data-delete-event="${idx}" class="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-auto cursor-pointer" title="Delete Event">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      <span>Delete</span>
                    </button>
                  </div>

                  <!-- Primary Fields -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="sm:col-span-2">
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Event Title / Headline</label>
                      <input type="text" data-event-field="title" data-event-index="${idx}" value="${this.escape(ev.title || '')}" placeholder="e.g. Community Health Mission..." class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold text-slate-800">
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Date String</label>
                      <input type="text" data-event-field="date" data-event-index="${idx}" value="${this.escape(ev.date || '')}" placeholder="e.g. March 15-22, 2025" class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-semibold">
                    </div>
                  </div>

                  <!-- Narrative Description -->
                  <div>
                    <label class="block text-[11px] font-bold text-slate-600 mb-1">Event Summary Narrative</label>
                    <textarea data-event-field="desc" data-event-index="${idx}" rows="2" placeholder="Brief summary of institutional engagement..." class="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue leading-relaxed">${this.escape(ev.desc || '')}</textarea>
                  </div>

                  <!-- Cover Photo Uploader -->
                  <div>
                    <label class="block text-[11px] font-bold text-slate-600 mb-1">Event Cover Photo</label>
                    <div class="single-image-uploader-zone" data-target-type="event" data-target-index="${idx}" data-target-prop="img">
                      ${currentImg ? `
                        <div class="single-image-preview relative w-full h-28 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 group shadow-xs cursor-pointer hover:border-ucu-blue transition-all" title="Click or drag new image to replace">
                          <input type="file" accept="image/*" class="hidden single-file-input">
                          <img src="${currentImg}" class="w-full h-full object-cover">
                          <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-ucu-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            <span>Click or drop new photo</span>
                          </div>
                          <button type="button" data-replace-single-image class="absolute top-2 right-2 bg-slate-900/90 hover:bg-ucu-blue text-white px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-md transition-all border border-white/20" title="Replace Photo">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-ucu-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            <span>Replace</span>
                          </button>
                        </div>
                      ` : `
                        <div class="single-dropzone border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-ucu-blue bg-white transition-colors">
                          <input type="file" accept="image/*" class="hidden single-file-input">
                          <div class="flex flex-col items-center justify-center gap-1 py-2 text-slate-400 hover:text-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span class="text-xs font-semibold">Click or drag event image to upload</span>
                          </div>
                        </div>
                      `}
                    </div>
                  </div>

                  <!-- Related SDGs (1-17) -->
                  <div>
                    <label class="block text-[11px] font-bold text-slate-600 mb-1.5">Related SDG Alignments</label>
                    <div class="flex flex-wrap gap-1.5 p-3 bg-white border border-slate-300 rounded-xl">
                      ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(num => {
                        const active = relatedSdgs.includes(num);
                        return `
                          <button type="button" data-event-sdg="${num}" data-event-index="${idx}" class="w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${active ? 'bg-ucu-blue-dark text-white shadow-xs font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                            ${num}
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- Flags & Details -->
                  <div class="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex flex-wrap items-center gap-4">
                      <label class="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" data-event-field="isHighlights" data-event-index="${idx}" ${ev.isHighlights ? 'checked' : ''} class="w-4 h-4 text-ucu-blue rounded border-slate-300 focus:ring-ucu-blue">
                        <span class="text-xs font-bold text-slate-700">⭐ Top Story / Highlight</span>
                      </label>
                      <label class="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" data-event-field="isFeatured" data-event-index="${idx}" ${ev.isFeatured ? 'checked' : ''} class="w-4 h-4 text-ucu-blue rounded border-slate-300 focus:ring-ucu-blue">
                        <span class="text-xs font-bold text-slate-700">👁️ Visible on Feed</span>
                      </label>
                    </div>

                    <div class="flex items-center gap-2 w-full sm:w-auto">
                      <label class="text-[10px] font-bold text-slate-500 uppercase shrink-0">Detail Modal Link:</label>
                      <input type="text" data-event-field="src" data-event-index="${idx}" value="${this.escape(ev.src || '')}" placeholder="events/2025/kalahi-cidss.html" class="w-full sm:w-56 px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded font-mono">
                    </div>
                  </div>

                  <!-- Modal Content Blocks Builder (Option B) -->
                  ${this.renderBlockBuilder(ev.blocks || [], 'event', idx)}

                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  }

  /**
   * 3C. Research Archive Form Builder (research.html)
   */
  buildResearchForm(draft) {
    const researchList = draft.researchList || [];

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Public Web Page</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-ucu-blue-dark">Academic Repository</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">SDG Research Publications Archive</h2>
            <p class="text-xs text-slate-500 mt-0.5">Manage peer-reviewed articles, institutional studies, and SDG research papers</p>
          </div>
          <button type="button" id="btn-add-research" class="px-4 py-2 text-xs font-bold rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white transition-colors flex items-center gap-2 shadow-sm shrink-0 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ Add Research Publication</span>
          </button>
        </div>

        ${this.buildHeroFields(draft, "Institutional Archive", "SDG Research", "Archive.", "An open-access archive of Urdaneta City University's academic contributions. Explore peer-reviewed publications, institutional studies, and localized research directly aligned with the United Nations' Sustainable Development Goals.")}

        <!-- Research Publications Manager -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>📚</span> Published Research Papers &amp; Studies (${researchList.length})
              </h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Articles listed on the public research repository with keyword and SDG alignment tags</p>
            </div>
          </div>

          <div class="space-y-6" id="research-container">
            ${researchList.length === 0 ? `
              <div class="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                <p class="text-xs font-semibold text-slate-500">No research articles found. Click "+ Add Research Publication" to create one.</p>
              </div>
            ` : researchList.map((paper, idx) => {
              const sdgs = Array.isArray(paper.sdgs) ? paper.sdgs : [];
              const keywordsStr = Array.isArray(paper.keywords) ? paper.keywords.join(', ') : (paper.keywords || '');

              return `
                <div class="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-5 shadow-xs hover:border-slate-300 transition-all">
                  
                  <!-- Card Header -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div class="flex items-center gap-3">
                      <span class="w-7 h-7 rounded-lg bg-ucu-blue-dark text-white font-black text-xs flex items-center justify-center shadow-xs">#${idx + 1}</span>
                      <span class="text-xs font-bold text-slate-800">${this.escape(paper.title || 'Untitled Publication')}</span>
                      ${paper.date ? `<span class="px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-slate-200 text-slate-700">${this.escape(paper.date)}</span>` : ''}
                    </div>
                    <button type="button" data-delete-research="${idx}" class="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-auto cursor-pointer" title="Delete Publication">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      <span>Delete</span>
                    </button>
                  </div>

                  <!-- Primary Fields -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="sm:col-span-2">
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Publication Title</label>
                      <input type="text" data-research-field="title" data-research-index="${idx}" value="${this.escape(paper.title || '')}" placeholder="Title of the research paper..." class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold text-slate-800">
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Date String / Volume</label>
                      <input type="text" data-research-field="date" data-research-index="${idx}" value="${this.escape(paper.date || '')}" placeholder="e.g. Oct 2025" class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-semibold">
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Authors &amp; Affiliation</label>
                      <input type="text" data-research-field="authors" data-research-index="${idx}" value="${this.escape(paper.authors || '')}" placeholder="e.g. Dr. Maria Santos, et al." class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-medium">
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">PDF File / Document Link</label>
                      <input type="text" data-research-field="pdfLink" data-research-index="${idx}" value="${this.escape(paper.pdfLink || '')}" placeholder="../documents/paper-title.pdf or https://..." class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-mono">
                    </div>
                  </div>

                  <!-- Abstract -->
                  <div>
                    <label class="block text-[11px] font-bold text-slate-600 mb-1">Abstract / Executive Narrative</label>
                    <textarea data-research-field="abstract" data-research-index="${idx}" rows="3" placeholder="Brief summary of research methodology and findings..." class="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue leading-relaxed">${this.escape(paper.abstract || '')}</textarea>
                  </div>

                  <!-- Keywords & Topic Tags -->
                  <div>
                    <label class="block text-[11px] font-bold text-slate-600 mb-1">Keywords &amp; Topic Tags <span class="text-[10px] text-slate-400 font-normal">(comma-separated)</span></label>
                    <input type="text" data-research-field="keywordsText" data-research-index="${idx}" value="${this.escape(keywordsStr)}" placeholder="e.g. Climate Resilience, Indigenous Flora, Agno Basin" class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                  </div>

                  <!-- Related SDG Alignments -->
                  <div>
                    <label class="block text-[11px] font-bold text-slate-600 mb-1.5">Related SDG Alignments</label>
                    <div class="flex flex-wrap gap-1.5 p-3 bg-white border border-slate-300 rounded-xl">
                      ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(num => {
                        const active = sdgs.includes(num);
                        return `
                          <button type="button" data-research-sdg="${num}" data-research-index="${idx}" class="w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${active ? 'bg-ucu-blue-dark text-white shadow-xs font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                            ${num}
                          </button>
                        `;
                      }).join('')}
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
   * 3D. Rankings Form Builder (rankings.html)
   */
  buildRankingsForm(draft) {
    const list = draft.rankingsList || [];

    const defaultLogos = {
      "AppliedHE": "images/rankings-logo/applied-he.png",
      "THE Impact": "images/rankings-logo/the-impact.png",
      "UI GreenMetric": "images/rankings-logo/ui-green.png",
      "WURI": "images/rankings-logo/wuri.png",
      "HE HIGHER EDUCATION": "images/rankings-logo/higher-education.png"
    };

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Public Web Page</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-ucu-blue-dark">Standing &amp; Trajectory</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">Institutional Rankings &amp; Accreditations</h2>
            <p class="text-xs text-slate-500 mt-0.5">Manage global standing cards, timeline milestones, and performance metrics</p>
          </div>
          <button type="button" id="btn-add-ranking" class="px-4 py-2 text-xs font-bold rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white transition-colors flex items-center gap-2 shadow-sm shrink-0 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ Add Ranking Card</span>
          </button>
        </div>

        ${this.buildHeroFields(draft, "A Network of Excellence", "Connecting UCU", "Globally", "Forging high-impact relationships with global academic institutions and premier industry leaders to elevate the educational standard of Urdaneta City University.")}

        <!-- Section Headings -->
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>🏷️</span> Section Headings
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Standing Section Title</label>
              <input type="text" data-bind="standingTitle" value="${this.escape(draft.standingTitle || 'Current Global Standing')}" class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Trajectory Eyebrow</label>
              <input type="text" data-bind="trajectoryEyebrow" value="${this.escape(draft.trajectoryEyebrow || 'Institutional Trajectory')}" class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Trajectory Title</label>
              <input type="text" data-bind="trajectoryTitle" value="${this.escape(draft.trajectoryTitle || 'Historical Performance')}" class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold">
            </div>
          </div>
        </div>

        <!-- Closing Mission / Terminus Statement -->
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>📜</span> Historical Timeline Closing Statement
            </h3>
            <span class="text-[10px] font-medium text-slate-400">Displayed at bottom of the timeline</span>
          </div>
          <textarea data-bind="terminusStatement" rows="2" class="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-ucu-blue leading-relaxed">${this.escape(draft.terminusStatement || '"We will continue our commitment to relentless innovation and real-world impact, ensuring the little giant UCU rises to meet the titans on the global stage."')}</textarea>
        </div>

        <!-- Rankings List -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>🏆</span> Rankings &amp; Accreditations List (${list.length})
            </h3>
            <span class="text-[11px] text-slate-400">Ordered chronologically</span>
          </div>

          <div class="space-y-6" id="rankings-container">
            ${list.map((r, idx) => {
              const rawLogo = r.logo || defaultLogos[r.org] || '';
              const currentLogo = this.resolveAdminImageSrc(rawLogo);
              const metrics = r.metrics || [];
              return `
                <div class="p-6 bg-white border-2 border-slate-200 rounded-2xl space-y-5 shadow-sm hover:border-slate-300 transition-all">
                  
                  <!-- Card Header -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div class="flex items-center gap-3">
                      <span class="px-3 py-1 text-xs font-black rounded-lg ${r.badgeClass || 'bg-ucu-blue-dark text-white'}">${r.org || 'New Ranking'}</span>
                      <span class="text-sm font-black text-slate-800">${r.year || '2025'}</span>
                      <span class="text-xs font-black text-ucu-blue px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100">${r.mainRank || '#'}</span>
                    </div>
                    <button type="button" data-delete-ranking="${idx}" class="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-auto cursor-pointer" title="Delete Ranking Card">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      <span>Delete</span>
                    </button>
                  </div>

                  <!-- Primary Fields -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Organization Name</label>
                      <input type="text" list="ranking-org-presets" data-rank-field="org" data-rank-index="${idx}" value="${this.escape(r.org || '')}" placeholder="AppliedHE, WURI, UI GreenMetric..." class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold">
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Year</label>
                      <input type="text" data-rank-field="year" data-rank-index="${idx}" value="${this.escape(r.year || '')}" placeholder="e.g. 2025" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-semibold">
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Primary Rank Value</label>
                      <input type="text" data-rank-field="mainRank" data-rank-index="${idx}" value="${this.escape(r.mainRank || '')}" placeholder="e.g. #44 or 241-260" class="w-full px-3 py-2 text-xs font-black text-ucu-blue-dark bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Category / Scope</label>
                      <input type="text" data-rank-field="category" data-rank-index="${idx}" value="${this.escape(r.category || '')}" placeholder="e.g. World Rankings, All Asia" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                    </div>
                  </div>

                  <!-- Highlight Description & Publication -->
                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div class="lg:col-span-2">
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Highlight Description <span class="font-normal text-slate-400">(Powers top carousel card)</span></label>
                      <textarea data-rank-field="shortDescription" data-rank-index="${idx}" rows="2" placeholder="Brief summary of institutional achievement..." class="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">${this.escape(r.shortDescription || '')}</textarea>
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Publication Date</label>
                      <input type="text" data-rank-field="publicationDate" data-rank-index="${idx}" value="${this.escape(r.publicationDate || '')}" placeholder="e.g. June 12, 2025" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                      
                      <label class="block text-[11px] font-bold text-slate-600 mb-1 mt-2">Rank Label</label>
                      <input type="text" data-rank-field="mainRankLabel" data-rank-index="${idx}" value="${this.escape(r.mainRankLabel || '')}" placeholder="e.g. World University Ranking" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                    </div>
                  </div>

                  <!-- Logo Manager -->
                  <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <div class="w-14 h-14 rounded-lg bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
                        ${currentLogo ? `<img src="${currentLogo}" alt="${r.org}" class="max-w-full max-h-full object-contain">` : `<span class="text-xs text-slate-400">No Logo</span>`}
                      </div>
                      <div>
                        <span class="text-xs font-bold text-slate-700 block">Ranking Organization Logo</span>
                        <span class="text-[10px] text-slate-500">${r.logo ? 'Custom uploaded logo active' : 'Using automatic preset brand logo'}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-1.5">
                        <span>🔄 Replace Logo</span>
                        <input type="file" accept="image/*" class="hidden ranking-logo-file-input" data-rank-index="${idx}">
                      </label>
                      ${r.logo ? `
                        <button type="button" data-reset-ranking-logo="${idx}" class="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-white rounded-lg transition-colors cursor-pointer" title="Reset to default preset logo">
                          Reset
                        </button>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Sub-Metrics Breakdown Repeater -->
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <span>📊</span> Sub-Metrics (${metrics.length})
                      </span>
                      <button type="button" data-add-submetric="${idx}" class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs transition-colors flex items-center gap-1 cursor-pointer">
                        <span>+ Add Metric</span>
                      </button>
                    </div>

                    ${metrics.length === 0 ? `
                      <p class="text-xs italic text-slate-400 py-1">No sub-metrics added for this ranking card.</p>
                    ` : `
                      <div class="space-y-2.5">
                        ${metrics.map((m, mIdx) => `
                          <div class="p-3 bg-white border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            <div class="sm:col-span-4">
                              <input type="text" data-submetric-field="label" data-rank-index="${idx}" data-submetric-index="${mIdx}" value="${this.escape(m.label || '')}" placeholder="Metric Label" class="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-ucu-blue font-medium">
                            </div>
                            <div class="sm:col-span-3">
                              <input type="text" data-submetric-field="value" data-rank-index="${idx}" data-submetric-index="${mIdx}" value="${this.escape(m.value || '')}" placeholder="Value (e.g. #1)" class="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-ucu-blue font-bold text-ucu-blue-dark">
                            </div>
                            <div class="sm:col-span-4">
                              <input type="text" data-submetric-field="subtext" data-rank-index="${idx}" data-submetric-index="${mIdx}" value="${this.escape(m.subtext || '')}" placeholder="Subtext (optional)" class="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-ucu-blue">
                            </div>
                            <div class="sm:col-span-1 text-right">
                              <button type="button" data-delete-submetric="${idx}-${mIdx}" class="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer" title="Delete Metric">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              </button>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    `}
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>

        <datalist id="ranking-org-presets">
          <option value="AppliedHE">
          <option value="WURI">
          <option value="UI GreenMetric">
          <option value="THE Impact">
          <option value="HE HIGHER EDUCATION">
        </datalist>

      </div>
    `;
  }

  /**
   * 3E. Partnerships Form Builder (partnership.html)
   */
  buildPartnershipForm(draft) {
    const metrics = draft.metrics || [];
    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        <div class="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Public Page</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-ucu-blue-dark">Linkages</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">Institutional Partnerships &amp; Linkages</h2>
            <p class="text-xs text-slate-500 mt-0.5">Manage active linkages metrics, partner categories, and correspondence channels</p>
          </div>
        </div>

        ${this.buildHeroFields(draft, "Trusted Connections. Global Vision.", "UCU Beyond", "Borders", "Creating lasting partnerships that empower education, elevate standards, and connect Urdaneta City University to opportunities across the world.")}

        <div class="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          ${this.buildMetricCardsFields(metrics, "Partnership Metrics (5)")}
        </div>

        <!-- Strategic Alliance & Direct Inquiry Channels -->
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>🤝</span> Strategic Alliance &amp; Direct Inquiry Channels
          </h3>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Alliance Section Title</label>
                <input type="text" data-bind="allianceTitle" value="${this.escape(draft.allianceTitle || 'Forge a Strategic Alliance')}" class="w-full px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Partnership Inquiry Google Form URL</label>
                <input type="text" data-bind="partnershipFormUrl" value="${this.escape(draft.partnershipFormUrl || 'https://forms.google.com/your-form-id-here')}" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Alliance Narrative Description</label>
              <textarea data-bind="allianceDescription" rows="3" class="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue leading-relaxed">${this.escape(draft.allianceDescription || 'Urdaneta City University (UCU) actively seeks to expand its global and local network through high-impact institutional linkages. We invite esteemed academic organizations and industry leaders to initialize formal collaboration proposals via our centralized portal.')}</textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Directorate of External Linkages Email</label>
                <input type="email" data-bind="emailExternal" value="${this.escape(draft.emailExternal || 'externalaffairsandlinkages@ucu.edu.ph')}" class="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-medium">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">University General Administration Email</label>
                <input type="email" data-bind="emailOfficial" value="${this.escape(draft.emailOfficial || 'officeofthepresident@ucu.edu.ph')}" class="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-medium">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 3F. Smart Eco Campus Form Builder (smart-eco-campus.html)
   */
  buildSmartEcoForm(draft) {
    const milestones = draft.milestones || [];
    const indicators = draft.sustainabilityIndicators || [];
    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        <div class="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Public Page</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-900">Green Metric</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">Smart Eco Campus &amp; UI GreenMetric</h2>
          </div>
        </div>

        ${this.buildHeroFields(draft, "Innovation Powered by Sustainability", "Smart Eco", "Campus", "Creating a campus where innovation, sustainability, and responsible growth work together to elevate institutional performance and environmental impact.")}

        <!-- Academic Milestone Recognition -->
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>🏅</span> Academic Milestone Recognition
          </h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Recognition Eyebrow Badge</label>
              <input type="text" data-bind="recognitionEyebrow" value="${this.escape(draft.recognitionEyebrow || 'Global Recognition')}" class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Section Title</label>
              <input type="text" data-bind="recognitionTitle" value="${this.escape(draft.recognitionTitle || 'An Academic Milestone')}" class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold">
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Narrative Paragraph 1</label>
              <textarea data-bind="introParagraph1" rows="2" class="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-blue">${this.escape(draft.introParagraph1 || 'The UI GreenMetric World University Rankings evaluates green campuses and environmental sustainability across 39 indicators in 6 criteria.')}</textarea>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Narrative Paragraph 2</label>
              <textarea data-bind="introParagraph2" rows="2" class="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-blue">${this.escape(draft.introParagraph2 || 'As a first try for UCU in this global ranking, it is an academic milestone worthy of celebration.')}</textarea>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Congratulations Callout</label>
              <input type="text" data-bind="introParagraph3" value="${this.escape(draft.introParagraph3 || 'Congratulations, UCUians! Mabuhay ang Urdaneta City University!')}" class="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue text-ucu-red font-medium italic">
            </div>
          </div>

          <!-- Award Evidence Photos Upload -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Award Photos / Certificates (Drag &amp; Drop to Upload)</label>
            <div class="image-uploader-zone" data-uploader-field="awardImages">
              <div class="dropzone border-2 border-dashed border-slate-300 bg-white rounded-lg p-5 text-center cursor-pointer hover:border-ucu-blue transition-colors relative">
                <input type="file" multiple accept="image/*" class="hidden file-input">
                <div class="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span class="text-xs font-semibold">Drag &amp; drop certificate images here or click to browse</span>
                </div>
              </div>
              <div class="preview-container mt-3 flex flex-wrap gap-2.5">
                ${(draft.awardImages || []).map((url, i) => `
                  <div class="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-300 bg-slate-900 shadow-sm">
                    <img src="${url}" class="w-full h-full object-cover">
                    <button type="button" data-uploader-remove="${i}" class="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shadow-md transition-all cursor-pointer" title="Remove Photo">&times;</button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Global Standing Highlights -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <div class="space-y-2 pb-2 border-b border-slate-200">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>🌟</span> Global Standing Highlights (${milestones.length} Cards)
            </h3>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Section Header Text</label>
              <input type="text" data-bind="standingHeader" value="${this.escape(draft.standingHeader || 'Out of 1,477 universities worldwide in 2025, WE ARE:')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-semibold">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${milestones.map((m, idx) => `
              <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative ${idx === 0 ? 'sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700' : ''}">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-mono font-bold ${idx === 0 ? 'text-ucu-yellow' : 'text-slate-400'}">Card #${idx + 1}${idx === 0 ? ' (Featured Large Card)' : ''}</span>
                  </div>
                  <input type="text" data-milestone-field="rank" data-milestone-index="${idx}" value="${this.escape(m.rank || '')}" class="w-24 px-2.5 py-1 text-sm font-black ${idx === 0 ? 'text-ucu-yellow bg-slate-800 border-slate-600' : 'text-ucu-red bg-white border-slate-300'} rounded-lg focus:ring-2 focus:ring-ucu-blue text-center" placeholder="#1">
                </div>
                <textarea data-milestone-field="label" data-milestone-index="${idx}" rows="2" class="w-full p-2.5 text-xs ${idx === 0 ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400' : 'bg-white border-slate-300 text-slate-800'} rounded-lg focus:ring-2 focus:ring-ucu-blue leading-snug" placeholder="Enter category standing description...">${this.escape(m.label || '')}</textarea>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Sustainability Indicators (7 Pillars) -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
          <div class="space-y-2 pb-3 border-b border-slate-200">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>🌱</span> Sustainability Indicators &amp; Pillars (${indicators.length})
            </h3>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Section Title</label>
              <input type="text" data-bind="sustainabilityTitle" value="${this.escape(draft.sustainabilityTitle || 'SUSTAINABILITY INDICATORS')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold text-ucu-red">
            </div>
          </div>

          <div class="space-y-4">
            ${indicators.map((ind, idx) => `
              <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition-all">
                <div class="flex items-center justify-between gap-3 pb-2 border-b border-slate-200">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-xs font-black bg-ucu-yellow text-ucu-blue-dark rounded-md">${ind.num || `0${idx + 1}`}</span>
                    <span class="text-xs font-bold text-slate-800">${this.escape(ind.title || `Pillar ${idx + 1}`)}</span>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Number / Code</label>
                    <input type="text" data-indicator-field="num" data-indicator-index="${idx}" value="${this.escape(ind.num || '')}" class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold text-center">
                  </div>
                  <div class="sm:col-span-3">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pillar Name / Title</label>
                    <input type="text" data-indicator-field="title" data-indicator-index="${idx}" value="${this.escape(ind.title || '')}" class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold">
                  </div>
                </div>

                <div class="pt-1">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pillar Background Image</label>
                  <div class="single-image-uploader-zone" data-target-type="indicator" data-target-index="${idx}" data-target-prop="img">
                    ${ind.img ? `
                      <div class="single-image-preview relative w-full h-32 rounded-xl overflow-hidden border border-slate-300 bg-slate-950 group shadow-sm cursor-pointer" title="Click or drop an image to replace">
                        <img src="${ind.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span class="text-white text-[11px] font-bold bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm">Drop or Click to Replace</span>
                        </div>
                        <input type="file" accept="image/*" class="hidden single-file-input">
                        <button type="button" data-replace-single-image class="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-ucu-blue text-white px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 shadow-md transition-all">
                          <span>🔄</span> Replace
                        </button>
                      </div>
                    ` : `
                      <div class="single-dropzone border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-ucu-blue bg-white transition-colors">
                        <input type="file" accept="image/*" class="hidden single-file-input">
                        <div class="flex flex-col items-center justify-center gap-1 py-1 text-slate-400 hover:text-slate-600">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span class="text-[11px] font-medium">Click or drag pillar image to upload</span>
                        </div>
                      </div>
                    `}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Strategic Framework Closing Paragraph</label>
            <textarea data-bind="sustainabilityParagraph" rows="3" class="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-blue">${this.escape(draft.sustainabilityParagraph || '')}</textarea>
          </div>
        </div>

      </div>
    `;
  }

  /**
   * 3G. Announcements Form Builder (announcement.html)
   */
  buildAnnouncementForm(draft) {
    // 1. Normalize list & single-featured state
    if (!draft.list || !Array.isArray(draft.list)) {
      draft.list = [];
    }
    
    // If list is empty but draft.featured exists, seed into list
    if (draft.list.length === 0 && draft.featured) {
      draft.list.push({ ...draft.featured, isFeatured: true });
    }

    // Ensure at least one is featured if list is non-empty and none marked
    const hasFeatured = draft.list.some(item => item.isFeatured);
    if (!hasFeatured && draft.list.length > 0) {
      draft.list[0].isFeatured = true;
    }

    const list = draft.list;
    const filter = this.announcementFilter;

    // 2. Date filtering calculations
    const now = new Date();
    let minDate = null;
    let maxDate = null;

    if (filter.preset === '7days') {
      minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (filter.preset === '30days') {
      minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (filter.preset === 'thisyear') {
      minDate = new Date(now.getFullYear(), 0, 1);
    } else if (filter.preset === 'custom') {
      if (filter.fromDate) minDate = new Date(filter.fromDate);
      if (filter.toDate) maxDate = new Date(filter.toDate + 'T23:59:59');
    }

    const parseDate = (str) => {
      if (!str) return new Date(0);
      const parsed = new Date(str);
      return isNaN(parsed.getTime()) ? new Date(0) : parsed;
    };

    // Filter items for display
    const filteredItems = list.map((item, originalIndex) => ({ item, originalIndex })).filter(({ item }) => {
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase();
        const matches = (item.title || '').toLowerCase().includes(kw) ||
                        (item.category || '').toLowerCase().includes(kw) ||
                        (item.content || '').toLowerCase().includes(kw);
        if (!matches) return false;
      }

      if (filter.preset !== 'all') {
        const d = parseDate(item.date);
        if (minDate && d < minDate) return false;
        if (maxDate && d > maxDate) return false;
      }

      return true;
    });

    return `
      <div class="p-6 md:p-8 space-y-6 animate-fadeIn">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Public Web Page</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-ucu-blue-dark">News &amp; Media</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">Announcements &amp; News Manager</h2>
            <p class="text-xs text-slate-500 mt-0.5">Manage public announcements, the featured hero article, and archive history</p>
          </div>
          <button type="button" id="btn-add-announcement" class="px-4 py-2 text-xs font-bold rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white transition-colors flex items-center gap-2 shadow-sm shrink-0 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>New Announcement</span>
          </button>
        </div>

        <!-- 1. Filter Bar & Date Picker (Top Studio Bar) -->
        <div class="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>📅</span> Filter &amp; Date Range
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Showing ${filteredItems.length} of ${list.length}
              </span>
            </div>
            
            <!-- Preset Pills -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button type="button" data-ann-preset="7days" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter.preset === '7days' ? 'bg-ucu-blue text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'}">
                Last 7 Days
              </button>
              <button type="button" data-ann-preset="30days" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter.preset === '30days' ? 'bg-ucu-blue text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'}">
                Last 30 Days
              </button>
              <button type="button" data-ann-preset="thisyear" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter.preset === 'thisyear' ? 'bg-ucu-blue text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'}">
                2025
              </button>
              <button type="button" data-ann-preset="all" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter.preset === 'all' ? 'bg-ucu-blue text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'}">
                All Time
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search Keywords</label>
              <input type="text" id="ann-filter-keyword" value="${this.escape(filter.keyword || '')}" placeholder="Search title, tag, or content..." class="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">From Date</label>
              <input type="date" id="ann-filter-from" value="${filter.fromDate || ''}" class="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">To Date</label>
              <input type="date" id="ann-filter-to" value="${filter.toDate || ''}" class="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
          </div>
        </div>

        <!-- 2. Announcements Card Stream -->
        <div class="space-y-4" id="announcements-container">
          ${filteredItems.length === 0 ? `
            <div class="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500">
              <span class="text-2xl block mb-2">🔍</span>
              <p class="text-xs font-bold text-slate-700">No announcements match the selected date filter.</p>
              <p class="text-[11px] text-slate-400 mt-1">Try clicking "All Time" above or "+ New Announcement".</p>
            </div>
          ` : filteredItems.map(({ item, originalIndex }) => `
            <div class="p-5 bg-white border ${item.isFeatured ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20' : 'border-slate-200'} rounded-2xl space-y-4 hover:border-slate-300 transition-all">
              
              <!-- Card Top Toolbar -->
              <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="w-6 h-6 rounded-md bg-ucu-blue text-white flex items-center justify-center text-xs font-bold shrink-0">${originalIndex + 1}</span>
                  <span class="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-md">${this.escape(item.title || `Announcement #${originalIndex + 1}`)}</span>
                  ${item.isFeatured ? `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm shrink-0">
                      ⭐ Featured Hero
                    </span>
                  ` : ''}
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <!-- Exclusive Featured Star Toggle -->
                  <button type="button" data-toggle-featured="${originalIndex}" class="px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${item.isFeatured ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 border border-slate-200'}" title="${item.isFeatured ? 'Currently Featured on Top Hero Banner' : 'Set as Top Featured Announcement'}">
                    <span>${item.isFeatured ? '⭐ Featured' : '☆ Set as Featured'}</span>
                </button>

                  <!-- Delete Announcement Button -->
                  <button type="button" data-delete-announcement="${originalIndex}" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete Announcement">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              <!-- Card Form Layout (3 Clean Rows) -->
              <div class="space-y-4 pt-1">
                
                <!-- 1st Row: Headline / Title, Category / Tag, Publication Date -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Headline / Title</label>
                    <input type="text" data-ann-item-field="title" data-ann-item-index="${originalIndex}" value="${this.escape(item.title || '')}" placeholder="Announcement headline" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue font-bold text-slate-800">
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category / Tag</label>
                    <input type="text" data-ann-item-field="category" data-ann-item-index="${originalIndex}" value="${this.escape(item.category || '')}" placeholder="e.g. Academic Linkages" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue text-slate-800">
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Publication Date</label>
                    <input type="text" data-ann-item-field="date" data-ann-item-index="${originalIndex}" value="${this.escape(item.date || '')}" placeholder="e.g. May 20, 2025" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue text-slate-800">
                  </div>
                </div>

                <!-- 2nd Row: Drag & Drop Images (Same UI from Homepage Slider) -->
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Announcement Images (Drag &amp; Drop to Upload, max 5)
                  </label>
                  <div class="announcement-image-zone" data-ann-index="${originalIndex}">
                    <div class="ann-dropzone border-2 border-dashed border-slate-300 bg-white rounded-lg p-6 text-center cursor-pointer hover:border-ucu-blue transition-colors relative">
                      <input type="file" multiple accept="image/*" class="hidden ann-file-input">
                      <span class="text-slate-400 text-xs font-semibold">Drag &amp; drop images here or click to browse</span>
                    </div>
                    ${(() => {
                      const imagesList = Array.isArray(item.images) && item.images.length > 0 
                        ? item.images 
                        : (item.image ? [item.image] : []);
                      if (imagesList.length === 0) return '';
                      return `
                        <div class="preview-container mt-3 flex flex-wrap gap-2">
                          ${imagesList.map((url, imgIdx) => `
                            <div class="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-300 bg-white shadow-sm">
                              <img src="${url}" class="w-full h-full object-cover">
                              <button type="button" data-ann-remove-image="${originalIndex}" data-img-idx="${imgIdx}" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-100 transition-opacity cursor-pointer shadow-sm" title="Remove Image">&times;</button>
                            </div>
                          `).join('')}
                        </div>
                      `;
                    })()}
                  </div>
                </div>

                <!-- 3rd Row: Narrative Content / Summary -->
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Narrative Content / Summary</label>
                  <textarea data-ann-item-field="content" data-ann-item-index="${originalIndex}" rows="3" placeholder="Full announcement narrative summary..." class="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue leading-relaxed text-slate-800">${this.escape(item.content || '')}</textarea>
                </div>

              </div>

            </div>
          `).join('')}
        </div>

      </div>
    `;
  }

  /**
   * 4. Events & Activities Form Builder
   */
  buildEventsForm(draft) {
    const list = draft.eventsList || [];

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        <div class="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Live Feed</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-ucu-blue-dark">Impact &amp; Activities</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">Events &amp; Community Engagement Feed</h2>
          </div>
          <button type="button" id="btn-add-event" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-ucu-blue text-white hover:bg-ucu-blue-dark transition-colors flex items-center gap-1.5 shadow-sm">
            <span>+ Add Event</span>
          </button>
        </div>

        <div class="space-y-5" id="events-container">
          ${list.map((ev, idx) => `
            <div class="p-5 bg-white border-2 border-slate-200 rounded-xl space-y-4 shadow-sm hover:border-slate-300 transition-all">
              <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">ID: ${ev.id}</span>
                  <span class="text-sm font-bold text-slate-800">${this.escape(ev.title || 'Untitled Event')}</span>
                </div>
                <button type="button" data-delete-event="${idx}" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete Event">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-1">Event Title</label>
                  <input type="text" data-event-field="title" data-event-index="${idx}" value="${this.escape(ev.title || '')}" class="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-1">Date / Period</label>
                  <input type="text" data-event-field="date" data-event-index="${idx}" value="${this.escape(ev.date || '')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-1">Image Asset Path / URL</label>
                  <input type="text" data-event-field="img" data-event-index="${idx}" value="${this.escape(ev.img || '')}" class="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-1">Related SDGs (Comma-separated numbers)</label>
                  <input type="text" data-event-field="relatedSdgs" data-event-index="${idx}" value="${Array.isArray(ev.relatedSdgs) ? ev.relatedSdgs.join(', ') : (ev.relatedSdgs || '')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-500 mb-1">Description / Summary</label>
                <textarea data-event-field="desc" data-event-index="${idx}" rows="3" class="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed focus:ring-2 focus:ring-ucu-blue">${this.escape(ev.desc || '')}</textarea>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 5. UI GreenMetric Indicators Form Builder
   */
  buildIndicatorForm(pillarId, draft) {
    const list = draft.evidenceList || [];
    const pillar = INDICATOR_PILLARS.find(p => p.id === pillarId) || { title: pillarId, num: "01" };

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        <div class="pb-6 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">UI GreenMetric Pillar ${pillar.num}</span>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Evidence Registry</span>
          </div>
          <h2 class="text-xl font-bold text-slate-800">${pillar.title}</h2>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">📋 Evidence Submissions</h3>
            <button type="button" id="btn-add-evidence" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-ucu-blue text-white hover:bg-ucu-blue-dark transition-colors flex items-center gap-1.5 shadow-sm">
              <span>+ Add Evidence Indicator</span>
            </button>
          </div>

          <div class="space-y-4" id="evidence-container">
            ${list.map((ev, idx) => `
              <div class="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-300">
                <div class="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <span class="text-xs font-bold text-ucu-blue-dark">Indicator ${ev.id || `${pillar.num}.${idx+1}`}</span>
                  <button type="button" data-delete-evidence="${idx}" class="p-1 text-slate-400 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Title / Description</label>
                    <input type="text" data-evidence-field="title" data-evidence-index="${idx}" value="${this.escape(ev.title || '')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Category Badge</label>
                    <input type="text" data-evidence-field="badge" data-evidence-index="${idx}" value="${this.escape(ev.badge || '')}" class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
                  </div>
                </div>

                <!-- Evidence Modal Content Blocks Builder (Option B) -->
                ${this.renderBlockBuilder(ev.blocks || [], 'evidence', idx)}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 6. Settings & Firebase Config Form Builder
   */
  buildSettingsForm() {
    const cfg = getFirebaseConfig();
    const isConfigured = isFirebaseConfigured();

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
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
            
            <button type="button" id="btn-run-seeder" class="px-6 py-3 bg-ucu-yellow text-ucu-blue-dark font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-lg hover:shadow-ucu-yellow/20 flex-shrink-0 flex items-center gap-2">
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
          <p>The CMS is currently connected to project <strong>${cfg.projectId || 'sdg-web-d07ac'}</strong>. All edits and publications are synchronized live across the database.</p>
        </div>

        <form id="firebase-config-form" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Firebase Project ID</label>
              <input type="text" id="cfg-projectId" value="${this.escape(cfg.projectId || '')}" placeholder="e.g. ucu-sdg-portal" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">API Key</label>
              <input type="text" id="cfg-apiKey" value="${this.escape(cfg.apiKey || '')}" placeholder="AIzaSy..." class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Auth Domain</label>
              <input type="text" id="cfg-authDomain" value="${this.escape(cfg.authDomain || '')}" placeholder="ucu-sdg-portal.firebaseapp.com" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Storage Bucket</label>
              <input type="text" id="cfg-storageBucket" value="${this.escape(cfg.storageBucket || '')}" placeholder="ucu-sdg-portal.appspot.com" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Messaging Sender ID</label>
              <input type="text" id="cfg-messagingSenderId" value="${this.escape(cfg.messagingSenderId || '')}" placeholder="1234567890" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">App ID</label>
              <input type="text" id="cfg-appId" value="${this.escape(cfg.appId || '')}" placeholder="1:1234567890:web:abcdef" class="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-ucu-blue">
            </div>
          </div>

          <div class="pt-4 flex items-center justify-between border-t border-slate-200">
            <button type="button" id="btn-reset-config" class="px-4 py-2 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              Reset to Defaults
            </button>
            <button type="submit" class="px-6 py-2 text-xs font-bold rounded-lg bg-ucu-blue-dark text-white hover:bg-ucu-red transition-colors shadow-md">
              Save &amp; Connect Firebase
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Bind event listeners to all dynamic inputs
   */
  bindEvents() {
    if (!this.container) return;

    const { type } = cmsState.activeSection;
    if (type === 'sdg') sdgReportsManager.bindEvents(this.container, this);
    if (type === 'home') homeManager.bindEvents(this.container, this);
    if (type === 'impact' || type === 'events') eventsManager.bindEvents(this.container, this);
    if (type === 'research') researchManager.bindEvents(this.container, this);
    if (type === 'rankings') rankingsManager.bindEvents(this.container, this);
    if (type === 'partnership') partnershipsManager.bindEvents(this.container, this);
    if (type === 'smarteco' || type === 'smart_eco') smartEcoManager.bindEvents(this.container, this);
    if (type === 'announcement' || type === 'announcements') announcementsManager.bindEvents(this.container, this);
    if (type === 'indicator') indicatorsManager.bindEvents(this.container, this);

    // 1. Direct Field Binding (`data-bind`)
    this.container.querySelectorAll('[data-bind]').forEach(input => {
      const field = input.getAttribute('data-bind');
      const handler = (e) => {
        cmsState.updateDraftField(field, e.target.value);
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    // 2. Year Selector
    const yearSelect = this.container.querySelector('#sdg-year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        cmsState.setActiveSection('sdg', cmsState.activeSection.id, e.target.value);
      });
    }

    // 3. Metric Repeaters
    this.container.querySelectorAll('[data-metric-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.getAttribute('data-metric-index'), 10);
        const field = input.getAttribute('data-metric-field');
        if (!cmsState.currentDraft.metrics) cmsState.currentDraft.metrics = [];
        if (!cmsState.currentDraft.metrics[idx]) cmsState.currentDraft.metrics[idx] = {};
        cmsState.currentDraft.metrics[idx][field] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        cmsState.notify();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // 3B. Milestones & Standing Highlight Fields
    this.container.querySelectorAll('[data-milestone-field]').forEach(input => {
      const handler = (e) => {
        const idx = parseInt(input.getAttribute('data-milestone-index'), 10);
        const field = input.getAttribute('data-milestone-field');
        if (!cmsState.currentDraft.milestones) cmsState.currentDraft.milestones = [];
        if (!cmsState.currentDraft.milestones[idx]) cmsState.currentDraft.milestones[idx] = {};
        cmsState.currentDraft.milestones[idx][field] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        cmsState.notify();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    // 3C. Sustainability Indicator Pillar Fields
    this.container.querySelectorAll('[data-indicator-field]').forEach(input => {
      const handler = (e) => {
        const idx = parseInt(input.getAttribute('data-indicator-index'), 10);
        const field = input.getAttribute('data-indicator-field');
        if (!cmsState.currentDraft.sustainabilityIndicators) cmsState.currentDraft.sustainabilityIndicators = [];
        if (!cmsState.currentDraft.sustainabilityIndicators[idx]) cmsState.currentDraft.sustainabilityIndicators[idx] = {};
        cmsState.currentDraft.sustainabilityIndicators[idx][field] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        cmsState.notify();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    // 3D. Rankings Management Listeners
    this.container.querySelectorAll('[data-rank-field]').forEach(input => {
      const handler = (e) => {
        const idx = parseInt(input.getAttribute('data-rank-index'), 10);
        const field = input.getAttribute('data-rank-field');
        if (!cmsState.currentDraft.rankingsList) cmsState.currentDraft.rankingsList = [];
        if (!cmsState.currentDraft.rankingsList[idx]) cmsState.currentDraft.rankingsList[idx] = {};
        cmsState.currentDraft.rankingsList[idx][field] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        cmsState.notify();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);

        if (e.type === 'change' && field === 'org' && !cmsState.currentDraft.rankingsList[idx].logo) {
          this.render();
        }
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    const btnAddRanking = this.container.querySelector('#btn-add-ranking');
    if (btnAddRanking) {
      btnAddRanking.addEventListener('click', () => {
        if (!cmsState.currentDraft.rankingsList) cmsState.currentDraft.rankingsList = [];
        cmsState.currentDraft.rankingsList.unshift({
          org: "WURI",
          year: "2026",
          mainRankLabel: "World University Ranking",
          mainRank: "#1",
          category: "World Rankings",
          badgeClass: "bg-[#0f4088] text-white",
          shortDescription: "Newly added institutional ranking entry for Urdaneta City University.",
          publicationDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          metrics: [
            { label: "New Indicator", value: "#1", subtext: "", color: "#394a8a" }
          ]
        });
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    this.container.querySelectorAll('[data-delete-ranking]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await window.cmsConfirm({
          title: "Delete Ranking Card?",
          description: "Are you sure you want to remove this ranking card and its associated sub-metrics?",
          icon: "🏆",
          iconBg: "bg-red-500/20 text-red-400",
          confirmText: "Delete Ranking",
          confirmClass: "bg-red-600 hover:bg-red-500 text-white"
        });
        if (!confirmed) return;
        const idx = parseInt(btn.getAttribute('data-delete-ranking'), 10);
        cmsState.currentDraft.rankingsList.splice(idx, 1);
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // Sub-metric repeater listeners
    this.container.querySelectorAll('[data-add-submetric]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rankIdx = parseInt(btn.getAttribute('data-add-submetric'), 10);
        if (!cmsState.currentDraft.rankingsList[rankIdx]) return;
        if (!cmsState.currentDraft.rankingsList[rankIdx].metrics) {
          cmsState.currentDraft.rankingsList[rankIdx].metrics = [];
        }
        cmsState.currentDraft.rankingsList[rankIdx].metrics.push({
          label: "New Metric",
          value: "#1",
          subtext: "",
          color: "#394a8a"
        });
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    this.container.querySelectorAll('[data-delete-submetric]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [rIdx, mIdx] = btn.getAttribute('data-delete-submetric').split('-').map(Number);
        if (cmsState.currentDraft.rankingsList[rIdx] && cmsState.currentDraft.rankingsList[rIdx].metrics) {
          cmsState.currentDraft.rankingsList[rIdx].metrics.splice(mIdx, 1);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          this.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    this.container.querySelectorAll('[data-submetric-field]').forEach(input => {
      const handler = (e) => {
        const rIdx = parseInt(input.getAttribute('data-rank-index'), 10);
        const mIdx = parseInt(input.getAttribute('data-submetric-index'), 10);
        const field = input.getAttribute('data-submetric-field');
        if (cmsState.currentDraft.rankingsList[rIdx] && cmsState.currentDraft.rankingsList[rIdx].metrics[mIdx]) {
          cmsState.currentDraft.rankingsList[rIdx].metrics[mIdx][field] = e.target.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          cmsState.notify();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    // Ranking custom logo upload & reset
    this.container.querySelectorAll('.ranking-logo-file-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const rankIdx = parseInt(input.getAttribute('data-rank-index'), 10);
        if (e.target.files && e.target.files.length > 0) {
          cmsState.uploadSingleImageToTarget('ranking', rankIdx, 'logo', e.target.files[0]);
        }
      });
    });

    this.container.querySelectorAll('[data-reset-ranking-logo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rankIdx = parseInt(btn.getAttribute('data-reset-ranking-logo'), 10);
        cmsState.setNestedTargetProperty('ranking', rankIdx, 'logo', '');
        this.render();
      });
    });

    const btnAddMetric = this.container.querySelector('#btn-add-metric') || this.container.querySelector('#btn-add-dashboard-metric');
    if (btnAddMetric) {
      btnAddMetric.addEventListener('click', () => {
        if (!cmsState.currentDraft.metrics) cmsState.currentDraft.metrics = [];
        const defaultIcons = ['award', 'globe', 'book-open', 'users', 'handshake', 'trending-up', 'leaf'];
        const chosenIcon = defaultIcons[cmsState.currentDraft.metrics.length % defaultIcons.length];
        const defaultSvg = lucideIconPicker.getSvg(chosenIcon, 28, 2);

        cmsState.currentDraft.metrics.push({ 
          value: "100", 
          label: "New Metric", 
          theme: "white", 
          icon: chosenIcon, 
          svgIcon: defaultSvg 
        });
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    // Lucide Icon Picker for Dashboard Metrics
    this.container.querySelectorAll('[data-pick-dashboard-metric-icon]').forEach(btn => {
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
      });
    });

    this.container.querySelectorAll('[data-delete-metric], [data-delete-dashboard-metric]').forEach(btn => {
      btn.addEventListener('click', () => {
        const attrVal = btn.getAttribute('data-delete-metric') || btn.getAttribute('data-delete-dashboard-metric');
        const idx = parseInt(attrVal, 10);
        if (Array.isArray(cmsState.currentDraft.metrics)) {
          cmsState.currentDraft.metrics.splice(idx, 1);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          this.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // SDG Filter Tabs in SDG Dashboard
    this.container.querySelectorAll('[data-sdg-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sdgCardFilter = btn.getAttribute('data-sdg-filter');
        this.render();
      });
    });

    // 3E. Impact Events Management Listeners
    this.container.querySelectorAll('[data-event-field]').forEach(input => {
      const handler = (e) => {
        const idx = parseInt(input.getAttribute('data-event-index'), 10);
        const field = input.getAttribute('data-event-field');
        if (!cmsState.currentDraft.eventsList) cmsState.currentDraft.eventsList = [];
        if (!cmsState.currentDraft.eventsList[idx]) cmsState.currentDraft.eventsList[idx] = {};
        
        if (input.type === 'checkbox') {
          cmsState.currentDraft.eventsList[idx][field] = input.checked;
        } else {
          cmsState.currentDraft.eventsList[idx][field] = e.target.value;
        }
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        cmsState.notify();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    this.container.querySelectorAll('[data-event-sdg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-event-index'), 10);
        const sdgNum = parseInt(btn.getAttribute('data-event-sdg'), 10);
        if (!cmsState.currentDraft.eventsList) cmsState.currentDraft.eventsList = [];
        if (!cmsState.currentDraft.eventsList[idx]) cmsState.currentDraft.eventsList[idx] = {};
        if (!Array.isArray(cmsState.currentDraft.eventsList[idx].relatedSdgs)) {
          cmsState.currentDraft.eventsList[idx].relatedSdgs = [];
        }

        const currentSdgs = cmsState.currentDraft.eventsList[idx].relatedSdgs;
        const sIndex = currentSdgs.indexOf(sdgNum);
        if (sIndex > -1) {
          currentSdgs.splice(sIndex, 1);
        } else {
          currentSdgs.push(sdgNum);
          currentSdgs.sort((a, b) => a - b);
        }

        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    const btnAddEvent = this.container.querySelector('#btn-add-event');
    if (btnAddEvent) {
      btnAddEvent.addEventListener('click', () => {
        if (!cmsState.currentDraft.eventsList) cmsState.currentDraft.eventsList = [];
        const newId = 'event-' + Date.now();
        cmsState.currentDraft.eventsList.unshift({
          id: newId,
          title: "New Community Engagement Event",
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          desc: "Description of community outreach or institutional initiative.",
          img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
          src: "",
          relatedSdgs: [1, 17],
          isFeatured: true,
          isHighlights: false
        });
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    this.container.querySelectorAll('[data-delete-event]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await window.cmsConfirm({
          title: "Delete Event Card?",
          description: "Are you sure you want to remove this event from the impact documentation?",
          icon: "📅",
          iconBg: "bg-red-500/20 text-red-400",
          confirmText: "Delete Event",
          confirmClass: "bg-red-600 hover:bg-red-500 text-white"
        });
        if (!confirmed) return;
        const idx = parseInt(btn.getAttribute('data-delete-event'), 10);
        cmsState.currentDraft.eventsList.splice(idx, 1);
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // 3F. Research Publications Management Listeners
    this.container.querySelectorAll('[data-research-field]').forEach(input => {
      const handler = (e) => {
        const idx = parseInt(input.getAttribute('data-research-index'), 10);
        const field = input.getAttribute('data-research-field');
        if (!cmsState.currentDraft.researchList) cmsState.currentDraft.researchList = [];
        if (!cmsState.currentDraft.researchList[idx]) cmsState.currentDraft.researchList[idx] = {};

        if (field === 'keywordsText') {
          const rawKeywords = e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
          cmsState.currentDraft.researchList[idx].keywords = rawKeywords;
        } else {
          cmsState.currentDraft.researchList[idx][field] = e.target.value;
        }

        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        cmsState.notify();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    this.container.querySelectorAll('[data-research-sdg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-research-index'), 10);
        const sdgNum = parseInt(btn.getAttribute('data-research-sdg'), 10);
        if (!cmsState.currentDraft.researchList) cmsState.currentDraft.researchList = [];
        if (!cmsState.currentDraft.researchList[idx]) cmsState.currentDraft.researchList[idx] = {};
        if (!Array.isArray(cmsState.currentDraft.researchList[idx].sdgs)) {
          cmsState.currentDraft.researchList[idx].sdgs = [];
        }

        const currentSdgs = cmsState.currentDraft.researchList[idx].sdgs;
        const sIndex = currentSdgs.indexOf(sdgNum);
        if (sIndex > -1) {
          currentSdgs.splice(sIndex, 1);
        } else {
          currentSdgs.push(sdgNum);
          currentSdgs.sort((a, b) => a - b);
        }

        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // 3G. Universal Block Engine Listeners (Add, Delete, Move, Update, Micro-Toolbar)
    this.container.querySelectorAll('[data-add-block]').forEach(btn => {
      btn.addEventListener('click', () => {
        const blockType = btn.getAttribute('data-add-block');
        const targetType = btn.getAttribute('data-target-type');
        const targetIndex = parseInt(btn.getAttribute('data-target-index'), 10);
        cmsState.addContentBlock(targetType, targetIndex, blockType);
        this.render();
      });
    });

    this.container.querySelectorAll('[data-delete-block]').forEach(btn => {
      btn.addEventListener('click', () => {
        const blockIndex = parseInt(btn.getAttribute('data-delete-block'), 10);
        const targetType = btn.getAttribute('data-target-type');
        const targetIndex = parseInt(btn.getAttribute('data-target-index'), 10);
        cmsState.deleteContentBlock(targetType, targetIndex, blockIndex);
        this.render();
      });
    });

    this.container.querySelectorAll('[data-move-block]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dirStr = btn.getAttribute('data-move-block');
        const direction = dirStr === 'up' ? -1 : 1;
        const targetType = btn.getAttribute('data-target-type');
        const targetIndex = parseInt(btn.getAttribute('data-target-index'), 10);
        const blockIndex = parseInt(btn.getAttribute('data-block-index'), 10);
        cmsState.moveContentBlock(targetType, targetIndex, blockIndex, direction);
        this.render();
      });
    });

    this.container.querySelectorAll('[data-block-field]').forEach(input => {
      const handler = (e) => {
        const field = input.getAttribute('data-block-field');
        const targetType = input.getAttribute('data-target-type');
        const targetIndex = parseInt(input.getAttribute('data-target-index'), 10);
        const blockIndex = parseInt(input.getAttribute('data-block-index'), 10);
        
        let val = e.target.value;
        if (field === 'headersCsv') {
          cmsState.updateContentBlock(targetType, targetIndex, blockIndex, 'headers', val.split(',').map(s => s.trim()).filter(Boolean));
        } else {
          cmsState.updateContentBlock(targetType, targetIndex, blockIndex, field, val);
        }
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    // Rich Text Micro-Toolbar Actions (Bold, Italic, Link, List)
    this.container.querySelectorAll('[data-toolbar-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-toolbar-btn');
        const targetTextareaId = btn.getAttribute('data-target-textarea');
        const textarea = this.container.querySelector(`#${targetTextareaId}`);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end) || 'text';

        let replacement = '';
        if (action === 'bold') replacement = `**${selected}**`;
        else if (action === 'italic') replacement = `*${selected}*`;
        else if (action === 'link') replacement = `[${selected}](https://...)`;
        else if (action === 'list') replacement = `\n- ${selected}`;

        textarea.value = text.substring(0, start) + replacement + text.substring(end);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    // Chart & Table Sub-Item Handlers
    this.container.querySelectorAll('[data-add-chart-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetType = btn.getAttribute('data-target-type');
        const targetIndex = parseInt(btn.getAttribute('data-target-index'), 10);
        const blockIndex = parseInt(btn.getAttribute('data-add-chart-item'), 10);
        const blockList = cmsState._getTargetBlockList(targetType, targetIndex);
        if (blockList && blockList[blockIndex]) {
          if (!Array.isArray(blockList[blockIndex].payload)) blockList[blockIndex].payload = [];
          blockList[blockIndex].payload.push({ label: "New Metric", percentage: 50, value: 50 });
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          this.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    this.container.querySelectorAll('[data-delete-chart-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pIdx = parseInt(btn.getAttribute('data-delete-chart-item'), 10);
        const targetType = btn.getAttribute('data-target-type');
        const targetIndex = parseInt(btn.getAttribute('data-target-index'), 10);
        const blockIndex = parseInt(btn.getAttribute('data-block-index'), 10);
        const blockList = cmsState._getTargetBlockList(targetType, targetIndex);
        if (blockList && blockList[blockIndex] && Array.isArray(blockList[blockIndex].payload)) {
          blockList[blockIndex].payload.splice(pIdx, 1);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          this.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    this.container.querySelectorAll('[data-chart-item-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const field = input.getAttribute('data-chart-item-field');
        const targetType = input.getAttribute('data-target-type');
        const targetIndex = parseInt(input.getAttribute('data-target-index'), 10);
        const blockIndex = parseInt(input.getAttribute('data-block-index'), 10);
        const pIdx = parseInt(input.getAttribute('data-payload-index'), 10);
        const blockList = cmsState._getTargetBlockList(targetType, targetIndex);
        if (blockList && blockList[blockIndex] && Array.isArray(blockList[blockIndex].payload) && blockList[blockIndex].payload[pIdx]) {
          blockList[blockIndex].payload[pIdx][field] = e.target.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    this.container.querySelectorAll('[data-add-table-row]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetType = btn.getAttribute('data-target-type');
        const targetIndex = parseInt(btn.getAttribute('data-target-index'), 10);
        const blockIndex = parseInt(btn.getAttribute('data-add-table-row'), 10);
        const blockList = cmsState._getTargetBlockList(targetType, targetIndex);
        if (blockList && blockList[blockIndex]) {
          if (!Array.isArray(blockList[blockIndex].rows)) blockList[blockIndex].rows = [];
          blockList[blockIndex].rows.push("images/evidence/1.3/image1.png | New Item | Description | 2025");
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          this.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    this.container.querySelectorAll('[data-delete-table-row]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rIdx = parseInt(btn.getAttribute('data-delete-table-row'), 10);
        const targetType = btn.getAttribute('data-target-type');
        const targetIndex = parseInt(btn.getAttribute('data-target-index'), 10);
        const blockIndex = parseInt(btn.getAttribute('data-block-index'), 10);
        const blockList = cmsState._getTargetBlockList(targetType, targetIndex);
        if (blockList && blockList[blockIndex] && Array.isArray(blockList[blockIndex].rows)) {
          blockList[blockIndex].rows.splice(rIdx, 1);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          this.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    this.container.querySelectorAll('[data-table-row-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const targetType = input.getAttribute('data-target-type');
        const targetIndex = parseInt(input.getAttribute('data-target-index'), 10);
        const blockIndex = parseInt(input.getAttribute('data-block-index'), 10);
        const rIdx = parseInt(input.getAttribute('data-row-index'), 10);
        const blockList = cmsState._getTargetBlockList(targetType, targetIndex);
        if (blockList && blockList[blockIndex] && Array.isArray(blockList[blockIndex].rows)) {
          blockList[blockIndex].rows[rIdx] = e.target.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    const btnAddResearch = this.container.querySelector('#btn-add-research');
    if (btnAddResearch) {
      btnAddResearch.addEventListener('click', () => {
        if (!cmsState.currentDraft.researchList) cmsState.currentDraft.researchList = [];
        cmsState.currentDraft.researchList.unshift({
          title: "New SDG Research Publication",
          authors: "Faculty / Research Group",
          date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          abstract: "Enter summary of research findings, methodology, and direct community impact.",
          sdgs: [4, 9],
          keywords: ["Sustainable Development", "Research"],
          pdfLink: "#"
        });
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    this.container.querySelectorAll('[data-delete-research]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await window.cmsConfirm({
          title: "Delete Publication?",
          description: "Are you sure you want to remove this research paper from the archive?",
          icon: "📚",
          iconBg: "bg-red-500/20 text-red-400",
          confirmText: "Delete Paper",
          confirmClass: "bg-red-600 hover:bg-red-500 text-white"
        });
        if (!confirmed) return;
        const idx = parseInt(btn.getAttribute('data-delete-research'), 10);
        cmsState.currentDraft.researchList.splice(idx, 1);
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // 4. Image Uploaders
    this.container.querySelectorAll('.image-uploader-zone').forEach(zone => {
      const field = zone.getAttribute('data-uploader-field');
      const dropzone = zone.querySelector('.dropzone');
      const fileInput = zone.querySelector('.file-input');
      const previews = zone.querySelectorAll('[data-uploader-remove]');

      if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('border-ucu-yellow', 'bg-slate-800');
        });
        dropzone.addEventListener('dragleave', () => {
          dropzone.classList.remove('border-ucu-yellow', 'bg-slate-800');
        });
        
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-ucu-yellow', 'bg-slate-800');
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            cmsState.uploadImages(field, e.dataTransfer.files);
          }
        });
        
        fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files.length > 0) {
            cmsState.uploadImages(field, e.target.files);
          }
        });
      }

      previews.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = await window.cmsConfirm({
            title: "Remove Image?",
            description: "Are you sure you want to remove this image from the slider?",
            icon: "🖼️",
            iconBg: "bg-red-500/20 text-red-400",
            confirmText: "Remove Image",
            confirmClass: "bg-red-600 hover:bg-red-500 text-white"
          });
          if (!confirmed) return;
          const idx = parseInt(btn.getAttribute('data-uploader-remove'), 10);
          cmsState.removeImageFromArray(field, idx);
        });
      });
    });

    // 5. Section Repeaters
    this.container.querySelectorAll('[data-section-title]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.getAttribute('data-section-title'), 10);
        if (!cmsState.currentDraft.sections) cmsState.currentDraft.sections = [];
        if (!cmsState.currentDraft.sections[idx]) cmsState.currentDraft.sections[idx] = {};
        cmsState.currentDraft.sections[idx].title = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    this.container.querySelectorAll('[data-section-prose]').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const idx = parseInt(textarea.getAttribute('data-section-prose'), 10);
        if (!cmsState.currentDraft.sections) cmsState.currentDraft.sections = [];
        if (!cmsState.currentDraft.sections[idx]) cmsState.currentDraft.sections[idx] = {};
        const paras = e.target.value.split('\n\n').filter(p => p.trim() !== '');
        cmsState.currentDraft.sections[idx].paragraphs = paras;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    this.container.querySelectorAll('[data-section-modal]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.getAttribute('data-section-modal'), 10);
        if (!cmsState.currentDraft.sections) cmsState.currentDraft.sections = [];
        if (!cmsState.currentDraft.sections[idx]) cmsState.currentDraft.sections[idx] = {};
        cmsState.currentDraft.sections[idx].eventModalId = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    const btnAddSection = this.container.querySelector('#btn-add-section');
    if (btnAddSection) {
      btnAddSection.addEventListener('click', () => {
        if (!cmsState.currentDraft.sections) cmsState.currentDraft.sections = [];
        cmsState.currentDraft.sections.push({
          title: "New Strategic Section",
          paragraphs: ["Enter narrative details for this section here."]
        });
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    this.container.querySelectorAll('[data-delete-section]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await window.cmsConfirm({
          title: "Delete Section Block?",
          description: "Are you sure you want to delete this section block from the draft?",
          icon: "🗑️",
          iconBg: "bg-red-500/20 text-red-400",
          confirmText: "Delete Section",
          confirmClass: "bg-red-600 hover:bg-red-500 text-white"
        });
        if (!confirmed) return;
        const idx = parseInt(btn.getAttribute('data-delete-section'), 10);
        cmsState.currentDraft.sections.splice(idx, 1);
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // 5. Homepage Metrics
    this.container.querySelectorAll('[data-home-metric-val], [data-home-metric]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.getAttribute('data-home-metric-val') || input.getAttribute('data-home-metric'), 10);
        if (!cmsState.currentDraft.metrics) cmsState.currentDraft.metrics = [];
        if (cmsState.currentDraft.metrics[idx]) {
          cmsState.currentDraft.metrics[idx].value = e.target.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // 6. Database Seeder Migration Button
    const btnRunSeeder = this.container.querySelector('#btn-run-seeder');
    if (btnRunSeeder) {
      btnRunSeeder.addEventListener('click', async () => {
        if (!confirm("Are you sure you want to migrate and seed all 17 SDG reports, rankings, events, and partners to your live Cloud Firestore database?")) {
          return;
        }

        const progContainer = this.container.querySelector('#seeder-progress-container');
        const progBar = this.container.querySelector('#seeder-progress-bar');
        const statusMsg = this.container.querySelector('#seeder-status-msg');
        const statusPercent = this.container.querySelector('#seeder-status-percent');
        const seederBtnText = this.container.querySelector('#seeder-btn-text');

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
      });
    }

    // 6B. Milestone Repeaters
    this.container.querySelectorAll('[data-milestone-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.getAttribute('data-milestone-index'), 10);
        const field = input.getAttribute('data-milestone-field');
        if (!cmsState.currentDraft.milestones) cmsState.currentDraft.milestones = [];
        if (!cmsState.currentDraft.milestones[idx]) cmsState.currentDraft.milestones[idx] = {};
        cmsState.currentDraft.milestones[idx][field] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // 6C. SDG Card Filter & Repeaters
    this.container.querySelectorAll('[data-sdg-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sdgCardFilter = btn.getAttribute('data-sdg-filter');
        this.render();
      });
    });

    this.container.querySelectorAll('[data-sdgcard-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.getAttribute('data-sdgcard-index'), 10);
        const field = input.getAttribute('data-sdgcard-field');
        if (!cmsState.currentDraft.sdgCards) cmsState.currentDraft.sdgCards = [];
        if (!cmsState.currentDraft.sdgCards[idx]) cmsState.currentDraft.sdgCards[idx] = {};
        cmsState.currentDraft.sdgCards[idx][field] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // 6D. Sustainability Indicator Repeaters
    this.container.querySelectorAll('[data-indicator-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.getAttribute('data-indicator-index'), 10);
        const field = input.getAttribute('data-indicator-field');
        if (!cmsState.currentDraft.sustainabilityIndicators) cmsState.currentDraft.sustainabilityIndicators = [];
        if (!cmsState.currentDraft.sustainabilityIndicators[idx]) cmsState.currentDraft.sustainabilityIndicators[idx] = {};
        cmsState.currentDraft.sustainabilityIndicators[idx][field] = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // 6E. Single Image Uploaders & Replacers (SDG Cards, Pillars, Announcements)
    this.container.querySelectorAll('.single-image-uploader-zone').forEach(zone => {
      const targetType = zone.getAttribute('data-target-type');
      const targetIndex = parseInt(zone.getAttribute('data-target-index'), 10);
      const targetProp = zone.getAttribute('data-target-prop');
      const dropzone = zone.querySelector('.single-dropzone');
      const previewBox = zone.querySelector('.single-image-preview');
      const fileInput = zone.querySelector('.single-file-input');
      const replaceBtn = zone.querySelector('[data-replace-single-image]');
      const removeBtn = zone.querySelector('[data-remove-single-image]');

      const triggerUpload = () => {
        if (fileInput) fileInput.click();
      };

      if (dropzone && fileInput) {
        dropzone.addEventListener('click', triggerUpload);
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('border-ucu-blue', 'bg-blue-50/50');
        });
        dropzone.addEventListener('dragleave', () => {
          dropzone.classList.remove('border-ucu-blue', 'bg-blue-50/50');
        });
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-ucu-blue', 'bg-blue-50/50');
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            cmsState.uploadSingleImageToTarget(targetType, targetIndex, targetProp, e.dataTransfer.files[0]);
          }
        });
      }

      if (previewBox && fileInput) {
        previewBox.addEventListener('click', (e) => {
          if (e.target.closest('[data-remove-single-image]')) return;
          triggerUpload();
        });
        if (replaceBtn) {
          replaceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerUpload();
          });
        }
        previewBox.addEventListener('dragover', (e) => {
          e.preventDefault();
          previewBox.classList.add('ring-2', 'ring-ucu-blue');
        });
        previewBox.addEventListener('dragleave', () => {
          previewBox.classList.remove('ring-2', 'ring-ucu-blue');
        });
        previewBox.addEventListener('drop', (e) => {
          e.preventDefault();
          previewBox.classList.remove('ring-2', 'ring-ucu-blue');
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            cmsState.uploadSingleImageToTarget(targetType, targetIndex, targetProp, e.dataTransfer.files[0]);
          }
        });
      }

      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files.length > 0) {
            cmsState.uploadSingleImageToTarget(targetType, targetIndex, targetProp, e.target.files[0]);
          }
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = await window.cmsConfirm({
            title: "Remove Image?",
            description: "Are you sure you want to remove this image?",
            icon: "🖼️",
            iconBg: "bg-red-500/20 text-red-400",
            confirmText: "Remove",
            confirmClass: "bg-red-600 hover:bg-red-500 text-white"
          });
          if (!confirmed) return;
          cmsState.removeNestedTargetProperty(targetType, targetIndex, targetProp);
        });
      }
    });

    // 6F. Announcement Filters, Featured Toggles & Fields
    this.container.querySelectorAll('[data-ann-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.announcementFilter.preset = btn.getAttribute('data-ann-preset');
        this.render();
      });
    });

    const filterKeyword = this.container.querySelector('#ann-filter-keyword');
    if (filterKeyword) {
      filterKeyword.addEventListener('input', (e) => {
        this.announcementFilter.keyword = e.target.value;
        this.render();
        const refocused = this.container.querySelector('#ann-filter-keyword');
        if (refocused) {
          refocused.focus();
          refocused.setSelectionRange(refocused.value.length, refocused.value.length);
        }
      });
    }

    const filterFrom = this.container.querySelector('#ann-filter-from');
    const filterTo = this.container.querySelector('#ann-filter-to');
    if (filterFrom) {
      filterFrom.addEventListener('change', (e) => {
        this.announcementFilter.preset = 'custom';
        this.announcementFilter.fromDate = e.target.value;
        this.render();
      });
    }
    if (filterTo) {
      filterTo.addEventListener('change', (e) => {
        this.announcementFilter.preset = 'custom';
        this.announcementFilter.toDate = e.target.value;
        this.render();
      });
    }

    this.container.querySelectorAll('[data-toggle-featured]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-toggle-featured'), 10);
        cmsState.toggleFeaturedAnnouncement(idx);
      });
    });

    this.container.querySelectorAll('[data-ann-item-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.getAttribute('data-ann-item-index'), 10);
        const field = input.getAttribute('data-ann-item-field');
        if (!cmsState.currentDraft.list) cmsState.currentDraft.list = [];
        if (!cmsState.currentDraft.list[idx]) cmsState.currentDraft.list[idx] = {};
        cmsState.currentDraft.list[idx][field] = e.target.value;
        if (cmsState.currentDraft.list[idx].isFeatured) {
          if (!cmsState.currentDraft.featured) cmsState.currentDraft.featured = {};
          cmsState.currentDraft.featured[field] = e.target.value;
        }
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // Announcement Image Drag & Drop Uploaders
    this.container.querySelectorAll('.announcement-image-zone').forEach(zone => {
      const annIndex = parseInt(zone.getAttribute('data-ann-index'), 10);
      const dropzone = zone.querySelector('.ann-dropzone');
      const fileInput = zone.querySelector('.ann-file-input');

      if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('border-ucu-blue', 'bg-blue-50/50');
        });
        dropzone.addEventListener('dragleave', () => {
          dropzone.classList.remove('border-ucu-blue', 'bg-blue-50/50');
        });
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-ucu-blue', 'bg-blue-50/50');
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            cmsState.uploadAnnouncementImages(annIndex, e.dataTransfer.files);
          }
        });
        fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files.length > 0) {
            cmsState.uploadAnnouncementImages(annIndex, e.target.files);
          }
        });
      }
    });

    // Announcement Image Thumbnail Removal
    this.container.querySelectorAll('[data-ann-remove-image]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const annIndex = parseInt(btn.getAttribute('data-ann-remove-image'), 10);
        const imgIndex = parseInt(btn.getAttribute('data-img-idx'), 10);
        const confirmed = await window.cmsConfirm({
          title: "Remove Image?",
          description: "Are you sure you want to remove this photo from the announcement?",
          icon: "🖼️",
          iconBg: "bg-red-500/20 text-red-400",
          confirmText: "Remove Image",
          confirmClass: "bg-red-600 hover:bg-red-500 text-white"
        });
        if (confirmed) {
          cmsState.removeAnnouncementImage(annIndex, imgIndex);
        }
      });
    });

    const btnAddAnn = this.container.querySelector('#btn-add-announcement');
    if (btnAddAnn) {
      btnAddAnn.addEventListener('click', () => {
        if (!cmsState.currentDraft.list) cmsState.currentDraft.list = [];
        const isFirst = cmsState.currentDraft.list.length === 0;
        cmsState.currentDraft.list.unshift({
          id: `ann-${Date.now()}`,
          category: "General Announcement",
          title: "New Institutional Announcement",
          content: "Enter announcement narrative details here...",
          images: [],
          image: "",
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          isFeatured: isFirst
        });
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    this.container.querySelectorAll('[data-delete-announcement]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await window.cmsConfirm({
          title: "Delete Announcement?",
          description: "Are you sure you want to delete this announcement card?",
          icon: "📢",
          iconBg: "bg-red-500/20 text-red-400",
          confirmText: "Delete Announcement",
          confirmClass: "bg-red-600 hover:bg-red-500 text-white"
        });
        if (!confirmed) return;
        const idx = parseInt(btn.getAttribute('data-delete-announcement'), 10);
        cmsState.currentDraft.list.splice(idx, 1);
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        this.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    });

    // 7. Firebase Config Form
    const cfgForm = this.container.querySelector('#firebase-config-form');
    if (cfgForm) {
      cfgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newCfg = {
          projectId: this.container.querySelector('#cfg-projectId')?.value?.trim() || '',
          apiKey: this.container.querySelector('#cfg-apiKey')?.value?.trim() || '',
          authDomain: this.container.querySelector('#cfg-authDomain')?.value?.trim() || '',
          storageBucket: this.container.querySelector('#cfg-storageBucket')?.value?.trim() || '',
          messagingSenderId: this.container.querySelector('#cfg-messagingSenderId')?.value?.trim() || '',
          appId: this.container.querySelector('#cfg-appId')?.value?.trim() || ''
        };
        saveFirebaseConfig(newCfg);
      });

      const btnReset = this.container.querySelector('#btn-reset-config');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          if (confirm("Reset Firebase credentials back to defaults?")) {
            resetFirebaseConfig();
          }
        });
      }
    }
  }

  escape(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
