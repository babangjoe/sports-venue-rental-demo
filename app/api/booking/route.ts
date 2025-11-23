import { NextRequest } from 'next/server';
import { readJSON, writeJSON, getNextId } from '@/lib/json-db';

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

    let bookings = await readJSON('bookings');

    if (fieldId) {
      bookings = bookings.filter((b: any) => b.field_id === parseInt(fieldId));
    }

    if (date) {
      bookings = bookings.filter((b: any) => b.booking_date === date);
    }

    if (status) {
      bookings = bookings.filter((b: any) => b.booking_status === status);
    }

    // Sort by created_at DESC
    bookings.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

    const bookings = await readJSON('bookings');

    // Check for existing bookings for the same field and time slots on the same date
    const existingBookings = bookings.filter((b: any) => 
        b.field_id === field_id && 
        b.booking_date === booking_date && 
        b.booking_status !== 'cancelled'
    );
    
    // Check for time slot conflicts
    for (const booking of existingBookings) {
        // In JSON file, time_slots should be an array, but handle string case just in case
        const existingSlots = Array.isArray(booking.time_slots) ? booking.time_slots : JSON.parse(booking.time_slots || '[]');
        const hasConflict = time_slots.some((slot: string) => existingSlots.includes(slot));
        if (hasConflict) {
            return new Response(
            JSON.stringify({ error: 'Selected time slots are already booked' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    const newId = await getNextId('bookings');
    const timestamp = new Date().toISOString();

    const newBooking = {
      id: newId,
      field_id,
      field_name,
      booking_date,
      time_slots: time_slots, // Store as array
      total_price,
      customer_name: customer_name || null,
      customer_phone: customer_phone || null,
      customer_email: customer_email || null,
      booking_status: 'pending', // Default status
      payment_status: 'pending', // Default status
      created_at: timestamp,
      updated_at: timestamp
    };

    bookings.push(newBooking);
    await writeJSON('bookings', bookings);

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
