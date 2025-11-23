'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  DollarSign, 
  Package,
  Calendar,
  Target,
  Users
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Define types for our data
interface Booking {
  id: number;
  field_id: string;
  field_name: string;
  booking_date: string;
  time_slots: string[];
  total_price: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

interface Field {
  id: number;
  field_name: string;
  field_code: string;
  sport_id: number;
  price_per_hour: number;
  description: string;
  is_available: boolean;
  sport_name: string;
  sport_type: string;
  created_at: string;
  updated_at: string;
}

interface Sport {
  id: number;
  sport_name: string;
  sport_type: string;
  description: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

const DashboardPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [selectedSport, setSelectedSport] = useState<string>(''); // Empty string shows all sports
  const [dateRange, setDateRange] = useState<string>(''); // Empty string shows all time
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Calculate stats based on all bookings and their status
  const totalIncoming = filteredBookings
    .filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed')
    .reduce((sum, booking) => sum + Number(booking.total_price), 0);
  
  const totalOutgoing = filteredBookings
    .filter(b => b.booking_status === 'cancelled')
    .reduce((sum, booking) => sum + Number(booking.total_price), 0);
  
  const pendingBookings = filteredBookings.filter(b => b.booking_status === 'pending');

  // Prepare data for charts - show confirmed bookings by sport in the last 3 months for each month
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Apply filters to the bookings for the chart data (similar to how filteredBookings is created)
  let chartBookings = [...bookings];
  
  // Apply sport filter
  if (selectedSport !== '') {
    const sportFieldCodes = fields
      .filter(field => field.sport_id.toString() === selectedSport)
      .map(field => field.field_code);
    
    chartBookings = chartBookings.filter(booking => sportFieldCodes.includes(booking.field_id));
  }
  
  // Apply search term filter
  if (searchTerm) {
    chartBookings = chartBookings.filter(booking => 
      booking.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Apply date range filter
  const now = new Date();
  switch (dateRange) {
    case 'daily':
      chartBookings = chartBookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate.toDateString() === now.toDateString();
      });
      break;
    case 'weekly':
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      chartBookings = chartBookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate >= oneWeekAgo && bookingDate <= now;
      });
      break;
    case 'monthly':
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      chartBookings = chartBookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate >= oneMonthAgo && bookingDate <= now;
      });
      break;
    case 'yearly':
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      chartBookings = chartBookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate >= oneYearAgo && bookingDate <= now;
      });
      break;
    case '':
      // Do not filter by date - show all bookings
      break;
  }

  // Calculate confirmed bookings by sport and month for the chart
  const confirmedBookingsBySportAndMonth = chartBookings
    .filter(b => {
      const bookingDate = new Date(b.booking_date);
      // Make sure the booking is confirmed/completed AND within the last 3 months
      const isConfirmed = b.booking_status === 'confirmed' || b.booking_status === 'completed';
      const isWithinThreeMonths = bookingDate >= threeMonthsAgo;
      return isConfirmed && isWithinThreeMonths;
    })
    .reduce((acc, booking) => {
      const field = fields.find(f => f.field_code === booking.field_id);
      const sportName = field ? field.sport_name : 'Unknown';
      const bookingDate = new Date(booking.booking_date);
      // Format month as MMM-yyyy
      const monthYear = bookingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!acc[monthYear]) {
        acc[monthYear] = {};
      }
      if (!acc[monthYear][sportName]) {
        acc[monthYear][sportName] = 0;
      }
      acc[monthYear][sportName]++;
      return acc;
    }, {} as Record<string, Record<string, number>>);

  // Find the sport with the most bookings for each month
  const topSportEachMonth = Object.entries(confirmedBookingsBySportAndMonth).map(([month, sportsData]) => {
    let topSport = 'Unknown';
    let maxCount = 0;
    
    Object.entries(sportsData).forEach(([sportName, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSport = sportName;
      }
    });
    
    return { name: month, sport: topSport, value: maxCount };
  });

  // Sort by month in ascending order (earliest to latest)
  // Parse month-year format to sort properly
  const sortedTopSportEachMonth = topSportEachMonth.sort((a, b) => {
    // Parse "MMM yyyy" format - create a date for the first day of the month
    const [monthA, yearA] = a.name.split(' ');
    const [monthB, yearB] = b.name.split(' ');
    
    // Create dates for first day of each month for comparison
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    
    return dateA.getTime() - dateB.getTime();
  });

  // Use the sorted data for the chart
  const trendChartData = sortedTopSportEachMonth;

  // Calculate revenue by sport by joining with fields and sports tables
  const revenueBySport = filteredBookings
    .filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed')
    .filter(booking => {
      // Only include bookings that have a matching field
      return fields.some(f => f.field_code === booking.field_id);
    })
    .reduce((acc, booking) => {
      // Find the field information using the field_id
      const field = fields.find(f => f.field_code === booking.field_id);
      // If field exists, get the sport_name
      const sportName = field ? field.sport_name : 'Unknown';
      
      if (!acc[sportName]) {
        acc[sportName] = 0;
      }
      // Add the total_price of the booking (converted to number) to the sport's revenue
      acc[sportName] += Number(booking.total_price);
      return acc;
    }, {} as Record<string, number>);

  // Convert the revenueBySport object to array format for the chart
  const revenueBySportData = Object.entries(revenueBySport).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, fieldsRes, sportsRes] = await Promise.all([
          fetch('/api/booking'),
          fetch('/api/fields'),
          fetch('/api/sports')
        ]);

        if (!bookingsRes.ok || !fieldsRes.ok || !sportsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [bookingsData, fieldsData, sportsData] = await Promise.all([
          bookingsRes.json(),
          fieldsRes.json(),
          sportsRes.json()
        ]);

        setBookings(bookingsData);
        setFields(fieldsData);
        setSports(sportsData);
        setFilteredBookings(bookingsData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    if (loading) return;

    let result = [...bookings];
    
    // Apply sport filter
    if (selectedSport !== '') {
      const sportFieldCodes = fields
        .filter(field => field.sport_id.toString() === selectedSport)
        .map(field => field.field_code);
      
      result = result.filter(booking => sportFieldCodes.includes(booking.field_id));
    }
    
    // Apply search term filter
    if (searchTerm) {
      result = result.filter(booking => 
        booking.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply date range filter
    const now = new Date();
    switch (dateRange) {
      case 'daily':
        result = result.filter(booking => {
          const bookingDate = new Date(booking.booking_date);
          return bookingDate.toDateString() === now.toDateString();
        });
        break;
      case 'weekly':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        result = result.filter(booking => {
          const bookingDate = new Date(booking.booking_date);
          return bookingDate >= oneWeekAgo && bookingDate <= now;
        });
        break;
      case 'monthly':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        result = result.filter(booking => {
          const bookingDate = new Date(booking.booking_date);
          return bookingDate >= oneMonthAgo && bookingDate <= now;
        });
        break;
      case 'yearly':
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        result = result.filter(booking => {
          const bookingDate = new Date(booking.booking_date);
          return bookingDate >= oneYearAgo && bookingDate <= now;
        });
        break;
      case '':
        // Do not filter by date - show all bookings (default case)
        break;
    }
    
    setFilteredBookings(result);
  }, [bookings, selectedSport, dateRange, searchTerm, fields, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-xl text-white font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
          <p className="text-xl text-white font-semibold mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Kembali ke Home</span>
            </Link>
          </div>
        </div>
        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Dashboard <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Transaksi</span>
          </h1>
          <p className="text-white/90 text-lg">Monitor transaksi lapangan olahraga Anda</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60">
              <SelectValue placeholder="All Sports" className="text-white" />
            </SelectTrigger>
            <SelectContent className="bg-white backdrop-blur-sm border-white/20">
              {sports.map(sport => (
                <SelectItem key={sport.id} value={sport.id.toString()}>
                  {sport.sport_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60">
              <SelectValue placeholder="All Time" className="text-white" />
            </SelectTrigger>
            <SelectContent className="bg-white backdrop-blur-sm border-white/20">
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm font-medium">Incoming Transactions</p>
                <p className="text-white text-2xl font-bold">
                  Rp {totalIncoming.toLocaleString('id-ID')}
                </p>
                <p className="text-white/60 text-xs">
                  {filteredBookings.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed').length} bookings
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-3">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm font-medium">Outgoing Transactions</p>
                <p className="text-white text-2xl font-bold">
                  Rp {totalOutgoing.toLocaleString('id-ID')}
                </p>
                <p className="text-white/60 text-xs">
                  {filteredBookings.filter(b => b.booking_status === 'cancelled').length} cancelled
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-3">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm font-medium">Pending Payments</p>
                <p className="text-white text-2xl font-bold">
                  Rp {pendingBookings.reduce((sum, booking) => sum + Number(booking.total_price), 0).toLocaleString('id-ID')}
                </p>
                <p className="text-white/60 text-xs">
                  {pendingBookings.length} pending
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">Top Sports by Month (Last 3 Months)</h3>
            <div className="h-80 flex flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="white"
                    // angle={-45}
                    // textAnchor="end"
                    height={5}
                  />
                  <YAxis 
                    stroke="white" 
                    tickFormatter={(value) => `${value}`} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} bookings`, 
                      `${props.payload.sport}`
                    ]}
                    labelFormatter={(value) => `Month: ${value}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Bar dataKey="value" name="Bookings">
                    {trendChartData.length > 0 && trendChartData.map((entry, index) => {
                      const sportColors: Record<string, string> = {
                        'Futsal': '#3b82f6',
                        'Badminton': '#10b981',
                        'Basketball': '#f59e0b',
                        'Mini Soccer': '#ef4444',
                        'Unknown': '#6b7280'
                      };
                      const color = sportColors[entry.sport] || '#8b5cf6';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend di bawah chart */}
              <div className="mt-2 flex flex-wrap gap-4 justify-center">
                {(() => {
                  // Only show legend if there's data
                  if (trendChartData.length > 0) {
                    const uniqueSports = [...new Set(trendChartData.map(item => item.sport))];
                    const sportColors: Record<string, string> = {
                      'Futsal': '#3b82f6',
                      'Badminton': '#10b981',
                      'Basketball': '#f59e0b',
                      'Mini Soccer': '#ef4444',
                      'Unknown': '#6b7280'
                    };

                    return uniqueSports.map((sport, index) => (
                      <div key={index} className="flex items-center">
                        <div
                          className="w-4 h-4 rounded mr-2"
                          style={{ backgroundColor: sportColors[sport] || '#8b5cf6' }}
                        ></div>
                        <span className="text-white text-sm">{sport}</span>
                      </div>
                    ));
                  } else {
                    // If no data, still return an empty fragment
                    return null;
                  }
                })()}
              </div>
            </div>

          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">Revenue by Sport</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBySportData} margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="name" stroke="white" />
                  <YAxis 
                    stroke="white" 
                    tickFormatter={(value) => `Rp${value.toLocaleString('id-ID')}`} 
                  />
                  <Tooltip 
                    formatter={(value) => [`Rp${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill={['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'][0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pending Payments Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">Pending Payments</h3>
            <p className="text-white/80">Bookings that have been made but not fully paid</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-white font-semibold">Field</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Date</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Time Slot</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-white/10 hover:bg-white/10 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{booking.field_name}</td>
                    <td className="py-3 px-4 text-white">{booking.customer_name}</td>
                    <td className="py-3 px-4 text-white">{new Date(booking.booking_date).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 px-4 text-white">{booking.time_slots.join(', ')}</td>
                    <td className="py-3 px-4 text-white">Rp {booking.total_price.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4">
                      <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm capitalize">
                        {booking.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {pendingBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-center text-white/60">
                      No pending payments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">Recent Transactions</h3>
            <p className="text-white/80">All booking transactions with status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-white font-semibold">ID</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Field</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Date</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 text-white font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-white/10 hover:bg-white/10 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">#{booking.id}</td>
                    <td className="py-3 px-4 text-white font-medium">{booking.field_name}</td>
                    <td className="py-3 px-4 text-white">{booking.customer_name}</td>
                    <td className="py-3 px-4 text-white">{new Date(booking.booking_date).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 px-4 text-white">Rp {booking.total_price.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                        booking.booking_status === 'confirmed' || booking.booking_status === 'completed' 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : booking.booking_status === 'pending' 
                            ? 'bg-yellow-500/20 text-yellow-300' 
                            : 'bg-red-500/20 text-red-300'
                      }`}>
                        {booking.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-center text-white/60">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;