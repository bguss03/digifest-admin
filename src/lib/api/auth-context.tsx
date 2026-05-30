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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (error) return false;
      return !!data?.is_admin;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Initial session recovery
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        if (session) {
          checkAdmin(session.user.id).then(status => {
            if (isMounted) {
              setIsAdmin(status);
              setLoading(false);
            }
          });
        } else {
          setLoading(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
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
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
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
