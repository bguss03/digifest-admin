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
  
  // Use refs to avoid stale closures and redundant checks
  const loadingRef = useRef(true);
  const lastCheckedUserId = useRef<string | null>(null);
  const adminCheckInFlight = useRef(false);

  const checkAdmin = useCallback(async (userId: string): Promise<boolean> => {
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
  }, []);

  // Helper to finish loading
  const finishLoading = useCallback((adminStatus: boolean, userSession: any) => {
    setSession(userSession);
    setIsAdmin(adminStatus);
    setLoading(false);
    loadingRef.current = false;
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Failsafe timeout using ref (not stale state)
    const failsafeTimeout = setTimeout(() => {
      if (isMounted && loadingRef.current) {
        console.warn('[AuthContext] Failsafe: forcing loading=false after 10s');
        finishLoading(false, null);
      }
    }, 10000);

    // Single source of truth: onAuthStateChange handles everything
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[AuthContext] Event:', event, '| User:', currentSession?.user?.id?.substring(0, 8) || 'none');
      if (!isMounted) return;

      if (!currentSession) {
        // No session — user is logged out
        console.log('[AuthContext] No session, clearing state');
        lastCheckedUserId.current = null;
        adminCheckInFlight.current = false;
        finishLoading(false, null);
        return;
      }

      const userId = currentSession.user.id;

      // If we already verified this user and it's just a token refresh, skip re-check
      if (lastCheckedUserId.current === userId && !loadingRef.current) {
        console.log('[AuthContext] Same user, skipping admin re-check. Event:', event);
        // Just update the session (it has a new token), keep isAdmin as-is
        setSession(currentSession);
        return;
      }

      // Avoid duplicate in-flight admin checks for the same user
      if (adminCheckInFlight.current) {
        console.log('[AuthContext] Admin check already in flight, skipping');
        return;
      }

      // We need to check admin status
      adminCheckInFlight.current = true;
      // Set session immediately so the UI knows we have a user
      setSession(currentSession);

      try {
        const status = await checkAdmin(userId);
        if (isMounted) {
          lastCheckedUserId.current = userId;
          finishLoading(status, currentSession);
        }
      } catch (err) {
        console.error('[AuthContext] Failed to check admin:', err);
        if (isMounted) {
          finishLoading(false, currentSession);
        }
      } finally {
        adminCheckInFlight.current = false;
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(failsafeTimeout);
      subscription.unsubscribe();
    };
  }, [checkAdmin, finishLoading]);

  const signOut = async () => {
    setLoading(true);
    loadingRef.current = true;
    lastCheckedUserId.current = null;
    await supabase.auth.signOut();
    // onAuthStateChange will handle clearing state
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
