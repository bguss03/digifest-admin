import { useEffect, useState } from 'react';
import { supabase } from '../../lib/api/supabase-client';
import { Search, Filter, Eye, X } from 'lucide-react';

interface Registration {
  id: string;
  nama_tim: string;
  instansi: string;
  kategori: string;
  status_verifikasi: string;
  created_at: string;
  batch: string;
  nama_ketua: string;
  no_ketua: string;
  nim_ketua: string;
  bukti_bayar_url: string;
  surat_ketua_url: string;
  bukti_follow_ketua_url: string;
  [key: string]: any; // Untuk field dinamis seperti anggota
}

const RegistrationsList = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRegistrations(data);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('registrations')
      .update({ status_verifikasi: newStatus })
      .eq('id', id);

    if (!error) {
      setRegistrations(prev => prev.map(item => item.id === id ? { ...item, status_verifikasi: newStatus } : item));
      if (selectedReg?.id === id) {
        setSelectedReg({ ...selectedReg, status_verifikasi: newStatus });
      }
    }
  };

  const filteredData = registrations.filter(item => {
    const matchesSearch = (item.nama_tim?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.instansi?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.nama_ketua?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'All' || item.kategori === filterCategory;
    
    if (searchTerm || filterCategory !== 'All') {
      console.log(`Filtering: search="${searchTerm}", category="${filterCategory}" | Item: tim="${item.nama_tim}", cat="${item.kategori}" | matchesSearch=${matchesSearch}, matchesFilter=${matchesFilter}`);
    }
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Registrasi</h1>
          <p className="text-sm text-gray-500">Daftar tim yang telah melakukan registrasi</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari tim, instansi, atau ketua..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">Semua Kategori</option>
              <option value="UI UX">UI UX</option>
              <option value="Innovation System Challenge">Innovation System Challenge</option>
              <option value="IT Competition">IT Competition</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Nama Tim</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Ketua / Instansi</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Kategori</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">WA Ketua</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{item.nama_tim}</div>
                      <div className="text-xs text-gray-400">Batch: {item.batch}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      <div className="text-sm font-medium">{item.nama_ketua}</div>
                      <div className="text-xs">{item.instansi}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.no_ketua}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status_verifikasi)}`}>
                        {item.status_verifikasi || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedReg(item)}
                        className="flex items-center text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                      >
                        <Eye size={16} className="mr-1" /> Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold dark:text-white">Detail Registrasi: {selectedReg.nama_tim}</h2>
              <button onClick={() => setSelectedReg(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Informasi Tim</h3>
                  <div className="mt-2 space-y-2">
                    <p className="dark:text-white"><span className="font-medium">Instansi:</span> {selectedReg.instansi}</p>
                    <p className="dark:text-white"><span className="font-medium">Kategori:</span> {selectedReg.kategori}</p>
                    <p className="dark:text-white"><span className="font-medium">Batch:</span> {selectedReg.batch}</p>
                    <p className="dark:text-white"><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReg.status_verifikasi)}`}>
                        {selectedReg.status_verifikasi || 'pending'}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Data Ketua</h3>
                  <div className="mt-2 space-y-2">
                    <p className="dark:text-white"><span className="font-medium">Nama:</span> {selectedReg.nama_ketua}</p>
                    <p className="dark:text-white"><span className="font-medium">NIM/ID:</span> {selectedReg.nim_ketua}</p>
                    <p className="dark:text-white"><span className="font-medium">WA:</span> {selectedReg.no_ketua}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedReg.surat_ketua_url && <a href={selectedReg.surat_ketua_url} target="_blank" rel="noreferrer" className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100">Surat Ketua</a>}
                      {selectedReg.bukti_follow_ketua_url && <a href={selectedReg.bukti_follow_ketua_url} target="_blank" rel="noreferrer" className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100">Bukti Follow</a>}
                      {selectedReg.bukti_post_ketua_url && <a href={selectedReg.bukti_post_ketua_url} target="_blank" rel="noreferrer" className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100">Bukti Post</a>}
                    </div>
                  </div>
                </div>

                {selectedReg.bukti_bayar_url && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Bukti Bayar</h3>
                    <a href={selectedReg.bukti_bayar_url} target="_blank" rel="noreferrer">
                      <img src={selectedReg.bukti_bayar_url} alt="Bukti Bayar" className="mt-2 w-full max-w-[300px] border rounded shadow-sm hover:opacity-90 transition-opacity" />
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Anggota Tim</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => {
                    const name = selectedReg[`anggota${i}_nama`];
                    if (!name) return null;
                    return (
                      <div key={i} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        <p className="font-medium dark:text-white">Anggota {i}: {name}</p>
                        <p className="text-xs text-gray-500">NIM: {selectedReg[`nim_anggota${i}`] || '-'}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedReg[`anggota${i}_surat_url`] && <a href={selectedReg[`anggota${i}_surat_url`]} target="_blank" rel="noreferrer" className="text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">Surat</a>}
                          {selectedReg[`anggota${i}_follow_url`] && <a href={selectedReg[`anggota${i}_follow_url`]} target="_blank" rel="noreferrer" className="text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">Follow</a>}
                          {selectedReg[`anggota${i}_post_url`] && <a href={selectedReg[`anggota${i}_post_url`]} target="_blank" rel="noreferrer" className="text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">Post</a>}
                        </div>
                      </div>
                    );
                  })}
                  {![1, 2, 3, 4].some(i => selectedReg[`anggota${i}_nama`]) && (
                    <p className="text-sm text-gray-500 italic">Tidak ada anggota tambahan.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 bg-gray-50 dark:bg-gray-900/20">
              <button 
                onClick={() => handleUpdateStatus(selectedReg.id, 'rejected')}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedReg.id, 'verified')}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Verify & Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationsList;
