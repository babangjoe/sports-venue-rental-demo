'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Target, MapPin, DollarSign, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Data struktur untuk ikon olahraga
const sportIcons = {
  futsal: Target,
  'mini-soccer': Target,
  basketball: Target,
  badminton: Target
};

interface Sport {
  id: number;
  sport_name: string;
  sport_type: string;
  description?: string;
  is_available: boolean;
}

interface Field {
  id: number;
  field_name: string;
  field_code: string;
  sport_id: number;
  price_per_hour: number;
  description?: string;
  url_image?: string;
  images?: string[];
  is_available: boolean;
  sport_name?: string;
  sport_type?: string;
}

export default function FieldManagementPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    field_name: '',
    field_code: '',
    sport_id: '',
    price_per_hour: '',
    description: '',
    url_image: '', // For compatibility/single display
    is_available: true
  });
  
  // Image handling state
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // For current preview
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load sports and fields data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [sportsResponse, fieldsResponse] = await Promise.all([
          fetch('/api/sports'),
          fetch('/api/fields')
        ]);

        if (sportsResponse.ok && fieldsResponse.ok) {
          const sportsData = await sportsResponse.json();
          const fieldsData = await fieldsResponse.json();
          setSports(sportsData);
          setFields(fieldsData);
        } else {
          throw new Error('Failed to load data');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setMessage({ type: 'error', text: 'Gagal memuat data' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
    
    if (name === 'price_per_hour') {
        // Allow only numbers
        const numericValue = value.replace(/\D/g, '');
        // Format with dots
        const formattedValue = new Intl.NumberFormat('id-ID').format(Number(numericValue));
        setFormData(prev => ({ ...prev, [name]: numericValue ? formattedValue : '' }));
    } else {
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check total images limit
      if (existingImages.length + newImages.length >= 3) {
        setMessage({ type: 'error', text: 'Maksimal 3 gambar per lapangan' });
        e.target.value = '';
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Format file harus .jpg, .jpeg, .png, atau .tif' });
        e.target.value = '';
        return;
      }

      // Basic validation (size < 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Ukuran file maksimal 2MB' });
        e.target.value = '';
        return;
      }

      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
      setTempFile(file);
      setShowPreviewModal(true);
      
      // Clear input value to allow re-selecting same file if cancelled
      e.target.value = '';
      setMessage(null);
    }
  };

  const confirmFileSelection = () => {
    if (tempFile) {
      setNewImages(prev => [...prev, tempFile]);
      setTempFile(null);
      setPreviewImage(null);
      setShowPreviewModal(false);
    }
  };

  const cancelFileSelection = () => {
    setTempFile(null);
    setPreviewImage(null);
    setShowPreviewModal(false);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      field_name: '',
      field_code: '',
      sport_id: '',
      price_per_hour: '',
      description: '',
      url_image: '',
      is_available: true
    });
    setExistingImages([]);
    setNewImages([]);
    setTempFile(null);
    setPreviewImage(null);
    setEditingField(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      let uploadedUrls: string[] = [];

      // Upload new images
      if (newImages.length > 0) {
        for (const file of newImages) {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('sports-center-demo-images')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new Error('Gagal mengupload gambar ke Storage');
            }

            // Get Public URL
            const { data: urlData } = supabase.storage
                .from('sports-center-demo-images')
                .getPublicUrl(fileName);

            if (urlData && urlData.publicUrl) {
                uploadedUrls.push(urlData.publicUrl);
            }
        }
      }

      // Combine existing URLs with new uploaded URLs
      const finalImages = [...existingImages, ...uploadedUrls];

      const fieldData = {
        ...formData,
        sport_id: parseInt(formData.sport_id),
        price_per_hour: parseFloat(formData.price_per_hour.replace(/\./g, '')), // Remove dots before sending
        url_image: finalImages.length > 0 ? finalImages[0] : '', // Main image
        images: finalImages // All images
      };

      const url = editingField ? `/api/fields/${editingField.id}` : '/api/fields';
      const method = editingField ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldData),
      });

      if (response.ok) {
        const newField = await response.json();
        
        if (editingField) {
          setFields(prev => prev.map(field => 
            field.id === editingField.id ? { ...field, ...newField } : field
          ));
          setMessage({ type: 'success', text: 'Lapangan berhasil diperbarui!' });
        } else {
          setFields(prev => [...prev, newField]);
          setMessage({ type: 'success', text: 'Lapangan berhasil ditambahkan!' });
        }
        
        resetForm();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Gagal menyimpan lapangan' });
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat menyimpan' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (field: Field) => {
    setEditingField(field);
    setFormData({
      field_name: field.field_name,
      field_code: field.field_code,
      sport_id: field.sport_id.toString(),
      price_per_hour: new Intl.NumberFormat('id-ID').format(field.price_per_hour), // Format on load
      description: field.description || '',
      url_image: field.url_image || '',
      is_available: field.is_available
    });
    
    // Load existing images (from field.images array if available, or url_image fallback)
    if (field.images && field.images.length > 0) {
        setExistingImages(field.images);
    } else if (field.url_image) {
        setExistingImages([field.url_image]);
    } else {
        setExistingImages([]);
    }
    setNewImages([]);
    setShowAddForm(true);
  };

  const handleDelete = async (fieldId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus lapangan ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/fields/${fieldId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFields(prev => prev.filter(field => field.id !== fieldId));
        setMessage({ type: 'success', text: 'Lapangan berhasil dihapus!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Gagal menghapus lapangan' });
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menghapus' });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Filter fields based on selected sport
  const filteredFields = selectedSportFilter === 'all' 
    ? fields 
    : fields.filter(field => field.sport_type === selectedSportFilter);

  const groupedFields = filteredFields.reduce((acc, field) => {
    const sportType = field.sport_type || 'unknown';
    if (!acc[sportType]) {
      acc[sportType] = [];
    }
    acc[sportType].push(field);
    return acc;
  }, {} as Record<string, Field[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
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
                  <Target className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Manajemen Lapangan
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Tambah Lapangan</span>
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

        {/* Sport Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <h2 className="text-xl font-bold text-gray-900">Filter Lapangan</h2>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  <span className="text-gray-700 font-medium">Cabang Olahraga:</span>
                </div>
                <select
                  value={selectedSportFilter}
                  onChange={(e) => setSelectedSportFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all min-w-[200px]"
                >
                  <option value="all">Semua Cabang Olahraga</option>
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.sport_type}>
                      {sport.sport_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              Menampilkan <span className="font-semibold text-emerald-600">{filteredFields.length}</span> dari <span className="font-semibold">{fields.length}</span> lapangan
            </div>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
            <div 
                className="absolute inset-0" 
                onClick={resetForm} // Clicking outside modal closes it (optional, remove if not wanted)
            ></div>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl relative flex flex-col max-h-[90vh] z-10">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingField ? 'Edit Lapangan' : 'Tambah Lapangan Baru'}
                </h2>
                <button 
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className="p-8 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Field Name */}
                    <div>
                      <label htmlFor="field_name" className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                        <span>Nama Lapangan</span>
                      </label>
                      <input
                        type="text"
                        id="field_name"
                        name="field_name"
                        value={formData.field_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Contoh: Lapangan Futsal A"
                      />
                    </div>

                    {/* Field Code */}
                    <div>
                      <label htmlFor="field_code" className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span>Kode Lapangan</span>
                      </label>
                      <input
                        type="text"
                        id="field_code"
                        name="field_code"
                        value={formData.field_code}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Contoh: FUTSAL-A"
                      />
                    </div>

                    {/* Sport Selection */}
                    <div>
                      <label htmlFor="sport_id" className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                        <Target className="h-5 w-5 text-purple-600" />
                        <span>Cabang Olahraga</span>
                      </label>
                      <select
                        id="sport_id"
                        name="sport_id"
                        value={formData.sport_id}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      >
                        <option value="">Pilih cabang olahraga</option>
                        {sports.map((sport) => (
                          <option key={sport.id} value={sport.id}>
                            {sport.sport_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price per Hour */}
                    <div>
                      <label htmlFor="price_per_hour" className="flex items-center space-x-2 text-gray-700 font-medium mb-3">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span>Harga per Jam</span>
                      </label>
                      <input
                        type="text"
                        id="price_per_hour"
                        name="price_per_hour"
                        value={formData.price_per_hour}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Contoh: 150.000"
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                        {existingImages.length + newImages.length < 3 ? (
                          <>
                            <input
                                type="file"
                                id="file_upload"
                                accept=".jpg,.jpeg,.png,.tif,.tiff"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label 
                              htmlFor="file_upload"
                              className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold border border-blue-200"
                            >
                               <Plus className="h-4 w-4 mr-2" />
                               Tambah Gambar
                            </label>
                          </>
                        ) : (
                           <div className="text-sm text-gray-500 italic">Maksimal 3 gambar tercapai</div>
                        )}

                        <label className="flex items-center space-x-2 text-gray-700 font-medium">
                          <ImageIcon className="h-5 w-5 text-blue-600" />
                          <span>Gambar Lapangan ({existingImages.length + newImages.length}/3)</span>
                        </label>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        {/* Existing Images List */}
                        {existingImages.map((url, idx) => (
                          <div key={`exist-${idx}`} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img src={url} alt={`Field ${idx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate">
                              Existing
                            </div>
                          </div>
                        ))}

                        {/* New Images List */}
                        {newImages.map((file, idx) => (
                          <div key={`new-${idx}`} className="relative group aspect-video bg-blue-50 rounded-lg overflow-hidden border border-blue-200">
                            <div className="w-full h-full flex items-center justify-center text-blue-500 font-bold text-xs truncate px-2">
                                {file.name}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeNewImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs p-1 text-center">
                              New
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {(existingImages.length === 0 && newImages.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 mt-4">
                            <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                            <span className="text-sm">Belum ada gambar</span>
                            <span className="text-xs mt-1">Format: .jpg, .png (Max 2MB)</span>
                        </div>
                    )}
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
                      placeholder="Deskripsi lapangan, fasilitas, dll."
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
                      Lapangan tersedia untuk booking
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex space-x-4 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`flex-1 py-3 rounded-2xl font-semibold transition-all shadow-lg ${
                        submitting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:scale-105'
                      }`}
                    >
                      {submitting ? 'Menyimpan...' : (editingField ? 'Perbarui' : 'Tambah')}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Fields List */}
        <div className="space-y-8">
          {Object.entries(groupedFields).map(([sportType, sportFields]) => {
            const sport = sports.find(s => s.sport_type === sportType);
            const SportIcon = sportIcons[sportType as keyof typeof sportIcons] || Target;
            
            return (
              <div key={sportType} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-6">
                  <div className="flex items-center space-x-3">
                    <SportIcon className="h-8 w-8 text-white" />
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {sport?.sport_name || sportType}
                      </h3>
                      <p className="text-emerald-100">
                        {sportFields.length} lapangan tersedia
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sportFields.map((field) => (
                      <div key={field.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{field.field_name}</h4>
                            <p className="text-gray-600 text-sm">Kode: {field.field_code}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            field.is_available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {field.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold">{formatPrice(field.price_per_hour)}/jam</span>
                          </div>
                          {field.description && (
                            <p className="text-gray-600 text-sm">{field.description}</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(field)}
                            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(field.id)}
                            className="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredFields.length === 0 && fields.length > 0 && (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada lapangan untuk cabang olahraga ini</h3>
            <p className="text-gray-600 mb-6">Coba pilih cabang olahraga lain atau tambahkan lapangan baru</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-8 py-3 rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Tambah Lapangan Baru</span>
            </button>
          </div>
        )}

        {/* No Fields at All */}
        {fields.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada lapangan</h3>
            <p className="text-gray-600 mb-6">Mulai dengan menambahkan lapangan pertama Anda</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-8 py-3 rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Tambah Lapangan Pertama</span>
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Preview Gambar</h3>
              <button 
                onClick={cancelFileSelection}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 bg-gray-50 flex-grow overflow-auto flex items-center justify-center">
               <img 
                 src={previewImage} 
                 alt="Preview" 
                 className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
               />
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-white flex justify-end space-x-3">
               <button
                 onClick={cancelFileSelection}
                 className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
               >
                 Batal
               </button>
               <button
                 onClick={confirmFileSelection}
                 className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center"
               >
                 <CheckCircle className="h-4 w-4 mr-2" />
                 Pilih Gambar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
