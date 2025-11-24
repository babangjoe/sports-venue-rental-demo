'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, CreditCard, Receipt, User, Calendar, Clock, CheckCircle, RefreshCcw, XCircle, Utensils, Coffee, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Booking {
  id: number;
  field_name: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  time_slots: string[];
  total_price: number;
  payment_status: string;
}

interface Barang {
  id: number;
  nama_barang: string;
  category: string;
  harga: number;
  stok: number;
}

interface CartItem {
  type: 'booking' | 'barang';
  id: number; // booking_id or barang_id
  name: string;
  price: number;
  quantity: number;
  data?: any; // Original data
}

interface PaymentResult {
  success: boolean;
  payment: {
    id: number;
    nomor_invoice: string;
    amount: number;
    created_at: string;
  };
}

export default function CashierPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [cashGiven, setCashGiven] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingBarang, setLoadingBarang] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentResult | null>(null);
  const [activeTab, setActiveTab] = useState('booking');

  // Search bookings
  useEffect(() => {
    if (activeTab === 'booking') {
      const searchBookings = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (searchTerm) params.append('q', searchTerm);
          
          const response = await fetch(`/api/bookings/pending?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setBookings(data.data || []);
          }
        } catch (error) {
          console.error('Error searching bookings:', error);
        } finally {
          setLoading(false);
        }
      };

      const debounceTimer = setTimeout(() => {
        searchBookings();
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      // Search Barang
      const searchBarang = async () => {
        setLoadingBarang(true);
        try {
          const params = new URLSearchParams();
          let category = 'all';
          if (activeTab === 'makanan') category = 'makanan';
          if (activeTab === 'minuman') category = 'minuman';
          
          params.append('category', category);
          if (searchTerm) params.append('q', searchTerm);

          const response = await fetch(`/api/barang?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setBarangList(data || []);
          }
        } catch (error) {
          console.error('Error searching barang:', error);
        } finally {
          setLoadingBarang(false);
        }
      };

      const debounceTimer = setTimeout(() => {
        searchBarang();
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, activeTab]);

  const addToCart = (item: any, type: 'booking' | 'barang') => {
    if (type === 'booking') {
      // Check if booking already in cart
      if (cart.some(c => c.type === 'booking' && c.id === item.id)) {
        toast.error('Booking ini sudah ada di keranjang');
        return;
      }

      setCart(prev => [...prev, {
        type: 'booking',
        id: item.id,
        name: `Booking ${item.field_name} - ${item.customer_name}`,
        price: item.total_price,
        quantity: 1,
        data: item
      }]);
      toast.success('Booking ditambahkan');
    } else {
      // Barang
      const existingItem = cart.find(c => c.type === 'barang' && c.id === item.id);
      if (existingItem) {
        // Update quantity
        setCart(prev => prev.map(c => 
          c.id === item.id && c.type === 'barang' 
            ? { ...c, quantity: c.quantity + 1 } 
            : c
        ));
      } else {
        setCart(prev => [...prev, {
          type: 'barang',
          id: item.id,
          name: item.nama_barang,
          price: item.harga,
          quantity: 1,
          data: item
        }]);
      }
      toast.success('Item ditambahkan');
    }
    
    setPaymentSuccess(null);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setCart([]);
    setCashGiven('');
    setPaymentSuccess(null);
    setSearchTerm('');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateChange = () => {
    const total = calculateTotal();
    if (total === 0 || !cashGiven) return 0;
    const cash = Number(cashGiven.replace(/\D/g, ''));
    return Math.max(0, cash - total);
  };

  const handlePayment = async () => {
    const total = calculateTotal();
    if (total === 0) return;
    
    const cash = Number(cashGiven.replace(/\D/g, ''));
    if (cash < total) {
      toast.error('Uang pembayaran kurang!');
      return;
    }

    setProcessing(true);
    try {
      // Find bookings in cart
      const bookingItems = cart.filter(c => c.type === 'booking');
      const bookingIds = bookingItems.map(b => b.id);
      
      const payload = {
        amount: total,
        user_name: 'Cashier',
        booking_ids: bookingIds,
        // In future, we can send detail items here
        items: cart.map(item => ({
          type: item.type,
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      const response = await fetch('/api/pemasukan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setPaymentSuccess(result);
        toast.success('Pembayaran berhasil!');
        
        // Remove processed bookings from list
        if (bookingIds.length > 0) {
          setBookings(prev => prev.filter(b => !bookingIds.includes(b.id)));
        }
      } else {
        toast.error(result.error || 'Pembayaran gagal');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Kembali ke Home</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <CreditCard className="h-5 w-5 text-emerald-300" />
            <span className="text-white font-bold">Cashier System</span>
          </div>
        </div>

        {/* CONTAINER UTAMA (GRID) - Ditambahkan min-h- untuk menyelaraskan ketinggian */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative min-h-[calc(100vh-8rem)]"> 
          {/* Right Column: Payment Detail (Left) */}
          <div className="lg:col-span-1">
            {/* KOLOM PEMBAYARAN - Dihapus 'sticky top-6' dan 'h-[...]', diganti dengan 'h-full' */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col relative sticky top-6 h-[calc(100vh-8rem)] overflow-hidden"> 
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center flex-shrink-0">
                <Receipt className="h-6 w-6 mr-2 text-emerald-600" />
                Pembayaran
              </h2>

              {/* Clear Button */}
              {(cart.length > 0 || paymentSuccess) && (
                 <button 
                   onClick={handleClear}
                   className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors z-10"
                   title="Clear"
                 >
                   <XCircle className="h-6 w-6" />
                 </button>
              )}

              <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
              {paymentSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-8 animate-in fade-in zoom-in duration-300 h-full">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">Pembayaran Berhasil!</h3>
                  <p className="text-gray-500 mb-6">Transaksi telah disimpan.</p>
                  
                  <div className="w-full bg-gray-50 p-4 rounded-xl mb-6 text-left">
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-500">No. Invoice</span>
                      <span className="font-mono font-bold text-gray-800">{paymentSuccess.payment.nomor_invoice}</span>
                    </div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-500">Tanggal</span>
                      <span className="font-medium text-gray-800">
                        {new Date(paymentSuccess.payment.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2 mt-2">
                      <span className="text-gray-500">Total Bayar</span>
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(paymentSuccess.payment.amount)}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      setPaymentSuccess(null);
                      setCart([]);
                      setCashGiven('');
                      setSearchTerm('');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 mt-auto"
                  >
                    Transaksi Baru
                  </Button>
                </div>
              ) : cart.length > 0 ? (
                <div className="flex flex-col h-full">
                  {/* Cart Items List */}
                  <div className="space-y-3 mb-4 flex-grow overflow-y-auto pr-1">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                        <div className="flex-1 overflow-hidden">
                          <p className="text-gray-800 font-medium truncate text-sm">{item.name}</p>
                          <p className="text-gray-500 text-xs">
                            {item.quantity} x {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="text-right pl-2">
                          <p className="text-emerald-600 font-bold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                          <button 
                            onClick={() => removeFromCart(index)}
                            className="text-red-400 hover:text-red-600 text-xs mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 mb-4 flex-shrink-0 pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Tagihan</label>
                      <div className="text-3xl font-bold text-emerald-600">
                        {formatCurrency(calculateTotal())}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Uang Diterima (Cash)</label>
                      <Input
                        type="text"
                        placeholder="0"
                        className="text-xl h-14 font-bold"
                        value={cashGiven}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setCashGiven(val);
                        }}
                      />
                    </div>

                    <div className={`p-4 rounded-xl transition-colors ${
                      calculateChange() >= 0 ? 'bg-blue-50' : 'bg-red-50'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Kembali</span>
                        <span className={`text-xl font-bold ${
                          calculateChange() >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(calculateChange())}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pb-1 flex-shrink-0">
                    <Button
                      onClick={handlePayment}
                      disabled={processing || !cashGiven || Number(cashGiven) < calculateTotal()}
                      className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-transform active:scale-95 ${
                        processing 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white'
                      }`}
                    >
                      {processing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCcw className="animate-spin h-5 w-5" />
                          <span>Memproses...</span>
                        </div>
                      ) : (
                        'BAYAR SEKARANG'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 opacity-50 h-full">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Pilih item dari daftar<br/>untuk memproses pembayaran</p>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Left Column: Search & List (Right) */}
          {/* KOLOM DAFTAR ITEM - Ditambahkan 'flex flex-col' */}
          <div className="lg:col-span-2 space-y-6 flex flex-col"> 
            {/* TABS CONTAINER - Ditambahkan 'flex flex-col flex-grow' */}
            <Tabs defaultValue="booking" onValueChange={(val) => {
              setActiveTab(val);
              setSearchTerm('');
            }} className="w-full flex flex-col flex-grow"> 
              
              {/* HEADER TABS & SEARCH (NON-SCROLLABLE) */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 sticky top-6 z-20 flex-shrink-0">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Pilih Item</h2>
                    <TabsList className="bg-white/20 border border-white/10">
                      <TabsTrigger value="booking" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 text-white">
                        Booking Pending
                      </TabsTrigger>
                      <TabsTrigger value="makanan" className="data-[state=active]:bg-white data-[state=active]:text-orange-500 text-white">
                        <Utensils className="h-4 w-4 mr-2" /> Makanan
                      </TabsTrigger>
                      <TabsTrigger value="minuman" className="data-[state=active]:bg-white data-[state=active]:text-blue-500 text-white">
                        <Coffee className="h-4 w-4 mr-2" /> Minuman
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                    <Input
                      placeholder={activeTab === 'booking' ? "Cari nama customer, no. hp..." : "Cari menu..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 h-12 text-lg rounded-xl focus:bg-white/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* KONTEN TABS (SCROLLABLE AREA) - Dihapus 'min-h-[400px]', diganti dengan 'flex-grow overflow-y-auto' dan 'min-h-0' */}
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 sticky h-[calc(100vh-28rem)] flex-grow overflow-y-auto custom-scrollbar">
                
                <TabsContent value="booking" className="mt-0">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-yellow-300" />
                    Daftar Booking Pending
                  </h3>
                  
                  {loading ? (
                    <div className="text-center py-12 text-white/60">Loading...</div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-12 text-white/60 border-2 border-dashed border-white/20 rounded-xl">
                      Tidak ada booking pending ditemukan
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          onClick={() => addToCart(booking, 'booking')}
                          className="p-4 rounded-xl border bg-white/5 border-white/10 hover:bg-white/20 hover:border-emerald-400 transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-white font-bold text-lg">{booking.customer_name}</h4>
                              <div className="flex items-center text-white/80 text-sm mt-1 space-x-3">
                                <span className="flex items-center"><User className="h-3 w-3 mr-1" /> {booking.customer_phone}</span>
                              </div>
                              <div className="flex items-center text-white/80 text-sm mt-1">
                                <Calendar className="h-3 w-3 mr-1" /> {booking.booking_date} ({booking.time_slots.length} slot)
                              </div>
                              <div className="mt-2 inline-block bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded-lg font-medium border border-emerald-500/30">
                                {booking.field_name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-emerald-300">
                                {formatCurrency(booking.total_price)}
                              </div>
                              <button className="mt-2 p-2 bg-emerald-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="makanan" className="mt-0">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Utensils className="h-5 w-5 mr-2 text-orange-400" />
                    Menu Makanan
                  </h3>
                  {loadingBarang ? (
                    <div className="text-center py-12 text-white/60">Loading...</div>
                  ) : barangList.length === 0 ? (
                    <div className="text-center py-12 text-white/60 border-2 border-dashed border-white/20 rounded-xl">
                      Tidak ada makanan ditemukan
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {barangList.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => addToCart(item, 'barang')}
                          className="p-4 rounded-xl border bg-white/5 border-white/10 hover:bg-white/20 hover:border-orange-400 transition-all cursor-pointer group"
                        >
                          <h4 className="text-white font-bold text-lg mb-1">{item.nama_barang}</h4>
                          <p className="text-white/60 text-sm mb-3">Stok: {item.stok}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-orange-300 font-bold">{formatCurrency(item.harga)}</span>
                            <button className="p-1.5 bg-orange-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="minuman" className="mt-0">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Coffee className="h-5 w-5 mr-2 text-blue-400" />
                    Menu Minuman
                  </h3>
                  {loadingBarang ? (
                    <div className="text-center py-12 text-white/60">Loading...</div>
                  ) : barangList.length === 0 ? (
                    <div className="text-center py-12 text-white/60 border-2 border-dashed border-white/20 rounded-xl">
                      Tidak ada minuman ditemukan
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {barangList.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => addToCart(item, 'barang')}
                          className="p-4 rounded-xl border bg-white/5 border-white/10 hover:bg-white/20 hover:border-blue-400 transition-all cursor-pointer group"
                        >
                          <h4 className="text-white font-bold text-lg mb-1">{item.nama_barang}</h4>
                          <p className="text-white/60 text-sm mb-3">Stok: {item.stok}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-300 font-bold">{formatCurrency(item.harga)}</span>
                            <button className="p-1.5 bg-blue-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

// 'use client';

// import React, { useState, useEffect } from 'react';
// import { ArrowLeft, Search, CreditCard, Receipt, User, Calendar, Clock, CheckCircle, RefreshCcw, XCircle, Utensils, Coffee, Trash2, Plus } from 'lucide-react';
// import Link from 'next/link';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { toast } from 'sonner';

// interface Booking {
//   id: number;
//   field_name: string;
//   customer_name: string;
//   customer_phone: string;
//   booking_date: string;
//   time_slots: string[];
//   total_price: number;
//   payment_status: string;
// }

// interface Barang {
//   id: number;
//   nama_barang: string;
//   category: string;
//   harga: number;
//   stok: number;
// }

// interface CartItem {
//   type: 'booking' | 'barang';
//   id: number; // booking_id or barang_id
//   name: string;
//   price: number;
//   quantity: number;
//   data?: any; // Original data
// }

// interface PaymentResult {
//   success: boolean;
//   payment: {
//     id: number;
//     nomor_invoice: string;
//     amount: number;
//     created_at: string;
//   };
// }

// export default function CashierPage() {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [barangList, setBarangList] = useState<Barang[]>([]);
  
//   // Cart State
//   const [cart, setCart] = useState<CartItem[]>([]);
  
//   const [cashGiven, setCashGiven] = useState<string>('');
//   const [loading, setLoading] = useState(false);
//   const [loadingBarang, setLoadingBarang] = useState(false);
//   const [processing, setProcessing] = useState(false);
//   const [paymentSuccess, setPaymentSuccess] = useState<PaymentResult | null>(null);
//   const [activeTab, setActiveTab] = useState('booking');

//   // Search bookings
//   useEffect(() => {
//     if (activeTab === 'booking') {
//       const searchBookings = async () => {
//         setLoading(true);
//         try {
//           const params = new URLSearchParams();
//           if (searchTerm) params.append('q', searchTerm);
          
//           const response = await fetch(`/api/bookings/pending?${params.toString()}`);
//           if (response.ok) {
//             const data = await response.json();
//             setBookings(data.data || []);
//           }
//         } catch (error) {
//           console.error('Error searching bookings:', error);
//         } finally {
//           setLoading(false);
//         }
//       };

//       const debounceTimer = setTimeout(() => {
//         searchBookings();
//       }, 500);

//       return () => clearTimeout(debounceTimer);
//     } else {
//       // Search Barang
//       const searchBarang = async () => {
//         setLoadingBarang(true);
//         try {
//           const params = new URLSearchParams();
//           let category = 'all';
//           if (activeTab === 'makanan') category = 'makanan';
//           if (activeTab === 'minuman') category = 'minuman';
          
//           params.append('category', category);
//           if (searchTerm) params.append('q', searchTerm);

//           const response = await fetch(`/api/barang?${params.toString()}`);
//           if (response.ok) {
//             const data = await response.json();
//             setBarangList(data || []);
//           }
//         } catch (error) {
//           console.error('Error searching barang:', error);
//         } finally {
//           setLoadingBarang(false);
//         }
//       };

//       const debounceTimer = setTimeout(() => {
//         searchBarang();
//       }, 500);

//       return () => clearTimeout(debounceTimer);
//     }
//   }, [searchTerm, activeTab]);

//   const addToCart = (item: any, type: 'booking' | 'barang') => {
//     if (type === 'booking') {
//       // Check if booking already in cart
//       if (cart.some(c => c.type === 'booking' && c.id === item.id)) {
//         toast.error('Booking ini sudah ada di keranjang');
//         return;
//       }

//       setCart(prev => [...prev, {
//         type: 'booking',
//         id: item.id,
//         name: `Booking ${item.field_name} - ${item.customer_name}`,
//         price: item.total_price,
//         quantity: 1,
//         data: item
//       }]);
//       toast.success('Booking ditambahkan');
//     } else {
//       // Barang
//       const existingItem = cart.find(c => c.type === 'barang' && c.id === item.id);
//       if (existingItem) {
//         // Update quantity
//         setCart(prev => prev.map(c => 
//           c.id === item.id && c.type === 'barang' 
//             ? { ...c, quantity: c.quantity + 1 } 
//             : c
//         ));
//       } else {
//         setCart(prev => [...prev, {
//           type: 'barang',
//           id: item.id,
//           name: item.nama_barang,
//           price: item.harga,
//           quantity: 1,
//           data: item
//         }]);
//       }
//       toast.success('Item ditambahkan');
//     }
    
//     setPaymentSuccess(null);
//   };

//   const removeFromCart = (index: number) => {
//     setCart(prev => prev.filter((_, i) => i !== index));
//   };

//   const handleClear = () => {
//     setCart([]);
//     setCashGiven('');
//     setPaymentSuccess(null);
//     setSearchTerm('');
//   };

//   const calculateTotal = () => {
//     return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//   };

//   const calculateChange = () => {
//     const total = calculateTotal();
//     if (total === 0 || !cashGiven) return 0;
//     const cash = Number(cashGiven.replace(/\D/g, ''));
//     return Math.max(0, cash - total);
//   };

//   const handlePayment = async () => {
//     const total = calculateTotal();
//     if (total === 0) return;
    
//     const cash = Number(cashGiven.replace(/\D/g, ''));
//     if (cash < total) {
//       toast.error('Uang pembayaran kurang!');
//       return;
//     }

//     setProcessing(true);
//     try {
//       // Find bookings in cart
//       const bookingItems = cart.filter(c => c.type === 'booking');
//       const bookingIds = bookingItems.map(b => b.id);
      
//       const payload = {
//         amount: total,
//         user_name: 'Cashier',
//         booking_ids: bookingIds,
//         // In future, we can send detail items here
//         items: cart.map(item => ({
//           type: item.type,
//           id: item.id,
//           name: item.name,
//           price: item.price,
//           quantity: item.quantity
//         }))
//       };

//       const response = await fetch('/api/pemasukan', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });

//       const result = await response.json();

//       if (response.ok) {
//         setPaymentSuccess(result);
//         toast.success('Pembayaran berhasil!');
        
//         // Remove processed bookings from list
//         if (bookingIds.length > 0) {
//           setBookings(prev => prev.filter(b => !bookingIds.includes(b.id)));
//         }
//       } else {
//         toast.error(result.error || 'Pembayaran gagal');
//       }
//     } catch (error) {
//       console.error('Payment error:', error);
//       toast.error('Terjadi kesalahan sistem');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 p-4 md:p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div className="flex items-center space-x-4">
//             <Link href="/" className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors">
//               <ArrowLeft className="h-5 w-5" />
//               <span className="font-medium">Kembali ke Home</span>
//             </Link>
//           </div>
//           <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
//             <CreditCard className="h-5 w-5 text-emerald-300" />
//             <span className="text-white font-bold">Cashier System</span>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
//           {/* Right Column: Payment Detail (Left) */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col sticky top-6 relative h-[calc(100vh-8rem)] overflow-hidden">
//               <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center flex-shrink-0">
//                 <Receipt className="h-6 w-6 mr-2 text-emerald-600" />
//                 Pembayaran
//               </h2>

//               {/* Clear Button */}
//               {(cart.length > 0 || paymentSuccess) && (
//                  <button 
//                    onClick={handleClear}
//                    className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors z-10"
//                    title="Clear"
//                  >
//                    <XCircle className="h-6 w-6" />
//                  </button>
//               )}

//               <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
//               {paymentSuccess ? (
//                 <div className="flex flex-col items-center justify-center text-center py-8 animate-in fade-in zoom-in duration-300 h-full">
//                   <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
//                     <CheckCircle className="h-10 w-10 text-green-600" />
//                   </div>
//                   <h3 className="text-2xl font-bold text-green-600 mb-2">Pembayaran Berhasil!</h3>
//                   <p className="text-gray-500 mb-6">Transaksi telah disimpan.</p>
                  
//                   <div className="w-full bg-gray-50 p-4 rounded-xl mb-6 text-left">
//                     <div className="flex justify-between mb-2 text-sm">
//                       <span className="text-gray-500">No. Invoice</span>
//                       <span className="font-mono font-bold text-gray-800">{paymentSuccess.payment.nomor_invoice}</span>
//                     </div>
//                     <div className="flex justify-between mb-2 text-sm">
//                       <span className="text-gray-500">Tanggal</span>
//                       <span className="font-medium text-gray-800">
//                         {new Date(paymentSuccess.payment.created_at).toLocaleDateString('id-ID')}
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm border-t pt-2 mt-2">
//                       <span className="text-gray-500">Total Bayar</span>
//                       <span className="font-bold text-emerald-600">
//                         {formatCurrency(paymentSuccess.payment.amount)}
//                       </span>
//                     </div>
//                   </div>

//                   <Button 
//                     onClick={() => {
//                       setPaymentSuccess(null);
//                       setCart([]);
//                       setCashGiven('');
//                       setSearchTerm('');
//                     }}
//                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 mt-auto"
//                   >
//                     Transaksi Baru
//                   </Button>
//                 </div>
//               ) : cart.length > 0 ? (
//                 <div className="flex flex-col h-full">
//                   {/* Cart Items List */}
//                   <div className="space-y-3 mb-4 flex-grow overflow-y-auto pr-1">
//                     {cart.map((item, index) => (
//                       <div key={index} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
//                         <div className="flex-1 overflow-hidden">
//                           <p className="text-gray-800 font-medium truncate text-sm">{item.name}</p>
//                           <p className="text-gray-500 text-xs">
//                             {item.quantity} x {formatCurrency(item.price)}
//                           </p>
//                         </div>
//                         <div className="text-right pl-2">
//                           <p className="text-emerald-600 font-bold text-sm">{formatCurrency(item.price * item.quantity)}</p>
//                           <button 
//                             onClick={() => removeFromCart(index)}
//                             className="text-red-400 hover:text-red-600 text-xs mt-1"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   <div className="space-y-4 mb-4 flex-shrink-0 pt-4 border-t border-gray-100">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Total Tagihan</label>
//                       <div className="text-3xl font-bold text-emerald-600">
//                         {formatCurrency(calculateTotal())}
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">Uang Diterima (Cash)</label>
//                       <Input
//                         type="text"
//                         placeholder="0"
//                         className="text-xl h-14 font-bold"
//                         value={cashGiven}
//                         onChange={(e) => {
//                           const val = e.target.value.replace(/\D/g, '');
//                           setCashGiven(val);
//                         }}
//                       />
//                     </div>

//                     <div className={`p-4 rounded-xl transition-colors ${
//                       calculateChange() >= 0 ? 'bg-blue-50' : 'bg-red-50'
//                     }`}>
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm font-medium text-gray-600">Kembali</span>
//                         <span className={`text-xl font-bold ${
//                           calculateChange() >= 0 ? 'text-blue-600' : 'text-red-600'
//                         }`}>
//                           {formatCurrency(calculateChange())}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mt-auto pb-1 flex-shrink-0">
//                     <Button
//                       onClick={handlePayment}
//                       disabled={processing || !cashGiven || Number(cashGiven) < calculateTotal()}
//                       className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-transform active:scale-95 ${
//                         processing 
//                           ? 'bg-gray-400 cursor-not-allowed' 
//                           : 'bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white'
//                       }`}
//                     >
//                       {processing ? (
//                         <div className="flex items-center justify-center space-x-2">
//                           <RefreshCcw className="animate-spin h-5 w-5" />
//                           <span>Memproses...</span>
//                         </div>
//                       ) : (
//                         'BAYAR SEKARANG'
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex flex-col items-center justify-center text-center py-12 opacity-50 h-full">
//                   <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
//                     <Search className="h-10 w-10 text-gray-400" />
//                   </div>
//                   <p className="text-gray-500 font-medium">Pilih item dari daftar<br/>untuk memproses pembayaran</p>
//                 </div>
//               )}
//               </div>
//             </div>
//           </div>

//           {/* Left Column: Search & List (Right) */}
//           <div className="lg:col-span-2 space-y-6">
//             <Tabs defaultValue="booking" onValueChange={(val) => {
//               setActiveTab(val);
//               setSearchTerm('');
//             }} className="w-full">
//               <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 sticky top-6 z-20">
//                 <div className="flex flex-col space-y-4">
//                   <div className="flex justify-between items-center">
//                     <h2 className="text-2xl font-bold text-white">Pilih Item</h2>
//                     <TabsList className="bg-white/20 border border-white/10">
//                       <TabsTrigger value="booking" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 text-white">
//                         Booking Pending
//                       </TabsTrigger>
//                       <TabsTrigger value="makanan" className="data-[state=active]:bg-white data-[state=active]:text-orange-500 text-white">
//                         <Utensils className="h-4 w-4 mr-2" /> Makanan
//                       </TabsTrigger>
//                       <TabsTrigger value="minuman" className="data-[state=active]:bg-white data-[state=active]:text-blue-500 text-white">
//                         <Coffee className="h-4 w-4 mr-2" /> Minuman
//                       </TabsTrigger>
//                     </TabsList>
//                   </div>
                  
//                   <div className="relative">
//                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
//                     <Input
//                       placeholder={activeTab === 'booking' ? "Cari nama customer, no. hp..." : "Cari menu..."}
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       className="pl-12 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 h-12 text-lg rounded-xl focus:bg-white/30 transition-all"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 min-h-[400px]">
//                 <TabsContent value="booking" className="mt-0">
//                   <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
//                     <Clock className="h-5 w-5 mr-2 text-yellow-300" />
//                     Daftar Booking Pending
//                   </h3>
                  
//                   {loading ? (
//                     <div className="text-center py-12 text-white/60">Loading...</div>
//                   ) : bookings.length === 0 ? (
//                     <div className="text-center py-12 text-white/60 border-2 border-dashed border-white/20 rounded-xl">
//                       Tidak ada booking pending ditemukan
//                     </div>
//                   ) : (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {bookings.map((booking) => (
//                         <div
//                           key={booking.id}
//                           onClick={() => addToCart(booking, 'booking')}
//                           className="p-4 rounded-xl border bg-white/5 border-white/10 hover:bg-white/20 hover:border-emerald-400 transition-all cursor-pointer group"
//                         >
//                           <div className="flex justify-between items-start">
//                             <div>
//                               <h4 className="text-white font-bold text-lg">{booking.customer_name}</h4>
//                               <div className="flex items-center text-white/80 text-sm mt-1 space-x-3">
//                                 <span className="flex items-center"><User className="h-3 w-3 mr-1" /> {booking.customer_phone}</span>
//                               </div>
//                               <div className="flex items-center text-white/80 text-sm mt-1">
//                                 <Calendar className="h-3 w-3 mr-1" /> {booking.booking_date} ({booking.time_slots.length} slot)
//                               </div>
//                               <div className="mt-2 inline-block bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded-lg font-medium border border-emerald-500/30">
//                                 {booking.field_name}
//                               </div>
//                             </div>
//                             <div className="text-right">
//                               <div className="text-xl font-bold text-emerald-300">
//                                 {formatCurrency(booking.total_price)}
//                               </div>
//                               <button className="mt-2 p-2 bg-emerald-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
//                                 <Plus className="h-4 w-4" />
//                               </button>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </TabsContent>

//                 <TabsContent value="makanan" className="mt-0">
//                   <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
//                     <Utensils className="h-5 w-5 mr-2 text-orange-400" />
//                     Menu Makanan
//                   </h3>
//                   {loadingBarang ? (
//                     <div className="text-center py-12 text-white/60">Loading...</div>
//                   ) : barangList.length === 0 ? (
//                     <div className="text-center py-12 text-white/60 border-2 border-dashed border-white/20 rounded-xl">
//                       Tidak ada makanan ditemukan
//                     </div>
//                   ) : (
//                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                       {barangList.map((item) => (
//                         <div
//                           key={item.id}
//                           onClick={() => addToCart(item, 'barang')}
//                           className="p-4 rounded-xl border bg-white/5 border-white/10 hover:bg-white/20 hover:border-orange-400 transition-all cursor-pointer group"
//                         >
//                           <h4 className="text-white font-bold text-lg mb-1">{item.nama_barang}</h4>
//                           <p className="text-white/60 text-sm mb-3">Stok: {item.stok}</p>
//                           <div className="flex justify-between items-center">
//                             <span className="text-orange-300 font-bold">{formatCurrency(item.harga)}</span>
//                             <button className="p-1.5 bg-orange-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
//                               <Plus className="h-4 w-4" />
//                             </button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </TabsContent>

//                 <TabsContent value="minuman" className="mt-0">
//                   <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
//                     <Coffee className="h-5 w-5 mr-2 text-blue-400" />
//                     Menu Minuman
//                   </h3>
//                   {loadingBarang ? (
//                     <div className="text-center py-12 text-white/60">Loading...</div>
//                   ) : barangList.length === 0 ? (
//                     <div className="text-center py-12 text-white/60 border-2 border-dashed border-white/20 rounded-xl">
//                       Tidak ada minuman ditemukan
//                     </div>
//                   ) : (
//                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                       {barangList.map((item) => (
//                         <div
//                           key={item.id}
//                           onClick={() => addToCart(item, 'barang')}
//                           className="p-4 rounded-xl border bg-white/5 border-white/10 hover:bg-white/20 hover:border-blue-400 transition-all cursor-pointer group"
//                         >
//                           <h4 className="text-white font-bold text-lg mb-1">{item.nama_barang}</h4>
//                           <p className="text-white/60 text-sm mb-3">Stok: {item.stok}</p>
//                           <div className="flex justify-between items-center">
//                             <span className="text-blue-300 font-bold">{formatCurrency(item.harga)}</span>
//                             <button className="p-1.5 bg-blue-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
//                               <Plus className="h-4 w-4" />
//                             </button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </TabsContent>
//               </div>
//             </Tabs>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

