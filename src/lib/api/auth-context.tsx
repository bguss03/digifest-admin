import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase-client';

interface AuthContextType {
  session: any;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string) => {
    console.log('[Auth] Starting admin check for:', userId);
    
    // Create a timeout promise
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Admin check timed out')), 10000)
    );

    try {
      const query = supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      // Race the query against the timeout
      const { data, error } = await (Promise.race([query, timeout]) as any);
      
      if (error) {
        console.error('[Auth] Admin check query error:', error);
        return false;
      }
      
      console.log('[Auth] Admin check result:', data?.is_admin);
      return !!data?.is_admin;
    } catch (err) {
      console.error('[Auth] Admin check failed or timed out:', err);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      console.log('[Auth] Initializing auth...');
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (isMounted) {
          console.log('[Auth] Initial session found:', !!initialSession);
          setSession(initialSession);
          
          if (initialSession) {
            const adminStatus = await checkAdmin(initialSession.user.id);
            if (isMounted) setIsAdmin(adminStatus);
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        if (isMounted) {
          console.log('[Auth] Init finished');
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[Auth] State changed:', event);
      if (!isMounted) return;

      setSession(currentSession);
      
      if (currentSession) {
        const adminStatus = await checkAdmin(currentSession.user.id);
        if (isMounted) {
          setIsAdmin(adminStatus);
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
