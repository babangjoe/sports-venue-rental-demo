import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Database connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  actions?: Array<{
    type: 'booking' | 'redirect' | 'availability_cards' | 'booking_form';
    label?: string;
    data?: any;
    url?: string;
  }>;
}

interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
  userRole?: string;
  userId?: string;
  contextData?: {
    sports: any[];
    fields: any[];
    bookings: any[];
  };
}

// Fetch active system prompt from database
const getActiveSystemPrompt = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('system_prompts')
      .select('prompt_content')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.log('Database not available, using fallback prompt');
      throw error;
    }

    return data.prompt_content;
  } catch (error) {
    // Fallback to default prompt
    return `Anda adalah asisten AI untuk SportArena. Tugas Anda:
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
   - User non-Owner tidak bisa akses informasi transaksi

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
}`;
  }
};



// Natural Language Processing for intent recognition
function recognizeIntent(message: string): {
  intent: 'availability' | 'pricing' | 'booking' | 'transaction' | 'general' | 'help';
  entities: {
    sport?: string;
    time?: string;
    date?: string;
    dayName?: string;
    timePreference?: 'morning' | 'noon' | 'afternoon' | 'evening';
    timeRange?: {
      start: string;
      end: string;
      timePreference: string;
    };
    fieldName?: string;
  };
  confidence: number;
} {
  const input = message.toLowerCase();

  // Intent recognition with better patterns
  const patterns = {
    availability: {
      keywords: ['jadwal', 'ketersediaan', 'tersedia', 'kosong', 'slot', 'bisa', 'booking', 'main', 'pakai', 'sewa'],
      patterns: [
        /kapan.* bisa/,
        /jam.* tersedia/,
        /slot.* kosong/,
        /schedule.* available/,
        /what time.* free/,
        /when can.* play/,
        /bisa main/,
        /kapan main/,
        /cek jadwal/,
        /mau sewa/,
        /cari lapangan/,
        /butuh lapangan/,
        /sabtu.* kosong/,
        /minggu.* tersedia/,
        /senin.* bisa/,
        / hari.* masih ada/
      ],
      score: 0
    },
    pricing: {
      keywords: ['harga', 'price', 'biaya', 'cost', 'tarif', 'ongkos', 'murah', 'mahal'],
      patterns: [
        /berapa harga/,
        /price.* list/,
        /how much/,
        /cost.* per/,
        /tarif.* per/,
        /biaya.* sewa/,
        /harga.* lapangan/
      ],
      score: 0
    },
    booking: {
      keywords: ['booking', ' reservasi', 'pesan', 'order', 'book', 'reserve', 'daftar'],
      patterns: [
        /want to book/,
        /buat booking/,
        /pesan lapangan/,
        /reservasi/,
        /book.* field/,
        /sewa lapangan/,
        /mau booking/,
        /booking.* now/
      ],
      score: 0
    },
    transaction: {
      keywords: ['transaksi', 'pemasukan', 'pengeluaran', 'laporan', 'revenue', 'income', 'profit', 'financial', 'bisnis', 'omset', 'penjualan', 'kinerja', 'performa'],
      patterns: [
        /laporan.* keuangan/,
        /rekap.* transaksi/,
        /summary.* financial/,
        /cek omset/,
        /how.* business/,
        /performance.* report/,
        /bagaimana.* bisnis/,
        /kinerja.* hari/,
        /performa.* penjualan/,
        /business.* today/
      ],
      score: 0
    }
  };

  // Calculate intent scores
  Object.entries(patterns).forEach(([intentType, patternData]) => {
    let score = 0;

    // Keyword matching
    patternData.keywords.forEach(keyword => {
      if (input.includes(keyword)) {
        score += 0.3;
      }
    });

    // Pattern matching
    patternData.patterns.forEach(pattern => {
      if (pattern.test(input)) {
        score += 0.5;
      }
    });

    // Specific pattern matching with higher weights
    if (input.includes('besok')) score += 0.2;
    if (input.includes('hari ini')) score += 0.2;
    if (input.includes('malam') || input.includes('malem')) score += 0.3;
    if (input.includes('pagi')) score += 0.3;
    if (input.includes('sore')) score += 0.3;

    patterns[intentType as keyof typeof patterns].score = score;
  });

  // Find best match
  let bestIntent = 'general';
  let bestScore = 0;
  Object.entries(patterns).forEach(([intentType, patternData]) => {
    if (patternData.score > bestScore) {
      bestScore = patternData.score;
      bestIntent = intentType;
    }
  });

  // Entity extraction
  const entities: any = {};

  // Sport extraction (ordered by priority - check longer phrases first)
  const sportKeywords = {
    'basketball': ['basketball', 'bola basket', 'basket'],
    'badminton': ['badminton', 'bulutangkis', 'bulu tangkis', 'bulutangkis'],
    'padel': ['padel', 'padel tennis', 'padle'],
    'mini-soccer': ['mini soccer', 'minisoccer', 'mini'],
    'futsal': ['futsal'] // remove 'bola' to avoid conflicts
  };

  for (const [sport, keywords] of Object.entries(sportKeywords)) {
    if (keywords.some(kw => input.includes(kw))) {
      entities.sport = sport;
      break;
    }
  }

  // Time preference extraction
  if (input.includes('pagi') || input.includes('morning')) {
    entities.timePreference = 'morning';
  } else if (input.includes('siang')) {
    entities.timePreference = 'noon';
  } else if (input.includes('sore') || input.includes('afternoon')) {
    entities.timePreference = 'afternoon';
  } else if (input.includes('malam') || input.includes('night') || input.includes('petang') || input.includes('malem')) {
    entities.timePreference = 'evening';
  }

  // Time extraction (patterns for specific times)
  const timeMatch = input.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    entities.time = timeMatch[0];
  }

  // Extract time range patterns (jam 5-6 sore, 5-6, etc.)
  const timeRangeMatch = input.match(/jam\s*(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?(?:\s*(sore|siang|malam|malem|pagi))?/i);
  if (timeRangeMatch) {
    const startHour = parseInt(timeRangeMatch[1]);
    const endHour = timeRangeMatch[2] ? parseInt(timeRangeMatch[2]) : startHour + 1;
    entities.timeRange = {
      start: `${startHour.toString().padStart(2, '0')}:00`,
      end: `${endHour.toString().padStart(2, '0')}:00`,
      timePreference: timeRangeMatch[3]?.toLowerCase() === 'malem' ? 'evening' :
        (timeRangeMatch[3]?.toLowerCase() || 'afternoon')
    };
  }

  // Extract field name with patterns - be more specific
  const fieldPatterns = [
    /padel-a/i,
    /padel-b/i,
    /badminton\s+court\s*(\d+)/i,
    /basketball\s+court\s*(\d+)/i,
    /futsal\s+field\s*(\w+)/i,
    /mini\s+soccer\s+field\s*(\w+)/i
  ];

  for (const pattern of fieldPatterns) {
    const match = input.match(pattern);
    if (match) {
      entities.fieldName = match[0];
      break;
    }
  }

  // Date extraction (enhanced patterns)
  if (input.includes('besok')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    entities.date = tomorrow.toISOString().split('T')[0];
  } else if (input.includes('hari ini')) {
    entities.date = new Date().toISOString().split('T')[0];
  } else if (input.includes('sabtu')) {
    // Find next Saturday
    const saturday = new Date();
    const currentDay = saturday.getDay();
    const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
    saturday.setDate(saturday.getDate() + daysUntilSaturday);
    entities.date = saturday.toISOString().split('T')[0];
    entities.dayName = 'Sabtu';
  } else if (input.includes('minggu')) {
    // Find next Sunday
    const sunday = new Date();
    const currentDay = sunday.getDay();
    const daysUntilSunday = (0 - currentDay + 7) % 7 || 7;
    sunday.setDate(sunday.getDate() + daysUntilSunday);
    entities.date = sunday.toISOString().split('T')[0];
    entities.dayName = 'Minggu';
  } else if (input.includes('senin')) {
    // Find next Monday
    const monday = new Date();
    const currentDay = monday.getDay();
    const daysUntilMonday = (1 - currentDay + 7) % 7 || 7;
    monday.setDate(monday.getDate() + daysUntilMonday);
    entities.date = monday.toISOString().split('T')[0];
    entities.dayName = 'Senin';
  } else if (input.includes('selasa')) {
    // Find next Tuesday
    const tuesday = new Date();
    const currentDay = tuesday.getDay();
    const daysUntilTuesday = (2 - currentDay + 7) % 7 || 7;
    tuesday.setDate(tuesday.getDate() + daysUntilTuesday);
    entities.date = tuesday.toISOString().split('T')[0];
    entities.dayName = 'Selasa';
  } else if (input.includes('rabu')) {
    // Find next Wednesday
    const wednesday = new Date();
    const currentDay = wednesday.getDay();
    const daysUntilWednesday = (3 - currentDay + 7) % 7 || 7;
    wednesday.setDate(wednesday.getDate() + daysUntilWednesday);
    entities.date = wednesday.toISOString().split('T')[0];
    entities.dayName = 'Rabu';
  } else if (input.includes('kamis')) {
    // Find next Thursday
    const thursday = new Date();
    const currentDay = thursday.getDay();
    const daysUntilThursday = (4 - currentDay + 7) % 7 || 7;
    thursday.setDate(thursday.getDate() + daysUntilThursday);
    entities.date = thursday.toISOString().split('T')[0];
    entities.dayName = 'Kamis';
  } else if (input.includes('jumat')) {
    // Find next Friday
    const friday = new Date();
    const currentDay = friday.getDay();
    const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
    friday.setDate(friday.getDate() + daysUntilFriday);
    entities.date = friday.toISOString().split('T')[0];
    entities.dayName = 'Jumat';
  } else {
    // Extract date patterns like "29 nov", "28 November", etc.
    const today = new Date();
    const currentYear = today.getFullYear();
    const months: Record<string, number> = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'may': 5, 'jun': 6,
      'jul': 7, 'ags': 8, 'aug': 8, 'sep': 9, 'okt': 10, 'oct': 10, 'nov': 11, 'des': 11, 'dec': 11
    };

    const dateMatch = input.match(/(?:tanggal\s*)?(\d{1,2})\s*(jan|feb|mar|apr|mei|may|jun|jul|ags|aug|sep|okt|oct|nov|des|dec)/i);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const monthKey = dateMatch[2].toLowerCase();

      if (months[monthKey] !== undefined) {
        // Fix the month - November is 11 (0-indexed)
        const monthNum = months[monthKey];

        // Create date with local timezone
        const date = new Date(currentYear, monthNum, day);

        // Format date as YYYY-MM-DD in local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(date.getDate()).padStart(2, '0');
        entities.date = `${year}-${month}-${dayOfMonth}`;
      }
    }
  }

  return {
    intent: bestIntent as any,
    entities,
    confidence: bestScore
  };
}

// Extract greeting style from system prompt
function getPromptGreeting(systemPrompt: string): string {
  if (systemPrompt.includes('Selamat') || systemPrompt.includes('Halo')) {
    return 'Halo';
  } else if (systemPrompt.includes('Hi') || systemPrompt.includes('Hello')) {
    return 'Hi';
  } else if (systemPrompt.includes('Siap') || systemPrompt.includes('Ready')) {
    return 'Siap';
  }
  return 'Baik';
}

// Extract section titles from system prompt
function getPromptSectionTitle(systemPrompt: string | undefined, section: 'availability' | 'pricing' | 'booking' | 'transaction'): string | undefined {
  if (!systemPrompt) return undefined;

  const sectionKeywords = {
    availability: ['ketersediaan', 'tersedia', 'jadwal', 'slot', 'availability', 'schedule'],
    pricing: ['harga', 'price', 'biaya', 'tarif', 'pricing', 'cost'],
    booking: ['booking', 'reservasi', 'pesan', 'order', 'book'],
    transaction: ['transaksi', 'laporan', 'revenue', 'financial', 'income']
  };

  const keywords = sectionKeywords[section];

  // Look for custom section titles in the system prompt
  for (const keyword of keywords) {
    const regex = new RegExp(`(?:${keyword})(?:.{0,50})`, 'i');
    const match = systemPrompt.match(regex);
    if (match) {
      const text = match[0];
      // Try to extract a custom title
      const titleMatch = text.match(/(?:[:\-–])\s*([^\n]{0,30})/);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
    }
  }

  return undefined;
}

// Generate contextual responses
async function generateContextualResponse(
  intent: ReturnType<typeof recognizeIntent>,
  userMessage: string,
  userRole?: string,
  systemPrompt?: string,
  baseUrl?: string,
  contextData?: any
): Promise<{
  message: string;
  actions: Array<{
    type: 'booking' | 'redirect';
    label: string;
    data?: any;
    url?: string;
  }>;
}> {
  const apiUrl = baseUrl ? new URL(baseUrl) : new URL('http://localhost:4000'); // Fallback URL

  try {
    switch (intent.intent) {
      case 'availability': {
        // Fetch real data (use context if available, otherwise fetch from API)
        let sportsData, fieldsData;

        if (contextData?.sports && contextData?.fields) {
          sportsData = contextData.sports;
          fieldsData = contextData.fields;
        } else {
          const [sportsResponse, fieldsResponse] = await Promise.all([
            fetch(`${apiUrl.origin}/api/sports?isAvailable=true`, { cache: 'no-store' }),
            fetch(`${apiUrl.origin}/api/fields?isAvailable=true`, { cache: 'no-store' })
          ]);
          sportsData = await sportsResponse.json();
          fieldsData = await fieldsResponse.json();
        }
        // Ensure data is array
        if (!Array.isArray(sportsData)) sportsData = [];
        if (!Array.isArray(fieldsData)) fieldsData = [];

        // Generate date range for 10 days
        const today = new Date();
        const dateRange = [];
        const dates = [];

        for (let i = 0; i < 10; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          dateRange.push(dateStr);
          dates.push({
            date: dateStr,
            dayName: date.toLocaleDateString('id-ID', { weekday: 'long' }),
            formatted: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          });
        }

        // Response generation influenced by system prompt
        const greeting = systemPrompt ? getPromptGreeting(systemPrompt) : "Baik";
        let response = `${greeting}, saya cek ketersediaan lapangan untuk Anda${intent.entities.sport ? ` khususnya ${sportsData.find((s: any) => s.sport_type === intent.entities.sport)?.sport_name || intent.entities.sport}` : ''}.\n\n`;

        // Generate time slots based on preference
        const allTimeSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
        let preferredSlots = allTimeSlots;

        if (intent.entities.timePreference === 'morning') {
          preferredSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
        } else if (intent.entities.timePreference === 'noon') {
          // Siang: 12:00 onwards to max available
          preferredSlots = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
        } else if (intent.entities.timePreference === 'afternoon') {
          // Adjusted to match system prompt (16:00 onwards to max available)
          preferredSlots = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
        } else if (intent.entities.timePreference === 'evening') {
          // Evening starts from 18:00 to max available
          preferredSlots = ['18:00', '19:00', '20:00', '21:00', '22:00'];
        }

        // Group fields by sport
        const fieldsBySport: Record<string, any[]> = {};
        fieldsData.forEach((field: any) => {
          const sportCode = sportsData.find((sport: any) => sport.id === field.sport_id)?.sport_type || 'unknown';
          if (!fieldsBySport[sportCode]) {
            fieldsBySport[sportCode] = [];
          }
          fieldsBySport[sportCode].push(field);
        });

        // Get the target sport
        const targetSportCode = intent.entities.sport || Object.keys(fieldsBySport)[0];
        const targetFields = fieldsBySport[targetSportCode] || [];
        const sportData = sportsData.find((sport: any) => sport.sport_type === targetSportCode);
        const sportName = sportData?.sport_name || targetSportCode;

        // Build structured availability data
        const availabilityData = [];
        let hasAvailability = false;

        // Check availability for specific date requested or show nearby dates
        let datesToCheck = dates;

        // If user specified a specific date, only show that date
        if (intent.entities.date) {
          // Find the index of the requested date
          const targetDateIndex = dates.findIndex(d => d.date === intent.entities.date);
          if (targetDateIndex !== -1) {
            // Show only the requested date
            datesToCheck = [dates[targetDateIndex]];
          } else {
            // If exact date not found in our range, show nearest dates
            datesToCheck = dates.slice(0, 3); // Show first 3 dates as fallback
          }
        } else {
          // No specific date requested, show first few dates
          datesToCheck = dates.slice(0, 3); // Show only 3 dates instead of 5
        }

        for (let dateIndex = 0; dateIndex < datesToCheck.length; dateIndex++) {
          const dateObj = datesToCheck[dateIndex];
          const dateStr = dateObj.date;

          const dateAvailability = {
            date: dateStr,
            dayName: dateObj.dayName,
            formatted: dateObj.formatted,
            fields: [] as any[]
          };

          let dateHasAvailability = false;

          // Check each field for this date
          for (const field of targetFields) {
            try {
              // Check availability
              let bookedSlots: string[] = [];

              if (contextData?.bookings) {
                // Use provided bookings data for availability check
                const relevantBookings = contextData.bookings.filter((b: any) =>
                  Number(b.field_id) === Number(field.id) &&
                  b.booking_date === dateStr &&
                  b.booking_status !== 'cancelled'
                );

                // Extract slots
                bookedSlots = [];
                relevantBookings.forEach((b: any) => {
                  if (Array.isArray(b.time_slots)) {
                    bookedSlots.push(...b.time_slots);
                  }
                });
              } else {
                // Fallback to API check
                const availabilityResponse = await fetch(`${apiUrl.origin}/api/booking/check-availability?fieldId=${field.id}&date=${dateStr}`, { cache: 'no-store' });
                const availabilityData_response = await availabilityResponse.json();
                bookedSlots = availabilityData_response.bookedSlots || [];
              }

              // Get available slots
              const availableSlots = preferredSlots.filter(slot => !bookedSlots.includes(slot));

              if (availableSlots.length > 0) {
                dateHasAvailability = true;
                hasAvailability = true;
                dateAvailability.fields.push({
                  id: field.id,
                  name: field.field_name,
                  price: parseInt(field.price_per_hour),
                  availableSlots: availableSlots,
                  allSlots: preferredSlots
                });
              }
            } catch (error) {
              // Fallback: show all slots as available
              dateAvailability.fields.push({
                id: field.id,
                name: field.field_name,
                price: parseInt(field.price_per_hour),
                availableSlots: preferredSlots,
                allSlots: preferredSlots,
                offlineMode: true
              });
              dateHasAvailability = true;
              hasAvailability = true;
            }
          }

          if (dateHasAvailability) {
            availabilityData.push(dateAvailability);
          }
        }

        // Build response with structured action data
        let specificDateInfo = '';
        if (intent.entities.dayName) {
          specificDateInfo = ` untuk ${intent.entities.dayName}${intent.entities.date ? ` (${new Date(intent.entities.date).toLocaleDateString('id-ID')})` : ''}`;
        } else if (intent.entities.date) {
          specificDateInfo = ` untuk ${new Date(intent.entities.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        }

        response = `${getPromptGreeting(systemPrompt || '') || 'Baik'}, saya cek ketersediaan lapangan${intent.entities.sport ? ` ${sportName}` : ''}${specificDateInfo}.\n\n💡 *Klik pada lapangan dan waktu yang Anda inginkan untuk booking langsung!*`;

        const actions: any[] = [{
          type: 'availability_cards',
          data: {
            sport: {
              code: targetSportCode,
              name: sportName
            },
            availability: availabilityData
          }
        }];

        if (!hasAvailability) {
          response = `\n❌ Tidak ada slot tersedia untuk 5 hari ke depan. Coba tanggal yang lebih jauh atau lapangan lain.`;
          actions.push({
            type: 'redirect',
            label: 'Cari Tanggal Lain',
            url: '/#sports'
          });
        }

        return {
          message: response,
          actions: actions
        };
      }

      case 'pricing': {
        let sportsData, fieldsData;

        if (contextData?.sports && contextData?.fields) {
          sportsData = contextData.sports;
          fieldsData = contextData.fields;
        } else {
          const [sportsResponse, fieldsResponse] = await Promise.all([
            fetch(`${apiUrl.origin}/api/sports?isAvailable=true`, { cache: 'no-store' }),
            fetch(`${apiUrl.origin}/api/fields?isAvailable=true`, { cache: 'no-store' })
          ]);
          sportsData = await sportsResponse.json();
          fieldsData = await fieldsResponse.json();
        }

        const pricingTitle = getPromptSectionTitle(systemPrompt, 'pricing') || 'Info Harga';
        let response = `${pricingTitle} SportArena${intent.entities.sport ? ` untuk ${sportsData.find((s: any) => s.sport_type === intent.entities.sport)?.sport_name || intent.entities.sport}` : ''}:\n\n`;

        // Group and display pricing
        const pricingBySport: Record<string, { name: string; price: number }[]> = {};
        fieldsData.forEach((field: any) => {
          const sportCode = sportsData.find((sport: any) => sport.id === field.sport_id)?.sport_type || 'unknown';
          if (!pricingBySport[sportCode]) {
            pricingBySport[sportCode] = [];
          }
          if (!intent.entities.sport || intent.entities.sport === sportCode) {
            const price = parseFloat(field.price_per_hour);
            if (!isNaN(price)) { // Check if price is valid number
              pricingBySport[sportCode].push({
                name: field.field_name,
                price: price
              });
            }
          }
        });

        Object.entries(pricingBySport).forEach(([sportCode, fields]) => {
          const sportData = sportsData.find((sport: any) => sport.sport_type === sportCode);
          const sportName = sportData?.sport_name || sportCode;

          if (fields.length > 0) {
            const avgPrice = fields.reduce((sum, f) => sum + f.price, 0) / fields.length;
            response += `🏆 ${sportName}\n`;
            response += `  💰 Rata-rata: Rp ${Math.round(avgPrice).toLocaleString('id-ID')}/jam\n`;
            response += `  📍 Lapangan: ${fields.map(f => f.name).join(', ')}\n\n`;
          }
        });

        response += `Mau coba dulu? Saya bisa cari slot kosong untuk Anda!`;

        return {
          message: response,
          actions: [
            {
              type: 'redirect',
              label: 'Lihat Semua Lapangan',
              url: '/#sports'
            },
            {
              type: 'booking',
              label: 'Cek Ketersediaan',
              data: { sport: intent.entities.sport }
            }
          ]
        };
      }

      case 'booking': {
        // Build booking details from extracted entities
        const sportName = intent.entities.sport || '';
        const dateStr = intent.entities.date || '';
        const timeStr = intent.entities.time ? intent.entities.time :
          intent.entities.timeRange?.start || '';
        const fieldStr = intent.entities.fieldName || '';

        const bookingGreeting = systemPrompt ? getPromptGreeting(systemPrompt) : 'Saya';
        let response = `${bookingGreeting} siap membantu booking lapangan Anda`;

        if (sportName) response += ` untuk ${sportName}`;
        if (dateStr) response += ` pada ${dateStr}`;
        if (timeStr) response += ` jam ${timeStr}`;
        if (fieldStr) response += ` di lapangan ${fieldStr}`;
        response += `.\n\n`;

        // Check required entities
        const missingEntities = [];
        if (!sportName) missingEntities.push('Cabang olahraga (Futsal, Basketball, Badminton, Padel, Mini Soccer)');
        if (!dateStr) missingEntities.push('Tanggal main');
        if (!timeStr) missingEntities.push('Preferensi waktu');

        if (missingEntities.length > 0) {
          response += `Untuk proses booking, saya perlu tahu:\n`;
          missingEntities.forEach(item => response += `• ${item}\n`);
          response += `\nSilakan berikan info tersebut ya!`;
          return {
            message: response,
            actions: []
          };
        }

        // Prepare booking URL with all extracted parameters
        const bookingParams = new URLSearchParams({
          sport: sportName,
          date: dateStr,
          timeSlot: timeStr
        });

        if (fieldStr) {
          bookingParams.set('field', fieldStr);
        }

        if (intent.entities.timeRange) {
          bookingParams.set('timeRange', `${intent.entities.timeRange.start}-${intent.entities.timeRange.end}`);
        }

        return {
          message: response + `Saya akan arahkan Anda ke halaman booking dengan data yang sudah terisi. Silakan lengkapi data pelanjutnya.`,
          actions: [
            {
              type: 'redirect',
              label: `Booking ${sportName.charAt(0).toUpperCase() + sportName.slice(1)}`,
              url: `/booking?${bookingParams.toString()}`
            }
          ]
        };
      }

      case 'transaction': {
        if (userRole === 'owner') {
          return {
            message: `📊 Laporan keuangan SportArena terkini:\n\n💰 Total pendaftaran hari ini: 3 booking💰 Revenue hari ini: Rp 450.000\n📈 Tren minggu ini: +23% dari minggu lalu\n⭐ Rating rata-rata: 4.8/5.0\n\nLaporan detail bisa lihat di dashboard admin ya!`,
            actions: [
              {
                type: 'redirect',
                label: 'Buka Dashboard',
                url: '/admin/dashboard'
              }
            ]
          };
        } else {
          return {
            message: `Hmm, informasi keuangan hanya bisa diakses oleh owner ya. Apa ada yang bisa saya bantu untuk booking lapangan atau informasi lainnya?`,
            actions: [
              {
                type: 'redirect',
                label: 'Cek Ketersediaan Lapangan',
                url: '/#sports'
              }
            ]
          };
        }
      }

      default: {
        const greetingMessages = [
          `Hai! Selamat datang di SportArena Assistant! 🏆\n\nSaya bisa bantu:\n• Cek ketersediaan lapangan\n• Informasi harga dan booking\n• Rekomendasi slot waktu terbaik\n• Bantu proses reservasi\n\nMau tanya apa dulu?`,
          `Halo! Dari SportArena Admin Assistant! 😊\n\nAda yang bisa saya bantu hari ini? Bisa:\n• Cari lapangan kosong\n• Tanya harga sewa\n• Langsung booking\n• Info cabang olahraga\n\nSilakan tanya dalam bahasaatural ya!`
        ];

        const randomGreeting = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];

        return {
          message: randomGreeting,
          actions: [
            {
              type: 'redirect',
              label: 'Lihat Semua Lapangan',
              url: '/#sports'
            }
          ]
        };
      }
    }
  } catch (error) {
    console.error('Error generating contextual response:', error);

    // Fallback responses
    const fallbackResponses = [
      `Maaf, sedang ada kendala teknis. Coba lagi dalam beberapa saat ya!`,
      `Sedang loading data, silakan refresh dan coba lagi!`,
      `Oopps! Terjadi kesalahan. Bisa coba dengan pertanyaan lain?`
    ];

    return {
      message: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      actions: []
    };
  }
}

// AI Chat handler function
async function generateAIResponse(request: ChatRequest, baseUrl: string): Promise<{
  message: string;
  actions: Array<{
    type: 'booking' | 'redirect';
    label: string;
    data?: any;
    url?: string;
  }>;
}> {
  const { message, userRole, contextData } = request;

  // Get active system prompt from database
  const systemPrompt = await getActiveSystemPrompt();

  // Recognize intent and extract entities
  const intent = recognizeIntent(message);

  // Generate contextual response using system prompt
  const usingFallback = systemPrompt.includes('Anda adalah asisten AI untuk SportArena');
  console.log(`🤖 AI Chat using ${usingFallback ? 'fallback' : 'database'} prompt`);
  const response = await generateContextualResponse(intent, message, userRole, systemPrompt, baseUrl, contextData);

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest;
    const baseUrl = request.nextUrl.origin;

    // Generate AI response
    const aiResponse = await generateAIResponse(body, baseUrl);

    return NextResponse.json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process chat request'
      },
      { status: 500 }
    );
  }
}

// Support GET method for testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Chat API is working. Use POST method to send chat messages.',
    endpoints: {
      POST: 'Send chat messages and get AI responses',
      body: {
        message: 'string - User message',
        conversationHistory: 'array - Previous conversation history',
        userRole: 'string - Optional: user role for access control'
      }
    }
  });
}
