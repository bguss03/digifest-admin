import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/api/auth-context';

const ProtectedRoute = () => {
  const { session, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950 px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Verifying...</h2>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
