import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase-client';

interface AuthContextType {
  session: any;
  isAdmin: boolean | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string) => {
    try {
      console.log('[AuthContext] Checking admin for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[AuthContext] Admin check error:', error);
        return false;
      }
      return !!data?.is_admin;
    } catch (err) {
      console.error('[AuthContext] Admin check exception:', err);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Load: Check if we already have a session
    const initializeAuth = async () => {
      try {
        const { data: { session: initSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (initSession) {
          console.log('[AuthContext] Initial session recovered');
          setSession(initSession);
          const status = await checkAdmin(initSession.user.id);
          if (isMounted) {
            setIsAdmin(status);
            setLoading(false);
          }
        } else {
          console.log('[AuthContext] No initial session');
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] Initialization failed:', err);
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[AuthContext] Event:', event);
      if (!isMounted) return;

      setSession(currentSession);
      
      if (currentSession) {
        const status = await checkAdmin(currentSession.user.id);
        if (isMounted) {
          setIsAdmin(status);
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
