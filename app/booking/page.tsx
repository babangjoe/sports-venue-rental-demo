'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ArrowLeft, Target, Zap, DribbbleIcon as Dribbble, ShuffleIcon as Shuttlecock, CheckCircle, User, Phone } from 'lucide-react';
import Link from 'next/link';

// Data struktur untuk ikon olahraga
const sportIcons = {
  futsal: Target,
  'mini-soccer': Zap,
  basketball: Dribbble,
  badminton: Shuttlecock
};

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

// Function to fetch booked time slots from API
const getBookedSlots = async (fieldId: string, date: string) => {
  try {
    // In booking form, fieldId might be passed as string from select value
    // but if it comes from database it's a number.
    // Ensure we pass it correctly.
    
    // Check if fieldId is a valid number string
    if (!fieldId || isNaN(Number(fieldId))) {
         console.error('Invalid fieldId:', fieldId);
         return [];
    }

    const response = await fetch(`/api/booking/check-availability?fieldId=${fieldId}&date=${date}`);
    if (!response.ok) {
      throw new Error('Failed to fetch availability');
    }
    const data = await response.json();
    return data.bookedSlots || [];
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return []; // Return empty array in case of error
  }
};

// Function to fetch all bookings
const getAllBookings = async () => {
  try {
    const response = await fetch('/api/booking');
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

// Function to fetch bookings with optional filters
const getBookings = async (filters: { fieldId?: string; date?: string; status?: string } = {}) => {
  const { fieldId, date, status } = filters;
  let url = '/api/booking';
  
  const params = [];
  if (fieldId) params.push(`fieldId=${fieldId}`);
  if (date) params.push(`date=${date}`);
  if (status) params.push(`status=${status}`);
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

// Function to fetch sports data from API
const getSports = async () => {
  try {
    const response = await fetch('/api/sports?isAvailable=true'); // Only fetch available sports
    if (!response.ok) {
      throw new Error('Failed to fetch sports');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sports:', error);
    return [];
  }
};

// Function to fetch fields data from API
const getFields = async (sportId?: number) => {
  try {
    let url = '/api/fields?isAvailable=true'; // Only fetch available fields
    if (sportId) {
      url += `&sportId=${sportId}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch fields');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching fields:', error);
    return [];
  }
};

export default function BookingPage() {
  const [sportsData, setSportsData] = useState<Record<string, { name: string; icon: any; fields: Array<{ id: string; name: string; price: number }> }>>({});
  const [sportsList, setSportsList] = useState<any[]>([]);
  const [fieldsList, setFieldsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    whatsapp_number: '',
    sport: '',
    field: '',
    date: ''
  });

  const [selectedSport, setSelectedSport] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Load sports and fields data on component mount
  useEffect(() => {
    const loadSportsAndFields = async () => {
      setLoading(true);
      try {
        // Fetch available sports
        const sports = await getSports();
        setSportsList(sports);

        // Fetch all available fields
        const fields = await getFields();
        setFieldsList(fields);

        // Transform sports data for use in the form
        const transformedSportsData: Record<string, { name: string; icon: any; fields: Array<{ id: string; name: string; price: number }> }> = {};
        
        sports.forEach((sport: any) => {
          // Get fields that belong to this sport
          const sportFields = fields
            .filter((field: any) => field.sport_id === sport.id)
            .map((field: any) => ({
              id: String(field.id), // Ensure ID is string for select value
              name: field.field_name,
              price: parseFloat(field.price_per_hour)
            }));

          transformedSportsData[sport.sport_type] = {
            name: sport.sport_name,
            icon: sportIcons[sport.sport_type as keyof typeof sportIcons] || Target,
            fields: sportFields
          };
        });

        setSportsData(transformedSportsData);
      } catch (error) {
        console.error('Error loading sports and fields:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSportsAndFields();
  }, []);

  const handleSportChange = async (sport: string) => {
    setSelectedSport(sport);
    setSelectedField('');
    setFormData({ ...formData, sport, field: '' });
    setShowTimeSlots(false);
    setSelectedTimes([]);
  };

  const handleFieldChange = (fieldId: string) => {
    setSelectedField(fieldId);
    setFormData({ ...formData, field: fieldId });
    setShowTimeSlots(false);
    setSelectedTimes([]);
  };

  const handleDateChange = (date: string) => {
    setFormData({ ...formData, date });
    setShowTimeSlots(false);
    setSelectedTimes([]);
  };

  const handleCheckAvailability = async () => {
    if (formData.sport && formData.field && formData.date) {
      const booked = await getBookedSlots(formData.field, formData.date);
      setBookedSlots(booked);
      setShowTimeSlots(true);
      setSelectedTimes([]);
    }
  };

  const handleTimeSlotClick = (time: string) => {
    if (bookedSlots.includes(time)) return;
    
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const handleBooking = async () => {
    if (!formData.customer_name.trim()) {
      alert('Nama pelanggan wajib diisi!');
      return;
    }

    if (!formData.whatsapp_number.trim()) {
      alert('Nomor WhatsApp wajib diisi!');
      return;
    }

    if (selectedTimes.length === 0) {
      alert('Pilih minimal 1 jam untuk booking!');
      return;
    }

    if (!selectedSport) {
      alert('Pilih cabang olahraga terlebih dahulu');
      return;
    }

    const sport = sportsData[selectedSport as keyof typeof sportsData];
    if (!sport) {
      alert('Olahraga tidak ditemukan');
      return;
    }

    const field = sport.fields.find(f => f.id === formData.field);
    if (!field) {
      alert('Field tidak ditemukan');
      return;
    }
    
    const totalPrice = field.price * selectedTimes.length;
    
    try {
      // Prepare booking data
      const bookingData = {
        customer_name: formData.customer_name,
        customer_phone: formData.whatsapp_number,
        field_id: formData.field,
        field_name: field.name,
        booking_date: formData.date,
        time_slots: selectedTimes,
        total_price: totalPrice
      };

      // Send booking request to API
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Booking berhasil!\n\nDetail:\n- Lapangan: ${field.name}\n- Tanggal: ${formData.date}\n- Jam: ${selectedTimes.sort().join(', ')}\n- Total: ${formatPrice(totalPrice)}\n\nBooking ID: ${result.id}\n\nSilakan lanjutkan ke pembayaran.`);
        
        // Reset form after successful booking
        setFormData({ customer_name: '', whatsapp_number: '', sport: '', field: '', date: '' });
        setSelectedSport('');
        setSelectedField('');
        setShowTimeSlots(false);
        setSelectedTimes([]);
        setBookedSlots([]);
      } else {
        const errorData = await response.json();
        alert(`Booking gagal: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Terjadi kesalahan saat membuat booking. Silakan coba lagi.');
    }
  };

  const isFormComplete = formData.sport && formData.field && formData.date;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getTotalPrice = () => {
    if (selectedTimes.length === 0 || !selectedField || !selectedSport) return 0;
    const sport = sportsData[selectedSport as keyof typeof sportsData];
    if (!sport) return 0;
    const field = sport.fields.find(f => f.id === selectedField);
    return field ? field.price * selectedTimes.length : 0;
  };

  return (
    <div className="min-h-screen bg-[#333333]">
      {/* Header */}
      <div className="bg-[#404040] shadow-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Kembali ke Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-red-600 rounded-xl p-2">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                SportArena
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Booking <span className="bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">Lapangan</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Pilih lapangan dan tanggal, lalu cek ketersediaan jam untuk booking!
          </p>
        </div>

        <div className="bg-[#404040] rounded-2xl shadow-xl p-8 md:p-12 border border-white/5">
          {/* Form Fields */}
          <div className="space-y-8">
            {/* Customer Name */}
            <div>
              <label htmlFor="customer_name" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                <User className="h-5 w-5 text-blue-500" />
                <span>Nama Pelanggan</span>
              </label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
                className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                placeholder="Masukkan nama lengkap Anda"
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <label htmlFor="whatsapp_number" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                <Phone className="h-5 w-5 text-green-500" />
                <span>No WhatsApp</span>
              </label>
              <input
                type="tel"
                id="whatsapp_number"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                required
                className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                placeholder="Masukkan nomor WhatsApp Anda (contoh: 6281234567890)"
              />
            </div>

            {/* Sport Selection */}
            <div>
              <label htmlFor="sport" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                <MapPin className="h-5 w-5 text-yellow-500" />
                <span>Pilih Cabang Olahraga</span>
              </label>
              <select
                id="sport"
                name="sport"
                value={formData.sport}
                onChange={(e) => handleSportChange(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all disabled:opacity-50 text-white appearance-none"
              >
                <option value="">Pilih cabang olahraga</option>
                {!loading && Object.entries(sportsData).map(([key, sport]) => (
                  <option key={key} value={key}>{sport.name}</option>
                ))}
                {loading && <option>Loading sports...</option>}
              </select>
            </div>

            {/* Field Selection */}
            {selectedSport && (
              <div>
                <label htmlFor="field" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                  <Target className="h-5 w-5 text-red-500" />
                  <span>Pilih Lapangan</span>
                </label>
                <select
                  id="field"
                  name="field"
                  value={formData.field}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 text-white appearance-none"
                >
                  <option value="">Pilih lapangan</option>
                  {!loading && sportsData[selectedSport as keyof typeof sportsData]?.fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name} - {formatPrice(field.price)}/jam
                    </option>
                  ))}
                  {loading && <option>Loading fields...</option>}
                </select>
              </div>
            )}

            {/* Date Selection */}
            {selectedField && (
              <div>
                <label htmlFor="date" className="flex items-center space-x-2 text-gray-300 font-medium mb-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span>Tanggal Main</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-4 bg-[#333333] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
                />
              </div>
            )}

            {/* Check Availability Button */}
            {isFormComplete && !showTimeSlots && (
              <div className="text-center">
                <button
                  onClick={handleCheckAvailability}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:scale-105 transition-transform shadow-xl"
                >
                  <Clock className="h-5 w-5 inline mr-2" />
                  Cek Ketersediaan
                </button>
              </div>
            )}

            {/* Time Slots */}
            {showTimeSlots && (
              <div>
                <div className="flex items-center space-x-2 text-gray-300 font-medium mb-6">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span>Pilih Jam (Klik untuk memilih/membatalkan)</span>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                  {timeSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    const isSelected = selectedTimes.includes(time);
                    
                    return (
                      <button
                        key={time}
                        onClick={() => handleTimeSlotClick(time)}
                        disabled={isBooked}
                        className={`
                          py-3 px-4 rounded-2xl font-semibold transition-all
                          ${isBooked 
                            ? 'bg-[#262626] text-gray-600 cursor-not-allowed border border-white/5' 
                            : isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-lg scale-105'
                            : 'bg-[#333333] text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105 border border-white/10'
                          }
                        `}
                      >
                        {time}
                        {isSelected && <CheckCircle className="h-4 w-4 inline ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-sm mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-[#262626] rounded border border-white/10"></div>
                    <span className="text-gray-400">Sudah Terbooking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-[#333333] rounded border border-white/10"></div>
                    <span className="text-gray-400">Tersedia</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-red-600 rounded"></div>
                    <span className="text-gray-400">Dipilih</span>
                  </div>
                </div>

                {/* Selected Times Summary */}
                {selectedTimes.length > 0 && (
                  <div className="bg-[#333333] border border-white/10 rounded-2xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">Ringkasan Booking</h3>
                    <div className="space-y-2 text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lapangan:</span>
                        <span className="font-medium text-white">
                          {sportsData[selectedSport as keyof typeof sportsData]?.fields.find(f => f.id === selectedField)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tanggal:</span>
                        <span className="font-medium text-white">{formData.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Jam:</span>
                        <span className="font-medium text-white">{selectedTimes.sort().join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Durasi:</span>
                        <span className="font-medium text-white">{selectedTimes.length} jam</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-blue-400 pt-2 border-t border-white/10">
                        <span>Total:</span>
                        <span>{formatPrice(getTotalPrice())}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Booking Button */}
                <div className="text-center">
                  <button
                    onClick={handleBooking}
                    disabled={selectedTimes.length === 0}
                    className={`px-12 py-4 rounded-2xl font-semibold text-lg transition-all shadow-xl ${
                      selectedTimes.length > 0
                        ? 'bg-gradient-to-r from-blue-600 to-red-600 text-white hover:scale-105'
                        : 'bg-[#262626] text-gray-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    Konfirmasi Booking ({selectedTimes.length} jam)
                  </button>
                  <p className="text-gray-400 mt-4">
                    atau hubungi WhatsApp: <span className="font-semibold text-blue-400">+62 812-3456-7890</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}