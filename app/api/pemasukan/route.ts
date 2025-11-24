import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, booking_ids, items, amount, user_name } = body;

    if (!amount) {
        return NextResponse.json({ error: 'Missing amount' }, { status: 400 });
    }

    // Normalize booking IDs
    let allBookingIds: number[] = [];
    if (booking_ids && Array.isArray(booking_ids)) {
        allBookingIds = booking_ids;
    } else if (booking_id) {
        allBookingIds = [booking_id];
    }

    // 1. Validate Bookings (Optional but good)
    if (allBookingIds.length > 0) {
        const { error: bookingError } = await supabase
            .from('bookings')
            .select('id')
            .in('id', allBookingIds);
        
        if (bookingError) {
            return NextResponse.json({ error: 'Error validating bookings' }, { status: 500 });
        }
    }

    // 2. Generate Invoice Number
    // Format: INV/[MonthlySequence]/[MMYYYY]
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const mmyyyy = `${month}${year}`;

    // Get count for this month to generate sequence
    const startOfMonth = new Date(year, now.getMonth(), 1).toISOString();
    // end of month
    const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const { count, error: countError } = await supabase
        .from('pemasukan')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);
    
    if (countError) throw countError;

    const sequence = String((count || 0) + 1).padStart(3, '0');
    const invoiceNumber = `INV/${sequence}/${mmyyyy}`;

    // 3. Insert Pemasukan
    // Use the first booking ID as reference if multiple, or null.
    const primaryBookingId = allBookingIds.length > 0 ? allBookingIds[0] : null;

    const { data: payment, error: paymentError } = await supabase
        .from('pemasukan')
        .insert([
            {
                nomor_invoice: invoiceNumber,
                id_booking: primaryBookingId, 
                amount: Number(amount),
                created_by: user_name || 'System',
                updated_by: user_name || 'System'
            }
        ])
        .select()
        .single();

    if (paymentError) throw paymentError;

    // 4. Update Booking Status (for all linked bookings)
    if (allBookingIds.length > 0) {
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ 
                payment_status: 'paid',
                booking_status: 'confirmed',
                updated_at: new Date().toISOString()
            })
            .in('id', allBookingIds);

        if (updateError) throw updateError;
    }

    // 5. Process Items (Stock Deduction)
    if (items && Array.isArray(items)) {
        for (const item of items) {
            if (item.type === 'barang') {
                // Fetch current stock
                const { data: currentItem } = await supabase
                    .from('barang')
                    .select('stok')
                    .eq('id', item.id)
                    .single();
                
                if (currentItem) {
                    const newStock = Math.max(0, currentItem.stok - item.quantity);
                    await supabase
                        .from('barang')
                        .update({ stok: newStock })
                        .eq('id', item.id);
                }
            }
        }
    }

    return NextResponse.json({ success: true, payment });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
