'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Users,
  Wallet
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  Cell
} from 'recharts';
import { useBookingsDemo, useFieldsDemo, useSportsDemo } from '@/hooks/useDemoData';

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
  const { bookings: demoBookings, loading: loadingBookings } = useBookingsDemo();
  const { fields: demoFields, loading: loadingFields } = useFieldsDemo();
  const { sports: demoSports, loading: loadingSports } = useSportsDemo();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Sync data from hooks
  useEffect(() => {
    if (loadingBookings || loadingFields || loadingSports) {
      // Still loading from demo store
      return;
    }

    try {
      // Map demo data to dashboard types
      const mappedBookings = demoBookings.map(b => ({
        ...b,
        field_id: b.field_id.toString(), // Convert to string
        booking_status: b.booking_status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
        customer_name: b.customer_name || 'Unknown',
        customer_phone: b.customer_phone || '',
        customer_email: b.customer_email || '',
        updated_at: b.updated_at || b.created_at
      }));

      const mappedFields = demoFields.map(f => {
        const sport = demoSports.find(s => s.id === f.sport_id);
        return {
          ...f,
          description: f.description || '',
          is_available: f.is_available === 1,
          sport_name: sport ? sport.sport_name : '',
          sport_type: sport ? sport.sport_type : '',
          created_at: '', // Not strictly needed for dashboard
          updated_at: f.updated_at || ''
        };
      });

      const mappedSports = demoSports.map(s => ({
        ...s,
        description: s.description || '',
        is_available: s.is_available === 1,
        created_at: '',
        updated_at: s.updated_at || ''
      }));

      setBookings(mappedBookings);
      setFields(mappedFields);
      setSports(mappedSports);
      setFilteredBookings(mappedBookings);
      setLoading(false);
    } catch (err) {
      console.error('Error mapping dashboard data:', err);
      setError('Failed to process dashboard data');
      setLoading(false);
    }
  }, [demoBookings, demoFields, demoSports, loadingBookings, loadingFields, loadingSports]);

  // Calculate stats based on all bookings and their status
  const totalIncoming = filteredBookings
    .filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed')
    .reduce((sum, booking) => sum + Number(booking.total_price), 0);

  const totalOutgoing = filteredBookings
    .filter(b => b.booking_status === 'cancelled')
    .reduce((sum, booking) => sum + Number(booking.total_price), 0);

  const pendingBookings = filteredBookings.filter(b => b.booking_status === 'pending');

  const threeMonthsAgoStart = new Date();
  threeMonthsAgoStart.setMonth(threeMonthsAgoStart.getMonth() - 3, 1);
  threeMonthsAgoStart.setHours(0, 0, 0, 0);

  // Filter logic for filteredBookings state
  // This effect updates filteredBookings when filters change
  useEffect(() => {
    if (loading) return;

    let result = [...bookings];

    if (selectedSport !== 'all') {
      const sportFieldIds = fields
        .filter(field => field.sport_id.toString() === selectedSport)
        .map(field => field.id.toString());

      result = result.filter(booking => sportFieldIds.includes(booking.field_id));
    }

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
    }

    setFilteredBookings(result);
  }, [bookings, selectedSport, dateRange, fields, loading]);

  // Calculations for charts based on 'bookings' (source) or 'filteredBookings' (displayed)
  // Logic: Charts usually respect the filters except maybe global filters if specified.
  // The original code applied filters to 'chartBookings' inside render logic (which is bad practice) 
  // or derived it. Let's reuse 'filteredBookings' logic but for charts we might want somewhat different scope?
  // Original code derived 'chartBookings' from 'bookings' inside render loop.
  // We can just use 'filteredBookings' for the charts as it reflects current selection.

  // Confirmed bookings by sport and month
  const confirmedBookingsBySportAndMonth = filteredBookings
    .filter(b => {
      const bookingDate = new Date(b.booking_date);
      const isConfirmed = b.booking_status === 'confirmed' || b.booking_status === 'completed';
      const isWithinThreeMonths = bookingDate >= threeMonthsAgoStart;
      return isConfirmed && isWithinThreeMonths;
    })
    .reduce((acc, booking) => {
      const field = fields.find(f => f.id.toString() === booking.field_id.toString());
      const sport = field ? sports.find(s => s.id === field.sport_id) : null;
      const sportName = sport ? sport.sport_name : 'Unknown';
      const bookingDate = new Date(booking.booking_date);
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

  const trendChartData = topSportEachMonth.sort((a, b) => {
    const [monthA, yearA] = a.name.split(' ');
    const [monthB, yearB] = b.name.split(' ');
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    return dateA.getTime() - dateB.getTime();
  });

  const revenueBySport = filteredBookings
    .filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed')
    .reduce((acc, booking) => {
      const field = fields.find(f => f.id.toString() === booking.field_id.toString());
      if (!field) return acc;

      const sport = sports.find(s => s.id === field.sport_id);
      const sportName = sport ? sport.sport_name : 'Unknown';

      acc[sportName] = (acc[sportName] || 0) + Number(booking.total_price);
      return acc;
    }, {} as Record<string, number>);

  const revenueBySportData = Object.entries(revenueBySport).map(([name, value]) => ({
    name,
    value
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-zinc-400 animate-pulse">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-400 font-medium mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative max-w-[1600px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
              Dashboard
            </h1>
            <p className="text-zinc-400 mt-1">
              Overview of your sports venue performance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px] bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500/20">
                <Calendar className="mr-2 h-4 w-4 text-zinc-400" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="daily">Today</SelectItem>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-[140px] bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500/20">
                <Filter className="mr-2 h-4 w-4 text-zinc-400" />
                <SelectValue placeholder="Sport" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="all">All Sports</SelectItem>
                {sports.map(sport => (
                  <SelectItem key={sport.id} value={sport.id.toString()}>
                    {sport.sport_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl hover:bg-zinc-900/80 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                </div>
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Incoming
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400 font-medium">Total Revenue</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Rp {totalIncoming.toLocaleString('id-ID')}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl hover:bg-zinc-900/80 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                  <Activity className="h-5 w-5 text-rose-500" />
                </div>
                <Badge variant="outline" className="bg-rose-500/5 text-rose-500 border-rose-500/20">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  Cancelled
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400 font-medium">Lost Revenue</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Rp {totalOutgoing.toLocaleString('id-ID')}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl hover:bg-zinc-900/80 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                </div>
                <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/20">
                  {pendingBookings.length} Pending
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400 font-medium">Pending Payments</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Rp {pendingBookings.reduce((sum, booking) => sum + Number(booking.total_price), 0).toLocaleString('id-ID')}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white">Booking Trends</CardTitle>
              <CardDescription className="text-zinc-400">Top performing sports over the last 3 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: '#27272a' }}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      itemStyle={{ color: '#e4e4e7' }}
                      labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {trendChartData.map((entry, index) => {
                        const sportColors: Record<string, string> = {
                          'Futsal': '#3b82f6',
                          'Badminton': '#10b981',
                          'Basketball': '#f59e0b',
                          'Mini Soccer': '#ef4444',
                          'Unknown': '#6b7280'
                        };
                        return <Cell key={`cell-${index}`} fill={sportColors[entry.sport] || '#8b5cf6'} />;
                      })}
                    </Bar>
                    <Legend
                      payload={
                        [...new Set(trendChartData.map(item => item.sport))].map(sport => {
                          const sportColors: Record<string, string> = {
                            'Futsal': '#3b82f6',
                            'Badminton': '#10b981',
                            'Basketball': '#f59e0b',
                            'Mini Soccer': '#ef4444',
                            'Unknown': '#6b7280'
                          };
                          return {
                            id: sport,
                            type: 'square',
                            value: sport,
                            color: sportColors[sport] || '#8b5cf6'
                          };
                        })
                      }
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white">Revenue Share</CardTitle>
              <CardDescription className="text-zinc-400">Distribution by sport type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={revenueBySportData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {revenueBySportData.map((entry, index) => {
                        const sportColors: Record<string, string> = {
                          'Futsal': '#3b82f6',
                          'Badminton': '#10b981',
                          'Basketball': '#f59e0b',
                          'Mini Soccer': '#ef4444',
                          'Unknown': '#6b7280'
                        };
                        return <Cell key={`cell-${index}`} fill={sportColors[entry.name] || '#8b5cf6'} stroke="rgba(0,0,0,0)" />;
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      itemStyle={{ color: '#e4e4e7' }}
                      formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-zinc-900/50 border border-zinc-800/50">
              <TabsTrigger value="transactions" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-white">
                Recent Transactions
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-white relative">
                Pending Payments
                {pendingBookings.length > 0 && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-amber-500 absolute top-2 right-2" />
                )}
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" className="hidden md:flex border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>

          <TabsContent value="transactions" className="mt-0">
            <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">ID</th>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Field</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium text-right">Amount</th>
                      <th className="px-6 py-4 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredBookings.slice(0, 10).map((booking) => (
                      <tr key={booking.id} className="hover:bg-zinc-900/30 transition-colors group">
                        <td className="px-6 py-4 font-medium text-zinc-300">#{booking.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-zinc-200 font-medium">{booking.customer_name}</span>
                            <span className="text-zinc-500 text-xs">{booking.customer_email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">{booking.field_name}</td>
                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(booking.booking_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-zinc-200">
                          Rp {booking.total_price.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge
                            variant="outline"
                            className={`
                              ${booking.booking_status === 'confirmed' || booking.booking_status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : booking.booking_status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}
                              capitalize
                            `}
                          >
                            {booking.booking_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                          No transactions found matching your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Field</th>
                      <th className="px-6 py-4 font-medium">Time Slot</th>
                      <th className="px-6 py-4 font-medium text-right">Amount</th>
                      <th className="px-6 py-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {pendingBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-zinc-200 font-medium">{booking.customer_name}</span>
                            <span className="text-zinc-500 text-xs">{booking.customer_phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">{booking.field_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1 flex-wrap">
                            {booking.time_slots.map(slot => (
                              <Badge key={slot} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                                {slot}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-zinc-200">
                          Rp {booking.total_price.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button size="sm" variant="ghost" className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10">
                            Verify
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {pendingBookings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          No pending payments found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;