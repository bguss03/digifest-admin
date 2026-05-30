import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/api/auth-context';

const ProtectedRoute = () => {
  const { session, isAdmin, loading } = useAuth();
  
  console.log('[ProtectedRoute] Rendering:', { loading, hasSession: !!session, isAdmin });

  // Loading state only shows on initial app load, and it's handled at the provider level
  if (loading && isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Memverifikasi Sesi...</h2>
        <p className="text-sm text-gray-500 mt-2">Koneksi Anda mungkin sedang lambat</p>
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/admin/login';
          }}
          className="mt-8 text-xs text-red-500 hover:text-red-600 font-medium underline"
        >
          Paksa Keluar jika macet
        </button>
      </div>
    );
  }

  // Once loading is false, the decision is final for the current route attempt
  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
