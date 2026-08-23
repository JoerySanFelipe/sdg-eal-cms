// admin/js/firebase-config.js
// Firebase v10 Modular SDK Initialization & Configuration Manager

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// Default Template Configuration for UCU SDG Portal
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBCfgDS0NliRN3LJR2cOie6y9N4YONtTR8",
  authDomain: "sdg-web-d07ac.firebaseapp.com",
  projectId: "sdg-web-d07ac",
  storageBucket: "sdg-web-d07ac.firebasestorage.app",
  messagingSenderId: "505597542017",
  appId: "1:505597542017:web:a75df94df956700e3e1780",
  measurementId: "G-K23T7B7YEP"
};

const STORAGE_KEY = 'UCU_SDG_FIREBASE_CONFIG';

/**
 * Retrieve active Firebase credentials (from LocalStorage if saved, else default)
 */
export function getFirebaseConfig() {
  try {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed && typeof parsed === 'object' && parsed.apiKey) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
      }
    }
  } catch (e) {
    console.warn("[Firebase Config] Error reading stored config:", e);
  }
  return { ...DEFAULT_FIREBASE_CONFIG };
}

/**
 * Persist custom Firebase credentials in LocalStorage
 */
export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.location.reload();
    return true;
  } catch (e) {
    console.error("[Firebase Config] Failed to save config:", e);
    return false;
  }
}

/**
 * Reset Firebase credentials back to defaults
 */
export function resetFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

/**
 * Check if active config has real API keys configured
 */
export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.apiKey.trim() !== "" && cfg.projectId && cfg.projectId.trim() !== "");
}

// Global instances
let app = null;
let auth = null;
let db = null;
let storage = null;
let initError = null;

const activeConfig = getFirebaseConfig();

if (isFirebaseConfigured()) {
  try {
    if (!getApps().length) {
      app = initializeApp(activeConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log(`%c[UCU SDG CMS] Firebase Initialized for project: ${activeConfig.projectId}`, 'color: #394a8a; font-weight: bold;');
  } catch (err) {
    console.error("[Firebase Config] Initialization failed:", err);
    initError = err;
  }
} else {
  console.info("%c[UCU SDG CMS] Running in Demo/LocalStorage Mode (No live Firebase keys yet). Configure keys in Admin Settings to enable cloud Firestore sync.", 'color: #c43643; font-weight: bold;');
}

export { 
  app, 
  auth, 
  db, 
  storage,
  initError,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy,
  ref,
  uploadBytesResumable,
  getDownloadURL
};
