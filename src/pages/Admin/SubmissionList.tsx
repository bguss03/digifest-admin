import { useEffect, useState } from 'react';
import { supabase } from '../../lib/api/supabase-client';
import { Search, Filter, Eye, ExternalLink, X, FileText, Video, Music } from 'lucide-react';

interface Submission {
  id: string;
  nama_tim: string;
  asal_sekolah: string;
  nama_ketua: string;
  no_whatsapp: string;
  kategori: string;
  judul_inovasi?: string;
  link_proposal_drive?: string;
  link_youtube?: string;
  judul_lagu?: string;
  genre_konsep?: string;
  durasi_video?: string;
  link_video_drive?: string;
  created_at: string;
}

const SubmissionList = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions_karya')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data);
    }
    setLoading(false);
  };

  const filteredData = submissions.filter(item => {
    const matchesSearch = (item.nama_tim?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.asal_sekolah?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.nama_ketua?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.judul_inovasi?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    // Robust category matching
    const itemCategory = item.kategori?.toLowerCase().trim() || '';
    const selectedCategory = filterCategory.toLowerCase().trim();
    
    const matchesFilter = filterCategory === 'All' || itemCategory === selectedCategory;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Karya</h1>
          <p className="text-sm text-gray-500">Daftar karya yang telah dikumpulkan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari tim, sekolah, ketua..."
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
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Sekolah / Ketua</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Kategori</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Info Utama</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.nama_tim}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      <div className="text-sm font-medium">{item.nama_ketua}</div>
                      <div className="text-xs">{item.asal_sekolah}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {item.judul_inovasi || item.judul_lagu || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedSub(item)}
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

      {/* Modal Detail Submission */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold dark:text-white">Detail Karya: {selectedSub.nama_tim}</h2>
              <button onClick={() => setSelectedSub(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Informasi Tim & Ketua</h3>
                  <div className="mt-3 space-y-2">
                    <p className="dark:text-white text-sm"><span className="font-medium text-gray-500">Ketua:</span> {selectedSub.nama_ketua}</p>
                    <p className="dark:text-white text-sm"><span className="font-medium text-gray-500">Asal Sekolah:</span> {selectedSub.asal_sekolah}</p>
                    <p className="dark:text-white text-sm"><span className="font-medium text-gray-500">WA:</span> {selectedSub.no_whatsapp}</p>
                    <p className="dark:text-white text-sm"><span className="font-medium text-gray-500">Kategori:</span> {selectedSub.kategori}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Detail Karya</h3>
                  <div className="mt-3 space-y-2">
                    {selectedSub.judul_inovasi && <p className="dark:text-white text-sm"><span className="font-medium text-gray-500">Judul Inovasi:</span> {selectedSub.judul_inovasi}</p>}
                    {selectedSub.judul_lagu && <p className="dark:text-white text-sm"><span className="font-medium text-gray-500">Judul Lagu:</span> {selectedSub.judul_lagu}</p>}
                    {selectedSub.genre_konsep && <p className="dark:text-white text-sm"><span className="font-medium text-gray-500">Genre/Konsep:</span> {selectedSub.genre_konsep}</p>}
                    {selectedSub.durasi_video && <p className="dark:text-white text-sm"><span className="font-medium text-gray-500">Durasi:</span> {selectedSub.durasi_video}</p>}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Tautan & Berkas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSub.link_proposal_drive && (
                    <a 
                      href={selectedSub.link_proposal_drive} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <FileText className="text-indigo-500 mr-3" size={24} />
                      <div>
                        <div className="text-sm font-medium dark:text-white">Proposal Karya</div>
                        <div className="text-xs text-gray-500 group-hover:text-indigo-500 flex items-center">Buka Google Drive <ExternalLink size={12} className="ml-1" /></div>
                      </div>
                    </a>
                  )}
                  {selectedSub.link_youtube && (
                    <a 
                      href={selectedSub.link_youtube} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <Video className="text-red-500 mr-3" size={24} />
                      <div>
                        <div className="text-sm font-medium dark:text-white">Video YouTube</div>
                        <div className="text-xs text-gray-500 group-hover:text-red-500 flex items-center">Tonton Video <ExternalLink size={12} className="ml-1" /></div>
                      </div>
                    </a>
                  )}
                  {selectedSub.link_video_drive && (
                    <a 
                      href={selectedSub.link_video_drive} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <Music className="text-blue-500 mr-3" size={24} />
                      <div>
                        <div className="text-sm font-medium dark:text-white">Berkas Video/Audio</div>
                        <div className="text-xs text-gray-500 group-hover:text-blue-500 flex items-center">Buka Google Drive <ExternalLink size={12} className="ml-1" /></div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 text-center text-xs text-gray-500">
              Dikumpulkan pada: {new Date(selectedSub.created_at).toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionList;
