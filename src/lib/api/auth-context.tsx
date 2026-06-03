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

  const lastCheckedUserId = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Check admin status using direct REST call with the user's access token
  // This avoids issues where the Supabase JS client may not have updated its token yet
  const checkAdmin = useCallback(async (userId: string, accessToken: string): Promise<boolean> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;

    try {
      console.log('[AuthContext] Checking admin for:', userId.substring(0, 8));

      // Method 1: Direct REST API call with user's access token (bypasses JS client token race)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/profiles?select=is_admin&id=eq.${userId}`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('[AuthContext] REST query result:', data);
          if (Array.isArray(data) && data.length > 0) {
            return !!data[0].is_admin;
          }
          // Empty array = RLS blocking or no row found
          console.warn('[AuthContext] No profile row found, trying Supabase client...');
        } else {
          console.error('[AuthContext] REST query failed:', response.status, response.statusText);
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          console.warn('[AuthContext] REST query timed out after 5s');
        } else {
          console.error('[AuthContext] REST query error:', fetchErr.message);
        }
      }

      // Method 2: Fallback to Supabase JS client
      console.log('[AuthContext] Trying Supabase JS client...');
      const queryPromise = supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      const result = await Promise.race([
        queryPromise,
        new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: 'JS client query timed out' } }), 5000)
        ),
      ]);

      console.log('[AuthContext] JS client result:', { data: result.data, error: result.error?.message });

      if (result.data && !result.error) {
        return !!result.data.is_admin;
      }

      // Method 3: Check user metadata as last resort
      console.log('[AuthContext] Trying user metadata...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.app_metadata?.is_admin || user?.user_metadata?.is_admin) {
        console.log('[AuthContext] Admin confirmed via metadata');
        return true;
      }

      console.log('[AuthContext] All admin check methods failed');
      return false;
    } catch (err) {
      console.error('[AuthContext] Admin check exception:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Initializing...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!isMountedRef.current) return;

        if (initialSession?.user) {
          console.log('[AuthContext] Found existing session for:', initialSession.user.id.substring(0, 8));
          setSession(initialSession);

          const adminStatus = await checkAdmin(initialSession.user.id, initialSession.access_token);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[AuthContext] Auth event:', event, '| User:', currentSession?.user?.id?.substring(0, 8) || 'none');

      if (!isMountedRef.current) return;

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

      if (event === 'TOKEN_REFRESHED' && lastCheckedUserId.current === userId) {
        console.log('[AuthContext] Token refreshed, keeping admin status');
        setSession(currentSession);
        return;
      }

      if (event === 'SIGNED_IN') {
        console.log('[AuthContext] SIGNED_IN, checking admin...');
        setSession(currentSession);
        setLoading(true);

        const adminStatus = await checkAdmin(userId, currentSession.access_token);
        if (!isMountedRef.current) return;

        lastCheckedUserId.current = userId;
        setIsAdmin(adminStatus);
        setLoading(false);
        console.log('[AuthContext] SIGNED_IN complete. isAdmin:', adminStatus);
        return;
      }

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
