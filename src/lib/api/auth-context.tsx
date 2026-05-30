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

  // Cache admin status to make refreshes instant
  const getCachedAdminStatus = (userId: string) => {
    const cached = localStorage.getItem(`is_admin_${userId}`);
    return cached === 'true';
  };

  const setCachedAdminStatus = (userId: string, status: boolean) => {
    localStorage.setItem(`is_admin_${userId}`, String(status));
  };

  const checkAdmin = async (userId: string) => {
    console.log('[Auth] Checking admin status:', userId);
    
    // Check cache first for immediate UI response
    const cached = getCachedAdminStatus(userId);
    if (cached) {
      console.log('[Auth] Using cached admin status: true');
      setIsAdmin(true);
      // We don't stop here, we still verify with the server
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      const status = !!data?.is_admin;
      console.log('[Auth] Server admin status:', status);
      setIsAdmin(status);
      setCachedAdminStatus(userId, status);
      return status;
    } catch (err) {
      console.error('[Auth] Admin check failed:', err);
      // If we have a cached 'true', we might want to stick with it if the network fails
      return cached; 
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const { data: { session: initSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (initSession) {
          console.log('[Auth] Initial session found');
          setSession(initSession);
          await checkAdmin(initSession.user.id);
        } else {
          console.log('[Auth] No initial session');
          setSession(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[Auth] Event:', event);
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (currentSession) {
        setSession(currentSession);
        // Only trigger loading if we don't have a status yet
        if (isAdmin === null) setLoading(true);
        await checkAdmin(currentSession.user.id);
        if (isMounted) setLoading(false);
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
    localStorage.clear(); // Clear cache on logout
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
