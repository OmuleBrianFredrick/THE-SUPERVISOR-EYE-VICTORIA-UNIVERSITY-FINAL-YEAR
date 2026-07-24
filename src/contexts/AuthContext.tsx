import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, firebaseSignOut, googleProvider, signInWithPopup, sendPasswordResetEmail, onAuthStateChanged } from '../lib/firebase';
import { User, GoogleAuthProvider } from 'firebase/auth';

interface AuthProfile {
  id: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string | null;
  profilePhotoUrl: string | null;
  status: string;
  role: string;
  department: string | null;
  onboardingComplete?: boolean | null;
  phone?: string | null;
  employeeNumber?: string | null;
  onboardingCompletedAt?: string | null;
  dateJoinedDepartment?: string | null;
  lastDepartmentChangeAt?: string | null;
  managerFirstName?: string | null;
  managerLastName?: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  requiresOnboarding: boolean;
  accountStatus: string | null;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  setProfileForce: (profile: AuthProfile) => void;
  refreshProfile: () => Promise<void>;
  googleAccessToken: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

let cachedAccessToken: string | null = null;

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  const fetchProfileData = async (user: User) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.onboardingComplete === false) {
          setRequiresOnboarding(true);
        } else {
          setRequiresOnboarding(false);
        }
        setAccountStatus('ACTIVE');
      } else if (res.status === 404) {
        setRequiresOnboarding(true);
        setProfile(null);
      } else if (res.status === 403) {
        const errData = await res.json();
        setAccountStatus(errData.status || 'INACTIVE');
        setProfile(null);
      } else {
        await firebaseSignOut(auth);
        setProfile(null);
      }
    } catch (err) {
      console.error(err);
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);
      if (user) {
        await fetchProfileData(user);
      } else {
        setProfile(null);
        setRequiresOnboarding(false);
        setAccountStatus(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await fetchProfileData(auth.currentUser);
    }
  };

  const logout = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch(e) {}
    await firebaseSignOut(auth);
    cachedAccessToken = null;
    setGoogleAccessToken(null);
    setProfile(null);
    setRequiresOnboarding(false);
    setAccountStatus(null);
  };

  const getToken = async () => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      try {
        const credential = GoogleAuthProvider.credentialFromResult(result as import('firebase/auth').UserCredential);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          setGoogleAccessToken(cachedAccessToken);
        }
      } catch (e) {
        console.warn("Failed to extract Google OAuth token", e);
      }
      return result;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  const setProfileForce = (p: AuthProfile) => setProfile(p);

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      profile, 
      loading, 
      requiresOnboarding, 
      accountStatus, 
      logout, 
      getToken, 
      signInWithGoogle,
      resetPassword,
      setProfileForce, 
      refreshProfile,
      googleAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};
