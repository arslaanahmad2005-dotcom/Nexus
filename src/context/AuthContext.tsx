import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, OccupationType } from '../types';
import { DEMO_PERSONAS, DemoPersona } from '../data/demoData';

export type DemoPersonaKey = 'student' | 'freelancer' | 'business' | 'priya' | 'aarav' | 'vikram';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  currentDemoPersona: DemoPersona | null;
  isSupabaseConnected: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string, occupation?: OccupationType) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  resendVerificationEmail: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  enterDemoMode: (personaKey?: DemoPersonaKey) => void;
  exitDemoMode: () => void;
  switchDemoPersona: (personaKey: DemoPersonaKey) => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_DEMO_KEY = 'nexus_demo_mode_state';
const LOCAL_STORAGE_PERSONA_KEY = 'nexus_demo_persona_key';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'nexus_local_accounts';
const LOCAL_STORAGE_ACTIVE_USER_ID = 'nexus_current_local_user_id';

interface LocalAccount {
  id: string;
  email: string;
  password: string;
  fullName: string;
  occupation: OccupationType;
  createdAt: string;
}

const getLocalAccounts = (): LocalAccount[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalAccounts = (accounts: LocalAccount[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore local storage errors
  }
};

async function hashLocalPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`nexus_secure_salt_${password}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback if subtle crypto is unavailable
    return `hashed_${password.length}_${password.slice(0, 3)}`;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [currentPersonaKey, setCurrentPersonaKey] = useState<string>('freelancer');

  // Load session or check demo mode / local user session
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      const savedDemoMode = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
      const savedPersona = (localStorage.getItem(LOCAL_STORAGE_PERSONA_KEY) as 'priya' | 'aarav') || 'priya';

      if (savedDemoMode === 'true') {
        const persona = DEMO_PERSONAS[savedPersona] || DEMO_PERSONAS.priya;
        setIsDemoMode(true);
        setCurrentPersonaKey(savedPersona);
        setUser({ id: persona.profile.id, email: `${savedPersona}@nexus-demo.local` });
        const savedDemoProf = localStorage.getItem(`nexus_demo_profile_${savedPersona}`);
        if (savedDemoProf) {
          try {
            setProfile(JSON.parse(savedDemoProf));
          } catch {
            setProfile(persona.profile);
          }
        } else {
          setProfile(persona.profile);
        }
        setIsLoading(false);
        return;
      }

      // Check active local user session
      const savedLocalUserId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_ID);
      if (savedLocalUserId) {
        const accounts = getLocalAccounts();
        const found = accounts.find((a) => a.id === savedLocalUserId);
        if (found) {
          setUser({
            id: found.id,
            email: found.email,
            user_metadata: {
              full_name: found.fullName,
              occupation: found.occupation
            }
          });
          await fetchProfile(found.id);
          setIsLoading(false);
          return;
        }
      }

      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
        } catch (_err) {
          console.warn('[NEXUS Auth] Session restore failure handled safely');
        }
      }

      setIsLoading(false);
    };

    initializeAuth();

    // Listen for Supabase auth state changes
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user && !isDemoMode) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (!isDemoMode && !localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_ID)) {
          setUser(null);
          setProfile(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isDemoMode]);

  const fetchProfile = async (userId: string) => {
    // 1. Check local cache first for instant responsiveness
    const cached = localStorage.getItem(`nexus_user_profile_${userId}`);
    if (cached) {
      try {
        setProfile(JSON.parse(cached));
      } catch {
        // ignore parse error
      }
    }

    // 2. If it's a locally created user account
    if (userId.startsWith('user_local_')) {
      const accounts = getLocalAccounts();
      const match = accounts.find((a) => a.id === userId);
      if (match && !cached) {
        const localProf: UserProfile = {
          id: userId,
          fullName: match.fullName,
          occupation: match.occupation,
          monthlyIncomeRange: '',
          location: '',
          onboardingCompleted: false,
          createdAt: match.createdAt,
          updatedAt: match.createdAt
        };
        setProfile(localProf);
        localStorage.setItem(`nexus_user_profile_${userId}`, JSON.stringify(localProf));
      }
      return;
    }

    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('[NEXUS Profile] Supabase profile note:', error.message);
      }

      if (data) {
        const loadedProf: UserProfile = {
          id: data.id,
          fullName: data.full_name,
          occupation: data.occupation || 'Freelancer',
          monthlyIncomeRange: data.monthly_income_range || '',
          location: data.location || '',
          onboardingCompleted: data.onboarding_completed ?? false,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        setProfile(loadedProf);
        localStorage.setItem(`nexus_user_profile_${userId}`, JSON.stringify(loadedProf));
      } else if (!cached && user) {
        // If profile row doesn't exist yet, synthesize one from user credentials
        const meta = user.user_metadata || {};
        const fallbackProf: UserProfile = {
          id: userId,
          fullName: meta.full_name || user.email?.split('@')[0] || 'Nexus Member',
          occupation: meta.occupation || 'Freelancer',
          monthlyIncomeRange: '',
          location: '',
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProfile(fallbackProf);
        localStorage.setItem(`nexus_user_profile_${userId}`, JSON.stringify(fallbackProf));
      }
    } catch (_err) {
      console.warn('[NEXUS Profile] Load profile exception handled safely');
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check local accounts first
    const localAccounts = getLocalAccounts();
    const localMatch = localAccounts.find((a) => a.email.toLowerCase() === normalizedEmail);

    if (localMatch) {
      const hashedAttempt = await hashLocalPassword(password);
      const isMatch = localMatch.password === hashedAttempt || localMatch.password === password;
      if (!isMatch) {
        return { error: 'Incorrect password. Please verify your credentials.' };
      }

      // Automatically migrate legacy plaintext password to secure hash
      if (localMatch.password === password) {
        localMatch.password = hashedAttempt;
        saveLocalAccounts(localAccounts);
      }

      const activeUser = {
        id: localMatch.id,
        email: localMatch.email,
        user_metadata: {
          full_name: localMatch.fullName,
          occupation: localMatch.occupation
        }
      };

      setUser(activeUser);
      setIsDemoMode(false);
      localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_ID, localMatch.id);
      await fetchProfile(localMatch.id);
      return {};
    }

    // 2. If Supabase is configured, try cloud login
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) {
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
            return {
              error: 'Authentication server is unreachable. No local account found with this email. Please click Create Account below.'
            };
          }
          return { error: error.message };
        }
        if (data.user) {
          setUser(data.user);
          setIsDemoMode(false);
          localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
          localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_ID);
          await fetchProfile(data.user.id);
        }
        return {};
      } catch (err: any) {
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('network')) {
          return {
            error: 'Authentication server is unreachable. No local account found with this email. Please click Create Account below.'
          };
        }
        return { error: err.message || 'Login failed.' };
      }
    }

    return {
      error: 'No account found with this email. Please click Create Account below to register.'
    };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    occupation: OccupationType = 'Freelancer'
  ): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Prevent duplicate email in local accounts
    const localAccounts = getLocalAccounts();
    if (localAccounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
      return { error: 'An account with this email address already exists. Please sign in instead.' };
    }

    // 2. If Supabase is configured, attempt cloud registration
    if (isSupabaseConfigured) {
      try {
        const configuredSiteUrl = (import.meta.env.VITE_SITE_URL || '').trim();
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        const targetBase = configuredSiteUrl || currentOrigin;
        const emailRedirectTo = targetBase ? `${targetBase}/dashboard` : undefined;

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo,
            data: {
              full_name: fullName.trim(),
              occupation
            }
          }
        });

        if (error) {
          const msg = error.message?.toLowerCase() || '';
          // If it's a real Auth error (e.g. invalid format or duplicate), return it
          // But if it's "Failed to fetch" or network issue, fall through to local account creation!
          if (!msg.includes('failed to fetch') && !msg.includes('network') && !msg.includes('fetch')) {
            return { error: error.message };
          }
          console.info('[NEXUS Auth] Cloud authentication unavailable; seamlessly provisioning local account.');
        } else if (data.user) {
          if (data.session) {
            setUser(data.user);
            setIsDemoMode(false);
            localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
            localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_ID);

            const newProf: UserProfile = {
              id: data.user.id,
              fullName: fullName.trim(),
              occupation,
              monthlyIncomeRange: '',
              location: '',
              onboardingCompleted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            try {
              await supabase.from('profiles').upsert({
                id: data.user.id,
                full_name: fullName.trim(),
                occupation,
                onboarding_completed: false
              });
            } catch {
              // ignore background error
            }

            setProfile(newProf);
            localStorage.setItem(`nexus_user_profile_${data.user.id}`, JSON.stringify(newProf));
            return { requiresEmailConfirmation: false };
          }
          // If no session returned by Supabase (e.g. project requires email confirmation), proceed to provision local session immediately
          console.info('[NEXUS Auth] Cloud requires manual email confirmation; activating instant local session for uninterrupted onboarding.');
        }
      } catch (err: any) {
        console.info('[NEXUS Auth] Cloud registration exception, switching to resilient local account:', err?.message);
      }
    }

    // 3. Resilient Local Account Creation (Works 100% offline or when Supabase is unreachable/unconfigured)
    const newLocalId = 'user_local_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const hashedPassword = await hashLocalPassword(password);
    const newAccount: LocalAccount = {
      id: newLocalId,
      email: normalizedEmail,
      password: hashedPassword,
      fullName: fullName.trim(),
      occupation,
      createdAt: new Date().toISOString()
    };

    saveLocalAccounts([...localAccounts, newAccount]);

    const localUserObj = {
      id: newLocalId,
      email: normalizedEmail,
      user_metadata: {
        full_name: fullName.trim(),
        occupation
      }
    };

    const newProf: UserProfile = {
      id: newLocalId,
      fullName: fullName.trim(),
      occupation,
      monthlyIncomeRange: '',
      location: '',
      onboardingCompleted: false,
      createdAt: newAccount.createdAt,
      updatedAt: newAccount.createdAt
    };

    setUser(localUserObj);
    setProfile(newProf);
    setIsDemoMode(false);
    localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_ID, newLocalId);
    localStorage.setItem(`nexus_user_profile_${newLocalId}`, JSON.stringify(newProf));

    return { requiresEmailConfirmation: false };
  };

  const resendVerificationEmail = async (email: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };
    try {
      const configuredSiteUrl = (import.meta.env.VITE_SITE_URL || '').trim();
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const targetBase = configuredSiteUrl || currentOrigin;
      const emailRedirectTo = targetBase ? `${targetBase}/dashboard` : undefined;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo
        }
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to resend confirmation email.' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_ID);
    if (isDemoMode) {
      setIsDemoMode(false);
      localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
      localStorage.removeItem(LOCAL_STORAGE_PERSONA_KEY);
      setUser(null);
      setProfile(null);
      return;
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // safe ignore
      }
    }
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const now = new Date().toISOString();
    const updatedProfile: UserProfile = {
      id: user?.id || (isDemoMode ? currentDemoPersona?.profile.id : 'user-local') || 'user-local',
      fullName: updates.fullName || profile?.fullName || user?.email?.split('@')[0] || 'Nexus Member',
      occupation: updates.occupation || profile?.occupation || 'Freelancer',
      monthlyIncomeRange: updates.monthlyIncomeRange !== undefined ? updates.monthlyIncomeRange : profile?.monthlyIncomeRange || '',
      location: updates.location !== undefined ? updates.location : profile?.location || '',
      onboardingCompleted: updates.onboardingCompleted !== undefined ? updates.onboardingCompleted : profile?.onboardingCompleted ?? false,
      createdAt: profile?.createdAt || now,
      ...(profile || {}),
      ...updates,
      updatedAt: now
    };

    setProfile(updatedProfile);

    if (isDemoMode) {
      localStorage.setItem(`nexus_demo_profile_${currentPersonaKey}`, JSON.stringify(updatedProfile));
      return;
    }

    if (user) {
      localStorage.setItem(`nexus_user_profile_${user.id}`, JSON.stringify(updatedProfile));
    }

    if (user && isSupabaseConfigured && !user.id?.startsWith('user_local_')) {
      try {
        const payload: any = {
          id: user.id,
          updated_at: now
        };
        if (updates.fullName !== undefined) payload.full_name = updates.fullName;
        if (updates.occupation !== undefined) payload.occupation = updates.occupation;
        if (updates.monthlyIncomeRange !== undefined) payload.monthly_income_range = updates.monthlyIncomeRange;
        if (updates.location !== undefined) payload.location = updates.location;
        if (updates.onboardingCompleted !== undefined) payload.onboarding_completed = updates.onboardingCompleted;

        await supabase.from('profiles').upsert(payload);
      } catch (_err: any) {
        console.warn('[NEXUS Profile] Background profile upsert notice:', _err?.message);
      }
    }
  };

  // Full User Account Deletion & Right to be Forgotten
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const activeLocalId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_ID);
      if (activeLocalId) {
        const accounts = getLocalAccounts().filter((a) => a.id !== activeLocalId);
        saveLocalAccounts(accounts);
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_ID);
        localStorage.removeItem(`nexus_user_profile_${activeLocalId}`);
        localStorage.removeItem(`nexus_user_records_${activeLocalId}`);
        localStorage.removeItem(`nexus_user_passport_${activeLocalId}`);
        setUser(null);
        setProfile(null);
        return { success: true };
      }

      if (isDemoMode) {
        localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
        localStorage.removeItem(LOCAL_STORAGE_PERSONA_KEY);
        localStorage.removeItem(`nexus_demo_records_${currentPersonaKey}`);
        localStorage.removeItem(`nexus_demo_passport_${currentPersonaKey}`);
        localStorage.removeItem(`nexus_demo_profile_${currentPersonaKey}`);
        setUser(null);
        setProfile(null);
        setIsDemoMode(false);
        return { success: true };
      }

      if (user && isSupabaseConfigured) {
        // 1. Purge server share links
        try {
          await fetch('/api/user/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });
        } catch (_err) {
          // Continue with DB cascade
        }

        // 2. Delete profile from PostgreSQL (cascades all records, analyses, passports, docs, consents)
        const { error: delError } = await supabase.from('profiles').delete().eq('id', user.id);
        if (delError) {
          return { success: false, error: delError.message };
        }

        // 3. Sign out session
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[NEXUS Auth] Account deletion error: [REDACTED]');
      return { success: false, error: err.message || 'Account deletion failed.' };
    }
  };

  const enterDemoMode = (personaKey: DemoPersonaKey = 'freelancer') => {
    const key = personaKey || 'freelancer';
    const persona = DEMO_PERSONAS[key] || DEMO_PERSONAS.freelancer || DEMO_PERSONAS.priya;
    setIsDemoMode(true);
    setCurrentPersonaKey(key);
    localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, 'true');
    localStorage.setItem(LOCAL_STORAGE_PERSONA_KEY, key);
    setUser({ id: persona.profile.id, email: `${key}@nexus-demo.local` });
    const savedDemoProf = localStorage.getItem(`nexus_demo_profile_${key}`);
    if (savedDemoProf) {
      try {
        setProfile(JSON.parse(savedDemoProf));
      } catch {
        setProfile(persona.profile);
      }
    } else {
      setProfile(persona.profile);
    }
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PERSONA_KEY);
    setUser(null);
    setProfile(null);
  };

  const switchDemoPersona = (personaKey: DemoPersonaKey) => {
    enterDemoMode(personaKey);
  };

  const resetDemoData = () => {
    localStorage.removeItem(`nexus_demo_records_${currentPersonaKey}`);
    localStorage.removeItem(`nexus_demo_records_demo-${currentPersonaKey}-sharma`);
    localStorage.removeItem(`nexus_demo_records_demo-${currentPersonaKey}-patel`);
    localStorage.removeItem(`nexus_demo_records_demo-${currentPersonaKey}-malhotra`);
    localStorage.removeItem(`nexus_demo_passport_${currentPersonaKey}`);
    localStorage.removeItem(`nexus_demo_passport_demo-${currentPersonaKey}-sharma`);
    localStorage.removeItem(`nexus_demo_passport_demo-${currentPersonaKey}-patel`);
    localStorage.removeItem(`nexus_demo_passport_demo-${currentPersonaKey}-malhotra`);
    localStorage.removeItem(`nexus_demo_profile_${currentPersonaKey}`);
    const persona = DEMO_PERSONAS[currentPersonaKey] || DEMO_PERSONAS.freelancer;
    setProfile(persona.profile);
    window.location.reload();
  };

  const currentDemoPersona = isDemoMode ? DEMO_PERSONAS[currentPersonaKey] : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isDemoMode,
        currentDemoPersona,
        isSupabaseConnected: isSupabaseConfigured,
        signIn,
        signUp,
        resendVerificationEmail,
        signOut,
        updateProfile,
        deleteAccount,
        enterDemoMode,
        exitDemoMode,
        switchDemoPersona,
        resetDemoData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
