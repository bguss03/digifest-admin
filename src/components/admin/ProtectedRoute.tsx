import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase-client';

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async (userId: string) => {
      console.log('Checking admin status for user:', userId);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', userId)
          .single();
        
        if (isMounted) {
          if (error) {
            console.error('Error fetching admin profile:', error);
            setIsAdmin(false);
          } else {
            console.log('Admin status result:', data?.is_admin);
            setIsAdmin(!!data?.is_admin);
          }
          setLoading(false); // Ensure loading ends here
        }
      } catch (err) {
        console.error('Unexpected error in profile check:', err);
        if (isMounted) setIsAdmin(false);
      }
    };

    const initialize = async () => {
      console.log('Initializing session check...');
      try {
        // Small delay to ensure mobile browsers have loaded storage
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 1. Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (isMounted) {
          console.log('Session found:', !!currentSession);
          if (currentSession) {
            setSession(currentSession);
            await checkAdminStatus(currentSession.user.id);
          } else {
            // If session is null, try one more time after a short delay (mobile fix)
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (isMounted) {
              setSession(retrySession);
              if (retrySession?.user) {
                await checkAdminStatus(retrySession.user.id);
              } else {
                setIsAdmin(false);
                setLoading(false);
              }
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setSession(null);
          setIsAdmin(false);
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          console.log('Initialization finished');
          // We don't necessarily set loading false here if checkAdminStatus is still running
          // loading is handled inside checkAdminStatus or onAuthStateChange
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event, !!currentSession);
      if (!isMounted) return;

      setSession(currentSession);
      
      if (currentSession?.user) {
        // Always check admin status if we have a user and we're not sure yet
        // or if it's a critical auth event
        await checkAdminStatus(currentSession.user.id);
      } else {
        setIsAdmin(false);
      }
      
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Memverifikasi Sesi...</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Mohon tunggu sebentar.</p>
        <button 
          onClick={() => window.location.href = '/admin/login'}
          className="mt-8 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
        >
          Kembali ke Login jika terlalu lama
        </button>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
