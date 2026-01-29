import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { queryClient } from '@/App';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'agente' | 'coordinatore' | 'admin';
  sede: string;
  sedi?: string[];
  avatar_emoji?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role?: string, sede?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  // Clear all React Query cache when user changes
  const clearQueryCache = () => {
    queryClient.clear();
  };

  useEffect(() => {
    let isMounted = true;
    let previousUserId: string | null = null;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        previousUserId = session?.user?.id ?? null;
        setLoading(false);

        // Load profile in background (never block the UI)
        if (session?.user) {
          fetchProfile(session.user.id).catch(() => {
            /* ignore */
          });
        } else {
          setProfile(null);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;

        const newUserId = session?.user?.id ?? null;
        
        // Clear cache when user changes (login as different user or logout)
        if (previousUserId !== newUserId) {
          clearQueryCache();
          previousUserId = newUserId;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          fetchProfile(session.user.id).catch(() => {
            /* ignore */
          });
        } else {
          setProfile(null);
        }
      }
    );

    initialize();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Clear cache before signing in to ensure fresh data
    clearQueryCache();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: string = 'agente',
    sede: string = 'AREZZO'
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          role,
          sede,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Clear all cached data before signing out
    clearQueryCache();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refetchProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refetchProfile }}>
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
