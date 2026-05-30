import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import Login from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import RegistrationsList from './pages/Admin/RegistrationsList';
import SubmissionList from './pages/Admin/SubmissionList';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/admin/login" element={<Login />} />
        
        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/registrations" element={<RegistrationsList />} />
            <Route path="/admin/submissions" element={<SubmissionList />} />
          </Route>
        </Route>

        {/* Redirects */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/" element={
          <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
            <h1 className="text-4xl font-bold text-indigo-600 mb-4">DIGIFEST Admin System</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Checking system status...</p>
            <a 
              href="/admin/login" 
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Admin Login
            </a>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
