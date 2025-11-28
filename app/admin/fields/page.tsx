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
                  <Target className="h-5 w-5 text-[#FF6C37]" />
                </div>
                <h1 className="text-lg font-semibold text-white tracking-tight">
                  Manajemen Lapangan
                </h1>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#FF6C37] hover:bg-[#FF5722] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_4px_12px_rgba(255,108,55,0.3)] hover:shadow-[0_6px_20px_rgba(255,108,55,0.4)] flex items-center space-x-2 border-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Lapangan</span>
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

        {/* Sport Filter */}
        <div className="bg-[#1F2937] border border-[#374151] rounded-xl shadow-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="bg-[#FF6C37]/10 p-2 rounded-lg border border-[#FF6C37]/20">
                  <Target className="h-4 w-4 text-[#FF6C37]" />
                </div>
                <h2 className="text-lg font-medium text-white">Filter Lapangan</h2>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">Cabang Olahraga:</span>
                </div>
                <select
                  value={selectedSportFilter}
                  onChange={(e) => setSelectedSportFilter(e.target.value)}
                  className="px-3 py-2 bg-[#111827] border border-[#374151] rounded-lg focus:ring-2 focus:ring-[#FF6C37] focus:border-transparent transition-all min-w-[200px] text-white text-sm"
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
            <div className="text-sm text-gray-400 bg-[#111827] px-3 py-2 rounded-lg border border-[#374151]">
              Menampilkan <span className="font-semibold text-[#FF6C37]">{filteredFields.length}</span> dari <span className="font-semibold">{fields.length}</span> lapangan
            </div>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="absolute inset-0" 
                onClick={resetForm} // Clicking outside modal closes it (optional, remove if not wanted)
            ></div>
            <div className="bg-[#1F2937] border border-[#374151] rounded-xl shadow-2xl w-full max-w-3xl relative flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#374151] bg-[#1F2937] rounded-t-xl">
                <h2 className="text-lg font-semibold text-white">
                  {editingField ? 'Edit Lapangan' : 'Tambah Lapangan'}
                </h2>
                <button 
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Field Name */}
                    <div className="space-y-2">
                      <label htmlFor="field_name" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Nama Lapangan
                      </label>
                      <input
                        type="text"
                        id="field_name"
                        name="field_name"
                        value={formData.field_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FF6C37] focus:border-[#FF6C37] outline-none transition-all text-sm"
                        placeholder="e.g. Lapangan Futsal A"
                      />
                    </div>

                    {/* Field Code */}
                    <div className="space-y-2">
                      <label htmlFor="field_code" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Kode Lapangan
                      </label>
                      <input
                        type="text"
                        id="field_code"
                        name="field_code"
                        value={formData.field_code}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FF6C37] focus:border-[#FF6C37] outline-none transition-all text-sm"
                        placeholder="e.g. FUTSAL-A"
                      />
                    </div>

                    {/* Sport Selection */}
                    <div className="space-y-2">
                      <label htmlFor="sport_id" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Cabang Olahraga
                      </label>
                      <select
                        id="sport_id"
                        name="sport_id"
                        value={formData.sport_id}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white focus:ring-2 focus:ring-[#FF6C37] focus:border-[#FF6C37] outline-none transition-all text-sm"
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
                    <div className="space-y-2">
                      <label htmlFor="price_per_hour" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Harga per Jam
                      </label>
                      <input
                        type="text"
                        id="price_per_hour"
                        name="price_per_hour"
                        value={formData.price_per_hour}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FF6C37] focus:border-[#FF6C37] outline-none transition-all text-sm"
                        placeholder="e.g. 150.000"
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label htmlFor="description" className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 block">
                      Gambar Lapangan ({existingImages.length + newImages.length}/3)
                    </label>
                    
                    <div className="space-y-3">
                        {existingImages.length + newImages.length < 3 && (
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
                              className="cursor-pointer inline-flex items-center px-4 py-2 bg-[#FF6C37]/10 text-[#FF6C37] rounded-lg hover:bg-[#FF6C37]/20 transition-colors text-sm font-semibold border border-[#FF6C37]/20"
                            >
                               <Plus className="h-4 w-4 mr-2" />
                               Tambah Gambar
                            </label>
                          </>
                        )}

                        {!existingImages.length && !newImages.length && (
                            <div className="text-xs text-gray-400 italic">Format: .jpg, .png, .tif (Max 2MB)</div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        {/* Existing Images List */}
                        {existingImages.map((url, idx) => (
                          <div key={`exist-${idx}`} className="relative group aspect-video bg-[#111827] rounded-lg overflow-hidden border border-[#374151]">
                            <img src={url} alt={`Field ${idx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-gray-300 text-xs p-1 text-center truncate">
                              Existing
                            </div>
                          </div>
                        ))}

                        {/* New Images List */}
                        {newImages.map((file, idx) => (
                          <div key={`new-${idx}`} className="relative group aspect-video bg-[#FF6C37]/10 rounded-lg overflow-hidden border border-[#FF6C37]/20">
                            <div className="w-full h-full flex items-center justify-center text-[#FF6C37] font-bold text-xs truncate px-2">
                                {file.name}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeNewImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-[#FF6C37]/80 text-white text-xs p-1 text-center">
                              New
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {(existingImages.length === 0 && newImages.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-8 bg-[#111827] rounded-lg border-2 border-dashed border-[#374151] text-gray-500 mt-4">
                            <ImageIcon className="h-8 w-8 mb-2" />
                            <span className="text-sm">Belum ada gambar</span>
                        </div>
                    )}
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
                      {submitting ? 'Menyimpan...' : (editingField ? 'Simpan Perubahan' : 'Buat Lapangan')}
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
              <div key={sportType} className="bg-[#1F2937] border border-[#374151] rounded-xl shadow-xl overflow-hidden">
                <div className="bg-[#FF6C37] p-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#FF6C37]/20 p-2 rounded-lg">
                      <SportIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {sport?.sport_name || sportType}
                      </h3>
                      <p className="text-orange-100">
                        {sportFields.length} lapangan tersedia
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sportFields.map((field) => (
                      <div key={field.id} className="group bg-[#1F2937] border border-[#374151] rounded-xl hover:border-[#FF6C37]/30 hover:shadow-[0_8px_32px_rgba(255,108,55,0.15)] transition-all duration-300 overflow-hidden">
                        <div className="p-3">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-white group-hover:text-[#FF6C37] transition-colors">{field.field_name}</h4>
                              <p className="text-gray-400 text-sm font-mono mt-0.5">{field.field_code}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-xs uppercase tracking-wide font-semibold border ${
                              field.is_available 
                                ? 'bg-[#0D1F0F] border-[#1B3A1B] text-[#34D399]' 
                                : 'bg-[#1F0F0F] border-[#3A1A1A] text-[#F87171]'
                            }`}>
                              {field.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-5">
                            <div className="flex items-center space-x-2 text-gray-300">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium">{formatPrice(field.price_per_hour)}/jam</span>
                            </div>
                            {field.description && (
                              <p className="text-gray-400 text-sm line-clamp-2 h-10">
                                {field.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#374151]">
                            <button
                              onClick={() => handleEdit(field)}
                              className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#374151] rounded-lg transition-all duration-200 flex items-center space-x-1.5 border border-transparent hover:border-[#374151]"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(field.id)}
                              className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-200 flex items-center space-x-1.5 border border-transparent"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
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
          <div className="text-center py-16 bg-[#1F2937] border border-[#374151] rounded-xl border-dashed">
            <div className="bg-[#111827] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-[#374151]">
              <Target className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Tidak ada lapangan untuk cabang olahraga ini</h3>
            <p className="text-gray-400 mb-6 text-sm">Coba pilih cabang olahraga lain atau tambahkan lapangan baru</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#FF6C37] hover:bg-[#FF5722] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Tambah Lapangan Baru
            </button>
          </div>
        )}

        {/* No Fields at All */}
        {fields.length === 0 && (
          <div className="text-center py-16 bg-[#1F2937] border border-[#374151] rounded-xl border-dashed">
            <div className="bg-[#111827] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-[#374151]">
              <Target className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Belum ada lapangan</h3>
            <p className="text-gray-400 mb-6 text-sm">Mulai dengan menambahkan lapangan pertama anda</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#FF6C37] hover:bg-[#FF5722] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Tambah Lapangan Pertama
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#374151] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Preview Gambar</h3>
              <button 
                onClick={cancelFileSelection}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 bg-[#111827] flex-grow overflow-auto flex items-center justify-center">
               <img 
                 src={previewImage} 
                 alt="Preview" 
                 className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
               />
            </div>
            
            <div className="p-6 border-t border-[#374151] bg-[#1F2937] flex justify-end space-x-3">
               <button
                 onClick={cancelFileSelection}
                 className="px-6 py-2 border border-[#374151] text-gray-300 rounded-lg font-semibold hover:bg-[#374151] transition-colors"
               >
                 Batal
               </button>
               <button
                 onClick={confirmFileSelection}
                 className="px-6 py-2 bg-[#FF6C37] text-white rounded-lg font-semibold hover:bg-[#FF5722] transition-colors flex items-center"
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
