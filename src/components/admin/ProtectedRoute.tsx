import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase-client';

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // Use null for 'unknown'

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', userId)
          .single();
        
        if (isMounted) {
          if (error) {
            console.error('Admin check error:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(!!data?.is_admin);
          }
        }
      } catch (err) {
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Listen for auth changes - this is our primary driver
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth event:', event);
      if (!isMounted) return;

      setSession(currentSession);
      
      if (currentSession?.user) {
        // If we have a user but don't know admin status, check it
        await checkAdminStatus(currentSession.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Initial check in case onAuthStateChange is slow to fire INITIAL_SESSION
    const checkInitial = async () => {
      const { data: { session: initSession } } = await supabase.auth.getSession();
      if (isMounted && initSession && isAdmin === null) {
        setSession(initSession);
        await checkAdminStatus(initSession.user.id);
      }
    };
    checkInitial();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isAdmin]);

  // Only show loading if we haven't determined admin status yet
  if (loading && isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Memverifikasi Sesi...</h2>
      </div>
    );
  }

  if (!session || isAdmin === false) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
