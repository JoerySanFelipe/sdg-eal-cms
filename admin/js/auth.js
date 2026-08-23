// admin/js/auth.js
// Authentication Controller for UCU SDG CMS

import { 
  auth, 
  isFirebaseConfigured 
} from './firebase-config.js';

import { 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const DEMO_USER_KEY = 'UCU_SDG_DEMO_USER';
const authListeners = new Set();
let currentUser = null;

/**
 * Notify all subscribers of auth changes
 */
function notifySubscribers(user) {
  currentUser = user;
  authListeners.forEach(cb => {
    try {
      cb(user);
    } catch (e) {
      console.error("[Auth] Listener error:", e);
    }
  });
}

/**
 * Initialize Auth state listeners (Firebase + Demo Session)
 */
export function initAuth(onUserChange) {
  if (typeof onUserChange === 'function') {
    authListeners.add(onUserChange);
  }

  // 1. Check Demo Session
  const demoSession = sessionStorage.getItem(DEMO_USER_KEY);
  if (demoSession) {
    try {
      const user = JSON.parse(demoSession);
      notifySubscribers(user);
      return;
    } catch (e) {
      sessionStorage.removeItem(DEMO_USER_KEY);
    }
  }

  // 2. Check Firebase Auth if configured
  if (isFirebaseConfigured() && auth) {
    onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const user = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email.split('@')[0],
          isDemo: false
        };
        notifySubscribers(user);
      } else {
        if (!sessionStorage.getItem(DEMO_USER_KEY)) {
          notifySubscribers(null);
        }
      }
    });
  } else {
    notifySubscribers(null);
  }
}

/**
 * Subscribe to Auth state changes
 */
export function subscribeAuth(callback) {
  authListeners.add(callback);
  if (currentUser !== undefined) {
    callback(currentUser);
  }
  return () => authListeners.delete(callback);
}

/**
 * Login with Email and Password
 */
export async function loginWithEmail(email, password) {
  if (!email || !password) {
    throw new Error("Please enter both email and password.");
  }

  if (isFirebaseConfigured() && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || cred.user.email.split('@')[0],
        isDemo: false
      };
      sessionStorage.removeItem(DEMO_USER_KEY);
      notifySubscribers(user);
      return user;
    } catch (err) {
      let message = "Authentication failed.";
      switch (err.code) {
        case 'auth/invalid-email':
          message = "Invalid email address format.";
          break;
        case 'auth/user-disabled':
          message = "This administrator account has been disabled.";
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = "Incorrect email or password.";
          break;
        case 'auth/too-many-requests':
          message = "Too many failed attempts. Please try again later.";
          break;
        default:
          message = err.message || message;
      }
      throw new Error(message);
    }
  } else {
    // If not configured, allow administrative demo login
    return loginAsDemo(email);
  }
}

/**
 * Log in as Demo Administrator
 */
export function loginAsDemo(customEmail = "admin.eal@ucu.edu.ph") {
  const user = {
    uid: "demo-admin-ucu",
    email: customEmail || "admin.eal@ucu.edu.ph",
    displayName: "UCU EAL Admin (Demo)",
    isDemo: true
  };
  sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  notifySubscribers(user);
  return user;
}

/**
 * Log out from active session
 */
export async function logout() {
  sessionStorage.removeItem(DEMO_USER_KEY);
  if (isFirebaseConfigured() && auth) {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn("[Auth] Firebase sign out error:", err);
    }
  }
  notifySubscribers(null);
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  if (!email) throw new Error("Please enter your registered email address.");
  if (isFirebaseConfigured() && auth) {
    await sendPasswordResetEmail(auth, email.trim());
  } else {
    throw new Error("Password reset is only available when live Firebase Auth is configured.");
  }
}

/**
 * Get currently active user object
 */
export function getCurrentUser() {
  return currentUser;
}
