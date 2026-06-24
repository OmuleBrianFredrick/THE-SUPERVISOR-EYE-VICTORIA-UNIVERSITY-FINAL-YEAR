import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup as realSignInWithPopup, 
  signInWithEmailAndPassword as realSignInWithEmailAndPassword, 
  createUserWithEmailAndPassword as realCreateUserWithEmailAndPassword, 
  signOut as realFirebaseSignOut, 
  sendPasswordResetEmail as realSendPasswordResetEmail,
  onAuthStateChanged as realOnAuthStateChanged
} from 'firebase/auth';
import { getStorage, ref as realRef, uploadBytesResumable as realUploadBytesResumable, getDownloadURL as realGetDownloadURL } from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Set to true to disable real Firebase Auth and force developer mock authentication
const DISABLE_REAL_FIREBASE = true;

const hasApiKey = !DISABLE_REAL_FIREBASE && ((!!import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== '""') || (!!firebaseAppletConfig?.apiKey && firebaseAppletConfig.apiKey !== ""));

let app: any = null;
let auth: any = null;
let googleProvider: any = null;
let storage: any = null;

// Mock implementations for a seamless sandbox demonstration when Firebase config is missing
const mockSubscribers = new Set<(user: any) => void>();

const createIdToken = (uid: string, email: string) => {
  try {
    const payload = JSON.stringify({ uid, email });
    return 'mock-token-' + btoa(payload);
  } catch (e) {
    return 'mock-jwt-token-abc';
  }
};

const getStoredMockUser = () => {
  try {
    const stored = sessionStorage.getItem('supervisor_eye_mock_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        getIdToken: async () => createIdToken(parsed.uid, parsed.email)
      };
    }
  } catch (e) {
    console.error(e);
  }
  return null; // Start as logged out by default
};

let mockUser: any = getStoredMockUser();

const triggerMockAuthChange = () => {
  try {
    if (mockUser) {
      sessionStorage.setItem('supervisor_eye_mock_user', JSON.stringify({
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName
      }));
    } else {
      sessionStorage.removeItem('supervisor_eye_mock_user');
    }
  } catch (e) {}
  
  mockSubscribers.forEach(cb => cb(mockUser));
};

const mockAuthObj = {
  get currentUser() {
    return mockUser;
  },
  onAuthStateChanged: (callback: (user: any) => void) => {
    mockSubscribers.add(callback);
    // Fire initially to simulate state loading
    const userToEmit = mockUser;
    setTimeout(() => callback(userToEmit), 50);
    return () => {
      mockSubscribers.delete(callback);
    };
  }
};

if (hasApiKey) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig?.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig?.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig?.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig?.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig?.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig?.appId,
  };
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    storage = getStorage(app);
  } catch (error) {
    console.error("Failed to initialize Firebase Client SDK, falling back to Mock Auth", error);
    auth = mockAuthObj;
    googleProvider = { id: 'mock-google-provider' };
  }
} else {
  console.warn("⚠️ Firebase credentials missing in client. Initializing Supervisor Eye Mock Client Auth.");
  auth = mockAuthObj;
  googleProvider = { id: 'mock-google-provider' };
}

// Wrapped auth functions
export async function signInWithPopup(authInstance: any, provider: any) {
  if (!hasApiKey || authInstance === mockAuthObj) {
    const msg = `Choose a Movit Group account to simulate Google Sign-In:\n\n` + 
                `1. christianekarel@gmail.com (IT Support & admin)\n` +
                `2. simpson.birungi@movitgroup.com (Executive Chairman)\n` +
                `3. james.munene@movitgroup.com (CEO)\n` +
                `4. bruce.mpamizo@movitgroup.com (Executive Director)\n` +
                `5. adard.mukiibi@movitgroup.com (CFO)\n\n` +
                `Or enter any other Gmail/Google email address directly.\n\n` +
                `Enter email directly or choose a number (1-5):`;
                
    const choice = typeof window !== 'undefined' ? window.prompt(msg, 'christianekarel@gmail.com') : 'christianekarel@gmail.com';
    let selectedEmail = 'christianekarel@gmail.com';
    
    if (choice) {
      const trimmed = choice.trim();
      if (trimmed === '1') selectedEmail = 'christianekarel@gmail.com';
      else if (trimmed === '2') selectedEmail = 'simpson.birungi@movitgroup.com';
      else if (trimmed === '3') selectedEmail = 'james.munene@movitgroup.com';
      else if (trimmed === '4') selectedEmail = 'bruce.mpamizo@movitgroup.com';
      else if (trimmed === '5') selectedEmail = 'adard.mukiibi@movitgroup.com';
      else if (trimmed.includes('@')) selectedEmail = trimmed;
    }
    
    // Consistent mock UID based on email so that we look up the same user in database after logouts!
    const selectedUid = 'mock-google-' + btoa(selectedEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
    mockUser = {
      uid: selectedUid,
      email: selectedEmail,
      displayName: selectedEmail.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      getIdToken: async () => createIdToken(selectedUid, selectedEmail),
    };
    triggerMockAuthChange();
    return { user: mockUser };
  }
  return realSignInWithPopup(authInstance, provider);
}

export async function signInWithEmailAndPassword(authInstance: any, email: string, password: string) {
  if (!hasApiKey || authInstance === mockAuthObj) {
    const cleanEmail = email || 'christianekarel@gmail.com';
    // Consistent mock UID based on email so that they log into the EXACT SAME existing DB user account every time!
    const selectedUid = 'mock-uid-' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
    mockUser = {
      uid: selectedUid,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      getIdToken: async () => createIdToken(selectedUid, cleanEmail),
    };
    triggerMockAuthChange();
    return { user: mockUser };
  }
  return realSignInWithEmailAndPassword(authInstance, email, password);
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, password: any) {
  if (!hasApiKey || authInstance === mockAuthObj) {
    // Consistent mock UID based on email
    const newUid = 'mock-uid-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
    mockUser = {
      uid: newUid,
      email: email,
      displayName: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      getIdToken: async () => createIdToken(newUid, email),
    };
    triggerMockAuthChange();
    return { user: mockUser };
  }
  return realCreateUserWithEmailAndPassword(authInstance, email, password);
}

export async function firebaseSignOut(authInstance: any) {
  if (!hasApiKey || authInstance === mockAuthObj) {
    mockUser = null;
    triggerMockAuthChange();
    return Promise.resolve();
  }
  return realFirebaseSignOut(authInstance);
}

export async function sendPasswordResetEmail(authInstance: any, email: string) {
  if (!hasApiKey || authInstance === mockAuthObj) {
    return Promise.resolve();
  }
  return realSendPasswordResetEmail(authInstance, email);
}

export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  if (!hasApiKey || authInstance === mockAuthObj) {
    return mockAuthObj.onAuthStateChanged(callback);
  }
  return realOnAuthStateChanged(authInstance, callback);
}

// Wrapped storage functions
export function ref(storageInstance: any, path?: string) {
  if (!hasApiKey || !storageInstance) {
    return { mockPath: path };
  }
  return realRef(storageInstance, path);
}

export function uploadBytesResumable(refInstance: any, file: any): any {
  if (!hasApiKey || !refInstance || refInstance.mockPath) {
    // Return mock upload task matching the UploadTask shape expected by the compiler
    return {
      snapshot: {
        ref: refInstance,
        bytesTransferred: 100,
        totalBytes: 100,
        state: 'success'
      },
      on: (event: string, progressCb: any, errorCb: any, completeCb: any) => {
        progressCb({ bytesTransferred: 100, totalBytes: 100 });
        setTimeout(() => {
          completeCb();
        }, 100);
        return () => {};
      }
    };
  }
  return realUploadBytesResumable(refInstance, file);
}

export async function getDownloadURL(refInstance: any) {
  if (!hasApiKey || !refInstance || refInstance.mockPath) {
    return `https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=300&auto=format&fit=crop`; // default robust fallback
  }
  return realGetDownloadURL(refInstance);
}

export { auth, googleProvider, storage };
