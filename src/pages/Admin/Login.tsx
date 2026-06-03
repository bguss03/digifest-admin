import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase-client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('[Login] Starting login sequence...');

    // 15-second timeout for the entire process
    const loginTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Login timeout. Periksa koneksi internet Anda dan coba lagi.');
        console.error('[Login] Sequence timed out after 15s');
      }
    }, 15000);

    try {
      // 1. Sign in with Supabase Auth
      console.log('[Login] DEBUG: Calling auth.signInWithPassword with email:', email);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('[Login] DEBUG: auth.signInWithPassword returned. Error:', authError?.message || 'none');

      if (authError) {
        clearTimeout(loginTimeout);
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('[Login] DEBUG: Auth successful. User ID:', data.user.id);
        console.log('[Login] DEBUG: Checking profiles table for is_admin...');
        
        // 2. Immediate admin check
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();
        
        console.log('[Login] DEBUG: profiles query returned. Error:', profileError?.message || 'none', 'Data:', profile);

        clearTimeout(loginTimeout);

        if (profileError) {
          console.error('[Login] Profile check error:', profileError);
          await supabase.auth.signOut();
          setError('Gagal memverifikasi status admin. Hubungi pengembang.');
          setLoading(false);
          return;
        }

        if (!profile?.is_admin) {
          console.log('[Login] User is not an admin, signing out...');
          await supabase.auth.signOut();
          setError('Akses ditolak. Anda bukan admin.');
          setLoading(false);
          return;
        }

        console.log('[Login] Admin verified, navigating to dashboard...');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      clearTimeout(loginTimeout);
      console.error('[Login] Unexpected error during login:', err);
      setError('Terjadi kesalahan jaringan atau sistem. Silakan coba lagi.');
      setLoading(false);
    }
  };

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
