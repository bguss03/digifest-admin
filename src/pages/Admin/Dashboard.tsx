import { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  Layers,
  Clock
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import { supabase } from '../../lib/api/supabase-client';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Total Pendaftar', value: '0', icon: Users, color: 'bg-blue-500' },
    { title: 'Total Karya Masuk', value: '0', icon: FileText, color: 'bg-green-500' },
    { title: 'Kategori Lomba', value: '3', icon: Layers, color: 'bg-purple-500' },
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    console.log('[Dashboard] Fetching stats...');
    try {
      // Count registrations
      const { count: regCount, error: regError } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });

      if (regError) {
        console.error('[Dashboard] Error fetching registrations:', regError);
      }

      // Count submissions
      const { count: subCount, error: subError } = await supabase
        .from('submissions_karya')
        .select('*', { count: 'exact', head: true });

      if (subError) {
        console.error('[Dashboard] Error fetching submissions:', subError);
      }

      console.log('[Dashboard] Stats fetched:', { registrations: regCount, submissions: subCount });

      setStats([
        { title: 'Total Pendaftar', value: (regCount || 0).toString(), icon: Users, color: 'bg-blue-500' },
        { title: 'Total Karya Masuk', value: (subCount || 0).toString(), icon: FileText, color: 'bg-green-500' },
        { title: 'Kategori Lomba', value: '3', icon: Layers, color: 'bg-purple-500' },
      ]);
    } catch (err) {
      console.error('[Dashboard] Unexpected error in fetchStats:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">Selamat datang kembali, Admin!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Status Sistem</h2>
          <div className="flex items-center text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
            <Clock size={16} className="mr-1" /> Terhubung ke Supabase
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Tabel Registrations</p>
            <p className="font-medium text-gray-900 dark:text-white">Online & Sinkron</p>
          </div>
          <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Tabel Submissions</p>
            <p className="font-medium text-gray-900 dark:text-white">Online & Sinkron</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
