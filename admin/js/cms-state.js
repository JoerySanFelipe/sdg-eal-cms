// admin/js/cms-state.js
/**
 * Application State Store & Cloud Firestore Orchestrator
 * Central Observable Reactive State Manager for UCU SDG CMS Studio
 */

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
import { SDG_METADATA, INDICATOR_PILLARS, escapeHtml, resolveAssetUrl, naturalSort } from './shared-utils.js';
import { getBaselineData } from './baseline-registry.js';

export { SDG_METADATA, INDICATOR_PILLARS, escapeHtml, resolveAssetUrl, naturalSort, getBaselineData };

/**
 * Sanitize deep nested objects and arrays for Cloud Firestore storage
 */
export function sanitizeForFirestore(val) {
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

/**
 * High-Performance Image Compression via Off-Thread createImageBitmap / Canvas
 */
export function compressAndEncodeImage(file, maxWidth = 1000, maxHeight = 650, quality = 0.68) {
  return new Promise(async (resolve) => {
    if (!file) return resolve(null);

    // Fast Path: Hardware-accelerated off-thread decoding via createImageBitmap
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        let width = bitmap.width;
        let height = bitmap.height;

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
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close(); // Immediate GPU memory cleanup

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl || dataUrl.startsWith('data:image/png') || dataUrl.length < 50) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch (err) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Release canvas backing store memory
        canvas.width = 0;
        canvas.height = 0;

        return resolve(dataUrl);
      } catch (e) {
        // Fallback to FileReader below if createImageBitmap fails
      }
    }

    // Fallback Path: Standard Image + FileReader
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

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl || dataUrl.startsWith('data:image/png') || dataUrl.length < 50) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch (err) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        canvas.width = 0;
        canvas.height = 0;
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Pick image file synchronously from local OS dialog
 */
export function pickImageFileFromSystem() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      resolve(file);
    };

    const onFocusBack = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          resolve(null);
        }
      }, 500);
    };
    
    window.addEventListener('focus', onFocusBack, { once: true });
    input.click();
  });
}

/**
 * Reporting Year Registry Management
 */
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

/**
 * Central State Store
 */
class CMSState {
  constructor() {
    const defaultYear = getDefaultYear();
    this.activeSection = {
      type: 'sdg', // 'home' | 'sdg' | 'rankings' | 'events' | 'indicator' | 'settings' | 'research' | 'partnership' | 'smarteco' | 'announcement'
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
    } else if (type === 'impact' || type === 'events') {
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

  // --- CONTENT BLOCK ENGINE ---
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

  toggleCurrentPageMaintenance(isMaintenance) {
    if (!this.currentDraft) this.currentDraft = {};
    const newStatus = isMaintenance !== undefined ? !!isMaintenance : !(this.currentDraft.isUnderMaintenance || this.currentDraft.isCurating);
    this.currentDraft.isUnderMaintenance = newStatus;
    this.currentDraft.isCurating = newStatus;
    if (this.activeSection && this.activeSection.type === 'home') {
      this.currentDraft.isGlobalMaintenance = newStatus;
      this.currentDraft.isGlobalCurating = newStatus;
    }
    if (!this.currentDraft.maintenanceTitle || this.currentDraft.maintenanceTitle.includes('Curation') || this.currentDraft.maintenanceTitle.includes('Institutional Web Page Under Maintenance') || this.currentDraft.maintenanceTitle.includes('Website Under Construction')) {
      this.currentDraft.maintenanceTitle = "Webpage Under Construction";
    }
    if (!this.currentDraft.maintenanceMessage) {
      this.currentDraft.maintenanceMessage = "The External Affairs and Linkages Office is currently updating and maintaining verified institutional records and publications for this section. Verified content will be available shortly. Thank you for your patience.";
    }

    // Specific SDG: Apply maintenance across all years for this SDG goal
    if (this.activeSection && this.activeSection.type === 'sdg') {
      const sdgId = this.activeSection.id;
      localStorage.setItem(`UCU_SDG_${sdgId}_MAINTENANCE`, String(newStatus));
      ['2025', '2024', '2023'].forEach(y => {
        const dKey = `UCU_DRAFT_sdg_narratives__sdg_${sdgId}_${y}`;
        try {
          const raw = localStorage.getItem(dKey);
          let dData = raw ? JSON.parse(raw) : {};
          let inner = dData.data || dData;
          inner.isUnderMaintenance = newStatus;
          inner.isCurating = newStatus;
          inner.maintenanceTitle = this.currentDraft.maintenanceTitle;
          inner.maintenanceMessage = this.currentDraft.maintenanceMessage;
          localStorage.setItem(dKey, JSON.stringify({ data: inner, savedAt: new Date().toISOString() }));
        } catch (e) {}
      });
    }

    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    previewBridge.sendLiveUpdate(this.currentDraft);
    return newStatus;
  }

  toggleCurrentPageCuration(isCurating) {
    return this.toggleCurrentPageMaintenance(isCurating);
  }

  toggleGlobalMaintenance(isGlobal) {
    if (!this.currentDraft) this.currentDraft = {};
    const newStatus = isGlobal !== undefined ? !!isGlobal : !(this.currentDraft.isGlobalMaintenance || this.currentDraft.isGlobalCurating);
    this.currentDraft.isGlobalMaintenance = newStatus;
    this.currentDraft.isGlobalCurating = newStatus;
    this.isDirty = true;
    this.saveLocalDraft();
    this.notify();
    previewBridge.sendLiveUpdate(this.currentDraft);
    return newStatus;
  }

  toggleGlobalCuration(isGlobal) {
    return this.toggleGlobalMaintenance(isGlobal);
  }

  async batchToggleSdgMaintenance(isMaintenance, year = this.activeSection.year || '2025') {
    for (let i = 1; i <= 17; i++) {
      const docKey = `sdg_narratives__sdg_${i}_${year}`;
      const publishedKey = `UCU_PUBLISHED_${docKey}`;
      const draftKey = `UCU_DRAFT_${docKey}`;

      let sdgData = {};
      const localPub = localStorage.getItem(publishedKey);
      if (localPub) {
        try {
          const p = JSON.parse(localPub);
          sdgData = p.data || p;
        } catch (e) {}
      }
      sdgData.isUnderMaintenance = !!isMaintenance;
      sdgData.isCurating = !!isMaintenance;
      
      try {
        localStorage.setItem(publishedKey, JSON.stringify({
          data: sdgData,
          publishedAt: new Date().toISOString()
        }));
        localStorage.setItem(draftKey, JSON.stringify({
          data: sdgData,
          savedAt: new Date().toISOString()
        }));
      } catch (e) {}

      if (isFirebaseConfigured() && db) {
        try {
          const sdgRef = doc(db, 'sdg_narratives', `sdg_${i}_${year}`);
          await setDoc(sdgRef, { isUnderMaintenance: !!isMaintenance, isCurating: !!isMaintenance, updatedAt: serverTimestamp() }, { merge: true });
        } catch (e) {
          console.warn(`[CMS State] Firestore batch SDG ${i} maintenance update skipped:`, e);
        }
      }
    }

    // If currently on an SDG page, reload active draft to reflect
    if (this.activeSection.type === 'sdg') {
      await this.loadActiveSectionData();
    }
    this.notify();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  async batchToggleSdgCuration(isCurating, year) {
    return this.batchToggleSdgMaintenance(isCurating, year);
  }

  async batchToggleIndicatorMaintenance(isMaintenance) {
    for (const pillar of INDICATOR_PILLARS) {
      const docKey = `indicators__${pillar.id}`;
      const publishedKey = `UCU_PUBLISHED_${docKey}`;
      const draftKey = `UCU_DRAFT_${docKey}`;

      let pillarData = {};
      const localPub = localStorage.getItem(publishedKey);
      if (localPub) {
        try {
          const p = JSON.parse(localPub);
          pillarData = p.data || p;
        } catch (e) {}
      }
      pillarData.isUnderMaintenance = !!isMaintenance;
      pillarData.isCurating = !!isMaintenance;
      pillarData.maintenanceTitle = "Webpage Under Construction";

      try {
        localStorage.setItem(publishedKey, JSON.stringify({
          data: pillarData,
          publishedAt: new Date().toISOString()
        }));
        localStorage.setItem(draftKey, JSON.stringify({
          data: pillarData,
          savedAt: new Date().toISOString()
        }));
      } catch (e) {}

      if (isFirebaseConfigured() && db) {
        try {
          const indRef = doc(db, 'indicators', pillar.id);
          await setDoc(indRef, { 
            isUnderMaintenance: !!isMaintenance, 
            isCurating: !!isMaintenance, 
            maintenanceTitle: "Webpage Under Construction",
            updatedAt: serverTimestamp() 
          }, { merge: true });
        } catch (e) {
          console.warn(`[CMS State] Firestore batch Indicator ${pillar.id} maintenance update skipped:`, e);
        }
      }
    }

    // If currently on an indicator page, reload active draft to reflect
    if (this.activeSection.type === 'indicator') {
      await this.loadActiveSectionData();
    }
    this.notify();
    previewBridge.sendLiveUpdate(this.currentDraft);
  }

  async batchToggleIndicatorCuration(isCurating) {
    return this.batchToggleIndicatorMaintenance(isCurating);
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
        // Silently skip if storage quota exceeded; memory state remains active
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

  applyGoalMaintenanceToCurrentDraft() {
    if (!this.currentDraft || !this.activeSection) return;
    if (this.activeSection.type === 'sdg') {
      const sdgId = this.activeSection.id;
      const draftGoalMaint = localStorage.getItem(`UCU_SDG_${sdgId}_MAINTENANCE`);
      const pubGoalMaint = localStorage.getItem(`UCU_PUBLISHED_SDG_${sdgId}_MAINTENANCE`);
      
      let isGoalMaint = null;
      if (draftGoalMaint !== null) {
        isGoalMaint = draftGoalMaint === 'true';
      } else if (pubGoalMaint !== null) {
        isGoalMaint = pubGoalMaint === 'true';
      }

      if (isGoalMaint !== null) {
        this.currentDraft.isUnderMaintenance = isGoalMaint;
        this.currentDraft.isCurating = isGoalMaint;
        if (isGoalMaint) {
          this.currentDraft.maintenanceTitle = this.currentDraft.maintenanceTitle || "Webpage Under Construction";
          this.currentDraft.maintenanceMessage = this.currentDraft.maintenanceMessage || "The External Affairs and Linkages Office is currently updating and maintaining verified institutional records and publications for this section. Verified content will be available shortly. Thank you for your patience.";
        }
      }
    }
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
          this.applyGoalMaintenanceToCurrentDraft();
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
      this.applyGoalMaintenanceToCurrentDraft();
      return this.currentDraft;
    }

    // 3. Fallback to baseline static data
    this.setFullDraft(baseline, false);
    this.applyGoalMaintenanceToCurrentDraft();
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
        // Proceed smoothly to Cloud Firestore publish
      }
    }

    // 2. Cloud Firestore persist if configured
    if (isFirebaseConfigured() && db) {
      const ref = doc(db, colName, docId);

      // Sanitize payload for Firestore to remove redundant mirror fields
      let firestorePayload = { ...payload };
      if (this.activeSection.type === 'sdg') {
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

    // 2.5 If SDG narrative, synchronize goal-level maintenance across all years
    if (this.activeSection.type === 'sdg') {
      const sdgId = this.activeSection.id;
      const isMaint = !!(this.currentDraft.isUnderMaintenance || this.currentDraft.isCurating);
      localStorage.setItem(`UCU_PUBLISHED_SDG_${sdgId}_MAINTENANCE`, String(isMaint));
      localStorage.setItem(`UCU_SDG_${sdgId}_MAINTENANCE`, String(isMaint));
      ['2025', '2024', '2023'].forEach(y => {
        const pubKey = `UCU_PUBLISHED_sdg_narratives__sdg_${sdgId}_${y}`;
        try {
          const raw = localStorage.getItem(pubKey);
          if (raw) {
            const p = JSON.parse(raw);
            const d = p.data || p;
            d.isUnderMaintenance = isMaint;
            d.isCurating = isMaint;
            d.maintenanceTitle = this.currentDraft.maintenanceTitle || "Webpage Under Construction";
            d.maintenanceMessage = this.currentDraft.maintenanceMessage || "The External Affairs and Linkages Office is currently updating and maintaining verified institutional records and publications for this section. Verified content will be available shortly. Thank you for your patience.";
            localStorage.setItem(pubKey, JSON.stringify({ data: d, publishedAt: new Date().toISOString() }));
          }
        } catch (e) {}
      });
      if (isFirebaseConfigured() && db) {
        ['2025', '2024', '2023'].forEach(async (y) => {
          try {
            const sdgRef = doc(db, 'sdg_narratives', `sdg_${sdgId}_${y}`);
            await setDoc(sdgRef, {
              isUnderMaintenance: isMaint,
              isCurating: isMaint,
              maintenanceTitle: this.currentDraft.maintenanceTitle || "Webpage Under Construction",
              maintenanceMessage: this.currentDraft.maintenanceMessage || "The External Affairs and Linkages Office is currently updating and maintaining verified institutional records and publications for this section. Verified content will be available shortly. Thank you for your patience.",
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch (e) {}
        });
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
   * Discard current unsaved draft and restore the most recent published version
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
    if (this.activeSection && this.activeSection.type === 'sdg') {
      const sdgId = this.activeSection.id;
      localStorage.removeItem(`UCU_PUBLISHED_SDG_${sdgId}_MAINTENANCE`);
      localStorage.removeItem(`UCU_SDG_${sdgId}_MAINTENANCE`);
    }
    this.clearLocalDraft();
    const baseline = this.getBaselineData(this.activeSection);
    this.setFullDraft(baseline, false);
    return baseline;
  }

  /**
   * Baseline Static Data Accessor
   */
  getBaselineData(section, paramId = null, paramYear = '2025') {
    return getBaselineData(section, paramId, paramYear);
  }
}

export const cmsState = new CMSState();
