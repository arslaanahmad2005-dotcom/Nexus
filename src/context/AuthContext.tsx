import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, OccupationType } from '../types';
import { DEMO_PERSONAS, DemoPersona } from '../data/demoData';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  currentDemoPersona: DemoPersona | null;
  isSupabaseConnected: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string, occupation?: OccupationType) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  enterDemoMode: (personaKey?: 'priya' | 'aarav') => void;
  exitDemoMode: () => void;
  switchDemoPersona: (personaKey: 'priya' | 'aarav') => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_DEMO_KEY = 'nexus_demo_mode_state';
const LOCAL_STORAGE_PERSONA_KEY = 'nexus_demo_persona_key';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [currentPersonaKey, setCurrentPersonaKey] = useState<'priya' | 'aarav'>('priya');

  // Load session or check demo mode
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      const savedDemoMode = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
      const savedPersona = localStorage.getItem(LOCAL_STORAGE_PERSONA_KEY) as 'priya' | 'aarav' || 'priya';

      if (savedDemoMode === 'true') {
        const persona = DEMO_PERSONAS[savedPersona] || DEMO_PERSONAS.priya;
        setIsDemoMode(true);
        setCurrentPersonaKey(savedPersona);
        setUser({ id: persona.profile.id, email: `${savedPersona}@nexus-demo.local` });
        setProfile(persona.profile);
        setIsLoading(false);
        return;
      }

      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
        } catch (err) {
          console.error('Error fetching Supabase session:', err);
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
        } else if (!isDemoMode) {
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
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      if (data) {
        setProfile({
          id: data.id,
          fullName: data.full_name,
          occupation: data.occupation || 'Freelancer',
          monthlyIncomeRange: data.monthly_income_range || '',
          location: data.location || '',
          onboardingCompleted: data.onboarding_completed ?? false,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase credentials are not yet configured in .env. Click "Explore Demo" to inspect the fully functional app in demo mode.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        setUser(data.user);
        setIsDemoMode(false);
        localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
        await fetchProfile(data.user.id);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed.' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    occupation: OccupationType = 'Freelancer'
  ): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase credentials are not yet configured in .env. Click "Explore Demo" to inspect the app.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            occupation
          }
        }
      });

      if (error) return { error: error.message };

      if (data.user) {
        setUser(data.user);
        setIsDemoMode(false);
        localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);

        // Ensure profile record exists
        const newProf: UserProfile = {
          id: data.user.id,
          fullName,
          occupation,
          monthlyIncomeRange: '',
          location: '',
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          occupation,
          onboarding_completed: false
        });

        setProfile(newProf);
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Sign up failed.' };
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
      localStorage.removeItem(LOCAL_STORAGE_PERSONA_KEY);
      setUser(null);
      setProfile(null);
      return;
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (isDemoMode) {
      if (profile) {
        setProfile({ ...profile, ...updates, updatedAt: new Date().toISOString() });
      }
      return;
    }

    if (!user || !isSupabaseConfigured) return;

    try {
      const payload: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.occupation !== undefined) payload.occupation = updates.occupation;
      if (updates.monthlyIncomeRange !== undefined) payload.monthly_income_range = updates.monthlyIncomeRange;
      if (updates.location !== undefined) payload.location = updates.location;
      if (updates.onboardingCompleted !== undefined) payload.onboarding_completed = updates.onboardingCompleted;

      await supabase.from('profiles').update(payload).eq('id', user.id);

      if (profile) {
        setProfile({ ...profile, ...updates });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const enterDemoMode = (personaKey: 'priya' | 'aarav' = 'priya') => {
    const persona = DEMO_PERSONAS[personaKey] || DEMO_PERSONAS.priya;
    setIsDemoMode(true);
    setCurrentPersonaKey(personaKey);
    localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, 'true');
    localStorage.setItem(LOCAL_STORAGE_PERSONA_KEY, personaKey);
    setUser({ id: persona.profile.id, email: `${personaKey}@nexus-demo.local` });
    setProfile(persona.profile);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PERSONA_KEY);
    setUser(null);
    setProfile(null);
  };

  const switchDemoPersona = (personaKey: 'priya' | 'aarav') => {
    enterDemoMode(personaKey);
  };

  const resetDemoData = () => {
    // Clear any customized demo storage and restore initial persona state
    const persona = DEMO_PERSONAS[currentPersonaKey] || DEMO_PERSONAS.priya;
    localStorage.removeItem(`nexus_demo_records_${currentPersonaKey}`);
    localStorage.removeItem(`nexus_demo_passport_${currentPersonaKey}`);
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
        signOut,
        updateProfile,
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
