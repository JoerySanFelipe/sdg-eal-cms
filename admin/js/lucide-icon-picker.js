// admin/js/lucide-icon-picker.js
// Universal Lucide Outline Icon Picker & Registry for SDG CMS Portal

// Helper: Convert string to clean kebab-case
export function toKebabCase(str) {
  if (!str) return '';
  return String(str)
    .replace(/([a-z0-9])([A-Z])/g, (m, a, b) => a + '-' + b)
    .replace(/([A-Z]+)([A-Z][a-z0-9])/g, (m, a, b) => a + '-' + b)
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
    .trim();
}

// Helper: Convert kebab-case to PascalCase
export function toPascalCase(str) {
  if (!str) return '';
  const kebab = toKebabCase(str);
  return kebab
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

// Helper: Get icon definition array from window.lucide
export function getLucideIconDef(iconName) {
  if (!iconName || typeof window === 'undefined') return null;
  const l = window.lucide;
  if (!l) return null;

  const rawName = String(iconName).trim();
  const kebab = toKebabCase(rawName);
  const pascal = toPascalCase(rawName);
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);

  const sources = [l.icons, l];
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    if (src[rawName] && Array.isArray(src[rawName])) return src[rawName];
    if (src[pascal] && Array.isArray(src[pascal])) return src[pascal];
    if (src[kebab] && Array.isArray(src[kebab])) return src[kebab];
    if (src[camel] && Array.isArray(src[camel])) return src[camel];
  }
  return null;
}

// Helper: Render SVG string from icon definition or name
export function renderLucideSvg(iconDefOrName, size = 24, strokeWidth = 2, customClass = '') {
  if (!iconDefOrName) return '';

  let def = Array.isArray(iconDefOrName) ? iconDefOrName : getLucideIconDef(iconDefOrName);

  if (Array.isArray(def)) {
    const inner = def.map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
      return `<${tag} ${attrStr}/>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${customClass || 'shrink-0 pointer-events-none'}">${inner}</svg>`;
  }

  if (def && typeof def.toSvg === 'function') {
    return def.toSvg({ width: size, height: size, 'stroke-width': strokeWidth, class: customClass });
  }

  // Fallback generic outline icon
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${customClass || 'shrink-0 pointer-events-none'}"><circle cx="12" cy="12" r="10"/><path d="M12 8v8m-4-4h8"/></svg>`;
}

// Curated Category Tags for Quick Filtering
export const ICON_CATEGORIES = {
  all: { label: 'All Icons', filter: () => true },
  academic: { 
    label: 'Academic & Research', 
    keywords: ['book', 'school', 'graduat', 'educat', 'study', 'learn', 'library', 'file', 'scroll', 'award', 'medal', 'trophy', 'badge', 'certificate', 'microscope', 'flask', 'brain', 'lightbulb', 'compass', 'pencil', 'pen', 'notebook'] 
  },
  sustainability: { 
    label: 'Sustainability & Eco', 
    keywords: ['leaf', 'tree', 'sprout', 'flower', 'sun', 'wind', 'droplet', 'recycle', 'globe', 'earth', 'cloud', 'zap', 'flame', 'sparkle', 'battery', 'waves', 'fish', 'mountain', 'bug', 'apple'] 
  },
  global: { 
    label: 'Global & Linkages', 
    keywords: ['globe', 'world', 'map', 'pin', 'navigation', 'compass', 'flag', 'plane', 'send', 'network', 'share', 'link', 'handshake', 'users', 'user', 'building', 'landmark'] 
  },
  community: { 
    label: 'Community & Impact', 
    keywords: ['heart', 'smile', 'users', 'user', 'person', 'people', 'hand', 'helping', 'shield', 'home', 'life-buoy', 'target', 'crosshair', 'sparkles', 'star', 'gift', 'message', 'phone'] 
  },
  analytics: { 
    label: 'Analytics & Growth', 
    keywords: ['chart', 'bar', 'line', 'pie', 'trending', 'activity', 'percent', 'dollar', 'credit', 'target', 'gauge', 'scale', 'calculator', 'database', 'layers', 'sliders'] 
  },
  campus: { 
    label: 'Campus & Infrastructure', 
    keywords: ['building', 'home', 'landmark', 'factory', 'store', 'truck', 'bus', 'car', 'bike', 'wifi', 'server', 'monitor', 'cpu', 'key', 'lock', 'door', 'tool', 'wrench'] 
  }
};

// Fallback Core Icon List in case Lucide CDN is offline
export const CORE_FALLBACK_ICONS = [
  'calendar', 'book-open', 'award', 'users', 'globe', 'handshake', 'chart-bar', 
  'trending-up', 'target', 'sparkles', 'leaf', 'building', 'graduation-cap', 
  'heart-handshake', 'shield', 'briefcase', 'activity', 'bookmark', 'check-circle',
  'compass', 'database', 'droplets', 'eye', 'file-text', 'flag', 'flask-conical',
  'folder', 'heart', 'help-circle', 'info', 'layers', 'life-buoy', 'lightbulb',
  'link', 'map-pin', 'medal', 'message-square', 'microscope', 'milestone',
  'newspaper', 'pen-tool', 'percent', 'pie-chart', 'recycle', 'rocket',
  'scale', 'search', 'share-2', 'sun', 'thumbs-up', 'trophy', 'umbrella',
  'user-check', 'user-plus', 'volume-2', 'wallet', 'watch', 'wind', 'zap'
];

class LucideIconPickerEngine {
  constructor() {
    this.modalEl = null;
    this.activeCallback = null;
    this.selectedIcon = '';
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.cachedIconNames = null;
  }

  /**
   * Get all available icon names from window.lucide or fallback
   */
  getAvailableIcons() {
    if (this.cachedIconNames && this.cachedIconNames.length > 0) {
      return this.cachedIconNames;
    }

    if (typeof window !== 'undefined' && window.lucide) {
      const src = window.lucide.icons || window.lucide;
      const ignore = new Set(['createIcons', 'createElement', 'icons', 'default', '__esModule']);
      const names = Object.keys(src).filter(k => !ignore.has(k) && Array.isArray(src[k]));
      if (names.length > 0) {
        // Convert PascalCase to clean kebab-case names
        const kebabNames = Array.from(new Set(names.map(n => toKebabCase(n)))).sort();
        this.cachedIconNames = kebabNames;
        return kebabNames;
      }
    }
    return CORE_FALLBACK_ICONS;
  }

  /**
   * Render SVG string for a given icon name
   */
  getSvg(iconName, size = 24, strokeWidth = 2, customClass = '') {
    return renderLucideSvg(iconName, size, strokeWidth, customClass);
  }

  /**
   * Filter icon list based on active category and search query
   */
  getFilteredIcons() {
    const all = this.getAvailableIcons();
    const q = this.searchQuery.toLowerCase().trim();
    const cat = ICON_CATEGORIES[this.currentCategory] || ICON_CATEGORIES.all;

    return all.filter(name => {
      // 1. Category Filter
      if (this.currentCategory !== 'all' && cat.keywords) {
        const matchesCategory = cat.keywords.some(k => name.includes(k));
        if (!matchesCategory) return false;
      }

      // 2. Search Query Filter
      if (q) {
        return name.includes(q) || name.replace(/-/g, ' ').includes(q);
      }

      return true;
    });
  }

  /**
   * Ensure modal DOM exists in the document
   */
  ensureModal() {
    if (this.modalEl && document.body.contains(this.modalEl)) return;

    const modal = document.createElement('div');
    modal.id = 'lucide-universal-icon-picker-modal';
    modal.className = 'fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 hidden animate-fadeIn';
    
    modal.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-scaleUp">
        
        <!-- Header -->
        <div class="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0 bg-white">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 uppercase tracking-wider">Icon Library</span>
              <span id="lucide-picker-total-count" class="text-[11px] font-mono font-semibold text-slate-400">Loading icons...</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 tracking-tight">Select Outline Icon</h3>
          </div>
          
          <button type="button" id="btn-close-lucide-modal" class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="Close">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Search & Filter Controls -->
        <div class="p-5 sm:p-6 py-3 border-b border-slate-100 bg-slate-50/70 space-y-3 shrink-0">
          <!-- Search Input -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <input 
              type="text" 
              id="lucide-picker-search" 
              placeholder="Search 1,400+ outline icons (e.g. school, book, globe, heart, chart, leaf)..." 
              class="w-full pl-10 pr-10 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-ucu-blue/15 focus:border-ucu-blue text-slate-800 placeholder-slate-400 shadow-2xs outline-none"
            >
            <button type="button" id="lucide-picker-search-clear" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-slate-600 hidden cursor-pointer">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto cms-scrollbar pb-1 text-xs" id="lucide-category-pills">
            ${Object.entries(ICON_CATEGORIES).map(([key, cat]) => `
              <button 
                type="button" 
                data-category-key="${key}" 
                class="px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${key === 'all' ? 'bg-ucu-blue text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}"
              >
                ${cat.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Scrollable Icon Grid Canvas -->
        <div class="flex-1 overflow-y-auto p-5 sm:p-6 cms-scrollbar bg-slate-50/30 min-h-[300px]" id="lucide-icon-grid-container">
          <!-- Rendered Dynamically -->
        </div>

        <!-- Footer / Active Selection Status -->
        <div class="p-4 px-6 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="text-[11px] text-slate-400 font-medium">Selected:</span>
            <div id="lucide-picker-selected-preview" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold">
              <span class="w-4 h-4 flex items-center justify-center text-ucu-blue" id="lucide-picker-selected-svg"></span>
              <span id="lucide-picker-selected-name">none</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" id="btn-cancel-lucide-picker" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer">
              Cancel
            </button>
            <button type="button" id="btn-confirm-lucide-picker" class="px-5 py-2 rounded-xl bg-ucu-blue hover:bg-ucu-blue-dark text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              Use Selected Icon
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;
    this.bindModalEvents();
  }

  /**
   * Bind event listeners on modal
   */
  bindModalEvents() {
    if (!this.modalEl) return;

    const searchInput = this.modalEl.querySelector('#lucide-picker-search');
    const searchClear = this.modalEl.querySelector('#lucide-picker-search-clear');
    const closeBtn = this.modalEl.querySelector('#btn-close-lucide-modal');
    const cancelBtn = this.modalEl.querySelector('#btn-cancel-lucide-picker');
    const confirmBtn = this.modalEl.querySelector('#btn-confirm-lucide-picker');
    const pillsContainer = this.modalEl.querySelector('#lucide-category-pills');

    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        if (searchClear) {
          searchClear.classList.toggle('hidden', !this.searchQuery);
        }
        this.renderGrid();
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        searchClear.classList.add('hidden');
        searchInput.focus();
        this.renderGrid();
      });
    }

    // Category Tabs
    if (pillsContainer) {
      pillsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-category-key]');
        if (!btn) return;
        this.currentCategory = btn.getAttribute('data-category-key');
        
        // Update pill UI
        pillsContainer.querySelectorAll('[data-category-key]').forEach(b => {
          const isAct = b.getAttribute('data-category-key') === this.currentCategory;
          b.className = `px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${isAct ? 'bg-ucu-blue text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`;
        });

        this.renderGrid();
      });
    }

    // Close & Cancel
    const closeModal = () => {
      this.modalEl.classList.add('hidden');
      this.activeCallback = null;
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) closeModal();
    });

    // Confirm selection
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (!this.selectedIcon) return;
        if (typeof this.activeCallback === 'function') {
          const svgString = this.getSvg(this.selectedIcon, 28, 2);
          this.activeCallback(this.selectedIcon, svgString);
        }
        closeModal();
      });
    }
  }

  /**
   * Render the icon grid items
   */
  renderGrid() {
    if (!this.modalEl) return;
    const gridContainer = this.modalEl.querySelector('#lucide-icon-grid-container');
    const totalCountEl = this.modalEl.querySelector('#lucide-picker-total-count');
    if (!gridContainer) return;

    const filtered = this.getFilteredIcons();
    if (totalCountEl) {
      totalCountEl.textContent = `${filtered.length} icon${filtered.length === 1 ? '' : 's'} available`;
    }

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div class="p-12 text-center flex flex-col items-center justify-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <h4 class="text-sm font-bold text-slate-700">No matching icons found</h4>
          <p class="text-xs text-slate-400 max-w-sm">Try searching for keywords like "education", "earth", "growth", or "calendar".</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = `
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2.5">
        ${filtered.map(name => {
          const isSelected = name === this.selectedIcon;
          const svg = this.getSvg(name, 22, 2);
          const readableName = name.replace(/-/g, ' ');
          return `
            <button 
              type="button" 
              data-icon-name="${name}" 
              class="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer group select-none text-center ${
                isSelected 
                  ? 'bg-blue-50/90 border-ucu-blue text-ucu-blue shadow-xs ring-2 ring-ucu-blue/20' 
                  : 'bg-white border-slate-200/90 text-slate-700 hover:border-ucu-blue/60 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
              }"
              title="${name}"
            >
              <div class="w-7 h-7 flex items-center justify-center mb-1 transition-transform group-hover:scale-110 pointer-events-none text-slate-700 group-hover:text-ucu-blue ${isSelected ? 'text-ucu-blue' : ''}">
                ${svg}
              </div>
              <span class="text-[9px] font-medium leading-tight truncate w-full pointer-events-none block capitalize ${isSelected ? 'font-bold text-ucu-blue' : 'text-slate-500 group-hover:text-slate-800'}">
                ${readableName}
              </span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Click handler for grid buttons
    gridContainer.querySelectorAll('[data-icon-name]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-icon-name');
        this.selectIcon(name);
      });

      // Double-click to instantly confirm and close
      btn.addEventListener('dblclick', () => {
        const name = btn.getAttribute('data-icon-name');
        this.selectIcon(name);
        const confirmBtn = this.modalEl.querySelector('#btn-confirm-lucide-picker');
        if (confirmBtn) confirmBtn.click();
      });
    });

    this.updateSelectionUI();
  }

  /**
   * Set selected icon and update UI
   */
  selectIcon(iconName) {
    this.selectedIcon = iconName;
    
    // Update grid highlights
    if (this.modalEl) {
      this.modalEl.querySelectorAll('[data-icon-name]').forEach(b => {
        const name = b.getAttribute('data-icon-name');
        const isSel = name === iconName;
        b.className = `flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer group select-none text-center ${
          isSel 
            ? 'bg-blue-50/90 border-ucu-blue text-ucu-blue shadow-xs ring-2 ring-ucu-blue/20' 
            : 'bg-white border-slate-200/90 text-slate-700 hover:border-ucu-blue/60 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
        }`;
      });
    }

    this.updateSelectionUI();
  }

  /**
   * Update bottom footer status of selected icon
   */
  updateSelectionUI() {
    if (!this.modalEl) return;
    const nameEl = this.modalEl.querySelector('#lucide-picker-selected-name');
    const svgEl = this.modalEl.querySelector('#lucide-picker-selected-svg');
    const confirmBtn = this.modalEl.querySelector('#btn-confirm-lucide-picker');

    if (nameEl) nameEl.textContent = this.selectedIcon || 'none';
    if (svgEl) svgEl.innerHTML = this.selectedIcon ? this.getSvg(this.selectedIcon, 16, 2) : '';
    if (confirmBtn) confirmBtn.disabled = !this.selectedIcon;
  }

  /**
   * Open the Lucide Icon Picker Modal
   * @param {Object} options
   * @param {string} options.currentIcon - Currently selected icon name
   * @param {Function} options.onSelect - Callback with (iconName, svgHtml)
   */
  open({ currentIcon = '', onSelect } = {}) {
    this.ensureModal();
    this.activeCallback = onSelect;
    this.selectedIcon = currentIcon || '';
    this.searchQuery = '';
    this.currentCategory = 'all';

    const searchInput = this.modalEl.querySelector('#lucide-picker-search');
    if (searchInput) searchInput.value = '';

    const pillsContainer = this.modalEl.querySelector('#lucide-category-pills');
    if (pillsContainer) {
      pillsContainer.querySelectorAll('[data-category-key]').forEach(b => {
        const isAct = b.getAttribute('data-category-key') === 'all';
        b.className = `px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${isAct ? 'bg-ucu-blue text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`;
      });
    }

    this.renderGrid();
    this.modalEl.classList.remove('hidden');

    if (searchInput) {
      setTimeout(() => searchInput.focus(), 100);
    }
  }
}

export const lucideIconPicker = new LucideIconPickerEngine();
