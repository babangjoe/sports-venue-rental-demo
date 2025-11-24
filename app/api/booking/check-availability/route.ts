import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';

// GET: Check available time slots for a specific field and date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const fieldId = searchParams.get('fieldId');
    const date = searchParams.get('date');

    if (!fieldId || !date) {
      return new Response(
        JSON.stringify({ error: 'fieldId and date are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fieldIdInt = parseInt(fieldId);
    if (isNaN(fieldIdInt)) {
       return new Response(
        JSON.stringify({ error: 'Invalid fieldId. Must be a number.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: relevantBookings, error } = await supabase
      .from('bookings')
      .select('time_slots')
      .eq('field_id', fieldIdInt)
      .eq('booking_date', date)
      .neq('booking_status', 'cancelled');

    if (error) throw error;
    
    // Extract all booked time slots from the results
    const bookedSlots: string[] = [];
    if (relevantBookings) {
        relevantBookings.forEach((row: any) => {
          let slots: string[];
          if (Array.isArray(row.time_slots)) {
            // Time slots is already an array
            slots = row.time_slots;
          } else if (typeof row.time_slots === 'string') {
            // Time slots is a JSON string that needs to be parsed
            try {
                slots = JSON.parse(row.time_slots);
            } catch (e) {
                slots = [];
            }
          } else {
            // Handle case where it might be an object
            slots = row.time_slots as string[] || [];
          }
          bookedSlots.push(...slots);
        });
    }

    // Remove duplicates
    const uniqueBookedSlots = Array.from(new Set(bookedSlots));

    return new Response(
      JSON.stringify({ bookedSlots: uniqueBookedSlots }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking availability:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check availability' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
