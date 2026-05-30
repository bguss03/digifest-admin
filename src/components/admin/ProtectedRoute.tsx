import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase-client';

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        setSession(session);

        if (session) {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

          if (isMounted) {
            if (!error && data?.is_admin) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          }
        } else {
          if (isMounted) setIsAdmin(false);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkUser();

    // Set a safety timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Session check timed out');
        setLoading(false);
      }
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      
      setSession(session);
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        if (isMounted) setIsAdmin(!!data?.is_admin);
      } else {
        if (isMounted) setIsAdmin(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading admin session...</p>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
