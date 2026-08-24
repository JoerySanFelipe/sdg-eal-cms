// admin/js/shared-utils.js
/**
 * Canonical Shared Utilities & Brand Token Registry
 * Single Source of Truth for UCU SDG Portal & CMS Studio
 */

export const SDG_METADATA = Object.freeze({
  "1": { title: "No Poverty", subtitle: "End poverty in all its forms everywhere", color: "#E5243B" },
  "2": { title: "Zero Hunger", subtitle: "End hunger, achieve food security and improved nutrition", color: "#DDA63A" },
  "3": { title: "Good Health and Well-Being", subtitle: "Ensure healthy lives and promote well-being for all", color: "#4C9F38" },
  "4": { title: "Quality Education", subtitle: "Ensure inclusive and equitable quality education", color: "#C5192D" },
  "5": { title: "Gender Equality", subtitle: "Achieve gender equality and empower all women and girls", color: "#FF3A21" },
  "6": { title: "Clean Water and Sanitation", subtitle: "Ensure availability and sustainable management of water", color: "#26BDE2" },
  "7": { title: "Affordable and Clean Energy", subtitle: "Ensure access to affordable, reliable, sustainable energy", color: "#FCC30B" },
  "8": { title: "Decent Work and Economic Growth", subtitle: "Promote sustained, inclusive and sustainable economic growth", color: "#A21942" },
  "9": { title: "Industry, Innovation and Infrastructure", subtitle: "Build resilient infrastructure, promote sustainable industrialization", color: "#FD6925" },
  "10": { title: "Reduced Inequalities", subtitle: "Reduce inequality within and among countries", color: "#DD1367" },
  "11": { title: "Sustainable Cities and Communities", subtitle: "Make cities inclusive, safe, resilient and sustainable", color: "#FD9D24" },
  "12": { title: "Responsible Consumption and Production", subtitle: "Ensure sustainable consumption and production patterns", color: "#BF8B2E" },
  "13": { title: "Climate Action", subtitle: "Take urgent action to combat climate change and its impacts", color: "#3F7E44" },
  "14": { title: "Life Below Water", subtitle: "Conserve and sustainably use the oceans, seas and marine resources", color: "#0A97D9" },
  "15": { title: "Life on Land", subtitle: "Protect, restore and promote sustainable use of terrestrial ecosystems", color: "#56C02B" },
  "16": { title: "Peace, Justice and Strong Institutions", subtitle: "Promote peaceful and inclusive societies for sustainable development", color: "#00689D" },
  "17": { title: "Partnerships for the Goals", subtitle: "Strengthen the means of implementation and revitalize the global partnership", color: "#19486A" }
});

export const INDICATOR_PILLARS = Object.freeze([
  { id: "infrastructure", title: "Setting & Infrastructure", num: "01", icon: "building", img: "images/smart-eco-assets/setting_and_infrastructure.jpg" },
  { id: "energy", title: "Energy & Climate Change", num: "02", icon: "zap", img: "images/smart-eco-assets/energy_and_climate_change.jpg" },
  { id: "waste", title: "Waste Management", num: "03", icon: "trash", img: "images/smart-eco-assets/waste.jpg" },
  { id: "water", title: "Water Management", num: "04", icon: "droplet", img: "images/smart-eco-assets/water.jpg" },
  { id: "transportation", title: "Transportation", num: "05", icon: "truck", img: "images/smart-eco-assets/transportation.jpg" },
  { id: "education", title: "Education & Research", num: "06", icon: "book", img: "images/smart-eco-assets/education_and_research.jpg" },
  { id: "digitalization", title: "Governance & Digitalization", num: "07", icon: "laptop", img: "images/smart-eco-assets/digitalization.jpg" }
]);

/**
 * High-performance HTML escaping
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  const match = /[&<>"']/.exec(s);
  if (!match) return s;
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Universal media & asset path normalizer
 * @param {string} src Raw asset path or data URI
 * @param {Object} [options] Context options
 * @param {boolean} [options.isAdmin=false] Whether resolving in admin studio context
 * @param {string} [options.basePath='./'] Base path for public pages
 */
export function resolveAssetUrl(src, options = {}) {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:') || src.startsWith('//')) {
    return src;
  }

  // Strip leading path traversal markers
  let clean = src;
  while (clean.startsWith('../')) clean = clean.substring(3);
  if (clean.startsWith('./')) clean = clean.substring(2);
  if (clean.startsWith('/')) clean = clean.substring(1);

  if (options.isAdmin) {
    return `../${clean}`;
  }

  const base = options.basePath || './';
  return `${base}${clean}`;
}

/**
 * Natural numerical sorter for indicator codes and criteria identifiers
 * Example: '1.2' sorts before '1.10'
 */
export function naturalSort(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}
