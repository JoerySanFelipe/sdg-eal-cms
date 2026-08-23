// js/global-charts.js
/**
 * Universal Data Visualizations & Chart Presets Engine for UCU SDG Web.
 * Supports: progress, vertical (YoY), stacked, donut/pie, table.
 */

class UcuDataViz extends HTMLElement {
  static get observedAttributes() {
    return ['data-type', 'data-payload', 'title', 'subtitle'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal && this.hasRendered) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.hasRendered = true;
    const type = this.getAttribute('data-type') || 'progress'; // 'progress', 'vertical', 'stacked', 'donut', 'pie', 'table'
    const title = this.getAttribute('title') || '';
    const subtitle = this.getAttribute('subtitle') || '';
    
    let payload = [];
    try {
      const rawPayload = this.getAttribute('data-payload');
      payload = rawPayload ? JSON.parse(rawPayload) : [];
    } catch (e) {
      console.error('Invalid data-payload in UcuDataViz:', e);
      payload = [];
    }

    let chartHtml = '';

    // 1. PROGRESS BARS
    if (type === 'progress') {
      chartHtml = `
        <div class="space-y-4">
          ${payload.map(item => {
            const pct = Math.min(100, Math.max(0, parseFloat(item.percentage || item.value || 0)));
            const colorClass = item.barColorClass || item.colorClass || (!item.color ? 'bg-ucu-blue-dark' : '');
            const bgClass = item.trackBgClass || 'bg-slate-100';
            const styleAttr = item.color ? `background-color: ${item.color}; width: ${pct}%;` : `width: ${pct}%;`;
            return `
              <div>
                <div class="flex justify-between items-end mb-1.5 text-xs md:text-sm font-bold text-slate-800">
                  <span class="flex items-center gap-2">
                    ${item.icon ? `<span class="text-sm">${item.icon}</span>` : ''}
                    ${item.label || ''}
                  </span>
                  <span class="font-black text-ucu-blue-dark">${pct}%</span>
                </div>
                <div class="w-full ${bgClass} rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                  <div class="${colorClass} h-full rounded-full transition-all duration-1000 ease-out shadow-xs" style="${styleAttr}"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } 
    
    // 2. VERTICAL YEAR-OVER-YEAR BARS
    else if (type === 'vertical') {
      const cols = payload.map(item => {
        const height = Math.min(100, Math.max(5, parseFloat(item.heightPercent || item.percentage || (item.value ? item.value / 2 : 50))));
        const baseBg = item.baseBgClass || (!item.color ? 'bg-ucu-blue-dark/80' : '');
        const hoverBg = item.hoverBgClass || (!item.color ? 'bg-ucu-blue-dark' : '');
        const textCls = item.textClass || 'text-ucu-blue-dark font-black';
        const styleAttr = item.color ? `background-color: ${item.color}; height: ${height}%;` : `height: ${height}%;`;
        return `
          <div class="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div class="text-[11px] md:text-xs font-bold mb-2 transition-all duration-300 opacity-90 group-hover:opacity-100 group-hover:scale-110 ${textCls}">
              ${item.value || ''}
            </div>
            <div class="w-full max-w-[48px] ${baseBg} hover:${hoverBg} hover:opacity-90 rounded-t-lg transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer shadow-sm group-hover:shadow-md" style="${styleAttr}"></div>
            <div class="mt-3 text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest text-center">${item.year || item.label || ''}</div>
          </div>
        `;
      }).join('');

      chartHtml = `
        <div class="flex items-end justify-between gap-2 md:gap-6 w-full h-64 border-b-2 border-slate-200 pb-2 px-2 pt-6">
          ${cols}
        </div>
      `;
    } 
    
    // 3. STACKED MULTI-SEGMENT DISTRIBUTION BAR
    else if (type === 'stacked') {
      const segments = payload.map(item => {
        const pct = Math.max(0, parseFloat(item.percentage || 0));
        const bg = item.bgClass || item.colorClass || (!item.color ? 'bg-ucu-blue-dark' : '');
        const textCls = item.textClass || 'text-white';
        const styleAttr = item.color ? `background-color: ${item.color}; width: ${pct}%;` : `width: ${pct}%;`;
        return `
          <div class="${bg} h-full flex items-center justify-center cursor-help transition-all duration-300 hover:brightness-110 hover:z-10 relative group" style="${styleAttr}" title="${item.label || item.legendLabel}: ${pct}%">
            ${pct >= 10 ? `<span class="text-[10px] md:text-xs font-black ${textCls} tracking-wider hidden sm:block">${pct}%</span>` : ''}
            <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-30 shadow-lg">
              ${item.label || item.legendLabel}: ${pct}%
            </div>
          </div>
        `;
      }).join('');

      const legend = payload.map(item => {
        const bg = item.bgClass || item.colorClass || (!item.color ? 'bg-ucu-blue-dark' : '');
        const pct = item.percentage ? ` (${item.percentage}%)` : '';
        const dotStyle = item.color ? `background-color: ${item.color};` : '';
        return `
          <div class="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg shadow-xs">
            <div class="w-3 h-3 rounded ${bg} shrink-0" style="${dotStyle}"></div>
            <span class="text-[11px] font-bold text-slate-700 uppercase tracking-wider">${item.legendLabel || item.label}${pct}</span>
          </div>
        `;
      }).join('');

      chartHtml = `
        <div>
          <div class="w-full h-9 rounded-xl overflow-hidden flex mb-5 shadow-inner border border-slate-200 p-0.5 bg-slate-100">${segments}</div>
          <div class="flex flex-wrap justify-center gap-2.5 md:gap-4">${legend}</div>
        </div>
      `;
    }

    // 4. DONUT / PIE CHART (SVG-based)
    else if (type === 'donut' || type === 'pie') {
      const total = payload.reduce((acc, cur) => acc + (parseFloat(cur.percentage || cur.value || 0)), 0) || 100;
      let cumulativeAngle = 0;

      const defaultColors = ['#24305e', '#a8201a', '#fbef4b', '#143642', '#0f766e', '#d97706', '#7c3aed'];

      const paths = payload.map((item, idx) => {
        const val = parseFloat(item.percentage || item.value || 0);
        const fraction = val / total;
        const angle = fraction * 360;
        
        // Arc coordinates on SVG 100x100 circle (center: 50,50, radius: 40)
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;
        cumulativeAngle += angle;

        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;

        const x1 = 50 + 40 * Math.cos(startRad);
        const y1 = 50 + 40 * Math.sin(startRad);
        const x2 = 50 + 40 * Math.cos(endRad);
        const y2 = 50 + 40 * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;
        const pathData = fraction >= 0.999 
          ? `M 50,10 A 40,40 0 1,1 49.99,10 Z` 
          : `M 50,50 L ${x1},${y1} A 40,40 0 ${largeArc},1 ${x2},${y2} Z`;

        const color = item.color || defaultColors[idx % defaultColors.length];

        return `
          <path d="${pathData}" fill="${color}" stroke="#ffffff" stroke-width="1.5" class="hover:opacity-90 transition-opacity cursor-pointer">
            <title>${item.label}: ${val}%</title>
          </path>
        `;
      }).join('');

      const legend = payload.map((item, idx) => {
        const color = item.color || defaultColors[idx % defaultColors.length];
        const val = item.percentage || item.value || 0;
        return `
          <div class="flex items-center gap-2 text-xs">
            <div class="w-3 h-3 rounded-full shrink-0" style="background-color: ${color};"></div>
            <span class="font-bold text-slate-700">${item.label}:</span>
            <span class="font-black text-ucu-blue-dark">${val}%</span>
          </div>
        `;
      }).join('');

      chartHtml = `
        <div class="flex flex-col sm:flex-row items-center justify-around gap-6">
          <div class="relative w-44 h-44 shrink-0">
            <svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90">
              ${paths}
            </svg>
            ${type === 'donut' ? `
              <div class="absolute inset-0 m-auto w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Share</span>
                <span class="text-xs font-black text-ucu-blue-dark">100%</span>
              </div>
            ` : ''}
          </div>
          <div class="flex flex-col gap-2.5 max-w-xs w-full">
            ${legend}
          </div>
        </div>
      `;
    }

    // 5. STRUCTURED DATA MATRIX TABLE
    else if (type === 'table') {
      const headers = payload.headers || [];
      const rows = payload.rows || [];

      chartHtml = `
        <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
          <table class="w-full text-left text-xs border-collapse">
            ${headers.length > 0 ? `
              <thead>
                <tr class="bg-slate-100 text-ucu-blue-dark font-black uppercase tracking-wider border-b border-slate-200">
                  ${headers.map(h => `<th class="p-3.5">${h}</th>`).join('')}
                </tr>
              </thead>
            ` : ''}
            <tbody class="divide-y divide-slate-100 bg-white font-medium text-slate-700">
              ${rows.map((row, rIdx) => `
                <tr class="${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50 transition-colors">
                  ${(Array.isArray(row) ? row : [row]).map((cell, cIdx) => `
                    <td class="p-3.5 ${cIdx === 0 ? 'font-bold text-slate-800' : ''}">${cell}</td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    this.innerHTML = `
      <div class="w-full my-6 p-6 md:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm not-prose hover:shadow-md transition-shadow">
        ${title ? `<h4 class="text-lg md:text-xl font-black text-ucu-blue-dark tracking-tight mb-1">${title}</h4>` : ''}
        ${subtitle ? `<p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">${subtitle}</p>` : (title ? '<div class="mb-6"></div>' : '')}
        ${chartHtml}
      </div>
    `;
  }
}

if (!customElements.get("ucu-data-viz")) {
  customElements.define("ucu-data-viz", UcuDataViz);
}