// admin/js/cms-state.js
// Centralized State Management & Cloud Firestore CRUD for UCU SDG CMS

import { 
  db, 
  isFirebaseConfigured, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from './firebase-config.js';

import { getCurrentUser } from './auth.js';
import { previewBridge } from './preview-bridge.js';

function sanitizeForFirestore(val) {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) {
    return val.map(item => {
      if (Array.isArray(item)) return item.join(' | ');
      if (typeof item === 'object' && item !== null) return sanitizeForFirestore(item);
      return item;
    });
  }
  if (typeof val === 'object') {
    if (val._methodName || val.constructor?.name === 'FieldValue') return val;
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) res[k] = sanitizeForFirestore(v);
    }
    return res;
  }
  return val;
}

// SDG Brand Colors registry
export const SDG_METADATA = {
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
};

export const INDICATOR_PILLARS = [
  { id: "infrastructure", title: "Setting & Infrastructure", num: "01", icon: "building", img: "images/smart-eco-assets/setting_and_infrastructure.jpg" },
  { id: "energy", title: "Energy & Climate Change", num: "02", icon: "zap", img: "images/smart-eco-assets/energy_and_climate_change.jpg" },
  { id: "waste", title: "Waste Management", num: "03", icon: "trash", img: "images/smart-eco-assets/waste.jpg" },
  { id: "water", title: "Water Management", num: "04", icon: "droplet", img: "images/smart-eco-assets/water.jpg" },
  { id: "transportation", title: "Transportation", num: "05", icon: "truck", img: "images/smart-eco-assets/transportation.jpg" },
  { id: "education", title: "Education & Research", num: "06", icon: "book", img: "images/smart-eco-assets/education_and_research.jpg" },
  { id: "digitalization", title: "Governance & Digitalization", num: "07", icon: "laptop", img: "images/smart-eco-assets/digitalization.jpg" }
];

export function compressAndEncodeImage(file, maxWidth = 1000, maxHeight = 650, quality = 0.68) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Always use lossy compressed WebP (or JPEG fallback) to ensure super lightweight ~35-60KB payload
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl || dataUrl.startsWith('data:image/png') || dataUrl.length < 50) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch (err) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function pickImageFileFromSystem() {
  return new Promise((resolve) => {
    // Create a pure, unattached input file element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      resolve(file);
    };

    // If the user cancels the file dialog, the window regains focus.
    const onFocusBack = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          resolve(null);
        }
      }, 500); // Give enough time for 'change' event to fire if a file WAS picked
    };
    
    // EXTREMELY CRITICAL: input.click() MUST be synchronous. 
    // Do NOT put this in a setTimeout, or Chrome/Brave will silently block the OS File Dialog!
    window.addEventListener('focus', onFocusBack, { once: true });
    input.click();
  });
}

export function getAvailableYears() {
  let baseYears = [2025, 2024, 2023];
  try {
    const custom = localStorage.getItem('UCU_AVAILABLE_YEARS');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed)) {
        baseYears = [...baseYears, ...parsed.map(y => parseInt(y, 10))];
      }
    }
  } catch (e) {}

  const uniqueSorted = Array.from(new Set(baseYears))
    .filter(y => !isNaN(y) && y >= 2000 && y <= 2100)
    .sort((a, b) => b - a)
    .map(String);

  return uniqueSorted;
}

export function addAvailableYear(year) {
  const numYear = parseInt(year, 10);
  if (isNaN(numYear) || numYear < 2000 || numYear > 2100) return false;
  const current = getAvailableYears();
  if (!current.includes(String(numYear))) {
    current.push(String(numYear));
    current.sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    try {
      localStorage.setItem('UCU_AVAILABLE_YEARS', JSON.stringify(current));
    } catch (e) {}
  }
  return true;
}

export function removeAvailableYear(year) {
  const current = getAvailableYears();
  if (current.length <= 1) {
    return { success: false, reason: "At least one reporting year must remain in the system." };
  }
  const updated = current.filter(y => y !== String(year));
  try {
    localStorage.setItem('UCU_AVAILABLE_YEARS', JSON.stringify(updated));
  } catch (e) {}
  return { success: true, nextYear: updated[0] || '2025' };
}

export function getDefaultYear() {
  const years = getAvailableYears();
  return years[0] || '2025';
}

// State Store
class CMSState {
  constructor() {
    const defaultYear = getDefaultYear();
    this.activeSection = {
      type: 'sdg', // 'home' | 'sdg' | 'rankings' | 'events' | 'indicator' | 'settings'
      id: '1',
      year: defaultYear
    };
    this.currentDraft = null;
    this.isDirty = false;
    this.listeners = new Set();
    window.cmsState = this;
  }

  hasUnsavedChanges() {
    return !!this.isDirty;
  }

  getDocPath(section = this.activeSection) {
    const { type, id, year } = section;
    const effectiveYear = year || getDefaultYear();
    if (type === 'home') {
      return { collection: 'pages', docId: 'home' };
    } else if (type === 'sdg') {
      return { collection: 'sdg_narratives', docId: `sdg_${id}_${effectiveYear}` };
    } else if (type === 'sdg_dashboard') {
      return { collection: 'pages', docId: `sdg_dashboard_${effectiveYear}` };
    } else if (type === 'impact') {
      return { collection: 'pages', docId: `impact_${effectiveYear}` };
    } else if (type === 'research') {
      return { collection: 'pages', docId: `research_${effectiveYear}` };
    } else if (type === 'rankings') {
      return { collection: 'pages', docId: 'rankings' };
    } else if (type === 'smart_eco' || type === 'smarteco') {
      return { collection: 'pages', docId: 'smart_eco_campus' };
    } else if (type === 'partnerships' || type === 'partnership') {
      return { collection: 'pages', docId: 'partnerships' };
    } else if (type === 'announcements' || type === 'announcement') {
      return { collection: 'pages', docId: 'announcements' };
    } else if (type === 'indicator') {
      return { collection: 'indicators', docId: id };
    }
    return { collection: 'pages', docId: `${type}_${id}` };
  }

  getDocKey(section = this.activeSection) {
    const { collection, docId } = this.getDocPath(section);
    return `${collection}__${docId}`;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  setActiveSection(type, id, year = getDefaultYear()) {
    const defaultYear = getDefaultYear();
    if (typeof type === 'object' && type !== null) {
      this.activeSection = {
        type: type.type || 'sdg',
        id: type.id || '',
        year: type.year || defaultYear
      };
    } else {
      this.activeSection = { type, id, year: year || defaultYear };
    }
    this.notify();
  }

  updateDraftField(path, value) {
    if (!this.currentDraft) this.currentDraft = {};
    const parts = path.split('.');
    let target = this.currentDraft;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) target[parts[i]] = {};
      target = target[parts[i]];
    }

    if ((path === 'sliderImages' || path === 'headlineSliders') && typeof value === 'string') {
      target[parts[parts.length - 1]] = value.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      target[parts[parts.length - 1]] = value;
    }
    this.isDirty = true;
    
    // Save draft locally
    this.saveLocalDraft();
    this.notify();
  }

  async uploadImages(field, files) {
    if (!this.currentDraft) this.currentDraft = {};
    if (!Array.isArray(this.currentDraft[field])) {
      this.currentDraft[field] = [];
    }

    const maxLimit = (field === 'sliderImages' || field === 'awardImages') ? 8 : 6;
    const availableSlots = maxLimit - this.currentDraft[field].length;
    if (availableSlots <= 0) {
      alert(`Maximum of ${maxLimit} images reached for this gallery. Please remove an existing image before adding new ones.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      alert(`Only adding ${availableSlots} image(s) to respect the maximum limit of ${maxLimit}.`);
    }

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const encodedUrl = await compressAndEncodeImage(file);
      if (encodedUrl) {
        this.currentDraft[field].push(encodedUrl);
      }
    }

    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    if (window.cmsForms) window.cmsForms.render();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  removeImageFromArray(field, index) {
    if (this.currentDraft && Array.isArray(this.currentDraft[field])) {
      this.currentDraft[field].splice(index, 1);
      this.isDirty = true;
      this.saveLocalDraft();
      this.notify();
      if (window.cmsForms) window.cmsForms.render();
      previewBridge.sendLiveUpdate(this.currentDraft);
    }
  }

  async uploadSingleImageToTarget(targetType, index, property, file) {
    const encodedUrl = await compressAndEncodeImage(file);
    if (encodedUrl) {
      this.setNestedTargetProperty(targetType, index, property, encodedUrl);
      if (window.cmsForms) window.cmsForms.render();
    }
  }

  setNestedTargetProperty(targetType, index, property, value) {
    if (!this.currentDraft) this.currentDraft = {};
    if (targetType === 'sdgCard') {
      if (!this.currentDraft.sdgCards) this.currentDraft.sdgCards = [];
      if (!this.currentDraft.sdgCards[index]) this.currentDraft.sdgCards[index] = {};
      this.currentDraft.sdgCards[index][property] = value;
    } else if (targetType === 'indicator') {
      if (!this.currentDraft.sustainabilityIndicators) this.currentDraft.sustainabilityIndicators = [];
      if (!this.currentDraft.sustainabilityIndicators[index]) this.currentDraft.sustainabilityIndicators[index] = {};
      this.currentDraft.sustainabilityIndicators[index][property] = value;
    } else if (targetType === 'featuredAnnouncement') {
      if (!this.currentDraft.featured) this.currentDraft.featured = {};
      this.currentDraft.featured[property] = value;
    } else if (targetType === 'announcement') {
      if (!this.currentDraft.list) this.currentDraft.list = [];
      if (!this.currentDraft.list[index]) this.currentDraft.list[index] = {};
      this.currentDraft.list[index][property] = value;
    } else if (targetType === 'ranking') {
      if (!this.currentDraft.rankingsList) this.currentDraft.rankingsList = [];
      if (!this.currentDraft.rankingsList[index]) this.currentDraft.rankingsList[index] = {};
      this.currentDraft.rankingsList[index][property] = value;
    } else if (targetType === 'event') {
      if (!this.currentDraft.eventsList) this.currentDraft.eventsList = [];
      if (!this.currentDraft.eventsList[index]) this.currentDraft.eventsList[index] = {};
      this.currentDraft.eventsList[index][property] = value;
    } else if (targetType === 'research') {
      if (!this.currentDraft.researchList) this.currentDraft.researchList = [];
      if (!this.currentDraft.researchList[index]) this.currentDraft.researchList[index] = {};
      this.currentDraft.researchList[index][property] = value;
    }
    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  removeNestedTargetProperty(targetType, index, property) {
    this.setNestedTargetProperty(targetType, index, property, '');
    if (window.cmsForms) window.cmsForms.render();
  }

  // --- CONTENT BLOCK ENGINE (Option B: Database Rich Content) ---
  addContentBlock(targetType, itemIndex, blockType) {
    if (!this.currentDraft) this.currentDraft = {};
    let targetList = this._getOrCreateTargetBlockList(targetType, itemIndex);
    if (!targetList) return;

    let newBlock = { type: blockType };
    if (blockType === 'paragraph') {
      newBlock.content = "Enter narrative text here. You can format with **bold**, *italic*, bullet lists (- item), or [links](https://...).";
    } else if (blockType === 'heading') {
      newBlock.level = "h2";
      newBlock.title = "Strategic Milestone & Action Plan";
      newBlock.subtitle = "";
    } else if (blockType === 'callout') {
      newBlock.value = "100%";
      newBlock.label = "Key Impact Indicator";
      newBlock.description = "Measurable university outcome and verified community impact description.";
    } else if (blockType === 'image') {
      newBlock.src = "images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png";
      newBlock.caption = "Photo caption describing verified campus activity or research evidence.";
    } else if (blockType === 'chart') {
      newBlock.chartType = "progress";
      newBlock.title = "Intervention Performance Metrics";
      newBlock.subtitle = "Target vs Actual Outcome";
      newBlock.payload = [
        { label: "Community Participation", percentage: 90, barColorClass: "bg-ucu-blue-dark" },
        { label: "Program Completion", percentage: 80, barColorClass: "bg-ucu-red" }
      ];
    } else if (blockType === 'table') {
      newBlock.headers = ["Image", "Facility / Item Name", "Description", "Status / Date"];
      newBlock.rows = [
        "images/evidence/1.3/image1.png | Main Facility | Primary university infrastructure. | Verified 2025"
      ];
    } else if (blockType === 'document') {
      newBlock.label = "Official Institutional Policy Document (PDF)";
      newBlock.url = "documents/policy.pdf";
    }

    targetList.push(newBlock);
    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  deleteContentBlock(targetType, itemIndex, blockIndex) {
    let targetList = this._getTargetBlockList(targetType, itemIndex);
    if (!targetList || !targetList[blockIndex]) return;
    targetList.splice(blockIndex, 1);
    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  moveContentBlock(targetType, itemIndex, blockIndex, direction) {
    let targetList = this._getTargetBlockList(targetType, itemIndex);
    if (!targetList) return;
    const targetIdx = blockIndex + direction;
    if (targetIdx < 0 || targetIdx >= targetList.length) return;
    const item = targetList.splice(blockIndex, 1)[0];
    targetList.splice(targetIdx, 0, item);
    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  updateContentBlock(targetType, itemIndex, blockIndex, field, value) {
    let targetList = this._getTargetBlockList(targetType, itemIndex);
    if (!targetList || !targetList[blockIndex]) return;
    targetList[blockIndex][field] = value;
    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  _getTargetBlockList(targetType, itemIndex) {
    if (targetType === 'event') {
      return this.currentDraft?.eventsList?.[itemIndex]?.blocks;
    } else if (targetType === 'evidence') {
      return this.currentDraft?.evidenceList?.[itemIndex]?.blocks;
    } else if (targetType === 'sdg') {
      return this.currentDraft?.subSections?.[itemIndex]?.blocks;
    }
    return null;
  }

  _getOrCreateTargetBlockList(targetType, itemIndex) {
    if (targetType === 'event') {
      if (!this.currentDraft.eventsList) this.currentDraft.eventsList = [];
      if (!this.currentDraft.eventsList[itemIndex]) this.currentDraft.eventsList[itemIndex] = {};
      if (!this.currentDraft.eventsList[itemIndex].blocks) this.currentDraft.eventsList[itemIndex].blocks = [];
      return this.currentDraft.eventsList[itemIndex].blocks;
    } else if (targetType === 'evidence') {
      if (!this.currentDraft.evidenceList) this.currentDraft.evidenceList = [];
      if (!this.currentDraft.evidenceList[itemIndex]) this.currentDraft.evidenceList[itemIndex] = {};
      if (!this.currentDraft.evidenceList[itemIndex].blocks) this.currentDraft.evidenceList[itemIndex].blocks = [];
      return this.currentDraft.evidenceList[itemIndex].blocks;
    } else if (targetType === 'sdg') {
      if (!this.currentDraft.subSections) this.currentDraft.subSections = [];
      if (!this.currentDraft.subSections[itemIndex]) this.currentDraft.subSections[itemIndex] = {};
      if (!this.currentDraft.subSections[itemIndex].blocks) this.currentDraft.subSections[itemIndex].blocks = [];
      return this.currentDraft.subSections[itemIndex].blocks;
    }
    return null;
  }

  async uploadAnnouncementImages(announcementIndex, fileList) {
    if (!this.currentDraft) this.currentDraft = {};
    if (!Array.isArray(this.currentDraft.list)) this.currentDraft.list = [];
    if (!this.currentDraft.list[announcementIndex]) return;

    const ann = this.currentDraft.list[announcementIndex];
    if (!Array.isArray(ann.images)) {
      ann.images = ann.image ? [ann.image] : [];
    }

    for (let i = 0; i < fileList.length; i++) {
      if (ann.images.length >= 5) {
        alert("Maximum of 5 images per announcement reached.");
        break;
      }
      const encoded = await compressAndEncodeImage(fileList[i]);
      if (encoded) {
        ann.images.push(encoded);
      }
    }

    ann.image = ann.images[0] || '';
    if (ann.isFeatured) {
      if (!this.currentDraft.featured) this.currentDraft.featured = {};
      this.currentDraft.featured.images = [...ann.images];
      this.currentDraft.featured.image = ann.image;
    }

    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    if (window.cmsForms) window.cmsForms.render();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  removeAnnouncementImage(announcementIndex, imageIndex) {
    if (!this.currentDraft || !Array.isArray(this.currentDraft.list)) return;
    const ann = this.currentDraft.list[announcementIndex];
    if (!ann) return;

    if (!Array.isArray(ann.images)) {
      ann.images = ann.image ? [ann.image] : [];
    }

    ann.images.splice(imageIndex, 1);
    ann.image = ann.images[0] || '';

    if (ann.isFeatured) {
      if (!this.currentDraft.featured) this.currentDraft.featured = {};
      this.currentDraft.featured.images = [...ann.images];
      this.currentDraft.featured.image = ann.image;
    }

    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    if (window.cmsForms) window.cmsForms.render();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  toggleFeaturedAnnouncement(index) {
    if (!this.currentDraft) this.currentDraft = {};
    if (!Array.isArray(this.currentDraft.list)) this.currentDraft.list = [];

    const item = this.currentDraft.list[index];
    if (!item) return;

    const currentlyFeatured = !!item.isFeatured;
    
    // Exclusive single-featured rule:
    // First set all announcements in the list to isFeatured: false
    this.currentDraft.list.forEach(ann => { ann.isFeatured = false; });

    // Toggle the selected announcement
    item.isFeatured = !currentlyFeatured;

    // Maintain draft.featured mirror for backwards compatibility
    if (item.isFeatured) {
      this.currentDraft.featured = { ...item };
    } else {
      this.currentDraft.featured = null;
    }

    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    if (window.cmsForms) window.cmsForms.render();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  setFullDraft(draft, isDirty = false) {
    this.currentDraft = JSON.parse(JSON.stringify(draft));
    this.isDirty = isDirty;
    this.notify();
  }

  evictOldLocalStorage() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('UCU_PUBLISHED_') || k.startsWith('UCU_TEMP_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }

  saveLocalDraft() {
    const key = `UCU_DRAFT_${this.getDocKey()}`;
    try {
      localStorage.setItem(key, JSON.stringify({
        savedAt: new Date().toISOString(),
        data: this.currentDraft
      }));
    } catch (e) {
      this.evictOldLocalStorage();
      try {
        localStorage.setItem(key, JSON.stringify({
          savedAt: new Date().toISOString(),
          data: this.currentDraft
        }));
      } catch (err) {
        // Silently skip if browser storage is full; memory state is active
      }
    }
  }

  getLocalDraft() {
    const key = `UCU_DRAFT_${this.getDocKey()}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("[CMS State] Local draft read error:", e);
    }
    return null;
  }

  clearLocalDraft() {
    const key = `UCU_DRAFT_${this.getDocKey()}`;
    localStorage.removeItem(key);
    this.isDirty = false;
    this.notify();
  }

  /**
   * Fetch data for active section (Firestore -> Local Draft -> Baseline Static)
   */
  async loadActiveSectionData() {
    const { collection: colName, docId } = this.getDocPath(this.activeSection);
    const baseline = this.getBaselineData(this.activeSection);

    // 1. Check Cloud Firestore if configured
    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(db, colName, docId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const cloudData = snap.data();
          const payloadData = cloudData.data || cloudData;
          this.setFullDraft({ ...baseline, ...payloadData, _cloudUpdatedAt: cloudData.updatedAt?.toDate?.() || cloudData.updatedAt }, false);
          return this.currentDraft;
        }
      } catch (err) {
        console.warn("[CMS State] Error loading from Firestore, falling back:", err);
      }
    }

    // 2. Check local draft
    const local = this.getLocalDraft();
    if (local && local.data) {
      this.setFullDraft({ ...baseline, ...local.data }, true);
      return this.currentDraft;
    }

    // 3. Fallback to baseline static data
    this.setFullDraft(baseline, false);
    return this.currentDraft;
  }

  /**
   * Publish current draft to Cloud Firestore
   */
  async publishCurrentDraft() {
    if (!this.currentDraft) throw new Error("No active draft to publish.");

    const { collection: colName, docId } = this.getDocPath(this.activeSection);
    const docKey = this.getDocKey();
    const user = getCurrentUser();
    const payload = {
      sectionType: this.activeSection.type,
      sectionId: this.activeSection.id,
      year: this.activeSection.year,
      ...this.currentDraft,
      updatedAt: new Date().toISOString(),
      updatedBy: user ? user.email : "demo@ucu.edu.ph"
    };

    // 1. Store to LocalStorage as fast local cache with quota protection
    try {
      localStorage.setItem(`UCU_PUBLISHED_${docKey}`, JSON.stringify(payload));
      if (colName === 'pages') {
        localStorage.setItem(`UCU_PUBLISHED_${docId}`, JSON.stringify(payload));
      }
    } catch (storageErr) {
      this.evictOldLocalStorage();
      try {
        localStorage.setItem(`UCU_PUBLISHED_${docKey}`, JSON.stringify(payload));
      } catch (e) {
        // Quota is full, proceeding smoothly to Cloud Firestore publish
      }
    }

    // 2. Cloud Firestore persist if configured
    if (isFirebaseConfigured() && db) {
      const ref = doc(db, colName, docId);

      // Sanitize payload for Firestore to remove redundant mirror fields and ensure size stays well below 1MB
      let firestorePayload = { ...payload };
      if (this.activeSection.type === 'sdg') {
        // Strip duplicate mirror properties that bloat document size
        delete firestorePayload.sections;
        delete firestorePayload.subSections;
        delete firestorePayload.heroBgImage;
        delete firestorePayload.heroIconImage;
      }

      await setDoc(ref, sanitizeForFirestore({
        ...firestorePayload,
        updatedAt: serverTimestamp()
      }), { merge: true });

      // If indicator, also sync individual evidence documents to 'evidences' collection
      if (this.activeSection.type === 'indicator' && Array.isArray(payload.evidences)) {
        for (const ev of payload.evidences) {
          const evDocId = ev.id ? ev.id.replace(/\./g, '_') : (ev.codeID ? ev.codeID.replace(/\./g, '_') : '');
          if (evDocId) {
            try {
              const evRef = doc(db, 'evidences', evDocId);
              await setDoc(evRef, sanitizeForFirestore({
                codeID: ev.codeID || evDocId.replace(/_/g, '.'),
                referenceId: payload.indicatorNum || payload.activeNum || "01",
                title: ev.title || '',
                badge: ev.badge || payload.indicatorTitle || '',
                relatedSdgs: Array.isArray(ev.relatedSdgs) ? ev.relatedSdgs : [],
                src: ev.src || `../evidence/${this.activeSection.id}/${evDocId}.html`,
                thumb_evidence: ev.thumb_evidence || payload.thumb_evidence || 'images/smart-eco-assets/ui-green-seal.png',
                year: this.activeSection.year || "2025",
                updatedAt: serverTimestamp()
              }), { merge: true });
            } catch (e) {
              console.warn('[CMS State] Failed to sync individual evidence doc:', evDocId, e);
            }
          }
        }
      }
    }

    // 3. Clear draft and broadcast live update across all tabs
    this.clearLocalDraft();
    this.isDirty = false;
    this.notify();
    previewBridge.sendLiveUpdate(payload);
    return payload;
  }

  /**
   * Discard current unsaved draft and restore the most recent published version from Cloud/Database
   */
  async discardDraftToLastPublished() {
    this.clearLocalDraft();
    const publishedData = await this.loadActiveSectionData();
    this.setFullDraft(publishedData, false);
    return this.currentDraft;
  }

  /**
   * Revert section to default static HTML state
   */
  async revertToStaticDefault() {
    const { collection: colName, docId } = this.getDocPath(this.activeSection);
    const docKey = this.getDocKey();
    if (isFirebaseConfigured() && db) {
      const ref = doc(db, colName, docId);
      await deleteDoc(ref);
    }
    localStorage.removeItem(`UCU_PUBLISHED_${docKey}`);
    this.clearLocalDraft();
    const baseline = this.getBaselineData(this.activeSection);
    this.setFullDraft(baseline, false);
    return baseline;
  }

  /**
   * Baseline Static Data Factory (Supports object { type, id, year } or positional (type, id, year))
   */
  getBaselineData(section, paramId = null, paramYear = '2025') {
    let type, id, year;
    if (typeof section === 'string') {
      type = section;
      id = paramId;
      year = paramYear || '2025';
    } else if (section && typeof section === 'object') {
      type = section.type;
      id = section.id;
      year = section.year || '2025';
    } else {
      type = 'home';
      id = 'main';
      year = '2025';
    }

    if (type === 'sdg') {
      const meta = SDG_METADATA[id] || { title: `SDG ${id}`, subtitle: "Sustainable Development Goal", color: "#394a8a" };
      const defaultMetrics = [
        { value: "1,920", label: "Beneficiaries Reached", theme: "navy", icon: "users" },
        { value: "45", label: "Active Programs", theme: "red", icon: "target" },
        { value: "15", label: "Research Publications", theme: "navy", icon: "book-open" }
      ];
      const defaultLead = `Sustainable Development Goal ${id} (${meta.title}) drives institutional action at Urdaneta City University. Through innovative research, strategic partnerships, and community-led initiatives, UCU actively contributes to regional and global sustainable development targets.`;

      return {
        reportYear: year,
        heroHeader: {
          goalName: `Sustainable Development Goal ${id}`,
          goalTitle: meta.title,
          subtitle: meta.subtitle,
          sdgNum: parseInt(id) || 1,
          heroBackground: `../images/sdg-banner/sdg${id}.jpg`,
          heroIconImage: `../images/sdg/sdg${id}.png`,
          themeColor: meta.color
        },
        narrative: [
          {
            type: "metric_cards",
            metrics: defaultMetrics
          },
          {
            type: "paragraph",
            content: defaultLead
          }
        ],
        impactDrawers: [
          {
            drawerTitle: "Institutional Framework & Action Plans",
            isOpen: true,
            eventId: "kalahi-cidss",
            contents: [
              {
                type: "paragraph",
                content: `Urdaneta City University (UCU) recognizes that achieving ${meta.title} requires a rigorous, evidence-based approach that integrates campus-wide policies with community engagement.`
              },
              {
                type: "data_viz",
                vizType: "progress",
                title: "Strategic Impact Performance",
                subtitle: "Target vs Actual Outcome",
                payload: [
                  { label: "Community Participation", percentage: 90, barColorClass: "bg-ucu-blue-dark" },
                  { label: "Institutional Alignment", percentage: 85, barColorClass: "bg-ucu-red" },
                  { label: "Sustainable Impact", percentage: 80, barColorClass: "bg-ucu-yellow" }
                ]
              }
            ]
          },
          {
            drawerTitle: "Community Extension & Direct Interventions",
            isOpen: false,
            eventId: "",
            contents: [
              {
                type: "paragraph",
                content: `Through specialized extension programs, UCU faculty and students engage directly with local government units and grassroots communities to deliver measurable impact.`
              }
            ]
          }
        ],
        // Backward-compatible mirror properties
        sdgNum: id,
        year: year,
        title: meta.title,
        subtitle: meta.subtitle,
        colorHex: meta.color,
        heroBgImage: `../images/sdg-banner/sdg${id}.jpg`,
        heroIconImage: `../images/sdg/sdg${id}.png`,
        metrics: defaultMetrics,
        executiveSummary: defaultLead
      };
    }

    if (type === 'home') {
      return {
        heroEyebrow: "Urdaneta City University",
        heroHeadline: "Global Standards.",
        heroHeadlineHighlight: "Local Impact.",
        heroSubtitle: "Driving institutional excellence through strategic international linkages, high-impact research, and an unwavering commitment to the UN Sustainable Development Goals.",
        heroCta1Text: "Explore Partnerships",
        heroCta1Link: "partnership.html",
        heroCta2Text: "View SDG Reports",
        heroCta2Link: "sdg-reports/2025.html",
        sliderImages: [
          "../images/home-sliders/1.png",
          "../images/home-sliders/2.png",
          "../images/home-sliders/3.png"
        ],
        commitmentEyebrow: "Our Commitment",
        commitmentTitle: "Global Standards, Local Impact",
        commitmentCtaText: "Read More",
        commitmentCtaLink: "announcement.html",
        introParagraph1: "Urdaneta City University stands at the intersection of international academic excellence and localized sustainable development. We are committed to dismantling geographical boundaries through strategic global linkages, robust research collaboration, and an unwavering dedication to the United Nations Agenda 2030.",
        introParagraph2: "By forging active partnerships across multiple continents, we subject our academic frameworks to rigorous global evaluations. This international exposure translates into cutting-edge pedagogy and facilities, empowering our External Office to drive true socio-economic mobility through evidence-based community outreach.",
        headlineSliders: [
          "../images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
          "../images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
          "../images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png"
        ],
        metricsEyebrow: "Institutional Impact",
        metricsTitle: "Strength in Numbers",
        metrics: [
          { label: "Total Events", value: "48", theme: "white", icon: "calendar" },
          { label: "Research & Pubs", value: "124", theme: "white", icon: "book-open" },
          { label: "Univ Rankings", value: "6", theme: "navy", icon: "award" },
          { label: "Local Partners", value: "85", theme: "white", icon: "map-pin" },
          { label: "Global Partners", value: "24", theme: "white", icon: "globe" },
          { label: "Active MOUs", value: "42", theme: "red", icon: "handshake" }
        ],
        allianceTitle: "Forge a Strategic Alliance",
        allianceDescription: "Urdaneta City University (UCU) actively seeks to expand its global and local network through high-impact institutional linkages. We invite esteemed academic organizations and industry leaders to initialize formal collaboration proposals via our centralized portal.",
        partnershipFormUrl: "https://forms.google.com/your-form-id-here",
        emailExternal: "externalaffairsandlinkages@ucu.edu.ph",
        emailOfficial: "officeofthepresident@ucu.edu.ph"
      };
    }

    if (type === 'rankings') {
      return {
        heroEyebrow: "A Network of Excellence",
        heroHeadline: "Connecting UCU",
        heroHighlight: "Globally",
        heroDescription: "Forging high-impact relationships with global academic institutions and premier industry leaders to elevate the educational standard of Urdaneta City University.",
        standingTitle: "Current Global Standing",
        trajectoryEyebrow: "Institutional Trajectory",
        trajectoryTitle: "Historical Performance",
        terminusStatement: `"We will continue our commitment to relentless innovation and real-world impact, ensuring the little giant UCU rises to meet the titans on the global stage."`,
        rankingsList: [
          {
            org: "AppliedHE",
            year: "2026",
            mainRankLabel: "Overall Asia Ranking",
            mainRank: "241-260",
            category: "All Asia",
            badgeClass: "bg-[#f26422] text-white",
            logo: "images/rankings-logo/applied-he.png",
            shortDescription: "Top tier recognition among Public and Local Universities within the ASEAN Region and the Philippines.",
            publicationDate: "March 15, 2026",
            metrics: [
              { label: "Public Univ. ASEAN Region", value: "#107", color: "#fbef4b" },
              { label: "Public Univ. Philippines", value: "#17", color: "#fbef4b" },
              { label: "Public Univ. Region 1", value: "#2", color: "#fbef4b" },
              { label: "Local Univ. & College Region 1", value: "#1", color: "#c43643" }
            ]
          },
          {
            org: "WURI",
            year: "2025",
            mainRankLabel: "World University Ranking",
            mainRank: "#44",
            category: "World Rankings",
            badgeClass: "bg-[#0f4088] text-white",
            logo: "images/rankings-logo/wuri.png",
            shortDescription: "Recognized globally for real-world impact and innovative approaches to education and industrial application.",
            publicationDate: "June 12, 2025",
            metrics: [
              { label: "A3 Industrial Application", value: "#1", subtext: '"Smart Aquaculture: Advancing Regional Fisheries Sustainability Through Innovative Monitoring Solutions"', color: "#394a8a" },
              { label: "A8 SDG-Based Responses", value: "#2", subtext: '"AgriTech for All: Empowering Farmers with Mobile Solutions for Disease Detection and Precision Farming"', color: "#394a8a" },
              { label: "A2 Student Mobility & Openness", value: "#4", subtext: '"Empowering Communities, Preserving Culture: A Global Journey into Sustainable Tourism"', color: "#394a8a" }
            ]
          },
          {
            org: "UI GreenMetric",
            year: "2025",
            mainRankLabel: "World Rankings",
            mainRank: "#362",
            category: "World Rankings",
            badgeClass: "bg-[#00993d] text-white",
            logo: "images/rankings-logo/ui-green.png",
            shortDescription: "Ranked #1 Local University in the Philippines for excellence in environmental sustainability and green campus management.",
            publicationDate: "December 5, 2025",
            metrics: [
              { label: "LUC in the Philippines", value: "#1", color: "#00993d" },
              { label: "LUC in Northern Luzon", value: "#1", color: "#00993d" },
              { label: "Province of Pangasinan", value: "#1", color: "#00993d" },
              { label: "Region 1", value: "#3", color: "#00993d" },
              { label: "Philippines", value: "#9", color: "#00993d" },
              { label: "Asia", value: "#203", color: "#00993d" }
            ]
          },
          {
            org: "THE Impact",
            year: "2025",
            mainRankLabel: "Global Impact Rank",
            mainRank: "1501+",
            category: "Impact Rankings",
            badgeClass: "bg-[#201f1f] text-white",
            logo: "images/rankings-logo/the-impact.png",
            shortDescription: "Evaluated against the United Nations' Sustainable Development Goals (SDGs) for global institutional impact.",
            publicationDate: "June 20, 2025",
            metrics: [
              { label: "SDG 1: No Poverty", value: "Global 401–600", subtext: "PH #6 | Region 1 #2", color: "#E5243B" },
              { label: "SDG 3: Good Health", value: "Global 1001–1500", subtext: "PH #6 | Region 1 #3", color: "#4C9F38" },
              { label: "SDG 4: Quality Ed.", value: "Global 1001–1500", subtext: "PH #5 | Region 1 #3", color: "#C5192D" },
              { label: "SDG 5: Gender Eq.", value: "Global 601–800", subtext: "PH #6 | Region 1 #3", color: "#FF3A21" },
              { label: "SDG 16: Peace & Justice", value: "Global 801–1000", subtext: "PH #6 | Region 1 #3", color: "#00689D" },
              { label: "SDG 17: Partnerships", value: "Global 1501+", subtext: "PH #7 | Region 1 #4", color: "#19486A" }
            ]
          },
          {
            org: "WURI",
            year: "2024",
            mainRankLabel: "World University Ranking",
            mainRank: "#281",
            category: "World Rankings",
            badgeClass: "bg-[#0f4088] text-white",
            logo: "images/rankings-logo/wuri.png",
            shortDescription: "",
            publicationDate: "June 2024",
            metrics: [
              { label: "A8 Support for Global Resilience", value: "#8", subtext: '"CyberShield: A Provincial-Wide Resilience Program Advancing Cybersecurity"', color: "#394a8a" },
              { label: "A3 Industrial Application", value: "#13", subtext: '"Bagsakan Market Tariff Information System Towards a Smart City of Urdaneta"', color: "#394a8a" },
              { label: "B4 Innovation in Promotion/Symbol", value: "#21", subtext: '"The ORATA Branding: Fostering a Noble Identity"', color: "#394a8a" }
            ]
          },
          {
            org: "UI GreenMetric",
            year: "2024",
            mainRankLabel: "World Rankings",
            mainRank: "#361",
            category: "World Rankings",
            badgeClass: "bg-[#00993d] text-white",
            logo: "images/rankings-logo/ui-green.png",
            shortDescription: "",
            publicationDate: "December 2024",
            metrics: [
              { label: "Locale Univ. in the PH", value: "#1", color: "#00993d" },
              { label: "Province of Pangasinan", value: "#1", color: "#00993d" },
              { label: "Region 1", value: "#3", color: "#00993d" },
              { label: "Philippines", value: "#8", color: "#00993d" },
              { label: "Asia", value: "#189", color: "#00993d" }
            ]
          }
        ]
      };
    }

    if (type === 'events') {
      return {
        eventsList: [
          {
            id: "kalahi-cidss",
            title: "DSWD's Kalahi-CIDSS Cash-for-Work Program",
            date: "March 15-22, 2025",
            desc: "Urdaneta City University strengthens community engagement through support for DSWD's sustainable livelihood and infrastructure programs in vulnerable sectors.",
            img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic6.png",
            relatedSdgs: [1, 8, 10],
            isFeatured: true,
            isHighlights: true
          },
          {
            id: "smart-campus-launch",
            title: "UCU Unveils Phase 1 of the Smart Eco-Campus Initiative",
            date: "February 10, 2025",
            desc: "The university officially transitions to a 30% solar-powered grid, marking a massive milestone in our UI GreenMetric institutional commitments.",
            img: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?q=80&w=800&auto=format&fit=crop",
            relatedSdgs: [7, 9, 11, 13],
            isFeatured: true,
            isHighlights: true
          },
          {
            id: "health-symposium",
            title: "International Symposium on Rural Health Diagnostics",
            date: "January 28, 2025",
            desc: "Global experts gather at the UCU Main Hall to discuss digital interventions for remote maternal health.",
            img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=400&auto=format&fit=crop",
            relatedSdgs: [3, 17],
            isFeatured: true,
            isHighlights: false
          }
        ]
      };
    }

    if (type === 'smart_eco' || type === 'smarteco') {
      return {
        heroEyebrow: "Innovation Powered by Sustainability",
        heroHeadline: "Smart Eco",
        heroHighlight: "Campus",
        heroDescription: "Creating a campus where innovation, sustainability, and responsible growth work together to elevate institutional performance and environmental impact.",
        recognitionEyebrow: "Global Recognition",
        recognitionTitle: "An Academic Milestone",
        introParagraph1: "The UI GreenMetric World University Rankings evaluates green campuses and environmental sustainability across 39 indicators in 6 criteria.",
        introParagraph2: "As a first try for UCU in this global ranking, it is an academic milestone worthy of celebration.",
        introParagraph3: "Congratulations, UCUians! Mabuhay ang Urdaneta City University!",
        awardImages: [
          "./images/smart-eco-assets/ui-gm2.jpg",
          "./images/smart-eco-assets/ui-gm.jpg"
        ],
        standingHeader: "Out of 1,477 universities worldwide in 2025, WE ARE:",
        milestones: [
          { rank: "#1", label: "Local Universities & Colleges (LUC) in the Philippines", color: "#fbef4b", theme: "blue", isFeatured: true },
          { rank: "#1", label: "HEI in Water Management Category", color: "#c43643", theme: "white" },
          { rank: "#1", label: "in the Province of Pangasinan", color: "#c43643", theme: "white" },
          { rank: "#3", label: "in Region 1", color: "#c43643", theme: "white" },
          { rank: "#8", label: "in the Entire Philippines", color: "#c43643", theme: "white" },
          { rank: "#189", label: "in Asia", color: "#c43643", theme: "white" },
          { rank: "#361", label: "IN THE WORLD", color: "#ffffff", theme: "red", isWorld: true }
        ],
        sustainabilityIndicators: [
          { num: "01", title: "Setting and Infrastructure", link: "indicators/infrastructure.html", id: "infrastructure" },
          { num: "02", title: "Energy and Climate Change", link: "indicators/energy.html", id: "energy" },
          { num: "03", title: "Waste", link: "indicators/waste.html", id: "waste" },
          { num: "04", title: "Water", link: "indicators/water.html", id: "water" },
          { num: "05", title: "Transportation", link: "indicators/transportation.html", id: "transportation" },
          { num: "06", title: "Education and Research", link: "indicators/education.html", id: "education" },
          { num: "07", title: "Digitalization", link: "indicators/digitalization.html", id: "digitalization" }
        ],
        concludingParagraph: "These seven sustainability indicators form the strategic framework of Urdaneta City University’s Smart Eco Campus initiative. By aggressively aligning our institutional metrics with global environmental standards—such as the UI GreenMetric framework—we do more than cultivate a green learning environment. We forge high-impact linkages with international stakeholders, driving collaborative research and scalable sustainable practices that elevate our graduates to global competitiveness."
      };
    }

    if (type === 'indicator') {
      const pillar = INDICATOR_PILLARS.find(p => p.id === id) || { id, title: "Setting & Infrastructure", num: "01" };
      
      const defaultManifests = {
        infrastructure: {
          metrics: [
            { value: "39", label: "Campus Sites", theme: "navy", evidenceId: "1_3" },
            { value: "35,544", label: "Campus Area (m²)", theme: "red", evidenceId: "1_5" },
            { value: "61.1%", label: "Open Space Ratio", theme: "navy", evidenceId: "1_8" }
          ],
          narrative: `Urdaneta City University (UCU) demonstrates a progressive campus design that balances modern facilities with extensive natural landscapes. Spanning a total area of 35,544 square meters (approximately 3.55 hectares), the university grounds are carefully zoned to support academic excellence, community interaction, and ecological preservation. A major highlight of the campus setting is its exceptional allocation of open spaces, which cover 21,731 square meters, yielding an open space ratio of 61.1% of the entire campus.\n\nThe campus integrates green and sustainable infrastructures such as the Botanical Garden, Square Garden, and the Marawi Garden Conservation Facilities. These areas serve as biological genebanks for safeguarding plant, animal, and wildlife genetic resources critical to regional biodiversity and sustainable food systems. They also function as active living laboratories where students and faculty engage in research, teaching, and community-centered environmental action.\n\nTo ensure the health, safety, and inclusion of its diverse academic community, UCU provides robust support facilities. This includes disabled-access ramps, specialized comfort rooms, a dedicated lactation room for nursing mothers, and a supportive PWD Learning Resource Center. Furthermore, the campus is secured by a modern surveillance CCTV system, active QR code ID gate turnstiles, a fully equipped University Clinic, and a proactive Disaster Risk Reduction and Management Office (DRRMO), fostering a resilient, inclusive, and protective environment.`,
          evidenceList: [
            { id: "1_3", title: "1.3 Number of Campus Sites", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_3.html", relatedSdgs: [4, 9, 11] },
            { id: "1_4", title: "1.4 Main Campus Setting", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_4.html", relatedSdgs: [4, 11, 15] },
            { id: "1_5", title: "1.5 Total Main Campus Area", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_5.html", relatedSdgs: [4, 11, 15] },
            { id: "1_7", title: "1.7 Total Campus Buildings Area", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_7.html", relatedSdgs: [3, 4, 9, 11, 15] },
            { id: "1_8", title: "1.8 The Ratio of Open Space Area to Total Area", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_8.html", relatedSdgs: [11, 13, 15] },
            { id: "1_9", title: "1.9 Total Area on Campus Covered in Forest Vegetation Used for Research, Teaching, and/or Community Engagement (meter2)", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_9.html", relatedSdgs: [3, 4, 11, 15] },
            { id: "1_10", title: "1.10 Total Area on Campus Covered in Planted Vegetation (meter 2)", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_10.html", relatedSdgs: [3, 4, 11, 15] },
            { id: "1_15", title: "1.15 Campus Facilities for Disabled, Special Needs and Maternity Care", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_15.html", relatedSdgs: [3, 4, 5, 10, 11] },
            { id: "1_16", title: "1.16 Safety and Security Infrastructure", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_16.html", relatedSdgs: [3, 11, 16] },
            { id: "1_17", title: "1.17 Health and Safety Infrastructure", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_17.html", relatedSdgs: [3, 4, 11] },
            { id: "1_18", title: "1.18 Genetic Resource Conservation Facilities", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_18.html", relatedSdgs: [2, 15] },
            { id: "1_19", title: "1.19 Green Campus Outdoor Features", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_19.html", relatedSdgs: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17] }
          ]
        },
        energy: {
          metrics: [
            { value: "91%", label: "Energy-Efficient Appliances", theme: "navy", evidenceId: "2_1" },
            { value: "571,950", label: "kWh Electricity Per Year", theme: "red", evidenceId: "2_6" },
            { value: "503", label: "Metric Tons CO₂ (2024)", theme: "navy", evidenceId: "2_11" }
          ],
          narrative: `Urdaneta City University is actively pursuing energy efficiency and climate-responsible operations across its campus. A total of 91% of campus appliances are classified as energy-efficient, including all 1,096 LED lamps and 31 street lights operating at 100% efficiency, alongside 89 out of 122 inverter-type air conditioning units. The university consumes approximately 571,950 kWh of electricity annually to power its academic buildings, administrative offices, and campus-wide lighting systems.\n\nUCU has invested in renewable energy through a 4.5 kW grid-connected solar photovoltaic system installed on the Dr. Teofidez E. Calvero Building since 2017. This system generates approximately 4,297 kWh per year, contributing 0.75% of total campus energy demand. The university has also developed a comprehensive Green Building Implementation Plan covering energy efficiency, water conservation, sustainable materials, and indoor environmental quality across all six major campus structures.\n\nThe university's total carbon footprint for 2024 stands at 503 metric tons of CO₂, computed from electricity consumption (480.44 metric tons), campus shuttle bus operations (0.35 metric tons), private cars (13.44 metric tons), and motorcycles (8.8 metric tons). Through its greenhouse gas emission reduction programs and continued investment in clean energy infrastructure, UCU demonstrates a measurable commitment to climate action and operational sustainability.`,
          evidenceList: [
            { id: "2_1", title: "2.1 Energy Efficient Appliances Usage", badge: "Energy and Climate Change", src: "../evidence/energy/2_1.html", relatedSdgs: [7, 12, 13] },
            { id: "2_3", title: "2.3 Smart Building Implementation", badge: "Energy and Climate Change", src: "../evidence/energy/2_3.html", relatedSdgs: [7, 9, 11, 13] },
            { id: "2_5", title: "2.5 Renewable Energy Sources in Campus", badge: "Energy and Climate Change", src: "../evidence/energy/2_5.html", relatedSdgs: [7, 11, 13] },
            { id: "2_6", title: "2.6 Electricity Usage Per Year (in Kilowatt Hour)", badge: "Energy and Climate Change", src: "../evidence/energy/2_6.html", relatedSdgs: [7, 12, 13] },
            { id: "2_8", title: "2.8 Ratio of Renewable Energy Production Divided by Total Energy Usage Per Year", badge: "Energy and Climate Change", src: "../evidence/energy/2_8.html", relatedSdgs: [7, 12, 13] },
            { id: "2_9", title: "2.9 Elements of Green Building Implementation As Reflected in All Buildings", badge: "Energy and Climate Change", src: "../evidence/energy/2_9.html", relatedSdgs: [3, 6, 7, 9, 11, 12, 13] },
            { id: "2_10", title: "2.10 Greenhouse Gas Emission Reduction Program", badge: "Energy and Climate Change", src: "../evidence/energy/2_10.html", relatedSdgs: [7, 13] },
            { id: "2_11", title: "2.11 The Total Carbon Footprint (co2emission in the Last 12 Months, in Metric Tons)", badge: "Energy and Climate Change", src: "../evidence/energy/2_11.html", relatedSdgs: [7, 11, 13] },
            { id: "2_13", title: "2.13 Number of Innovative Program(s) in Energy and Climate Change (EC.9)", badge: "Energy and Climate Change", src: "../evidence/energy/2_13.html", relatedSdgs: [4, 7, 9, 11, 13] },
            { id: "2_14", title: "2.14 Impactful University Program(s) on Climate Change", badge: "Energy and Climate Change", src: "../evidence/energy/2_14.html", relatedSdgs: [4, 7, 11, 12, 13] },
            { id: "2_15", title: "2.15 Planning, Implementation, Monitoring and/or Evaluation of All Programs Related to Energy and Climate Change Through the Utilization of Information and Communication Technology (ict)", badge: "Energy and Climate Change", src: "../evidence/energy/2_15.html", relatedSdgs: [4, 7, 9, 11, 13] },
            { id: "2_16", title: "2.16 Impact of Energy and Climate Change Programs in Supporting the Sustainable Development Goals (SDGs)", badge: "Energy and Climate Change", src: "../evidence/energy/2_16.html", relatedSdgs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] }
          ]
        },
        waste: {
          metrics: [
            { value: "30 tons", label: "Waste Reduced Year-on-Year", theme: "navy", evidenceId: "3_2" },
            { value: "11.3", label: "Tons Organic Waste", theme: "red", evidenceId: "3_5" },
            { value: "0", label: "Food Waste (Tons)", theme: "navy", evidenceId: "3_5" }
          ],
          narrative: `Urdaneta City University implements a comprehensive waste management system that addresses organic, inorganic, and hazardous waste streams across its campus. Year-on-year data shows a measurable reduction of 30 tons in combined paper and plastic waste, with plastic decreasing from 161 to 147 tons and paper from 180 to 160 tons. The university actively promotes waste minimization through programs such as Eco-Craft (upcycling plastic bottles into functional products) and its annual Segregation Week campaign, which reinforce proper sorting, recycling, and responsible consumption practices.\n\nThe campus generates 11.3 tons of organic waste annually, composed entirely of leaf litter from grounds maintenance, with zero measurable food waste recorded during the assessment period. This outcome reflects the effectiveness of UCU's food service management strategies, including portion control and responsible consumption campaigns. Organic waste is processed on-site through the Marawi/STP (Sewage Treatment Plant), which converts leaf litter into nutrient-rich compost for campus landscaping and greening programs, operating on a closed-loop circular economy model.\n\nFor sewage treatment, UCU operates an innovative Bamboo Sewer Treatment Plant (BSTP) that uses Bayug Bamboo as a nature-based filtration and wastewater treatment system. This facility integrates rainwater harvesting, carbon sequestration, and soil stabilization, contributing to improved water quality and reduced greenhouse gas emissions. Inorganic waste is tracked at the source level, with 0.309 tons of plastics processed and zero paper waste generated, reflecting the university's successful transition to paperless administrative and academic systems.`,
          evidenceList: [
            { id: "3_1", title: "3.1 3r (reduce, Reuse and Recycle) Program for University Waste", badge: "Waste", src: "../evidence/waste/3_1.html", relatedSdgs: [4, 11, 12] },
            { id: "3_2", title: "3.2 Total Volume of Paper and Plastic Produced This Year", badge: "Waste", src: "../evidence/waste/3_2.html", relatedSdgs: [11, 12, 13] },
            { id: "3_3", title: "3.3 Total Volume of Paper and Plastic Produced Last Year", badge: "Waste", src: "../evidence/waste/3_3.html", relatedSdgs: [11, 12, 13] },
            { id: "3_4", title: "3.4 Program to Reduce the Use of Paper and Plastic on Campus (WS.2)", badge: "Waste", src: "../evidence/waste/3_4.html", relatedSdgs: [3, 4, 8, 9, 11, 12, 13, 14, 15, 16, 17] },
            { id: "3_5", title: "3.5 Total Volume Organic Waste Produced This Year", badge: "Waste", src: "../evidence/waste/3_5.html", relatedSdgs: [11, 12, 15] },
            { id: "3_6", title: "3.6 Total Volume Organic Waste Produced Last Year", badge: "Waste", src: "../evidence/waste/3_6.html", relatedSdgs: [11, 12, 15] },
            { id: "3_7", title: "3.7 Total Volume Organic Waste Treated This Year", badge: "Waste", src: "../evidence/waste/3_7.html", relatedSdgs: [6, 11, 12, 13, 15] },
            { id: "3_8", title: "3.8 Organic Waste Treatment", badge: "Waste", src: "../evidence/waste/3_8.html", relatedSdgs: [6, 11, 12, 13, 15] },
            { id: "3_9", title: "3.9 Total VolumeHazardous & Toxic Waste Produced This Year", badge: "Waste", src: "../evidence/waste/3_9.html", relatedSdgs: [11, 12] },
            { id: "3_10", title: "3.10 Total Volume Inorganic Waste Produced Last Year", badge: "Waste", src: "../evidence/waste/3_10.html", relatedSdgs: [11, 12] },
            { id: "3_11", title: "3.11 Total Volume Inorganic Waste Treated This Year", badge: "Waste", src: "../evidence/waste/3_11.html", relatedSdgs: [11, 12] },
            { id: "3_12", title: "3.12 Inorganic Waste Treatment", badge: "Waste", src: "../evidence/waste/3_12.html", relatedSdgs: [9, 11, 12] },
            { id: "3_13", title: "3.13 Total Volume Toxic Waste Produced This Year", badge: "Waste", src: "../evidence/waste/3_13.html", relatedSdgs: [3, 11, 12] },
            { id: "3_14", title: "3.14 Total Volume Toxic Waste Produced Last Year", badge: "Waste", src: "../evidence/waste/3_14.html", relatedSdgs: [3, 11, 12] },
            { id: "3_15", title: "3.15 Total Volume Toxic Waste Treated This Year", badge: "Waste", src: "../evidence/waste/3_15.html", relatedSdgs: [3, 11, 12] },
            { id: "3_16", title: "3.16 Toxic Waste Treatment", badge: "Waste", src: "../evidence/waste/3_16.html", relatedSdgs: [3, 11, 12] },
            { id: "3_17", title: "3.17 Sewage Disposal", badge: "Waste", src: "../evidence/waste/3_17.html", relatedSdgs: [6, 11, 12, 13, 15] },
            { id: "3_19", title: "3.19 Impact of Waste Management Programs in Supporting the Sustainable Development Goals (SDGs)", badge: "Waste", src: "../evidence/waste/3_19.html", relatedSdgs: [1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] }
          ]
        },
        water: {
          metrics: [
            { value: "80%", label: "Water-Efficient Appliances", theme: "navy", evidenceId: "4_4" },
            { value: "100%", label: "Buildings With Harvesting", theme: "red", evidenceId: "4_1" },
            { value: "Closed-Loop", label: "Wastewater Recycling", theme: "navy", evidenceId: "4_3" }
          ],
          narrative: `Urdaneta City University has achieved an average water appliance efficiency rate of 80%, with 40 out of 50 toilet units upgraded to water-efficient models and all 50 flush systems operating at 100% efficiency. Every campus building is equipped with an integrated rainwater harvesting system that captures precipitation from rooftops and channels it into strategically located storage tanks. The harvested rainwater is systematically reused for landscape irrigation, toilet flushing, and general facility cleaning, significantly reducing the university's dependence on potable water sources.\n\nThe university operates a dedicated treated water consumption program that routes processed wastewater through a campus-wide pipeline network for non-potable applications. A comprehensive Water Pollution Control Program enforces Best Management Practices for waste handling, maintains a Water Quality Task Force, and conducts regular water quality testing of campus ponds and canal systems. ICT-based monitoring through digital water meters and data analytics dashboards enables real-time consumption tracking and leak detection across all facilities.\n\nWastewater generated across campus buildings and laboratories undergoes a closed-loop multi-stage recycling process—including activated sludge treatment and biofiltration—before being routed back for non-potable operations. This recycled water network, combined with student-led waterway cleanup campaigns organized by the Water Quality Task Force, ensures that UCU's local environmental stewardship directly aligns with 10 Sustainable Development Goals.`,
          evidenceList: [
            { id: "4_1", title: "4.1 Water Conservation Program Implementation", badge: "Water", src: "../evidence/water/4_1.html", relatedSdgs: [4, 6, 11, 12] },
            { id: "4_2", title: "4.2 Water Conservation Program Implementation", badge: "Water", src: "../evidence/water/4_2.html", relatedSdgs: [4, 6, 11, 12] },
            { id: "4_3", title: "4.3 Water Recycling Program Implementation", badge: "Water", src: "../evidence/water/4_3.html", relatedSdgs: [6, 11, 12, 15] },
            { id: "4_4", title: "4.4 Water Efficient Appliances Usage (e.g. Hand Washing Taps, Toilet Flush, Etc.)", badge: "Water", src: "../evidence/water/4_4.html", relatedSdgs: [6, 12] },
            { id: "4_5", title: "4.5 Consumption of Treated Water", badge: "Water", src: "../evidence/water/4_5.html", relatedSdgs: [6, 11, 12] },
            { id: "4_6", title: "4.6 Water Pollution Control in Campus Area", badge: "Water", src: "../evidence/water/4_6.html", relatedSdgs: [4, 6, 11, 12, 14, 15] },
            { id: "4_7", title: "4.7 Impact of Water Management Programs in Supporting the Sustainable Development Goals (SDGs)", badge: "Water", src: "../evidence/water/4_7.html", relatedSdgs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] }
          ]
        },
        transportation: {
          metrics: [
            { value: "840", label: "Daily Vehicles", theme: "navy", evidenceId: "5_4" },
            { value: "5,636 m²", label: "Parking Area", theme: "red", evidenceId: "5_13" },
            { value: "100%", label: "Coding Scheme", theme: "navy", evidenceId: "5_14" }
          ],
          narrative: `Urdaneta City University monitors approximately 840 daily vehicles entering the campus, consisting of 222 cars and 610 motorcycles, plus 8 university-managed vehicles. With a campus population of 5,000, this yields a vehicle density ratio of 0.168, indicating a moderate traffic level that the university actively manages through multiple sustainability-oriented transport programs.\n\nThe university dedicates a total of 5,636 square meters across four designated parking zones (representing 16.98% of total campus area). To control congestion and reduce private vehicle use, UCU enforces a Student Vehicle Number Coding Scheme from Monday through Friday, restricting campus entry based on plate numbers. The Campus Commute Connect initiative further promotes shared mobility by proposing a network of hybrid buses connecting the campus with nearby residential communities, complemented by dedicated bike lanes and secure bicycle parking facilities.\n\nUCU operates four zero-emission electric vehicles (e-bikes) with on-site charging stations, deployed for intra-campus operations by the Engineering Management and Auxiliary Services, General Services Office, and Supply Office. A comprehensive pedestrian path policy ensures safe, accessible walkways throughout the campus, supporting walking as a primary mode of intra-campus mobility and contributing to reduced carbon emissions and improved air quality.`,
          evidenceList: [
            { id: "5_4", title: "5.4 The Total Number of Vehicles (cars and Motorcycles) Divided by Total Campus", badge: "Transportation", src: "../evidence/transport/5_4.html", relatedSdgs: [11, 13] },
            { id: "5_5", title: "5.5 Shuttle Services", badge: "Transportation", src: "../evidence/transport/5_5.html", relatedSdgs: [11, 13] },
            { id: "5_9", title: "5.9 Zero Emission Vehicles (zev) Availability on Campus", badge: "Transportation", src: "../evidence/transport/5_9.html", relatedSdgs: [7, 11, 13] },
            { id: "5_13", title: "5.13 Ratio of Parking Area to Total Campus Area", badge: "Transportation", src: "../evidence/transport/5_13.html", relatedSdgs: [11, 12, 15] },
            { id: "5_14", title: "5.14 Program to Limit or Decrease the Parking Area on Campus for the Last 3 Years", badge: "Transportation", src: "../evidence/transport/5_14.html", relatedSdgs: [4, 11, 12, 13] },
            { id: "5_15", title: "5.15 Number of Transportation Initiatives to Decrease Private Vehicles on Campus", badge: "Transportation", src: "../evidence/transport/5_15.html", relatedSdgs: [4, 9, 11, 13] },
            { id: "5_16", title: "5.16 Pedestrian Path Policy on Campus", badge: "Transportation", src: "../evidence/transport/5_16.html", relatedSdgs: [3, 10, 11] },
            { id: "5_18", title: "5.18 Impact of Transportation Programs in Supporting the Sustainable Development Goals (SDGs)", badge: "Transportation", src: "../evidence/transport/5_18.html", relatedSdgs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] }
          ]
        },
        education: {
          metrics: [
            { value: "50.4%", label: "Green Curriculum Ratio", theme: "navy", evidenceId: "6_1" },
            { value: "8", label: "Eco-Startups Incubated", theme: "red", evidenceId: "6_16" },
            { value: "330", label: "Green Career Placements", theme: "navy", evidenceId: "6_17" }
          ],
          narrative: `Urdaneta City University embeds ecological stewardship throughout its academic landscape, with 185 out of 367 total courses integrating sustainability principles. This represents a 50.4% green curriculum ratio across multiple departments, ensuring that students develop core competencies in resource conservation, climate action, and environmental ethics aligned with 11 different United Nations Sustainable Development Goals.\n\nIn December 2024, the university launched eight sustainability-focused startup ventures through its business incubation programs. These innovative projects turn agricultural byproducts and local resources into commercial wellness and food solutions, such as Banana Peel Patties by ChoPeel, Purslane Chips by Green Bites, Kawayang Tinik Bamboo Shoot Bitesnacks, and nutrient-dense Malunggay Crackers. These initiatives foster a robust campus culture of green entrepreneurship and sustainable economic development.\n\nThe university's practical commitments extend to career transitions and research output. UCU has tracked 330 graduates securing green job placements over a three-year period, representing 23.8% of graduates from key technical departments. This professional pipeline is reinforced by active faculty inquiry, with publications in peer-reviewed journals doubling in 2025 to explore topics like AI-driven methodological gap analysis tools and virtual resilience in graduate studies.`,
          evidenceList: [
            { id: "6_1", title: "6.1 Number of Courses/Subjects Related to Sustainability Offered", badge: "Education and Research", src: "../evidence/education/6_1.html", relatedSdgs: [4, 13] },
            { id: "6_2", title: "6.2 Total Number of Courses/Subjects Offered", badge: "Education and Research", src: "../evidence/education/6_2.html", relatedSdgs: [4] },
            { id: "6_3", title: "6.3 Total Number of Study Program Related to Sustainability Offered", badge: "Education and Research", src: "../evidence/education/6_3.html", relatedSdgs: [4, 13] },
            { id: "6_5", title: "6.5 Total Research Funds Dedicated to Sustainability Research (in Us Dollars)", badge: "Education and Research", src: "../evidence/education/6_5.html", relatedSdgs: [9, 13, 17] },
            { id: "6_6", title: "6.6 Total Research Funds (in Us Dollars)", badge: "Education and Research", src: "../evidence/education/6_6.html", relatedSdgs: [9] },
            { id: "6_8", title: "6.8 Number of Lecturers and Researchers on Campus in One Year Period", badge: "Education and Research", src: "../evidence/education/6_8.html", relatedSdgs: [4, 8] },
            { id: "6_9", title: "6.9 Number of Scholarly Publications on Sustainability in One Year Period", badge: "Education and Research", src: "../evidence/education/6_9.html", relatedSdgs: [4, 9, 10] },
            { id: "6_10", title: "6.10 Ratio of Scholarly Publications to Lecturers and Researchers", badge: "Education and Research", src: "../evidence/education/6_10.html", relatedSdgs: [4, 9] },
            { id: "6_11", title: "6.11 Number of Events Related to Sustainability (ED.4)", badge: "Education and Research", src: "../evidence/education/6_11.html", relatedSdgs: [4, 13, 17] },
            { id: "6_12", title: "6.12 Number of Activities Organized by Student Organizations Related to Sustainability Per Year (ED.5)", badge: "Education and Research", src: "../evidence/education/6_12.html", relatedSdgs: [4, 11, 12, 13] },
            { id: "6_13", title: "6.13 Number of Cultural Activities on Campus (e.g. Cultural Festival) (ED.6)", badge: "Education and Research", src: "../evidence/education/6_13.html", relatedSdgs: [4, 11] },
            { id: "6_14", title: "6.14 Number of University Sustainability Program(s) with International Collaborations (ED.7)", badge: "Education and Research", src: "../evidence/education/6_14.html", relatedSdgs: [4, 16, 17] },
            { id: "6_15", title: "6.15 Number of Sustainablity Community Services Project Organised and/or Involving Students (ED.8)", badge: "Education & Research", src: "../evidence/education/6_15.html", relatedSdgs: [4, 11, 17] },
            { id: "6_16", title: "6.16 Number of Sustainability-related Startups", badge: "Education & Research", src: "../evidence/education/6_16.html", relatedSdgs: [2, 3, 8, 9, 12] },
            { id: "6_17", title: "6.17 Total Number of Graduates with Green Jobs (for the Last 3 Years)", badge: "Education and Research", src: "../evidence/education/6_17.html", relatedSdgs: [8, 13] },
            { id: "6_18", title: "6.18 Total Number of Graduates (for the Last 3 Years)", badge: "Education and Research", src: "../evidence/education/6_18.html", relatedSdgs: [4, 8] },
            { id: "6_19", title: "6.19 Percentage of Number of Graduates with Green Jobs (for the Last 3 Years)", badge: "Education and Research", src: "../evidence/education/6_19.html", relatedSdgs: [8, 13] },
            { id: "6_20", title: "6.20 Impact of Education and Research Programs in Supporting the Sustainable Development Goals (SDGs)", badge: "Education and Research", src: "../evidence/education/6_20.html", relatedSdgs: [3, 4, 6, 8, 9, 11, 12, 13, 15, 17] }
          ]
        },
        digitalization: {
          metrics: [
            { value: "6", label: "AI & IoT Policies", theme: "navy", evidenceId: "7_13" },
            { value: "43.5%", label: "Female Leadership", theme: "red", evidenceId: "7_17" },
            { value: "iKonek", label: "Custom LMS Platform", theme: "navy", evidenceId: "7_20" }
          ],
          narrative: `Urdaneta City University has formalized six distinct policies governing the deployment of artificial intelligence and Internet of Things technologies across campus operations. These range from an AI Governance Policy that mandates human oversight in all AI-assisted decisions to an IoT Integration Policy for smart energy management, facility monitoring, and automated security systems. A dedicated Digital Decision-Support System feeds real-time KPI data into strategic planning, while cloud-based service delivery has replaced traditional paper-based workflows institution-wide.\n\nGender equity in institutional governance stands at 43.5%, with 47 out of 108 leadership positions held by women across university-level administration, faculty and school leadership, study program coordination, and university-level units. A 20-member sustainability coordination team oversees environmental programs, supported by a formal anti-corruption and integrity system, a whistleblowing and complaint mechanism, and a Written Code of Ethics that applies to all university leaders, academic staff, administrative personnel, and students.\n\nThe university's proprietary iKonek Learning Management System serves as the centralized platform for academic delivery, faculty digital competency training, and student digital literacy development. Built to support flexible and blended learning modalities, iKonek integrates with UCU's broader ICT infrastructure, which includes a Sustainability Dashboard with real-time GreenMetric KPI tracking, an Energy and Carbon Monitoring System, campus-wide Wi-Fi with dual-ISP redundancy, and cybersecurity protocols compliant with national data protection regulations.`,
          evidenceList: [
            { id: "7_2", title: "7.2 University Budget for Sustainability Effort (in Us Dollars)", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_2.html", relatedSdgs: [11, 13] },
            { id: "7_6", title: "7.6 Sustainability Report", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_6.html", relatedSdgs: [11, 12, 13] },
            { id: "7_8", title: "7.8 Financial Report", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_8.html", relatedSdgs: [8, 16] },
            { id: "7_10", title: "7.10 Availability of Unit(s) or Office(s) That Coordinate Sustainability on Campus (GD.5)", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_10.html", relatedSdgs: [16, 17] },
            { id: "7_12", title: "7.12 Implementation of Sustainability Programs Through the Utilization of Information and Communication Technology (ict) Aligned with Ui Greenmetric Criteria", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_12.html", relatedSdgs: [9, 11, 12] },
            { id: "7_13", title: "7.13 Policy on Advanced Digital Technologies (AI/IoT, Etc.) to Support Decision-making, Efficiency, and Service Delivery (GD.7)", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_13.html", relatedSdgs: [9, 16] },
            { id: "7_14", title: "7.14 Compliance with the General Data Protection Regulation (gdpr) or Equivalent National Data Protection Regulations", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_14.html", relatedSdgs: [16] },
            { id: "7_17", title: "7.17 Ratio of Female Leaders to Total Institutional Leaders", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_17.html", relatedSdgs: [5, 10] },
            { id: "7_18", title: "7.18 Anti-Corruption and Integrity System of the University (GD.10)", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_18.html", relatedSdgs: [16] },
            { id: "7_19", title: "7.19 Whistle Blowing and Complaint System of the University", badge: "Data and Governance", src: "../evidence/digitalization/7_19.html", relatedSdgs: [16] },
            { id: "7_20", title: "7.20 Lms-enabled Digital Literacy Program", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_20.html", relatedSdgs: [4, 9] },
            { id: "7_21", title: "7.21 Written Code of Ethics That Applies to University Leaders, Academic Staff, Administrative Staff, and Students (GD.13)", badge: "Governance and Digitalization", src: "../evidence/digitalization/7_21.html", relatedSdgs: [16] }
          ]
        }
      };

      const pillarData = defaultManifests[id] || defaultManifests.infrastructure;
      const thumbImage = pillar.img || `images/smart-eco-assets/${id}.jpg`;
      const defaultIcon = `images/indicator-icons/${id}.png`;

      const metricsCard = (pillarData.metrics || []).map(m => ({
        value: m.value || '',
        title: m.title || m.label || '',
        url: m.url || m.evidenceId || '',
        theme: m.theme || 'navy',
        label: m.title || m.label || '',
        evidenceId: m.url || m.evidenceId || ''
      }));

      const evidences = (pillarData.evidenceList || []).map(ev => {
        const underscoreId = ev.id ? ev.id.replace(/\./g, '_') : '';
        return {
          codeID: ev.id ? ev.id.replace(/_/g, '.') : '',
          referenceId: pillar.num,
          title: ev.title || '',
          badge: ev.badge || pillar.title,
          relatedSdgs: Array.isArray(ev.relatedSdgs) ? ev.relatedSdgs : [],
          src: ev.src || `../evidence/${id}/${underscoreId}.html`,
          thumb_evidence: ev.thumb_evidence || ev.img || defaultIcon,
          year: "2025",
          id: ev.id,
          img: ev.thumb_evidence || ev.img || defaultIcon
        };
      });

      return {
        // Standard Agreed Schema
        indicatorId: id,
        indicatorNum: pillar.num,
        indicatorTitle: pillar.title,
        thumb_image: thumbImage,
        thumb_evidence: defaultIcon,
        narrative: pillarData.narrative,
        metricsCard: JSON.parse(JSON.stringify(metricsCard)),
        evidences: JSON.parse(JSON.stringify(evidences)),
        // Legacy Aliases
        pillarId: id,
        pillarTitle: pillar.title,
        activeNum: pillar.num,
        thumbnailImg: thumbImage,
        evidence_thumb: defaultIcon,
        metrics: JSON.parse(JSON.stringify(metricsCard)),
        evidenceList: JSON.parse(JSON.stringify(evidences))
      };
    }

    if (type === 'sdg_dashboard') {
      return {
        heroEyebrow: "Local Action. Global Impact.",
        heroHeadline: "SDG Reports",
        heroHighlight: "2025",
        heroDescription: "Documenting Urdaneta City University’s measurable contributions to the United Nations Sustainable Development Goals through education, research, partnerships, and community-driven initiatives in 2025.",
        metrics: [
          { metricId: "sdgTargets", value: "169", label: "Targets", theme: "white" },
          { metricId: "totalEvents", value: "48", label: "Events", theme: "white" },
          { metricId: "totalResearch", value: "124", label: "Research", theme: "white" }
        ],
        sdgCards: [
          { goalNum: "1", title: "No Poverty", subtitle: "End poverty in all its forms everywhere.", color: "#E5243B", bgImg: "../images/sdg/bg/1.png", logoImg: "../images/sdg/sdg1.png" },
          { goalNum: "2", title: "Zero Hunger", subtitle: "End hunger, achieve food security and improved nutrition.", color: "#DDA63A", bgImg: "../images/sdg/bg/2.png", logoImg: "../images/sdg/sdg2.png" },
          { goalNum: "3", title: "Good Health and Well-being", subtitle: "Ensure healthy lives and promote well-being for all.", color: "#4C9F38", bgImg: "../images/sdg/bg/3.png", logoImg: "../images/sdg/sdg3.png" },
          { goalNum: "4", title: "Quality Education", subtitle: "Ensure inclusive and equitable quality education.", color: "#C5192D", bgImg: "../images/sdg/bg/4.png", logoImg: "../images/sdg/sdg4.png" },
          { goalNum: "5", title: "Gender Equality", subtitle: "Achieve gender equality and empower all women and girls.", color: "#FF3A21", bgImg: "../images/sdg/bg/5.png", logoImg: "../images/sdg/sdg5.png" },
          { goalNum: "6", title: "Clean Water and Sanitation", subtitle: "Ensure availability and sustainable management of water.", color: "#26BDE2", bgImg: "../images/sdg/bg/6.png", logoImg: "../images/sdg/sdg6.png" },
          { goalNum: "7", title: "Affordable and Clean Energy", subtitle: "Ensure access to affordable, reliable, sustainable energy.", color: "#FCC30B", bgImg: "../images/sdg/bg/7.png", logoImg: "../images/sdg/sdg7.png" },
          { goalNum: "8", title: "Decent Work and Economic Growth", subtitle: "Promote sustained, inclusive and sustainable economic growth.", color: "#A21942", bgImg: "../images/sdg/bg/8.png", logoImg: "../images/sdg/sdg8.png" },
          { goalNum: "9", title: "Industry, Innovation and Infrastructure", subtitle: "Build resilient infrastructure, promote inclusive industrialization.", color: "#FD6925", bgImg: "../images/sdg/bg/9.png", logoImg: "../images/sdg/sdg9.png" },
          { goalNum: "10", title: "Reduced Inequalities", subtitle: "Reduce inequality within and among countries.", color: "#DD1367", bgImg: "../images/sdg/bg/10.png", logoImg: "../images/sdg/sdg10.png" },
          { goalNum: "11", title: "Sustainable Cities and Communities", subtitle: "Make cities and human settlements inclusive, safe, resilient.", color: "#FD9D24", bgImg: "../images/sdg/bg/11.png", logoImg: "../images/sdg/sdg11.png" },
          { goalNum: "12", title: "Responsible Consumption and Production", subtitle: "Ensure sustainable consumption and production patterns.", color: "#BF8B2E", bgImg: "../images/sdg/bg/12.png", logoImg: "../images/sdg/sdg12.png" },
          { goalNum: "13", title: "Climate Action", subtitle: "Take urgent action to combat climate change and its impacts.", color: "#3F7E44", bgImg: "../images/sdg/bg/13.png", logoImg: "../images/sdg/sdg13.png" },
          { goalNum: "14", title: "Life Below Water", subtitle: "Conserve and sustainably use the oceans, seas and marine resources.", color: "#0A97D9", bgImg: "../images/sdg/bg/14.png", logoImg: "../images/sdg/sdg14.png" },
          { goalNum: "15", title: "Life on Land", subtitle: "Protect, restore and promote sustainable use of terrestrial ecosystems.", color: "#56C02B", bgImg: "../images/sdg/bg/15.png", logoImg: "../images/sdg/sdg15.png" },
          { goalNum: "16", title: "Peace, Justice and Strong Institutions", subtitle: "Promote peaceful and inclusive societies for sustainable development.", color: "#00689D", bgImg: "../images/sdg/bg/16.png", logoImg: "../images/sdg/sdg16.png" },
          { goalNum: "17", title: "Partnerships for the Goals", subtitle: "Strengthen the means of implementation and revitalize the global partnership.", color: "#19486A", bgImg: "../images/sdg/bg/17.png", logoImg: "../images/sdg/sdg17.jpg" }
        ]
      };
    }

    if (type === 'impact') {
      return {
        heroEyebrow: "News & Documentation",
        heroHeadline: "Impact & Events",
        heroHighlight: "2025.",
        heroDescription: "Documenting UCU's institutional milestones, community engagements, and sustainable development initiatives.",
        metrics: [
          { value: "3", label: "Upcoming (May)", theme: "white" },
          { metricId: "totalEvents", value: "48", label: "Total Engagements", theme: "white" },
          { value: "5,000+", label: "Community Reached", theme: "white" },
          { value: "17", label: "SDGs Addressed", theme: "white" }
        ],
        eventsList: [
          {
            id: "kalahi-cidss",
            title: "DSWD's Kalahi-CIDSS Cash-for-Work Program",
            date: "March 15-22, 2025",
            desc: "Urdaneta City University strengthens community engagement through support for DSWD's sustainable livelihood and infrastructure programs in vulnerable sectors.",
            img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic6.png",
            src: "events/2025/kalahi-cidss.html",
            relatedSdgs: [1, 8, 10],
            isFeatured: true,
            isHighlights: true
          },
          {
            id: "smart-campus-launch",
            title: "UCU Unveils Phase 1 of the Smart Eco-Campus Initiative",
            date: "February 10, 2025",
            desc: "The university officially transitions to a 30% solar-powered grid, marking a massive milestone in our UI GreenMetric institutional commitments.",
            img: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?q=80&w=800&auto=format&fit=crop",
            src: "",
            relatedSdgs: [7, 9, 11, 13],
            isFeatured: true,
            isHighlights: true
          },
          {
            id: "health-symposium",
            title: "International Symposium on Rural Health Diagnostics",
            date: "January 28, 2025",
            desc: "Global experts gather at the UCU Main Hall to discuss digital interventions for remote maternal health.",
            img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=400&auto=format&fit=crop",
            src: "",
            relatedSdgs: [3, 17],
            isFeatured: true,
            isHighlights: false
          },
          {
            id: "gender-equality-forum",
            title: "Women in STEM: The 2025 Leadership Forum",
            date: "January 15, 2025",
            desc: "Celebrating our female engineering and IT students leading innovations in sustainable architecture.",
            img: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=400&auto=format&fit=crop",
            src: "",
            relatedSdgs: [4, 5, 10],
            isFeatured: true,
            isHighlights: false
          }
        ]
      };
    }

    if (type === 'research') {
      return {
        heroEyebrow: "Institutional Archive",
        heroHeadline: "SDG Research",
        heroHighlight: "Archive.",
        heroDescription: "An open-access archive of Urdaneta City University's academic contributions. Explore peer-reviewed publications, institutional studies, and localized research directly aligned with the United Nations' Sustainable Development Goals.",
        researchList: [
          {
            title: "Impact of Digital Health Interventions on Rural Education Outcomes",
            authors: "Dr. Maria Santos, et al.",
            date: "Oct 2025",
            abstract: "This study evaluates the intersection of adolescent health and academic performance in Northern Luzon. By deploying targeted digital health tracking within the localized curriculum, the research demonstrates a significant correlation between well-being interventions and improved scholastic retention rates among marginalized communities.",
            sdgs: [3, 4],
            keywords: ["Adolescent Health", "Digital Health", "Scholastic Retention"],
            pdfLink: "../documents/santos-et-al.pdf"
          },
          {
            title: "Economic Efficacy of Cash-for-Work Programs in Pangasinan",
            authors: "Prof. Juan dela Cruz",
            date: "Mar 2025",
            abstract: "An analysis of the DSWD's KALAHI-CIDSS initiative. This paper examines the short-term economic stabilization provided by cash-for-work frameworks in highly vulnerable sectors of Urdaneta City, establishing metrics for sustainable inclusive growth and the reduction of regional income inequalities.",
            sdgs: [1, 8, 10],
            keywords: ["Cash-for-Work", "Inclusive Growth", "Economic Efficacy"],
            pdfLink: "#"
          },
          {
            title: "Climate Resilience of Indigenous Flora in Northern Agno Basin",
            authors: "College of Agriculture Research Team",
            date: "Nov 2024",
            abstract: "Investigating the adaptive mechanisms of local plant species against increasingly severe weather anomalies. The research outlines actionable strategies for preserving terrestrial ecosystems and reinforcing agricultural security amidst shifting climate patterns in Region I.",
            sdgs: [13, 15],
            keywords: ["Climate Resilience", "Indigenous Flora", "Agno Basin"],
            pdfLink: "#"
          }
        ]
      };
    }

    if (type === 'rankings') {
      const defaultRankings = (typeof window !== 'undefined' && Array.isArray(window.UCU_RANKINGS))
        ? JSON.parse(JSON.stringify(window.UCU_RANKINGS))
        : [
            {
              org: "AppliedHE",
              year: "2026",
              mainRankLabel: "Overall Asia Ranking",
              mainRank: "241-260",
              category: "All Asia",
              badgeClass: "bg-[#f26422] text-white",
              crownBadgeClass: "bg-[#f26422] text-white",
              shortDescription: "Top tier recognition among Public and Local Universities within the ASEAN Region and the Philippines.",
              publicationUrl: "",
              publicationDate: "March 15, 2026",
              logo: "images/rankings-logo/applied-he.png",
              metrics: [
                { label: "Public Univ. ASEAN Region", value: "#107", subtext: "", color: "#fbef4b" },
                { label: "Public Univ. Philippines", value: "#17", subtext: "", color: "#fbef4b" },
                { label: "Public Univ. Region 1", value: "#2", subtext: "", color: "#fbef4b" },
                { label: "Local Univ. & College Region 1", value: "#1", subtext: "", color: "#c43643" }
              ]
            },
            {
              org: "WURI",
              year: "2025",
              mainRankLabel: "World University Ranking",
              mainRank: "#44",
              category: "World Rankings",
              badgeClass: "bg-[#0f4088] text-white",
              crownBadgeClass: "bg-[#0f4088] text-white",
              shortDescription: "Recognized globally for real-world impact and innovative approaches to education and industrial application.",
              publicationUrl: "",
              publicationDate: "June 12, 2025",
              logo: "images/rankings-logo/wuri.png",
              metrics: [
                { label: "A3 Industrial Application", value: "#1", subtext: '"Smart Aquaculture: Advancing Regional Fisheries Sustainability Through Innovative Monitoring Solutions"', color: "#394a8a" },
                { label: "A8 SDG-Based Responses", value: "#2", subtext: '"AgriTech for All: Empowering Farmers with Mobile Solutions for Disease Detection and Precision Farming"', color: "#394a8a" },
                { label: "A2 Student Mobility & Openness", value: "#4", subtext: '"Empowering Communities, Preserving Culture: A Global Journey into Sustainable Tourism"', color: "#394a8a" }
              ]
            },
            {
              org: "UI GreenMetric",
              year: "2025",
              mainRankLabel: "World Rankings",
              mainRank: "#362",
              category: "World Rankings",
              badgeClass: "bg-[#00993d] text-white",
              crownBadgeClass: "bg-[#00993d] text-white",
              shortDescription: "Ranked #1 Local University in the Philippines for excellence in environmental sustainability and green campus management.",
              publicationUrl: "",
              publicationDate: "December 5, 2025",
              logo: "images/rankings-logo/ui-green.png",
              metrics: [
                { label: "LUC in the Philippines", value: "#1", subtext: "", color: "#00993d" },
                { label: "LUC in Northern Luzon", value: "#1", subtext: "", color: "#00993d" },
                { label: "Province of Pangasinan", value: "#1", subtext: "", color: "#00993d" },
                { label: "Region 1", value: "#3", subtext: "", color: "#00993d" },
                { label: "Philippines", value: "#9", subtext: "", color: "#00993d" },
                { label: "Asia", value: "#203", subtext: "", color: "#00993d" }
              ]
            },
            {
              org: "THE Impact",
              year: "2025",
              mainRankLabel: "Global Impact Rank",
              mainRank: "1501+",
              category: "Impact Rankings",
              badgeClass: "bg-[#201f1f] text-white",
              crownBadgeClass: "bg-[#201f1f] text-white",
              shortDescription: "Evaluated against the United Nations' Sustainable Development Goals (SDGs) for global institutional impact.",
              publicationUrl: "",
              publicationDate: "June 20, 2025",
              logo: "images/rankings-logo/the-impact.png",
              metrics: [
                { label: "SDG 1: No Poverty", value: "Global 401–600", subtext: "PH #6 | Region 1 #2", color: "#E5243B" },
                { label: "SDG 3: Good Health", value: "Global 1001–1500", subtext: "PH #6 | Region 1 #3", color: "#4C9F38" },
                { label: "SDG 4: Quality Ed.", value: "Global 1001–1500", subtext: "PH #5 | Region 1 #3", color: "#C5192D" },
                { label: "SDG 5: Gender Eq.", value: "Global 601–800", subtext: "PH #6 | Region 1 #3", color: "#FF3A21" },
                { label: "SDG 16: Peace & Justice", value: "Global 801–1000", subtext: "PH #6 | Region 1 #3", color: "#00689D" },
                { label: "SDG 17: Partnerships", value: "Global 1501+", subtext: "PH #7 | Region 1 #4", color: "#19486A" }
              ]
            }
          ];

      return {
        heroEyebrow: "A Network of Excellence",
        heroHeadline: "Connecting UCU",
        heroHighlight: "Globally",
        heroDescription: "Forging high-impact relationships with global academic institutions and premier industry leaders to elevate the educational standard of Urdaneta City University.",
        standingTitle: "Current Global Standing",
        trajectoryEyebrow: "Institutional Trajectory",
        trajectoryTitle: "Historical Performance",
        terminusStatement: `"We will continue our commitment to relentless innovation and real-world impact, ensuring the little giant UCU rises to meet the titans on the global stage."`,
        rankingsList: defaultRankings
      };
    }

    if (type === 'partnership') {
      const defaultPartners = (typeof window !== 'undefined' && window.UCU_PARTNERS) ? window.UCU_PARTNERS : [
        { name: "Adventist University of the Philippines", category: "local-academic", logoSrc: "./images/local-partners/Adventist-University-of-the-Philippines.png", url: "" },
        { name: "Air Link International Aviation College", category: "local-academic", logoSrc: "./images/local-partners/Air-Link-International-Aviation-College.png", url: "" },
        { name: "Ateneo De Davao University", category: "local-academic", logoSrc: "./images/local-partners/ateneo-de-davao-university.png", url: "" },
        { name: "Baguio Central University", category: "local-academic", logoSrc: "./images/local-partners/Baguio-Central-University.png", url: "" },
        { name: "Baliuag University", category: "local-academic", logoSrc: "./images/local-partners/baliuag-university.png", url: "" },
        { name: "Benguet State University", category: "local-academic", logoSrc: "./images/local-partners/BSU.png", url: "" },
        { name: "Central Mindanao University", category: "local-academic", logoSrc: "./images/local-partners/Central-mindanao-university.png", url: "" },
        { name: "City College of San Jose Del Monte", category: "local-academic", logoSrc: "./images/local-partners/city-college-of-san-jose-del-monte.png", url: "" },
        { name: "Colegio San Agustin - Bacolod", category: "local-academic", logoSrc: "./images/local-partners/colegio-of-san-agustin-bacolod.png", url: "" },
        { name: "Davao Oriental State University", category: "local-academic", logoSrc: "./images/local-partners/davao-oriental-state-university.png", url: "" },
        { name: "De La Salle Medical and Health Sciences Institute", category: "local-academic", logoSrc: "./images/local-partners/de-la-salle-medical-and-health-sciences-institute.png", url: "" },
        { name: "Dr. Yanga's Colleges, Inc.", category: "local-academic", logoSrc: "./images/local-partners/Dr-Yanga-Colleges-Inc.png", url: "" },
        { name: "Eastern Visayas State University", category: "local-academic", logoSrc: "./images/local-partners/Eastern-Visayas-State-University.png", url: "" },
        { name: "Goldenstate College - General Santos City", category: "local-academic", logoSrc: "./images/local-partners/Goldenstate-college-general-santos-city-philipines.png", url: "" },
        { name: "Green Valley College Foundation, Inc.", category: "local-academic", logoSrc: "./images/local-partners/Green-Valley-College-Foundation-Inc.png", url: "" },
        { name: "Holy Cross of Davao College", category: "local-academic", logoSrc: "./images/local-partners/holy-cross-of-davao-college.png", url: "" },
        { name: "Holy Name University", category: "local-academic", logoSrc: "./images/local-partners/holy-name-university.png", url: "" },
        { name: "Holy Trinity College of General Santos City", category: "local-academic", logoSrc: "./images/local-partners/holy-trinity-college-of-general-santos-city.png", url: "" },
        { name: "Iloilo Science and Technology University", category: "local-academic", logoSrc: "./images/local-partners/ISTU.png", url: "" },
        { name: "John B. Lacson Foundation Maritime University", category: "local-academic", logoSrc: "./images/local-partners/john-b-lacson-foundation-maritime-university.png", url: "" },
        { name: "Kalinga State University", category: "local-academic", logoSrc: "./images/local-partners/KSU.png", url: "" },
        { name: "Lananpin National High School", category: "local-academic", logoSrc: "./images/local-partners/LananpinNHS.png", url: "" },
        { name: "Leyte Normal University", category: "local-academic", logoSrc: "./images/local-partners/LeyteNU.png", url: "" },
        { name: "Lyceum of the Philippines University – Batangas", category: "local-academic", logoSrc: "./images/local-partners/Lyceum-of-the-philippines-university-batangas.png", url: "" },
        { name: "Manuel S. Enverga University Foundation", category: "local-academic", logoSrc: "./images/local-partners/manuel-s-enverga-university-foundation.png", url: "" },
        { name: "Maritime Polytechnic College Foundation of Canaman Inc.", category: "local-academic", logoSrc: "./images/local-partners/maritime-polytechnic-college-foundation.png", url: "" },
        { name: "Mariners Polytechnic Colleges Foundation - Legazpi", category: "local-academic", logoSrc: "./images/local-partners/Mariners-polytechnic-colleges-foundation.png", url: "" },
        { name: "Misamis University", category: "local-academic", logoSrc: "./images/local-partners/misamis-university.png", url: "" },
        { name: "Naga College Foundation Inc.", category: "local-academic", logoSrc: "./images/local-partners/Naga-College-Foundation-Inc.png", url: "" },
        { name: "Northwestern University - Laoag City", category: "local-academic", logoSrc: "./images/local-partners/northwestern-university.png", url: "" },
        { name: "Osias Educational Foundation Inc.", category: "local-academic", logoSrc: "./images/local-partners/oasis-educational-foundation-inc.png", url: "" },
        { name: "Polytechnic College of Botolan", category: "local-academic", logoSrc: "./images/local-partners/Polytechnic-College-of-Botolan.png", url: "" },
        { name: "Samar College - Catbalogan", category: "local-academic", logoSrc: "./images/local-partners/Samar-college.png", url: "" },
        { name: "San Pedro College - Davao City", category: "local-academic", logoSrc: "./images/local-partners/san-pedro-college-davao-city.png", url: "" },
        { name: "SDO-Urdaneta City", category: "local-academic", logoSrc: "./images/local-partners/SDO-URD.png", url: "" },
        { name: "St. Bernadette Lourdes College", category: "local-academic", logoSrc: "./images/local-partners/SBLC.png", url: "" },
        { name: "St. Michael's College of Iligan Inc.", category: "local-academic", logoSrc: "./images/local-partners/saint-michael_s-college-of-iligan.png", url: "" },
        { name: "St. Paul University - Dumaguete City", category: "local-academic", logoSrc: "./images/local-partners/st-paul-university-dumaguete.png", url: "" },
        { name: "St. Paul University Philippines - Quezon City", category: "local-academic", logoSrc: "./images/local-partners/st-paul-university-qc.png", url: "" },
        { name: "St. Paul University Philippines - Tuguegarao City", category: "local-academic", logoSrc: "./images/local-partners/st-paul-university-philippines.png", url: "" },
        { name: "Union Christian College", category: "local-academic", logoSrc: "./images/local-partners/union-christian-college.png", url: "" },
        { name: "Universidad De Sta. Maria Isabela De Naga, Inc.", category: "local-academic", logoSrc: "./images/local-partners/universidad-de-sta-isabel-de-naga-inc.png", url: "" },
        { name: "University of Baguio", category: "local-academic", logoSrc: "./images/local-partners/UB.png", url: "" },
        { name: "University of Cagayan Valley", category: "local-academic", logoSrc: "./images/local-partners/university-of-cagayan-valley.png", url: "" },
        { name: "University of Eastern Philippines - Catarman N. Samar", category: "local-academic", logoSrc: "./images/local-partners/University-of-eastern-philippines-catarman-n-samar.png", url: "" },
        { name: "University of La Salette Inc.", category: "local-academic", logoSrc: "./images/local-partners/university-of-la-salette-inc.png", url: "" },
        { name: "University of Makati", category: "local-academic", logoSrc: "./images/local-partners/University-of-makati.png", url: "" },
        { name: "University of Negros Occidental - Recoletos Inc.", category: "local-academic", logoSrc: "./images/local-partners/university-of-negros-occidental-recoletos-inc.png", url: "" },
        { name: "University of Nueva Caceres", category: "local-academic", logoSrc: "./images/local-partners/university-of-nueva-caceres.png", url: "" },
        { name: "University od Santo Tomas - Legazpi", category: "local-academic", logoSrc: "./images/local-partners/university-of-santo-tomas-legazpi.png", url: "" },
        { name: "University of the Immaculate Conception", category: "local-academic", logoSrc: "./images/local-partners/university-of-the-immaculate-conception.png", url: "" },
        { name: "Beyond Books Publication", category: "local-industry", logoSrc: "./images/local-partners/Beyond-Books-Publication.png", url: "" },
        { name: "Center for Pangasinan Studies", category: "local-industry", logoSrc: "./images/local-partners/CPS.png", url: "" },
        { name: "Commission on Human Rights-RO1", category: "local-industry", logoSrc: "./images/local-partners/CHR-1.png", url: "" },
        { name: "Global Professional Advancement", category: "local-industry", logoSrc: "./images/local-partners/GPA.png", url: "" },
        { name: "Philippine Red Cross", category: "local-industry", logoSrc: "./images/local-partners/Redcross.png", url: "" },
        { name: "Urdaneta District Jail Male Dorm", category: "local-industry", logoSrc: "./images/local-partners/BJMP.png", url: "" },
        { name: "Abdullah Gul University", category: "international-academic", logoSrc: "./images/international-partners/abdullah-gul-university.png", url: "" },
        { name: "American University of Sovereign Nations", category: "international-academic", logoSrc: "./images/international-partners/ausovereignnations.png", url: "https://ausovereignnations.org/" },
        { name: "aSSIST University", category: "international-academic", logoSrc: "./images/international-partners/aSSIST.png", url: "" },
        { name: "Chandigarh Group of Colleges", category: "international-academic", logoSrc: "./images/international-partners/Chandigarh-Group.png", url: "" },
        { name: "Chitkara University", category: "international-academic", logoSrc: "./images/international-partners/chitkara-university.png", url: "" },
        { name: "Da-Yeh University", category: "international-academic", logoSrc: "./images/international-partners/Da-Yeh-University.png", url: "" },
        { name: "Deggendorf Institute of Technology", category: "international-academic", logoSrc: "./images/international-partners/dit-logo-grau.png", url: "" },
        { name: "Ecolde 42", category: "international-academic", logoSrc: "./images/international-partners/Ecole-42.png", url: "" },
        { name: "Incheon National University", category: "international-academic", logoSrc: "./images/international-partners/incheon-national-university.png", url: "" },
        { name: "Institut Teknologi Sepuluh Nopember (ITS) Indonesia", category: "international-academic", logoSrc: "./images/international-partners/ITS.png", url: "" },
        { name: "Konan University", category: "international-academic", logoSrc: "./images/international-partners/Konan-University.png", url: "" },
        { name: "Lac Hong University", category: "international-academic", logoSrc: "./images/international-partners/lac-hong-university.png", url: "" },
        { name: "Minerva University", category: "international-academic", logoSrc: "./images/international-partners/minerva-university.png", url: "" },
        { name: "National Chi Nan University", category: "international-academic", logoSrc: "./images/international-partners/national-chi-nan-university.png", url: "" },
        { name: "Northwestern University - Illinois", category: "international-academic", logoSrc: "./images/local-partners/NWU.png", url: "" },
        { name: "Portsworld Academy Malaysia", category: "international-academic", logoSrc: "./images/international-partners/Portsworlds.png", url: "" },
        { name: "Powiślański University", category: "international-academic", logoSrc: "./images/international-partners/Powislanski-University.png", url: "" },
        { name: "Richmond American University, London", category: "international-academic", logoSrc: "./images/international-partners/Richmond-American.png", url: "" },
        { name: "SDG Management School", category: "international-academic", logoSrc: "./images/international-partners/SDGMS.png", url: "" },
        { name: "Seoul National University (Human Resource Research Center)", category: "international-academic", logoSrc: "./images/international-partners/seoul-national-university.png", url: "" },
        { name: "Siam University", category: "international-academic", logoSrc: "./images/international-partners/siam-university.png", url: "" },
        { name: "Tongmyong University", category: "international-academic", logoSrc: "./images/international-partners/Tongmyong.png", url: "" },
        { name: "Universitas Gadjah Mada", category: "international-academic", logoSrc: "./images/international-partners/Universitas-gadjah-mada-indonesia.png", url: "" },
        { name: "Universitas Pendidikan Ganeshia", category: "international-academic", logoSrc: "./images/international-partners/Ganeshia.png", url: "" },
        { name: "Universitas Persada Indonesia", category: "international-academic", logoSrc: "./images/international-partners/Universitas-Persada-Indonesia.png", url: "" },
        { name: "University of Liberal Arts Bangladesh", category: "international-academic", logoSrc: "./images/international-partners/University-of-Liberal-Arts-Bangladesh.png", url: "" },
        { name: "University of Mostar", category: "international-academic", logoSrc: "./images/international-partners/Mostar.png", url: "" },
        { name: "University of Technology and Applied Sciences", category: "international-academic", logoSrc: "./images/international-partners/UTAS.png", url: "" },
        { name: "Aptimizer", category: "international-industry", logoSrc: "./images/international-partners/Aptimizer.png", url: "" },
        { name: "Global Peace Foundation", category: "international-industry", logoSrc: "./images/international-partners/Global-Peace.png", url: "" },
        { name: "International Society of Teachers, Administrators and Researchers Inc.", category: "international-industry", logoSrc: "./images/international-partners/ISTAR.png", url: "" },
        { name: "3ZERO", category: "membership", logoSrc: "./images/membership/3zero.png", url: "" },
        { name: "ATENEO-EEC", category: "membership", logoSrc: "./images/membership/EEC.png", url: "" },
        { name: "Global School Alliance", category: "membership", logoSrc: "./images/membership/GSA.png", url: "" },
        { name: "Global University Network for Innovation", category: "membership", logoSrc: "./images/membership/GUNI.png", url: "" },
        { name: "Sustainable Development Solutions Network", category: "membership", logoSrc: "./images/membership/SDSN.png", url: "" },
        { name: "The SDG Accord", category: "membership", logoSrc: "./images/membership/SDG_Accord.png", url: "" },
        { name: "United Nations Academic Impact", category: "membership", logoSrc: "./images/membership/UN-AcademicImpact.png", url: "" }
      ];

      return {
        heroEyebrow: "Trusted Connections. Global Vision.",
        heroHeadline: "UCU Beyond",
        heroHighlight: "Borders",
        heroDescription: "Creating lasting partnerships that empower education, elevate standards, and connect Urdaneta City University to opportunities across the world.",

        partnersList: defaultPartners,
        countries: [
          "Philippines", "Turkey", "Bangladesh", "Indonesia", "Japan", "Oman", "South Korea", 
          "Thailand", "Taiwan", "Vietnam", "Malaysia", "China", 
          "Bosnia and Herzegovina", "United Kingdom", "Switzerland", "Poland", "Germany", 
          "USA", "Canada", "India", "France", "Spain"
        ],
        allianceTitle: "Forge a Strategic Alliance",
        allianceDescription: "Urdaneta City University (UCU) actively seeks to expand its global and local network through high-impact institutional linkages. We invite esteemed academic organizations and industry leaders to initialize formal collaboration proposals via our centralized portal.",
        partnershipFormUrl: "https://forms.google.com/your-form-id-here",
        emailExternal: "externalaffairsandlinkages@ucu.edu.ph",
        emailOfficial: "officeofthepresident@ucu.edu.ph"
      };
    }

    if (type === 'smarteco') {
      return {
        heroEyebrow: "Innovation Powered by Sustainability",
        heroHeadline: "Smart Eco",
        heroHighlight: "Campus",
        heroDescription: "Creating a campus where innovation, sustainability, and responsible growth work together to elevate institutional performance and environmental impact.",
        recognitionEyebrow: "Global Recognition",
        recognitionTitle: "An Academic Milestone",
        introParagraph1: "The UI GreenMetric World University Rankings evaluates green campuses and environmental sustainability across 39 indicators in 6 criteria.",
        introParagraph2: "As a first try for UCU in this global ranking, it is an academic milestone worthy of celebration.",
        introParagraph3: "Congratulations, UCUians! Mabuhay ang Urdaneta City University!",
        awardImages: [
          "./images/smart-eco-assets/ui-gm2.jpg",
          "./images/smart-eco-assets/ui-gm.jpg"
        ],
        standingHeader: "Out of 1,477 universities worldwide in 2025, WE ARE:",
        milestones: [
          { rank: "#1", label: "Local Universities & Colleges (LUC) in the Philippines", isMain: true },
          { rank: "#1", label: "HEI in Water Management Category" },
          { rank: "#1", label: "in the Province of Pangasinan" },
          { rank: "#3", label: "in Region 1" },
          { rank: "#8", label: "in the Entire Philippines" },
          { rank: "#189", label: "in Asia" },
          { rank: "#361", label: "IN THE WORLD" }
        ],
        sustainabilityTitle: "SUSTAINABILITY INDICATORS",
        sustainabilityIndicators: [
          { num: "01", title: "Setting and Infrastructure", img: "./images/smart-eco-assets/setting_and_infrastructure.jpg", link: "./indicators/infrastructure.html" },
          { num: "02", title: "Energy and Climate Change", img: "./images/smart-eco-assets/energy_and_climate_change.jpg", link: "./indicators/energy.html" },
          { num: "03", title: "Waste", img: "./images/smart-eco-assets/waste.jpg", link: "./indicators/waste.html" },
          { num: "04", title: "Water", img: "./images/smart-eco-assets/water.jpg", link: "./indicators/water.html" },
          { num: "05", title: "Transportation", img: "./images/smart-eco-assets/transportation.jpg", link: "./indicators/transportation.html" },
          { num: "06", title: "Education and Research", img: "./images/smart-eco-assets/education_and_research.jpg", link: "./indicators/education.html" },
          { num: "07", title: "Digitalization", img: "./images/smart-eco-assets/digitalization.jpg", link: "./indicators/digitalization.html" }
        ],
        sustainabilityParagraph: "These seven sustainability indicators form the strategic framework of Urdaneta City University’s Smart Eco Campus initiative. By aggressively aligning our institutional metrics with global environmental standards—such as the UI GreenMetric framework—we do more than cultivate a green learning environment. We forge high-impact linkages with international stakeholders, driving collaborative research and scalable sustainable practices that elevate our graduates to global competitiveness."
      };
    }

    if (type === 'announcement' || type === 'announcements') {
      return {
        announcementsList: [
          {
            id: "ann-0",
            category: "Academic Linkages",
            title: "Strength of Urdaneta City University Research & Global Linkages Endorsed by 2025 Milestones",
            desc: "Urdaneta City University welcomes the latest results of institutional research evaluations and international linkages, demonstrating the university’s unwavering delivery of high-quality, high-impact sustainable development programs and global academic alliances.",
            img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
            src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
            date: "May 20, 2025",
            badge: "Featured",
            isFeatured: true,
            relatedSdgs: [4, 9, 17],
            blocks: [
              {
                type: "paragraph",
                content: "Urdaneta City University welcomes the latest results of institutional research evaluations and international linkages, demonstrating the university’s unwavering delivery of high-quality, high-impact sustainable development programs and global academic alliances."
              },
              {
                type: "heading",
                level: "h2",
                title: "Expanding Global Institutional Collaborations"
              },
              {
                type: "paragraph",
                content: "Through strategic engagements across the ASEAN region and active participation in international university ranking frameworks, UCU continues to cultivate academic excellence, faculty mobility, and world-class sustainable innovation."
              },
              {
                type: "image",
                src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
                caption: "Urdaneta City University leadership celebrating key institutional ranking milestones."
              }
            ]
          },
          {
            id: "ann-1",
            category: "Community Extension",
            title: "UCU Collaborates with DSWD on Kalahi-CIDSS Cash-for-Work Sustainable Infrastructure",
            desc: "Empowering vulnerable communities across Pangasinan through direct infrastructure livelihood support, civic engagement, and targeted poverty mitigation.",
            img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
            src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
            date: "March 15, 2025",
            isFeatured: false,
            relatedSdgs: [1, 8, 10],
            blocks: [
              {
                type: "paragraph",
                content: "Empowering vulnerable communities across Pangasinan through direct infrastructure livelihood support, civic engagement, and targeted poverty mitigation."
              },
              {
                type: "image",
                src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
                caption: "Community orientation and cash-for-work program mobilization at UCU."
              }
            ]
          },
          {
            id: "ann-2",
            category: "Green Campus",
            title: "Smart Eco Campus Initiative Receives Landmark UI GreenMetric Global Standing",
            desc: "Ranked #1 Local University in the Philippines and #1 in Water Management Category worldwide, driving institutional climate action and clean energy.",
            img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png",
            src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png",
            date: "February 10, 2025",
            isFeatured: false,
            relatedSdgs: [6, 7, 11, 13],
            blocks: [
              {
                type: "paragraph",
                content: "Ranked #1 Local University in the Philippines and #1 in Water Management Category worldwide, driving institutional climate action and clean energy."
              },
              {
                type: "image",
                src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png",
                caption: "Smart Eco Campus sustainability initiatives on display."
              }
            ]
          },
          {
            id: "ann-3",
            category: "Academic Linkages",
            title: "UCU Signs New International Memorandums of Understanding Across ASEAN Region",
            desc: "Broadening cross-border faculty mobility, student exchanges, and joint peer-reviewed publications with premier Southeast Asian partner universities.",
            img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic4.png",
            src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic4.png",
            date: "January 28, 2025",
            isFeatured: false,
            relatedSdgs: [4, 17],
            blocks: [
              {
                type: "paragraph",
                content: "Broadening cross-border faculty mobility, student exchanges, and joint peer-reviewed publications with premier Southeast Asian partner universities."
              },
              {
                type: "image",
                src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic4.png",
                caption: "Formal MOU signing ceremonies with international academic delegations."
              }
            ]
          }
        ]
      };
    }

    return {};
  }
}

export const cmsState = new CMSState();
