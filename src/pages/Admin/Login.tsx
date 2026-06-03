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

    console.log('[Login] Attempting sign in...');

    try {
      // 1. Sign in
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('[Login] Sign in successful, checking admin status...');
        
        // 2. Immediate admin check for feedback
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('[Login] Profile check error:', profileError);
          await supabase.auth.signOut();
          setError('Gagal memverifikasi profil admin. Periksa koneksi internet Anda.');
          setLoading(false);
          return;
        }

        if (!profile?.is_admin) {
          console.log('[Login] User is not an admin');
          await supabase.auth.signOut();
          setError('Akses ditolak. Akun Anda tidak terdaftar sebagai admin.');
          setLoading(false);
          return;
        }

        console.log('[Login] Admin verified, navigating...');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Login</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">DIGIFEST Dashboard</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 mt-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 mt-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="text-center text-xs text-gray-500 mt-4">
          Pastikan koneksi internet stabil saat melakukan login.
        </p>
      </div>
    </div>
  );
};

export default Login;
