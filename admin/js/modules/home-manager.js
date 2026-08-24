// admin/js/modules/home-manager.js
// Modular Feature Manager for Homepage (CMS Studio)

import { cmsState, compressAndEncodeImage, pickImageFileFromSystem } from '../cms-state.js';
import { previewBridge } from '../preview-bridge.js';
import { lucideIconPicker } from '../lucide-icon-picker.js';
import { escapeHtml, resolveAssetUrl } from '../shared-utils.js';

export class HomeManager {
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
   * Render Homepage CMS Management View
   */
  render(draft) {
    const sliderImages = Array.isArray(draft.sliderImages) ? draft.sliderImages : [];
    const metrics = Array.isArray(draft.metrics) ? draft.metrics : [];

    return `
      <div class="p-6 md:p-8 space-y-8 animate-fadeIn">
        
        <!-- Header -->
        <div class="pb-5 border-b border-slate-200">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Header Page</span>
            <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">index.html</span>
          </div>
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">Homepage Studio</h2>
        </div>

        <!-- 1. Section 1: Hero Banner Image Slider -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-bold uppercase tracking-wider shrink-0">Section 1</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>Hero Carousel Slider (${sliderImages.length} Slides)</span>
              </h3>
            </div>
          </div>

          <!-- Slider Images Grid & Upload Dropzone -->
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" id="home-slider-container">
              ${sliderImages.map((img, idx) => {
                const src = typeof img === 'string' ? img : (img.src || '');
                const resolved = this.resolveAdminImageSrc(src);
                const inputId = `home-slide-replace-${idx}`;
                return `
                  <div class="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col shadow-2xs">
                    <input type="file" id="${inputId}" data-replace-slider="${idx}" accept="image/*" class="sr-only">
                    
                    <div class="w-full h-40 bg-slate-100 overflow-hidden relative">
                      <img src="${resolved}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\\'p-4 text-xs text-slate-400\\'>Image not found</div>'">
                      <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-bold text-white z-10 shadow-2xs">Slide #${idx + 1}</span>
                      
                      <!-- Overlay Hover Actions -->
                      <div class="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" data-home-slide-browse="${idx}" class="px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer select-none">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-ucu-blue pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                          <span>Replace</span>
                        </button>
                        <button type="button" data-delete-slider="${idx}" class="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs cursor-pointer shadow-sm" title="Delete Slide">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Upload New Slide Dropzone with Direct File Explorer Button -->
            <div id="home-slide-dropzone" class="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-2 border-dashed border-slate-200 hover:border-ucu-blue bg-slate-50/70 hover:bg-blue-50/20 rounded-xl transition-all">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <span class="text-xs font-bold text-slate-800 block">Add New Hero Carousel Slide</span>
                  <span class="text-[10px] text-slate-400">Drag &amp; drop photo here or click Open File Explorer</span>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <button type="button" id="btn-home-browse-slide" class="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer select-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  <span>Open File Explorer</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Section 2 Notice: Headline Dynamic Consumer (DRY) -->
        <div class="bg-gradient-to-r from-amber-50/60 via-slate-50 to-amber-50/40 p-5 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 uppercase tracking-wider">Section 2 (DRY)</span>
                <h4 class="text-xs font-bold text-slate-800">Headline / Featured Story</h4>
              </div>
              <p class="text-[11px] text-slate-600 mt-1 max-w-xl leading-relaxed">
                Section 2 Headline is automatically synchronized with the active <strong>Featured Announcement</strong>. Changes made in Announcements &amp; News update this section in real time.
              </p>
            </div>
          </div>
          <button type="button" id="btn-jump-announcements" class="px-3.5 py-2 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-2xs cursor-pointer whitespace-nowrap">
            Announcement Studio &rarr;
          </button>
        </div>

        <!-- 3. Section 3: Strength in Numbers Metrics -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 uppercase tracking-wider shrink-0">Section 3</span>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <span>Strength in Numbers (${metrics.length} Stat Cards)</span>
              </h3>
            </div>
            
            <button type="button" id="btn-add-home-metric" class="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-ucu-blue text-white hover:bg-ucu-blue-dark transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              <span>Add Metric</span>
            </button>
          </div>

          <!-- Section 3 Header Customization (Eyebrow & Section Title) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Section Eyebrow</label>
              <input 
                type="text" 
                id="home-metrics-eyebrow" 
                value="${this.escape(draft.metricsEyebrow || 'Institutional Impact')}" 
                placeholder="Institutional Impact" 
                class="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue text-slate-800 outline-none"
              >
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Section Title</label>
              <input 
                type="text" 
                id="home-metrics-title" 
                value="${this.escape(draft.metricsTitle || 'Strength in Numbers')}" 
                placeholder="Strength in Numbers" 
                class="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue text-slate-800 outline-none"
              >
            </div>
          </div>

          <!-- Metric Cards List with Universal Lucide Icon Selector -->
          <div class="space-y-3" id="home-metrics-container">
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
                      <input type="text" data-metric-field="label" data-metric-index="${idx}" value="${this.escape(m.label || '')}" placeholder="e.g. Total Events" class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue font-semibold">
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

                  <button type="button" data-delete-home-metric="${idx}" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-center cursor-pointer" title="Delete Metric">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4. Section 4 & 5 & 6 Notices (DRY Dynamic Feeds) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div class="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 uppercase tracking-wider shrink-0">Section 4</span>
              <h4 class="text-xs font-bold text-slate-800 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                <span>Global Recognition</span>
              </h4>
            </div>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              Populated dynamically from <strong>Current Global Standing</strong> in Rankings.
            </p>
            <button type="button" id="btn-jump-rankings" class="text-xs font-bold text-ucu-blue hover:text-ucu-blue-dark block pt-1 cursor-pointer">
              Rankings Studio &rarr;
            </button>
          </div>

          <div class="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 uppercase tracking-wider shrink-0">Section 5</span>
              <h4 class="text-xs font-bold text-slate-800 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>Latest Impact &amp; Events</span>
              </h4>
            </div>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              Displays the <strong>3 recently added events</strong> from the Impact &amp; Events archive.
            </p>
            <button type="button" id="btn-jump-events" class="text-xs font-bold text-ucu-blue hover:text-ucu-blue-dark block pt-1 cursor-pointer">
              Impact and Events Studio &rarr;
            </button>
          </div>

          <div class="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 uppercase tracking-wider shrink-0">Section 6</span>
              <h4 class="text-xs font-bold text-slate-800 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span>Global Network</span>
              </h4>
            </div>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              Displays <strong>Partner Countries &amp; Logos</strong> from Strategic Linkages.
            </p>
            <button type="button" id="btn-jump-partnerships" class="text-xs font-bold text-ucu-blue hover:text-ucu-blue-dark block pt-1 cursor-pointer">
              Partnerships Studio &rarr;
            </button>
          </div>

        </div>

        <!-- 5. Section 7: Strategic Alliances & Inquiries -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div class="pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 uppercase tracking-wider shrink-0">Section 7</span>
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              <span>Strategic Alliance &amp; Direct Inquiry Channels</span>
            </h3>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">
            Populated dynamically from <strong>Institutional Linkage Direct Portals</strong> in the Partnerships Studio.
          </p>
        </div>

      </div>
    `;
  }

  /**
   * Bind event listeners for Homepage section
   */
  bindEvents(container, parentFormEngine) {
    if (!container) return;

    // Navigation Jump Buttons
    const jumpAnn = container.querySelector('#btn-jump-announcements');
    if (jumpAnn) {
      jumpAnn.addEventListener('click', () => {
        if (typeof window.cmsNavigateToSection === 'function') {
          window.cmsNavigateToSection('announcement');
        } else {
          cmsState.setActiveSection('announcement', 'announcements');
        }
      });
    }

    const jumpRank = container.querySelector('#btn-jump-rankings');
    if (jumpRank) {
      jumpRank.addEventListener('click', () => {
        if (typeof window.cmsNavigateToSection === 'function') {
          window.cmsNavigateToSection('rankings');
        } else {
          cmsState.setActiveSection('rankings', 'main');
        }
      });
    }

    const jumpEvents = container.querySelector('#btn-jump-events');
    if (jumpEvents) {
      jumpEvents.addEventListener('click', () => {
        if (typeof window.cmsNavigateToSection === 'function') {
          window.cmsNavigateToSection('impact', '2025');
        } else {
          cmsState.setActiveSection('impact', '2025');
        }
      });
    }

    const jumpPartners = container.querySelector('#btn-jump-partnerships');
    if (jumpPartners) {
      jumpPartners.addEventListener('click', () => {
        if (typeof window.cmsNavigateToSection === 'function') {
          window.cmsNavigateToSection('partnership');
        } else {
          cmsState.setActiveSection('partnership', 'main');
        }
      });
    }

    // Section 3 Eyebrow & Title Live Listeners
    const inputEyebrow = container.querySelector('#home-metrics-eyebrow');
    if (inputEyebrow) {
      inputEyebrow.addEventListener('input', (e) => {
        cmsState.currentDraft.metricsEyebrow = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    const inputTitle = container.querySelector('#home-metrics-title');
    if (inputTitle) {
      inputTitle.addEventListener('input', (e) => {
        cmsState.currentDraft.metricsTitle = e.target.value;
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    // Slider Upload New Slide Listener
    const btnBrowseSlide = container.querySelector('#btn-home-browse-slide');
    const dropzoneNewSlide = container.querySelector('#home-slide-dropzone');

    const handleNewSlideFile = async (file) => {
      if (!file) return;
      const encoded = await compressAndEncodeImage(file);
      if (encoded) {
        if (!Array.isArray(cmsState.currentDraft.sliderImages)) {
          cmsState.currentDraft.sliderImages = [];
        }
        cmsState.currentDraft.sliderImages.push(encoded);
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        parentFormEngine.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      }
    };

    if (btnBrowseSlide) {
      btnBrowseSlide.addEventListener('click', async () => {
        const file = await pickImageFileFromSystem();
        if (file) {
          await handleNewSlideFile(file);
        }
      });
    }

    if (dropzoneNewSlide) {
      dropzoneNewSlide.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneNewSlide.classList.add('border-ucu-blue', 'bg-blue-50/30');
      });
      dropzoneNewSlide.addEventListener('dragleave', () => {
        dropzoneNewSlide.classList.remove('border-ucu-blue', 'bg-blue-50/30');
      });
      dropzoneNewSlide.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropzoneNewSlide.classList.remove('border-ucu-blue', 'bg-blue-50/30');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await handleNewSlideFile(e.dataTransfer.files[0]);
        }
      });
    }

    // Slider Replace Slide Listeners
    container.querySelectorAll('[data-home-slide-browse]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-home-slide-browse'), 10);
        const file = await pickImageFileFromSystem();
        if (file) {
          const encoded = await compressAndEncodeImage(file);
          if (encoded && Array.isArray(cmsState.currentDraft.sliderImages)) {
            cmsState.currentDraft.sliderImages[idx] = encoded;
            cmsState.isDirty = true;
            cmsState.saveLocalDraft();
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        }
      });
    });

    // Delete Slider Image Buttons
    container.querySelectorAll('[data-delete-slider]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-delete-slider'), 10);
        if (Array.isArray(cmsState.currentDraft.sliderImages)) {
          cmsState.currentDraft.sliderImages.splice(idx, 1);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // Slider Input Change Listeners
    container.querySelectorAll('[data-slider-input]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.getAttribute('data-slider-input'), 10);
        if (Array.isArray(cmsState.currentDraft.sliderImages)) {
          cmsState.currentDraft.sliderImages[idx] = e.target.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });

    // Metric Fields Change Listeners (Value, Label, Theme)
    container.querySelectorAll('[data-metric-field]').forEach(input => {
      const handleFieldUpdate = (e) => {
        const field = input.getAttribute('data-metric-field');
        const idx = parseInt(input.getAttribute('data-metric-index'), 10);
        if (Array.isArray(cmsState.currentDraft.metrics) && cmsState.currentDraft.metrics[idx]) {
          cmsState.currentDraft.metrics[idx][field] = e.target.value;
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      };
      input.addEventListener('input', handleFieldUpdate);
      input.addEventListener('change', handleFieldUpdate);
    });

    // Metric Lucide Icon Picker Integration
    container.querySelectorAll('[data-pick-metric-icon]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-pick-metric-icon'), 10);
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
            parentFormEngine.render();
            previewBridge.sendLiveUpdate(cmsState.currentDraft);
          }
        });
      });
    });

    // Add Metric Button
    const btnAddMetric = container.querySelector('#btn-add-home-metric');
    if (btnAddMetric) {
      btnAddMetric.addEventListener('click', () => {
        if (!Array.isArray(cmsState.currentDraft.metrics)) {
          cmsState.currentDraft.metrics = [];
        }
        const defaultIcons = ['award', 'globe', 'book-open', 'users', 'handshake', 'trending-up', 'leaf'];
        const chosenIcon = defaultIcons[cmsState.currentDraft.metrics.length % defaultIcons.length];
        const defaultSvg = lucideIconPicker.getSvg(chosenIcon, 28, 2);

        cmsState.currentDraft.metrics.push({
          value: "0",
          label: "New Metric",
          theme: "white",
          icon: chosenIcon,
          svgIcon: defaultSvg
        });
        cmsState.isDirty = true;
        cmsState.saveLocalDraft();
        parentFormEngine.render();
        previewBridge.sendLiveUpdate(cmsState.currentDraft);
      });
    }

    // Delete Metric Buttons
    container.querySelectorAll('[data-delete-home-metric]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-delete-home-metric'), 10);
        if (Array.isArray(cmsState.currentDraft.metrics)) {
          cmsState.currentDraft.metrics.splice(idx, 1);
          cmsState.isDirty = true;
          cmsState.saveLocalDraft();
          parentFormEngine.render();
          previewBridge.sendLiveUpdate(cmsState.currentDraft);
        }
      });
    });
  }
}

export const homeManager = new HomeManager();
