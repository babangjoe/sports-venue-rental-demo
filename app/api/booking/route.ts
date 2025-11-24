import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';

// GET: Fetch bookings (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters for filtering
    const fieldId = searchParams.get('fieldId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let query = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (fieldId) {
      query = query.eq('field_id', parseInt(fieldId));
    }

    if (date) {
      query = query.eq('booking_date', date);
    }

    if (status) {
      query = query.eq('booking_status', status);
    }

    const { data: bookings, error } = await query;

    if (error) {
        throw error;
    }

    return new Response(JSON.stringify(bookings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch bookings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST: Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      field_id,
      field_name,
      booking_date,
      time_slots,
      total_price,
      customer_name,
      customer_phone,
      customer_email
    } = body;

    // Validate required fields
    if (!field_id || !field_name || !booking_date || !time_slots || time_slots.length === 0 || total_price === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing bookings for the same field and time slots on the same date
    // IMPORTANT: field_id must be an integer. If passed as string (e.g. "minisoccer-aa"), Supabase will throw 22P02
    const fieldIdInt = typeof field_id === 'string' ? parseInt(field_id) : field_id;

    if (isNaN(fieldIdInt)) {
       return new Response(
        JSON.stringify({ error: 'Invalid field_id. Must be a number.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('field_id', fieldIdInt)
      .eq('booking_date', booking_date)
      .neq('booking_status', 'cancelled');
    
    if (fetchError) throw fetchError;

    // Check for time slot conflicts
    if (existingBookings) {
        for (const booking of existingBookings) {
            const existingSlots = Array.isArray(booking.time_slots) ? booking.time_slots : [];
            const hasConflict = time_slots.some((slot: string) => existingSlots.includes(slot));
            if (hasConflict) {
                return new Response(
                JSON.stringify({ error: 'Selected time slots are already booked' }),
                { status: 409, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }
    }

    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert([{
        field_id: fieldIdInt,
        field_name,
        booking_date,
        time_slots, // Supabase handles array -> jsonb automatically
        total_price,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        customer_email: customer_email || null,
        booking_status: 'pending',
        payment_status: 'pending'
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify(newBooking), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create booking' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
