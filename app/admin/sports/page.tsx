'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Target, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Activity, Users, Zap, Dribbble, ShuffleIcon as Shuttlecock, Search, Filter } from 'lucide-react';
import Link from 'next/link';

// Data struktur untuk ikon olahraga
const sportIcons = {
  futsal: Target,
  'mini-soccer': Zap,
  basketball: Dribbble,
  badminton: Shuttlecock,
  default: Activity
};

interface Sport {
  id: number;
  sport_name: string;
  sport_type: string;
  description?: string;
  is_available: boolean;
}

export default function SportsManagementPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [formData, setFormData] = useState({
    sport_name: '',
    sport_type: '',
    description: '',
    is_available: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load sports data
  useEffect(() => {
    const loadSports = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/sports?show_all=true');
        if (response.ok) {
          const result = await response.json();
          // Handle both array (legacy/direct) and { data: [] } formats
          const sportsData = Array.isArray(result) ? result : (result.data || []);
          setSports(sportsData);
        } else {
          throw new Error('Failed to load sports');
        }
      } catch (error) {
        console.error('Error loading sports:', error);
        setMessage({ type: 'error', text: 'Gagal memuat data cabang olahraga' });
      } finally {
        setLoading(false);
      }
    };

    loadSports();
  }, []);

  // Toggle body scroll when modal is open
  useEffect(() => {
    if (showAddForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showAddForm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      sport_name: '',
      sport_type: '',
      description: '',
      is_available: true
    });
    setEditingSport(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const sportData = {
        ...formData,
        sport_type: formData.sport_type.toLowerCase().replace(/\s+/g, '-')
      };

      const url = editingSport ? `/api/sports/${editingSport.id}` : '/api/sports';
      const method = editingSport ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sportData),
      });

      if (response.ok) {
        const newSport = await response.json();
        
        if (editingSport) {
          setSports(prev => prev.map(sport => 
            sport.id === editingSport.id ? { ...sport, ...newSport } : sport
          ));
          setMessage({ type: 'success', text: 'Cabang olahraga berhasil diperbarui!' });
        } else {
          setSports(prev => [...prev, newSport]);
          setMessage({ type: 'success', text: 'Cabang olahraga berhasil ditambahkan!' });
        }
        
        resetForm();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Gagal menyimpan cabang olahraga' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (sport: Sport) => {
    setEditingSport(sport);
    setFormData({
      sport_name: sport.sport_name,
      sport_type: sport.sport_type,
      description: sport.description || '',
      is_available: sport.is_available
    });
    setShowAddForm(true);
  };

  const handleDelete = async (sportId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus cabang olahraga ini? Semua lapangan yang terkait juga akan terpengaruh.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sports/${sportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSports(prev => prev.filter(sport => sport.id !== sportId));
        setMessage({ type: 'success', text: 'Cabang olahraga berhasil dihapus!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Gagal menghapus cabang olahraga' });
      }
    } catch (error) {
      console.error('Error deleting sport:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menghapus' });
    }
  };

  const getSportIcon = (sportType: string) => {
    return sportIcons[sportType as keyof typeof sportIcons] || sportIcons.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6C37] mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] text-[#FF6C37] font-sans selection:bg-[#FF6C37]/20">
      {/* Header */}
      <div className="border-b border-[#1F2937] bg-[#111827]/95 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-[#FF6C37]/10 p-2 rounded-lg border border-[#FF6C37]/20">
                  <Activity className="h-5 w-5 text-[#FF6C37]" />
                </div>
                <h1 className="text-lg font-semibold text-white tracking-tight">
                  Manajemen Cabang Olahraga
                </h1>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#FF6C37] hover:bg-[#FF5722] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_4px_12px_rgba(255,108,55,0.3)] hover:shadow-[0_6px_20px_rgba(255,108,55,0.4)] flex items-center space-x-2 border-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Olahraga</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border text-sm flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' 
              ? 'bg-[#0D1F0F] border-[#1B3A1B] text-[#34D399]' 
              : 'bg-[#1F0F0F] border-[#3A1A1A] text-[#F87171]'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-white">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="absolute inset-0" 
                onClick={resetForm}
            ></div>
            <div className="bg-[#1F2937] border border-[#374151] rounded-xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#374151] bg-[#1F2937] rounded-t-xl">
                <h2 className="text-lg font-semibold text-white">
                  {editingSport ? 'Edit Cabang Olahraga' : 'Tambah Cabang Olahraga'}
                </h2>
                <button 
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sport Name */}
                    <div className="space-y-2">
                      <label htmlFor="sport_name" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Nama Olahraga
                      </label>
                      <input
                        type="text"
                        id="sport_name"
                        name="sport_name"
                        value={formData.sport_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FF6C37] focus:border-[#FF6C37] outline-none transition-all text-sm"
                        placeholder="e.g. Futsal"
                      />
                    </div>

                    {/* Sport Type */}
                    <div className="space-y-2">
                      <label htmlFor="sport_type" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Kode (Slug)
                      </label>
                      <input
                        type="text"
                        id="sport_type"
                        name="sport_type"
                        value={formData.sport_type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FF6C37] focus:border-[#FF6C37] outline-none transition-all text-sm"
                        placeholder="e.g. futsal"
                      />
                      <p className="text-xs text-gray-400">
                        Huruf kecil, pisahkan spasi dengan (-)
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Deskripsi
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FF6C37] focus:border-[#FF6C37] outline-none transition-all text-sm resize-none"
                      placeholder="Deskripsi singkat..."
                    />
                  </div>

                  {/* Available Status */}
                  <div className="flex items-center space-x-3 bg-[#111827] p-3 rounded-lg border border-[#374151]">
                    <input
                      type="checkbox"
                      id="is_available"
                      name="is_available"
                      checked={formData.is_available}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#FF6C37] bg-[#111827] border-[#374151] rounded focus:ring-2 focus:ring-[#FF6C37] focus:ring-offset-[#1F2937]"
                    />
                    <label htmlFor="is_available" className="text-sm text-white select-none cursor-pointer">
                      Tersedia untuk booking
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex space-x-3 pt-4 border-t border-[#374151]">
                     <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-[#374151] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#374151] hover:text-white transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${
                        submitting
                          ? 'bg-[#374151] text-gray-400 cursor-not-allowed'
                          : 'bg-[#FF6C37] text-white hover:bg-[#FF5722] shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {submitting ? 'Menyimpan...' : (editingSport ? 'Simpan Perubahan' : 'Buat Olahraga')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Sports List */}
        <div className="space-y-6">
          {sports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sports.map((sport) => {
                const SportIcon = getSportIcon(sport.sport_type);
                
                return (
                  <div key={sport.id} className="group bg-[#1F2937] border border-[#374151] rounded-xl hover:border-[#FF6C37]/30 hover:shadow-[0_8px_32px_rgba(255,108,55,0.15)] transition-all duration-300 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-[#111827] p-3 rounded-lg group-hover:bg-[#FF6C37]/10 transition-colors border border-[#374151] group-hover:border-[#FF6C37]/20">
                            <SportIcon className="h-6 w-6 text-gray-400 group-hover:text-[#FF6C37] transition-colors" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-white group-hover:text-[#FF6C37] transition-colors">{sport.sport_name}</h3>
                            <p className="text-gray-400 text-xs font-mono mt-0.5">{sport.sport_type}</p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-xs uppercase tracking-wide font-semibold border ${
                          sport.is_available 
                            ? 'bg-[#0D1F0F] border-[#1B3A1B] text-[#34D399]' 
                            : 'bg-[#1F0F0F] border-[#3A1A1A] text-[#F87171]'
                        }`}>
                          {sport.is_available ? 'Aktif' : 'Nonaktif'}
                        </div>
                      </div>
                      
                      {sport.description && (
                        <p className="text-gray-400 text-sm mb-5 line-clamp-2 h-10">
                          {sport.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#374151]">
                        <button
                          onClick={() => handleEdit(sport)}
                          className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#374151] rounded-lg transition-all duration-200 flex items-center space-x-1.5 border border-transparent hover:border-[#374151]"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(sport.id)}
                          className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-200 flex items-center space-x-1.5 border border-transparent"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#1F2937] border border-[#374151] rounded-xl border-dashed">
              <div className="bg-[#111827] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-[#374151]">
                <Activity className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Belum ada olahraga</h3>
              <p className="text-gray-400 mb-6 text-sm">Tambahkan cabang olahraga pertama anda untuk memulai.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-[#FF6C37] hover:bg-[#FF5722] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Tambah Olahraga
              </button>
            </div>
          )}
        </div>

        {/* Statistics */}
        {sports.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-[#1F2937] border border-[#374151] p-5 rounded-xl flex items-center justify-between hover:border-[#FF6C37]/30 transition-all duration-300">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Total Olahraga</p>
                  <p className="text-3xl font-bold text-white">{sports.length}</p>
                </div>
                <div className="bg-[#111827] p-3 rounded-lg border border-[#374151]">
                  <Activity className="h-8 w-8 text-[#FF6C37]" />
                </div>
             </div>
             <div className="bg-[#1F2937] border border-[#374151] p-5 rounded-xl flex items-center justify-between hover:border-[#34D399]/30 transition-all duration-300">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Aktif</p>
                  <p className="text-3xl font-bold text-white">{sports.filter(sport => sport.is_available).length}</p>
                </div>
                <div className="bg-[#111827] p-3 rounded-lg border border-[#374151]">
                  <CheckCircle className="h-8 w-8 text-[#34D399]" />
                </div>
             </div>
             <div className="bg-[#1F2937] border border-[#374151] p-5 rounded-xl flex items-center justify-between hover:border-[#F87171]/30 transition-all duration-300">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Nonaktif</p>
                  <p className="text-3xl font-bold text-white">{sports.filter(sport => !sport.is_available).length}</p>
                </div>
                <div className="bg-[#111827] p-3 rounded-lg border border-[#374151]">
                  <XCircle className="h-8 w-8 text-[#F87171]" />
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
