import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase-client';
import { useAuth } from '../../lib/api/auth-context';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session, isAdmin, loading: authLoading } = useAuth();

  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (!authLoading && session && isAdmin) {
      console.log('[Login] Already authenticated as admin, redirecting...');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [authLoading, session, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('[Login] Starting login...');

    try {
      // Just sign in — AuthProvider will handle admin check via onAuthStateChange
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('[Login] Auth error:', authError.message);
        setError(authError.message);
        setLoading(false);
        return;
      }

      console.log('[Login] Sign in successful, waiting for AuthProvider to verify admin...');
      // Don't navigate here — the useEffect above will handle navigation
      // once AuthProvider finishes the admin check and sets isAdmin=true
      
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      setError('Terjadi kesalahan jaringan atau sistem. Silakan coba lagi.');
      setLoading(false);
    }
  };

  // Watch for auth context changes to handle post-login results
  useEffect(() => {
    if (!loading) return; // Only care when we initiated a login

    // Auth context finished loading after we triggered login
    if (!authLoading && session) {
      if (isAdmin) {
        console.log('[Login] Admin verified by AuthProvider, navigating...');
        navigate('/admin/dashboard', { replace: true });
      } else if (isAdmin === false) {
        // AuthProvider confirmed NOT admin
        console.log('[Login] Not admin, signing out...');
        supabase.auth.signOut();
        setError('Akses ditolak. Anda bukan admin.');
        setLoading(false);
      }
    }
  }, [authLoading, session, isAdmin, loading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Admin Login</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest text-xs">DIGIFEST Dashboard</p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl animate-shake">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase ml-1">Email Address</label>
            <input
              type="email"
              required
              disabled={loading}
              placeholder="admin@digifest.com"
              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white disabled:opacity-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase ml-1">Password</label>
            <input
              type="password"
              required
              disabled={loading}
              placeholder="••••••••"
              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white disabled:opacity-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            System protected by Supabase Auth & RLS Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
