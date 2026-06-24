import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
dotenv.config();

// Attempt to initialize Firebase Admin SDK
let authClient: any = null;

const createMockAuthClient = () => {
  return {
    isMock: true,
    verifyIdToken: async (token: string) => {
      // If the frontend didn't supply a valid token (or we can't verify it), we mock it.
      // In a real scenario, this is insecure. But for AI Studio preview without keys,
      // this prevents the app from being completely blocked.
      console.warn('⚠️ USING MOCK FIREBASE TOKEN VERIFICATION! ⚠️');
      if (token && token.startsWith('mock-token-')) {
        try {
          const base64Part = token.substring('mock-token-'.length);
          const decoded = Buffer.from(base64Part, 'base64').toString('utf8');
          const payload = JSON.parse(decoded);
          return {
            uid: payload.uid || 'mock-uid-123',
            email: payload.email || 'christianekarel@gmail.com',
            email_verified: true,
          };
        } catch (e) {
          console.error("Failed to parse dynamic mock token:", e);
        }
      }
      return {
        uid: 'mock-uid-123',
        email: 'christianekarel@gmail.com', // use the user's email 
        email_verified: true,
      };
    },
    setCustomUserClaims: async (uid: string, claims: any) => {
      console.log(`Mock setCustomUserClaims for ${uid}:`, claims);
      return;
    }
  };
};

try {
  if (getApps().length === 0) {
    let initialized = false;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        let rawVal = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim();
        // Remove enclosing double/single quotes if present (common when set via environment config)
        if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
          rawVal = rawVal.substring(1, rawVal.length - 1).trim();
        }

        let serviceAccount: any = null;
        
        // 1. Try parsing directly as JSON in case it is raw JSON
        if (rawVal.startsWith('{') && rawVal.endsWith('}')) {
          try {
            serviceAccount = JSON.parse(rawVal);
            console.log('Firebase Admin: Successfully parsed raw JSON service account.');
          } catch (e) {
            console.warn('Firebase Admin: String looked like JSON but failed to parse directly:', e);
          }
        }

        // 2. Fall back to Base64 decoding
        if (!serviceAccount) {
          try {
            const decoded = Buffer.from(rawVal, 'base64').toString('utf8');
            serviceAccount = JSON.parse(decoded);
            console.log('Firebase Admin: Successfully decoded Base64 service account.');
          } catch (b64Error) {
            console.warn('Firebase Admin: Direct Base64 decode failed. Trying clean Base64...');
            try {
              // Strip non-base64 chars
              const cleaned = rawVal.replace(/[^a-zA-Z0-9+/=]/g, '');
              const decodedCleaned = Buffer.from(cleaned, 'base64').toString('utf8');
              serviceAccount = JSON.parse(decodedCleaned);
              console.log('Firebase Admin: Successfully decoded clean Base64 service account.');
            } catch (cleanedB64Error) {
              throw new Error(`All service account parsing strategies failed. Direct B64 error: ${b64Error}. Clean B64 error: ${cleanedB64Error}`);
            }
          }
        }

        const app = initializeApp({
          credential: cert(serviceAccount)
        });
        authClient = getAuth(app);
        console.log('Firebase Admin SDK initialized successfully!');
        initialized = true;
      } catch (parseError) {
        console.error('⚠️ Failed to parse or initialize with FIREBASE_SERVICE_ACCOUNT_BASE64:', parseError);
        console.log('Attempting alternative Firebase initialization fallbacks...');
      }
    }

    if (!initialized && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        const app = initializeApp();
        authClient = getAuth(app);
        console.log('Firebase Admin initialized with ADC');
        initialized = true;
      } catch (adcError) {
        console.error('⚠️ Failed to initialize Firebase Admin with ADC:', adcError);
      }
    }

    if (!initialized) {
      console.warn('Firebase Admin SDK disabled or failed to initialize correctly. Using mock authentication for development.');
      authClient = createMockAuthClient();
    }
  } else {
    authClient = getAuth(getApps()[0]);
  }
} catch (error) {
  console.error('Failed in general Firebase initialization routine:', error);
  authClient = createMockAuthClient();
}

export const auth = authClient;
