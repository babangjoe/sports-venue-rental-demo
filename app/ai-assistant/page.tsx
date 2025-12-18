'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, Bot, User as UserIcon, Settings, Clock, Target, Calendar, DollarSign, BarChart3, ArrowRight, X, Check, CheckCircle, MapPin, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useSportsDemo, useFieldsDemo, useBookingsDemo } from '@/hooks/useDemoData';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  actions?: Array<{
    type: 'booking' | 'redirect' | 'availability_cards' | 'booking_form' | 'inline_booking_form';
    label?: string;
    data?: any;
    url?: string;
  }>;
}

interface SystemPrompt {
  id: string;
  name: string;
  prompt_content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  CreatedBy?: {
    username: string;
    full_name: string;
  };
  description: string;
  version: number;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Demo Data Hooks
  const { sports } = useSportsDemo();
  const { fields } = useFieldsDemo();
  const { bookings, createBooking } = useBookingsDemo();

  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState<{
    customer_name: string;
    whatsapp_number: string;
    sport: string;
    field: string;
    date: string;
    fieldName: string;
    fieldPrice: number;
    allBookedSlots: string[];
  }>({
    customer_name: '',
    whatsapp_number: '',
    sport: '',
    field: '',
    date: '',
    fieldName: '',
    fieldPrice: 0,
    allBookedSlots: []
  });
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [bookingStep, setBookingStep] = useState<'idle' | 'form' | 'time_slots' | 'confirmation' | 'success'>('idle');
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [newPromptName, setNewPromptName] = useState('');
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create refs for input fields to maintain focus - move outside component
  const nameInputRef = useRef<HTMLInputElement>(null);
  const whatsappInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const defaultPrompt: SystemPrompt = {
    id: '1',
    name: 'Default Assistant',
    prompt_content: `Anda adalah asisten AI untuk SportArena, sebuah platform booking venue olahraga. Tugas Anda:

1. **Cek Ketersediaan Lapangan**: 
   - Gunakan API GET /api/booking/check-availability untuk cek slot waktu kosong
   - Tampilkan list lapangan, tanggal maksimal 10 hari dari today()
   - Jika user minta "jadwal sore hari", filter dari jam 16:00 ke atas

2. **Informasi Harga**:
   - Gunakan API GET /api/fields?isAvailable=true untuk price list
   - Gunakan API GET /api/sports?isAvailable=true untuk cabang olahraga

3. **Booking Lapangan**:
   - Gunakan API POST /api/booking untuk membuat order
   - Selalu berikan button "Book Now" yang redirect ke /booking dengan parameter terisi

4. **Informasi Transaksi (Role Owner Only)**:
   - Tampilkan summary transaksi jika user role = Owner
   - Berikan button "Dashboard" redirect ke /admin/dashboard
   - User non-Owner tidak bisa akses info ini

5. **Format Response**:
   - Gunakan bahasa Indonesia yang ramah
   - Berikan informasi yang jelas dan actionable
   - Selalu sertakan call-to action button yang relevan

Respon dalam format JSON dengan struktur:
{
  "message": "pesan untuk user",
  "actions": [
    {
      "type": "booking|redirect",
      "label": "button text",
      "data": {...}, // untuk booking
      "url": "/url" // untuk redirect
    }
  ]
}`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    CreatedBy: {
      username: 'system',
      full_name: 'System'
    },
    description: 'Default system prompt for SportArena AI Assistant',
    version: 1
  };

  useEffect(() => {
    // Load system prompts from database
    loadSystemPrompts();

    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Halo! Saya adalah asisten AI SportArena. Saya bisa membantu Anda:\n\n🏆 Cek ketersediaan lapangan\n💰 Informasi harga lapangan\n📅 Booking lapangan olahraga\n📊 Informasi transaksi (Owner only)\n\nAda yang bisa saya bantu hari ini?`,
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Handle /clear command
    if (inputMessage.trim() === '/clear') {
      const welcomeMessage = messages[0]; // Keep the first welcome message
      setMessages([welcomeMessage]);
      setInputMessage('');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual API call)
      const response = await simulateAIResponse(inputMessage);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'ai',
        timestamp: new Date(),
        actions: response.actions
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (userInput: string) => {
    try {
      console.log("mulai simulateAIResponse")

      // Call the AI API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          conversationHistory: messages,
          userRole: user?.role,
          userId: user?.id,
          contextData: {
            sports,
            fields,
            bookings
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      console.log("response api/ai-chat: ", data)

      if (data.success) {
        console.log("return success: ", data.response)
        return data.response;
      } else {
        throw new Error(data.error || 'AI response failed');
      }
    } catch (error) {
      console.error('AI Response Error:', error);

      // Fallback response
      const input = userInput.toLowerCase();

      // Check for schedule/availability requests
      if (input.includes('jadwal') || input.includes('ketersediaan') || input.includes('tersedia')) {
        const isAfternoon = input.includes('sore') || input.includes('siang');

        return {
          message: `Berikut jadwal lapangan yang ${isAfternoon ? 'di sore hari' : 'tersedia'} untuk 10 hari ke depan:\n\n🏀 Basketball Court A - Rp 150.000/jam\n  16:00, 17:00, 18:00, 19:00\n⚽ Futsal Field 1 - Rp 100.000/jam\n  16:00, 17:00, 20:00, 21:00\n🏸 Badminton Court 2 - Rp 80.000/jam\n  17:00, 18:00, 19:00\n\nPilih lapangan dan jam yang Anda inginkan, saya akan bantu proses bookingnya.`,
          actions: [
            {
              type: 'booking',
              label: 'Book Now',
              data: {
                sport: isAfternoon ? 'basketball' : 'futsal',
                timeSlot: isAfternoon ? '16:00' : '07:00'
              }
            }
          ]
        };
      }

      // Default fallback response
      return {
        message: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi customer service kami.',
        actions: []
      };
    }
  };

  // Load system prompts from database
  const loadSystemPrompts = async () => {
    try {
      const response = await fetch('/api/system-prompts');
      const result = await response.json();

      if (result.success) {
        setSystemPrompts(result.data);

        // Set selected prompt to active one
        const activePrompt = result.data.find((p: any) => p.is_active);
        if (activePrompt) {
          setSelectedPrompt(activePrompt);
        }
      }
    } catch (error) {
      console.error('Error loading system prompts:', error);

      // Fallback to default prompt if database not available
      const fallbackPrompts: SystemPrompt[] = [defaultPrompt];
      console.warn('Using fallback in-memory prompts - database not available. Please check database connection.');
      setSystemPrompts(fallbackPrompts);
      setSelectedPrompt(defaultPrompt);
    }
  };

  const handleSavePrompt = async (prompt: SystemPrompt) => {
    try {
      const response = await fetch(`/api/system-prompts/${prompt.id}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: prompt.name,
          prompt_content: prompt.prompt_content,
          description: `Updated by ${user?.fullName || 'Unknown'}`,
          is_active: prompt.is_active
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setSystemPrompts(prev => prev.map(p => p.id === prompt.id ? result.data : p));
        setSelectedPrompt(result.data);
        setShowSettings(false);
      } else {
        alert('Gagal menyimpan prompt: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Terjadi kesalahan saat menyimpan prompt');
    }
  };

  const handleCreatePrompt = async () => {
    if (!newPromptName.trim()) {
      alert('Nama prompt tidak boleh kosong!');
      return;
    }

    try {
      const response = await fetch('/api/system-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPromptName,
          prompt_content: `Buat sistem prompt untuk ${newPromptName}. Define perilaku dan kemampuan asisten AI yang diinginkan.`,
          description: `Created by ${user?.fullName || 'Unknown'}`,
          created_by: user?.id || null
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setSystemPrompts(prev => [...prev, result.data]);
        setNewPromptName('');
        setShowAddPrompt(false);
        setEditingPrompt(result.data);
      } else {
        alert('Gagal membuat prompt: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
      alert('Terjadi kesalahan saat membuat prompt');
    }
  };

  const handleUpdatePrompt = (prompt: SystemPrompt) => {
    // Update via API instead of local state
    handleSavePrompt(prompt);
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (promptId === 'default' || promptId === '1') {
      alert('Tidak bisa menghapus default prompt!');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus prompt ini?')) {
      try {
        const response = await fetch(`/api/system-prompts/${promptId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          // Update local state
          setSystemPrompts(prev => prev.filter(p => p.id !== promptId));

          if (selectedPrompt?.id === promptId) {
            setSelectedPrompt(null);
          }

          setEditingPrompt(null);
        } else {
          alert('Gagal menghapus prompt: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting prompt:', error);
        alert('Terjadi kesalahan saat menghapus prompt');
      }
    }
  };

  const handleActivatePrompt = async (promptId: string) => {
    try {
      const prompt = systemPrompts.find(p => p.id === promptId);
      if (!prompt) return;

      const response = await fetch(`/api/system-prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: true
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setSystemPrompts(prev => prev.map(p => ({
          ...p,
          is_active: p.id === promptId
        })));

        setSelectedPrompt(result.data);
      } else {
        alert('Gagal mengaktifkan prompt: ' + result.error);
      }
    } catch (error) {
      console.error('Error activating prompt:', error);
      alert('Terjadi kesalahan saat mengaktifkan prompt');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Availability Cards Component
  const AvailabilityCards = ({ data }: { data: any }) => {

    const handleSlotClick = (field: any, date: string, timeSlot: string) => {
      const isSameContext = bookingForm.field === field.id && bookingForm.date === date;

      if (!isSameContext) {
        // New context, reset and start new
        setBookingForm(prev => ({
          ...prev,
          sport: data.sport.code,
          field: field.id,
          date: date,
          fieldName: field.name,
          fieldPrice: field.price,
        }));
        setSelectedTimes([timeSlot]);
      } else {
        // Same context, toggle slot
        if (selectedTimes.includes(timeSlot)) {
          setSelectedTimes(selectedTimes.filter(t => t !== timeSlot));
        } else {
          setSelectedTimes([...selectedTimes, timeSlot]);
        }
      }
    };

    const handleDirectBooking = () => {
      const summaryMessage: Message = {
        id: Date.now().toString(),
        content: "Baik, silakan lengkapi data berikut untuk menyelesaikan pemesanan:",
        sender: 'ai',
        timestamp: new Date(),
        actions: [{
          type: 'inline_booking_form',
          data: {
            ...bookingForm,
            selectedTimes: [...selectedTimes],
            totalPrice: bookingForm.fieldPrice * selectedTimes.length
          }
        }]
      };
      setMessages(prev => [...prev, summaryMessage]);
      // Optional: clear selection or keep it. 
      // If we clear, the UI updates. Let's keep it for visual context or clear it if we want to force focus on the form.
      // Clearing it might be better to prevent confusion if they scroll back up and click "Booking" again with different slots.
      setSelectedTimes([]);
    };

    if (!data.availability || data.availability.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Tidak ada jadwal tersedia</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
            <Target className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{data.sport.name}</h3>
            <p className="text-xs text-gray-400">Klik jam untuk memilih, lalu klik tombol Booking</p>
          </div>
        </div>

        {data.availability.map((dateData: any, dateIndex: number) => (
          <div key={dateData.date} className="bg-[#2a2a2a] rounded-xl border border-white/10 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-white">{dateData.dayName}</span>
                  <span className="text-sm text-gray-400">{dateData.formatted}</span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {dateData.fields.map((field: any) => {
                const isContextMatch = bookingForm.field === field.id && bookingForm.date === dateData.date;
                const hasSelection = isContextMatch && selectedTimes.length > 0;

                return (
                  <div key={field.id} className="bg-[#1a1a1a] rounded-lg p-3 border border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-1 sm:gap-0">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                        <span className="font-medium text-white text-xs sm:text-base">{field.name}</span>
                        {field.offlineMode && (
                          <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-[10px] sm:text-xs">Offline</span>
                        )}
                      </div>
                      <div className="text-green-400 font-medium text-[10px] sm:text-base whitespace-nowrap sm:text-right pl-5 sm:pl-0">
                        Rp {field.price.toLocaleString('id-ID')}/jam
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-3">
                      {field.allSlots.map((timeSlot: string) => {
                        const isSelected = isContextMatch && selectedTimes.includes(timeSlot);
                        const isAvailable = field.availableSlots.includes(timeSlot);

                        return (
                          <button
                            key={timeSlot}
                            onClick={() => isAvailable && handleSlotClick(field, dateData.date, timeSlot)}
                            disabled={!isAvailable}
                            className={`px-2 py-1 rounded text-xs transition-all border flex items-center justify-center
                          ${!isAvailable
                                ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-50 border-transparent'
                                : isSelected
                                  ? 'bg-gradient-to-r from-blue-600 to-red-600 text-white scale-105 border-transparent shadow-lg'
                                  : 'bg-[#333333] text-gray-300 hover:bg-white/10 hover:text-white border-white/10'
                              }`}
                          >
                            {timeSlot}
                          </button>
                        )
                      })}
                    </div>

                    {hasSelection && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={handleDirectBooking}
                          className="w-full py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg flex items-center justify-center space-x-2"
                        >
                          <span>Booking Langsung di Chat ({selectedTimes.length} slot)</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Inline Booking Form Component
  const InlineBookingForm = ({ data }: { data: any }) => {
    const [name, setName] = useState(data.customer_name || '');
    const [whatsapp, setWhatsapp] = useState(data.whatsapp_number || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [bookingResult, setBookingResult] = useState<any>(null);

    if (isSuccess) {
      return (
        <div className="bg-[#2a2a2a] rounded-xl border border-green-600/30 p-6 mt-3 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-green-600/20 rounded-full p-3 w-12 h-12 mx-auto mb-4 border border-green-600/30">
            <Check className="h-6 w-6 text-green-400 mx-auto" />
          </div>
          <h3 className="text-lg font-bold text-green-400 mb-2">Booking Berhasil!</h3>
          <div className="text-gray-300 text-sm space-y-1 bg-[#1a1a1a] p-3 rounded-lg mb-4 border border-white/5">
            <p>Kode: <span className="font-mono text-white">{bookingResult?.booking_code}</span></p>
            <p>Lapangan: {data.fieldName}</p>
            <p>Tanggal: {new Date(data.date).toLocaleDateString('id-ID')}</p>
            <p>Jam: {data.selectedTimes.join(', ')}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Buat booking baru
          </button>
        </div>
      );
    }

    return (
      <div className="bg-[#2a2a2a] rounded-xl border border-white/10 p-5 mt-3 animate-in slide-in-from-bottom-4 duration-300 shadow-2xl">
        <div className="flex items-center space-x-2 mb-4 border-b border-white/10 pb-3">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-bold text-white">Konfirmasi Pemesanan</h3>
        </div>

        {/* Summary Section */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-5 border border-white/5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-bold text-white text-lg">{data.fieldName}</h4>
              <p className="text-blue-400 text-sm">{new Date(data.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-500/30">
              <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">{data.sport}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 my-3">
            {data.selectedTimes.map((time: string) => (
              <span key={time} className="px-3 py-1 bg-[#333333] text-gray-300 rounded-md text-xs border border-white/10 font-mono">
                {time}
              </span>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3 flex justify-between items-center mt-2">
            <span className="text-gray-400 text-sm">Total Biaya</span>
            <span className="text-xl font-bold text-green-400">Rp {data.totalPrice.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim() || !whatsapp.trim()) {
            alert('Mohon lengkapi Nama dan No WhatsApp');
            return;
          }

          setIsSubmitting(true);
          try {
            // Use local createBooking instead of API to ensure Demo Mode works
            const result = createBooking({
              field_id: Number(data.field),
              field_name: data.fieldName,
              booking_date: data.date,
              time_slots: data.selectedTimes,
              total_price: data.totalPrice,
              customer_name: name,
              customer_phone: whatsapp,
              booking_status: 'pending',
              payment_status: 'pending'
            });

            // Simulate API delay slightly for better UX
            await new Promise(resolve => setTimeout(resolve, 800));

            if (result.success) {
              setIsSuccess(true);
              setBookingResult({
                booking_code: `BOOK-${result.data?.id}`,
                ...result.data
              });

              const successMsg: Message = {
                id: Date.now().toString(),
                content: `✅ **Booking Sukses!**\n\nHalo ${name}, booking Anda di ${data.fieldName} berhasil dikonfirmasi.`,
                sender: 'ai',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, successMsg]);
            } else {
              alert(result.error || 'Booking gagal');
            }


          } catch (err) {
            console.error(err);
            alert('Gagal memproses booking');
          } finally {
            setIsSubmitting(false);
          }
        }}>
          <div className="space-y-4">
            <div>
              <label className="flex items-center text-xs text-gray-400 mb-1.5 ml-1">
                <UserIcon className="w-3 h-3 mr-1.5" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Masukkan nama Anda..."
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                required
              />
            </div>
            <div>
              <label className="flex items-center text-xs text-gray-400 mb-1.5 ml-1">
                <Phone className="w-3 h-3 mr-1.5" />
                No. WhatsApp
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="08xxx..."
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 mt-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Konfirmasi Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };



  // Action handler
  const handleActionClick = (action: any) => {
    if (action.type === 'booking') {
      // Navigate to booking page with pre-filled data
      const params = new URLSearchParams();
      if (action.data?.sport) params.set('sport', action.data.sport);
      if (action.data?.date) params.set('date', action.data.date);
      if (action.data?.timeSlot) params.set('timeSlot', action.data.timeSlot);
      if (action.data?.field) params.set('field', action.data.field);
      if (action.data?.timeRange) params.set('timeRange', action.data.timeRange);

      window.location.href = `/booking?${params.toString()}`;
    } else if (action.type === 'redirect') {
      window.location.href = action.url;
    } else if (action.type === 'availability_cards') {
      // No direct action - cards handle their own booking clicks
    }
  };

  return (
    <div className="min-h-screen bg-[#333333]">
      {/* Header */}
      <div className="bg-[#404040] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-red-600 rounded-xl p-2">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
              <p className="text-gray-400 text-sm">Customer Service Virtual Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#404040] rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">System Prompt Management</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Add New Prompt Section */}
            <div className="bg-[#333333] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  System Prompt Settings
                </h3>
                {!showAddPrompt ? (
                  <button
                    onClick={() => setShowAddPrompt(true)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    + Add New Prompt
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAddPrompt(false)}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {showAddPrompt && (
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={newPromptName}
                      onChange={(e) => setNewPromptName(e.target.value)}
                      placeholder="Enter prompt name..."
                      className="flex-1 px-3 py-2 bg-[#262626] text-white rounded-lg text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreatePrompt()}
                    />
                    <button
                      onClick={handleCreatePrompt}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Prompts List */}
            <div className="space-y-4">
              {systemPrompts.map(prompt => (
                <div key={prompt.id} className="bg-[#333333] rounded-xl">
                  {/* Prompt Header */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-white">{prompt.name}</h3>
                        {prompt.is_active && (
                          <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Active</span>
                        )}
                        <span className="text-gray-400 text-xs">
                          Created: {new Date(prompt.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleActivatePrompt(prompt.id)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${prompt.is_active
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                          {prompt.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setEditingPrompt(prompt)}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(prompt.id)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${prompt.id === 'default'
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          disabled={prompt.id === 'default'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Prompt Editor */}
                  <div className="p-4">
                    {editingPrompt?.id === prompt.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Edit Prompt Content:</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdatePrompt(editingPrompt)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPrompt(null)}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={editingPrompt.prompt_content}
                          onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_content: e.target.value })}
                          className="w-full h-48 bg-[#262626] text-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Enter system prompt content..."
                        />
                        {(prompt.CreatedBy?.username || prompt.CreatedBy?.full_name) && (
                          <div className="text-xs text-gray-500 mt-2">
                            Created by: {prompt.CreatedBy.full_name} ({prompt.CreatedBy.username}) |
                            Last updated: {new Date(prompt.updated_at).toLocaleString()}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Version: {prompt.version} | Created: {new Date(prompt.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-400 text-sm mb-2">Preview:</div>
                        <div className="bg-[#262626] rounded-lg p-3 text-gray-300 text-sm max-h-32 overflow-y-auto">
                          {prompt.prompt_content}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {systemPrompts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No system prompts found. Create your first prompt!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-6 h-[calc(100vh-73px)] sm:h-auto flex flex-col">
        <div className="bg-[#404040] rounded-none sm:rounded-2xl shadow-xl flex flex-col h-full overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${message.sender === 'ai' ? 'max-w-full' : 'max-w-[85%]'} sm:max-w-[80%] rounded-2xl p-3 sm:p-4 ${message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#333333] text-gray-300 border border-white/10'
                    }`}
                >
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    {message.sender === 'ai' && (
                      <div className="bg-gradient-to-r from-blue-600 to-red-600 rounded-lg p-1 flex-shrink-0">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    )}
                    {message.sender === 'user' && (
                      <div className="bg-blue-700 rounded-lg p-1 flex-shrink-0">
                        <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">{message.content}</p>
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {message.actions.map((action, index) => (
                            <div key={index} className="w-full overflow-hidden">
                              {action.type === 'availability_cards' ? (
                                <div className="w-full overflow-x-auto">
                                  <AvailabilityCards data={action.data} />
                                </div>
                              )
                                : action.type === 'inline_booking_form' ? (
                                  <InlineBookingForm data={action.data} />
                                )
                                  : action.type === 'booking_form' ? (
                                    <button
                                      onClick={() => {
                                        setShowBookingForm(true);
                                        setBookingForm({
                                          customer_name: '',
                                          whatsapp_number: '',
                                          sport: action.data.sport.code,
                                          field: '',
                                          date: '',
                                          fieldName: '',
                                          fieldPrice: 0,
                                          allBookedSlots: []
                                        });
                                        setBookingStep('form');
                                      }}
                                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg text-sm transition-all"
                                    >
                                      <span>{action.label}</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  )
                                    : (
                                      <button
                                        onClick={() => handleActionClick(action)}
                                        className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                                      >
                                        <span>{action.label}</span>
                                        <ArrowRight className="h-3 w-3" />
                                      </button>
                                    )
                              }
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#333333] text-gray-300 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-600 to-red-600 rounded-lg p-1">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-end space-x-4">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ketik pesan Anda..."
                className="flex-1 bg-[#333333] text-white rounded-xl px-4 py-3 resize-none h-12 border border-white/10 focus:border-blue-500 focus:outline-none transition-colors"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-xl p-3 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setInputMessage('cek jadwal kosong padel')}
                className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-sm text-gray-300 transition-colors"
              >
                🎾 Padel
              </button>
              <button
                onClick={() => setInputMessage('cek jadwal badminton')}
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-sm text-gray-300 transition-colors"
              >
                🏸 Badminton
              </button>
              <button
                onClick={() => setInputMessage('minta jadwal futsal donk')}
                className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-sm text-gray-300 transition-colors"
              >
                ⚽ Futsal
              </button>
              <button
                onClick={() => setInputMessage('kirimin jadwal mini soccer plis')}
                className="px-3 py-1 bg-orange-600/20 hover:bg-orange-600/30 rounded-lg text-sm text-gray-300 transition-colors"
              >
                ⭐ Mini Soccer
              </button>
              <button
                onClick={() => setInputMessage('aku mau booking bola basket malam ini')}
                className="px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 rounded-lg text-sm text-gray-300 transition-colors"
              >
                🏀 Basketball
              </button>
              {user?.role === 'owner' && (
                <button
                  onClick={() => setInputMessage('bagaimana performa bisnis kita hari ini?')}
                  className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm text-gray-300 transition-colors"
                >
                  📊 Business Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
