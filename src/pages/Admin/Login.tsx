import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/api/supabase-client';
import { useAuth } from '../../lib/api/auth-context';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const navigate = useNavigate();
  const { session, isAdmin, loading: authLoading } = useAuth();
  const hasTriedLogin = useRef(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[Login] ${msg}`);
    setDebugLog(prev => [...prev.slice(-10), `${time}: ${msg}`]);
  };

  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (!authLoading && session && isAdmin) {
      addLog('Already admin, redirecting to dashboard');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [authLoading, session, isAdmin, navigate]);

  // Watch auth context after login attempt
  useEffect(() => {
    if (!hasTriedLogin.current) return;
    
    addLog(`Auth state: authLoading=${authLoading}, session=${!!session}, isAdmin=${isAdmin}`);

    if (!authLoading && session) {
      if (isAdmin === true) {
        addLog('Admin confirmed! Navigating to dashboard...');
        hasTriedLogin.current = false;
        navigate('/admin/dashboard', { replace: true });
      } else if (isAdmin === false) {
        addLog('Not admin, signing out...');
        hasTriedLogin.current = false;
        supabase.auth.signOut();
        setError('Akses ditolak. Anda bukan admin.');
        setLoading(false);
      }
    }
  }, [authLoading, session, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDebugLog([]);
    hasTriedLogin.current = true;

    addLog(`Login attempt: ${email}`);

    try {
      addLog('Calling signInWithPassword...');
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        addLog(`Auth error: ${authError.message}`);
        setError(authError.message);
        setLoading(false);
        hasTriedLogin.current = false;
        return;
      }

      addLog(`Sign in OK! User: ${data.user?.id?.substring(0, 8)}. Waiting for AuthProvider...`);
      // AuthProvider's onAuthStateChange will handle admin check
      // useEffect above will detect isAdmin change and navigate
      
    } catch (err: any) {
      addLog(`Exception: ${err?.message || err}`);
      setError('Terjadi kesalahan jaringan atau sistem. Silakan coba lagi.');
      setLoading(false);
      hasTriedLogin.current = false;
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
        
        {/* Debug panel - remove after fixing */}
        {debugLog.length > 0 && (
          <div className="p-3 bg-gray-800 rounded-xl text-[10px] font-mono text-green-400 max-h-40 overflow-y-auto space-y-0.5">
            <p className="text-gray-500 mb-1">Debug Log:</p>
            {debugLog.map((log, i) => (
              <p key={i}>{log}</p>
            ))}
          </div>
        )}

        {/* Auth state indicator */}
        <div className="text-[10px] text-center text-gray-400 space-y-0.5">
          <p>Auth: {authLoading ? '⏳ loading' : '✅ ready'} | Session: {session ? '✅' : '❌'} | Admin: {isAdmin === null ? '⏳' : isAdmin ? '✅' : '❌'}</p>
        </div>

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
