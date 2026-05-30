import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/api/auth-context';
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import Login from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import RegistrationsList from './pages/Admin/RegistrationsList';
import SubmissionList from './pages/Admin/SubmissionList';

function App() {
  return (
    <AuthProvider>
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
            <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-center selection:bg-indigo-100 selection:text-indigo-700">
              {/* Background Accent */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                    Management Console
                  </span>
                  <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    DIGIFEST <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">2026</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-light leading-relaxed max-w-lg mx-auto">
                    A comprehensive portal to manage registrations, track submissions, and orchestrate the digital festival ecosystem.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <a 
                    href="/admin/login" 
                    className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold shadow-xl shadow-gray-200 dark:shadow-none hover:bg-gray-800 dark:hover:bg-gray-100 transform transition-all active:scale-95 duration-200 flex items-center justify-center"
                  >
                    Access Dashboard
                  </a>
                  <a 
                    href="https://himmatisi.org" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 duration-200"
                  >
                    Learn More
                  </a>
                </div>

                <div className="pt-12 flex items-center justify-center gap-8 opacity-50 grayscale dark:invert">
                  <img src="/src/assets/react.svg" alt="React" className="h-6" />
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
                  <img src="/src/assets/vite.svg" alt="Vite" className="h-6" />
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
                  <span className="text-xs font-bold tracking-widest text-gray-900 dark:text-white">SUPABASE</span>
                </div>
              </div>

              <footer className="absolute bottom-8 text-xs text-gray-400 dark:text-gray-600">
                &copy; 2026 HIMMATISI. All rights reserved.
              </footer>
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
