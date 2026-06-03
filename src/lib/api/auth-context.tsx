import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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

  // Refs to prevent race conditions
  const lastCheckedUserId = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const checkAdmin = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log('[AuthContext] Checking admin for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      console.log('[AuthContext] Admin check result:', { data, error: error?.message });

      if (error) {
        console.error('[AuthContext] Admin check error:', error);
        return false;
      }
      return !!data?.is_admin;
    } catch (err) {
      console.error('[AuthContext] Admin check exception:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Step 1: Get initial session
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Initializing...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!isMountedRef.current) return;

        if (initialSession?.user) {
          console.log('[AuthContext] Found existing session for:', initialSession.user.id.substring(0, 8));
          setSession(initialSession);

          const adminStatus = await checkAdmin(initialSession.user.id);
          if (!isMountedRef.current) return;

          lastCheckedUserId.current = initialSession.user.id;
          setIsAdmin(adminStatus);
          console.log('[AuthContext] Init complete. isAdmin:', adminStatus);
        } else {
          console.log('[AuthContext] No existing session');
          setSession(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('[AuthContext] Init error:', err);
        if (isMountedRef.current) {
          setSession(null);
          setIsAdmin(false);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          console.log('[AuthContext] Loading set to false');
        }
      }
    };

    initializeAuth();

    // Step 2: Listen for auth changes AFTER initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[AuthContext] Auth event:', event, '| User:', currentSession?.user?.id?.substring(0, 8) || 'none');

      if (!isMountedRef.current) return;

      // Skip INITIAL_SESSION — already handled by getSession above
      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (event === 'SIGNED_OUT' || !currentSession) {
        lastCheckedUserId.current = null;
        setSession(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const userId = currentSession.user.id;

      // Token refresh for same user — just update session, keep admin status
      if (event === 'TOKEN_REFRESHED' && lastCheckedUserId.current === userId) {
        console.log('[AuthContext] Token refreshed, keeping admin status');
        setSession(currentSession);
        return;
      }

      // SIGNED_IN — need to verify admin
      if (event === 'SIGNED_IN') {
        console.log('[AuthContext] SIGNED_IN, checking admin...');
        setSession(currentSession);
        setLoading(true); // Show loading spinner while checking

        const adminStatus = await checkAdmin(userId);
        if (!isMountedRef.current) return;

        lastCheckedUserId.current = userId;
        setIsAdmin(adminStatus);
        setLoading(false);
        console.log('[AuthContext] SIGNED_IN complete. isAdmin:', adminStatus);
        return;
      }

      // Other events — just update session
      setSession(currentSession);
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [checkAdmin]);

  const signOut = async () => {
    setLoading(true);
    lastCheckedUserId.current = null;
    await supabase.auth.signOut();
    // onAuthStateChange SIGNED_OUT will handle the rest
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
