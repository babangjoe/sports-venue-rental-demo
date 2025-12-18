import { NextRequest } from 'next/server';
import {
  getBookings,
  createBooking,
} from '@/lib/demoStore';

/**
 * DEMO MODE: Booking API
 * 
 * - GET: Reads from localStorage
 * - POST: Writes to localStorage ONLY (no Supabase mutation)
 */

export const dynamic = 'force-dynamic';

// GET: Fetch bookings (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters for filtering
    const fieldId = searchParams.get('fieldId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    // DEMO MODE: Read from localStorage
    const bookings = getBookings({
      fieldId: fieldId ? parseInt(fieldId) : undefined,
      date: date || undefined,
      status: status || undefined,
    });

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

    // Validate field_id is a number
    const fieldIdInt = typeof field_id === 'string' ? parseInt(field_id) : field_id;

    if (isNaN(fieldIdInt)) {
      return new Response(
        JSON.stringify({ error: 'Invalid field_id. Must be a number.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DEMO MODE: Check for existing bookings in localStorage
    const existingBookings = getBookings({
      fieldId: fieldIdInt,
      date: booking_date,
    }).filter(b => b.booking_status !== 'cancelled');

    // Check for time slot conflicts
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

    // DEMO MODE: Create booking in localStorage only
    const newBooking = createBooking({
      field_id: fieldIdInt,
      field_name,
      booking_date,
      time_slots,
      total_price,
      customer_name: customer_name || null,
      customer_phone: customer_phone || null,
      customer_email: customer_email || null,
      booking_status: 'pending',
      payment_status: 'pending'
    });

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
