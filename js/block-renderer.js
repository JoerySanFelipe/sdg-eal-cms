// js/block-renderer.js
/**
 * Universal Modular Block Renderer Engine for UCU SDG Web.
 * Converts structured content blocks into accessible, beautifully styled Tailwind UI elements.
 */

window.UcuBlockRenderer = {
  /**
   * Helper: Parse simple markdown (bold, italic, links, lists) into safe HTML
   */
  parseMarkdown(text) {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold: **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    
    // Italic: *text* or _text_
    escaped = escaped.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>');
    
    // Links: [text](url)
    escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-ucu-blue-dark font-bold underline decoration-ucu-red/40 hover:decoration-ucu-red transition-colors">$1</a>');

    // Bullet lists: Lines starting with "- " or "* "
    const lines = escaped.split('\n');
    let inList = false;
    let result = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          result += '<ul class="list-disc list-inside space-y-1.5 my-3 pl-2 text-slate-700 font-medium">';
          inList = true;
        }
        result += `<li>${trimmed.substring(2)}</li>`;
      } else {
        if (inList) {
          result += '</ul>';
          inList = false;
        }
        if (trimmed.length > 0) {
          result += `<p class="mb-3.5 leading-relaxed text-slate-700 font-medium">${line}</p>`;
        }
      }
    });

    if (inList) result += '</ul>';
    return result;
  },

  /**
   * Resolve relative asset paths based on base path
   */
  resolvePath(src, basePath = './') {
    if (window.ucuResolveMediaSrc) {
      return window.ucuResolveMediaSrc(src, basePath);
    }
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('//')) {
      return src;
    }
    // Clean leading ../ or ./ to harmonize
    let clean = src;
    while (clean.startsWith('../')) clean = clean.substring(3);
    if (clean.startsWith('./')) clean = clean.substring(2);
    if (clean.startsWith('/')) clean = clean.substring(1);
    return basePath + clean;
  },

  /**
   * Render a single block object
   */
  renderBlock(block, basePath = './', accentColor = '#24305e') {
    if (!block || !block.type) return '';

    // 1. PARAGRAPH / TEXT BLOCK
    if (block.type === 'paragraph' || block.type === 'text') {
      const content = block.content || block.text || '';
      return `<div class="ucu-block-text text-base md:text-lg leading-relaxed text-slate-700 font-normal mb-5 font-sans not-prose">${this.parseMarkdown(content)}</div>`;
    }

    // 2. HEADING BLOCK
    if (block.type === 'heading') {
      const level = block.level === 'h3' ? 'h3' : 'h2';
      const title = block.title || block.text || '';
      const subtitle = block.subtitle || '';
      
      if (level === 'h3') {
        return `
          <div class="my-5 pt-1">
            <h3 class="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 font-sans">
              <span class="w-2 h-2 rounded-full" style="background-color: ${accentColor};"></span>
              ${title}
            </h3>
            ${subtitle ? `<p class="text-xs md:text-sm text-slate-500 font-medium mt-1 font-sans">${subtitle}</p>` : ''}
          </div>
        `;
      }

      return `
        <div class="flex items-center w-full mt-10 mb-5 gap-4">
          <div class="w-1.5 h-6 rounded-full shadow-xs shrink-0" style="background-color: ${accentColor};"></div>
          <h2 class="shrink-0 text-xl md:text-2xl font-black text-slate-900 tracking-tight m-0 pr-2 font-sans">${title}</h2>
          <div class="grow h-px bg-slate-200 rounded-full"></div>
        </div>
      `;
    }

    // 3. IMAGE / MEDIA BLOCK
    if (block.type === 'image') {
      const src = this.resolvePath(block.src || block.url, basePath);
      const caption = block.caption || '';
      const alt = block.alt || caption || 'Evidence Photo';
      const maxHeight = block.maxHeight || '520px';

      return `
        <figure class="my-6 max-w-3xl mx-auto flex flex-col items-center">
          <img src="${src}" alt="${alt}" class="rounded-2xl border border-slate-200/90 shadow-sm max-w-full h-auto object-contain hover:scale-[1.01] transition-transform duration-300" style="max-height: ${maxHeight};" loading="lazy" onerror="window.ucuHandleImageError(this)" />
          ${caption ? `<figcaption class="text-xs text-slate-500 font-semibold mt-2.5 text-center leading-normal px-4 font-sans">${caption}</figcaption>` : ''}
        </figure>
      `;
    }

    // 4. CALLOUT / METRIC HIGHLIGHT BLOCK
    if (block.type === 'callout') {
      const value = block.value || block.stat || '';
      const label = block.label || block.title || '';
      const description = block.description || block.desc || '';

      return `
        <div class="my-6 p-6 md:p-7 bg-slate-50/80 rounded-2xl border border-slate-200/80 border-l-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-6" style="border-left-color: ${accentColor};">
          ${value ? `<div class="text-4xl md:text-5xl font-black text-slate-900 tracking-tight shrink-0 font-sans">${value}</div>` : ''}
          <div class="text-slate-700 font-medium text-sm md:text-base leading-relaxed font-sans">
            ${label ? `<strong class="block font-black text-slate-900 text-base mb-1 font-sans">${label}</strong>` : ''}
            ${description || ''}
          </div>
        </div>
      `;
    }

    // 5. DATA VISUALIZATION / CHART BLOCK
    if (block.type === 'chart') {
      const chartType = block.chartType || block.dataType || 'progress';
      const title = block.title || '';
      const subtitle = block.subtitle || '';
      const payloadStr = typeof block.payload === 'string' ? block.payload : JSON.stringify(block.payload || []);

      return `
        <ucu-data-viz 
          data-type="${chartType}" 
          title="${title}" 
          subtitle="${subtitle}" 
          data-payload='${payloadStr}'>
        </ucu-data-viz>
      `;
    }

    // 6. STRUCTURED EVIDENCE TABLE BLOCK
    if (block.type === 'table') {
      const headers = block.headers || [];
      const rows = block.rows || [];

      return `
        <div class="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
          <table class="w-full text-left text-xs border-collapse font-sans">
            ${headers.length > 0 ? `
              <thead>
                <tr class="bg-slate-100/90 text-slate-900 font-black uppercase tracking-wider border-b border-slate-200">
                  ${headers.map(h => `<th class="p-3.5 font-sans">${h}</th>`).join('')}
                </tr>
              </thead>
            ` : ''}
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700 font-sans">
              ${rows.map((row, rIdx) => {
                const cells = Array.isArray(row) ? row : (typeof row === 'string' ? row.split('|').map(s => s.trim()) : Object.values(row));
                return `
                <tr class="${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/40 transition-colors">
                  ${cells.map((cell, cIdx) => {
                    const isImg = typeof cell === 'string' && (cell.endsWith('.jpg') || cell.endsWith('.png') || cell.endsWith('.webp') || cell.startsWith('images/') || cell.startsWith('data:image/'));
                    if (isImg) {
                      const resolvedImg = cell.startsWith('data:image/') ? cell : this.resolvePath(cell, basePath);
                      return `<td class="p-3"><img src="${resolvedImg}" class="w-20 h-14 object-cover rounded-lg border border-slate-200 shadow-2xs" alt="Evidence" loading="lazy" /></td>`;
                    }
                    return `<td class="p-3.5 ${cIdx === 0 ? 'font-bold text-slate-900' : ''}">${cell}</td>`;
                  }).join('')}
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 7. OFFICIAL DOCUMENT / ATTACHMENT DOWNLOAD BLOCK
    if (block.type === 'document') {
      const label = block.label || block.title || 'Download Official Document';
      const fileUrl = this.resolvePath(block.url || block.fileUrl, basePath);
      const ext = (fileUrl.split('.').pop() || 'PDF').toUpperCase();

      return `
        <div class="my-4 flex items-center justify-between p-4 bg-slate-50/80 border border-slate-200 rounded-2xl hover:border-slate-300 transition-all font-sans">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-ucu-blue-dark text-white font-black text-xs flex items-center justify-center shadow-xs uppercase font-sans">
              ${ext.slice(0, 4)}
            </div>
            <div>
              <h4 class="text-xs md:text-sm font-bold text-slate-900 font-sans">${label}</h4>
              <span class="text-[10px] text-slate-400 font-mono">Verified Institutional Proof</span>
            </div>
          </div>
          <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-ucu-blue-dark text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-900 transition-colors inline-flex items-center gap-2 no-underline shadow-xs font-sans">
            <span>View File</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      `;
    }

    // 8. ALIGNED COMMUNITY ENGAGEMENT / EVENT CARD BLOCK
    if (block.type === 'event_card' || block.type === 'event') {
      const eventId = block.eventId || block.id;
      const allEvents = window.UCU_EVENTS || [];
      const ev = allEvents.find(e => e.id === eventId) || block;
      if (!ev || !ev.title) return '';

      const tagsHtml = (ev.relatedSdgs || [])
        .map(num => `<div class="flex items-center justify-center w-5 h-5 rounded text-white text-[9px] font-black shadow-xs font-sans" style="background-color: ${(window.UCU_SDG_COLORS || {})[num] || '#24305e'};">${num}</div>`)
        .join('');

      const imgSrc = window.ucuResolveMediaSrc ? window.ucuResolveMediaSrc(ev.img, basePath) : (ev.img && (ev.img.startsWith('data:') || ev.img.startsWith('http')) ? ev.img : `${basePath}${ev.img}`);

      return `
        <div class="my-6 pt-2 font-sans">
          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3 font-sans">
            <svg class="w-3.5 h-3.5" style="color: ${accentColor};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Aligned Community Engagement
          </h4>
          <button class="ucu-event-trigger group block relative w-full text-left overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer max-w-[340px]" data-event-id="${ev.id}">
            <div class="w-full aspect-video overflow-hidden relative bg-slate-100 shrink-0">
              <img src="${imgSrc}" alt="${ev.title}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[0.6s]" loading="lazy" onerror="window.ucuHandleImageError(this)" />
              <div class="absolute top-2.5 right-2.5 bg-ucu-red/90 backdrop-blur-md border border-white/10 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-widest font-sans">EVENT</div>
            </div>
            <div class="p-4 flex flex-col gap-1 relative bg-white flex-grow w-full font-sans">
              <p class="text-[8px] text-ucu-red font-bold uppercase tracking-widest font-sans">${ev.date || ''}</p>
              <h5 class="text-xs md:text-sm font-black text-slate-900 group-hover:text-ucu-red leading-tight transition-colors duration-200 line-clamp-2 font-sans">${ev.title}</h5>
              <p class="text-[11px] text-slate-500 line-clamp-2 leading-relaxed m-0 mb-2 font-sans font-medium">${ev.desc || ''}</p>
              <div class="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 w-full">
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink-0 font-sans">SDG Alignment</span>
                <div class="flex flex-wrap gap-1 justify-end">${tagsHtml}</div>
              </div>
            </div>
          </button>
        </div>
      `;
    }

    // 9. METRIC CARDS BLOCK (Top 3 Metric Cards)
    if (block.type === 'metric_cards' || block.type === 'metrics') {
      const metricsList = Array.isArray(block.metrics) ? block.metrics : (Array.isArray(block.payload) ? block.payload : []);
      if (metricsList.length === 0) return '';
      const safeJson = JSON.stringify(metricsList).replace(/"/g, '&quot;');
      return `<div class="my-4 block w-full reveal-on-scroll is-visible"><ucu-metric-cards class="block w-full" data-metrics="${safeJson}"></ucu-metric-cards></div>`;
    }

    return '';
  },

  /**
   * Render an array of blocks into an HTML string
   */
  renderBlocks(blocks, basePath = './', accentColor = '#24305e') {
    if (!Array.isArray(blocks) || blocks.length === 0) return '';
    return blocks.map(block => this.renderBlock(block, basePath, accentColor)).join('');
  },

  /**
   * Extract snippet (first 180 chars) from the first text block
   */
  extractCardSnippet(blocks, maxLength = 160) {
    if (!Array.isArray(blocks)) return '';
    const firstTextBlock = blocks.find(b => b.type === 'paragraph' || b.type === 'text' || b.type === 'callout');
    if (!firstTextBlock) return '';
    const raw = firstTextBlock.content || firstTextBlock.text || firstTextBlock.description || '';
    const clean = raw.replace(/[*_#`[\]()]/g, '').trim();
    if (clean.length <= maxLength) return clean;
    return clean.slice(0, maxLength).trim() + '...';
  }
};
