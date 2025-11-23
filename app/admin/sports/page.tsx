'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Target, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Activity, Users, Zap, Dribbble, ShuffleIcon as Shuttlecock } from 'lucide-react';
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
        const response = await fetch('/api/sports');
        if (response.ok) {
          const sportsData = await response.json();
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data cabang olahraga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Kembali ke Home</span>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-2">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Manajemen Cabang Olahraga
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Tambah Cabang Olahraga</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingSport ? 'Edit Cabang Olahraga' : 'Tambah Cabang Olahraga Baru'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sport Name */}
                <div>
                  <label htmlFor="sport_name" className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    <span>Nama Cabang Olahraga</span>
                  </label>
                  <input
                    type="text"
                    id="sport_name"
                    name="sport_name"
                    value={formData.sport_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Contoh: Futsal, Basket, Badminton"
                  />
                </div>

                {/* Sport Type */}
                <div>
                  <label htmlFor="sport_type" className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Kode Cabang Olahraga</span>
                  </label>
                  <input
                    type="text"
                    id="sport_type"
                    name="sport_type"
                    value={formData.sport_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Contoh: futsal, basketball, badminton"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Gunakan huruf kecil dan pisahkan dengan tanda hubung (-)
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                  <span>Deskripsi (Opsional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Deskripsi cabang olahraga, aturan main, dll."
                />
              </div>

              {/* Available Status */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_available"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="is_available" className="text-gray-700 font-medium">
                  Cabang olahraga tersedia untuk booking
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-8 py-3 rounded-2xl font-semibold transition-all shadow-lg ${
                    submitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:scale-105'
                  }`}
                >
                  {submitting ? 'Menyimpan...' : (editingSport ? 'Perbarui' : 'Tambah')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sports List */}
        <div className="space-y-6">
          {sports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sports.map((sport) => {
                const SportIcon = getSportIcon(sport.sport_type);
                
                return (
                  <div key={sport.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <SportIcon className="h-8 w-8 text-white" />
                          <div>
                            <h3 className="text-xl font-bold text-white">{sport.sport_name}</h3>
                            <p className="text-emerald-100 text-sm">Kode: {sport.sport_type}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          sport.is_available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sport.is_available ? 'Aktif' : 'Nonaktif'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {sport.description && (
                        <p className="text-gray-600 mb-4">{sport.description}</p>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(sport)}
                          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(sport.id)}
                          className="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada cabang olahraga</h3>
              <p className="text-gray-600 mb-6">Mulai dengan menambahkan cabang olahraga pertama Anda</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-8 py-3 rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>Tambah Cabang Olahraga Pertama</span>
              </button>
            </div>
          )}
        </div>

        {/* Statistics */}
        {sports.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Statistik Cabang Olahraga</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{sports.length}</div>
                <div className="text-gray-600">Total Cabang Olahraga</div>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {sports.filter(sport => sport.is_available).length}
                </div>
                <div className="text-gray-600">Aktif</div>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {sports.filter(sport => !sport.is_available).length}
                </div>
                <div className="text-gray-600">Nonaktif</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
