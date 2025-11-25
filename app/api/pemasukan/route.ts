import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const invoice = searchParams.get('invoice');

    let query = supabase
      .from('pemasukan')
      .select(`
        *,
        pemasukan_detail (*),
        bookings (
          *,
          fields (field_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (id) {
      query = query.eq('id', id);
    }
    if (invoice) {
      query = query.eq('nomor_invoice', invoice);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching pemasukan:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    // 1. Validate Bookings
    let bookingDetails: any[] = [];
    if (allBookingIds.length > 0) {
        const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .in('id', allBookingIds);
        
        if (bookingError) {
            return NextResponse.json({ error: 'Error validating bookings' }, { status: 500 });
        }
        bookingDetails = bookings || [];
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

    const pemasukanDetailsToInsert = [];

    // 4. Add Booking Details to Invoice
    for (const booking of bookingDetails) {
        pemasukanDetailsToInsert.push({
            pemasukan_id: payment.id,
            nomor_invoice: payment.nomor_invoice,
            barang_id: null,
            nama_barang: `Sewa Lapangan: ${booking.field_name} (${booking.booking_date})`,
            harga_satuan: booking.total_price,
            qty: 1,
            subtotal: booking.total_price
        });
    }

    // 5. Update Booking Status (for all linked bookings)
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

    // 6. Process Items (Stock Deduction) and Add to Invoice Details
    if (items && Array.isArray(items)) {
        for (const item of items) {
            if (item.type === 'barang') {
                // Fetch current stock and details
                const { data: currentItem } = await supabase
                    .from('barang')
                    .select('id, nama_barang, harga, stok')
                    .eq('id', item.id)
                    .single();
                
                if (currentItem) {
                    const qty = Number(item.quantity) || 1;
                    const newStock = Math.max(0, currentItem.stok - qty);
                    
                    // Update Stock
                    await supabase
                        .from('barang')
                        .update({ stok: newStock })
                        .eq('id', item.id);

                    // Add to invoice details
                    pemasukanDetailsToInsert.push({
                        pemasukan_id: payment.id,
                        nomor_invoice: payment.nomor_invoice,
                        barang_id: currentItem.id,
                        nama_barang: currentItem.nama_barang,
                        harga_satuan: currentItem.harga,
                        qty: qty,
                        subtotal: Number(currentItem.harga) * qty
                    });
                }
            }
        }
    }

    // 7. Insert Pemasukan Details
    if (pemasukanDetailsToInsert.length > 0) {
        const { error: detailsError } = await supabase
            .from('pemasukan_detail')
            .insert(pemasukanDetailsToInsert);
        
        if (detailsError) {
            console.error('Error inserting pemasukan details:', detailsError);
            // Note: We don't rollback the main payment here as Supabase client doesn't support transactions easily
            // in this context without RPC. But ideally this should be atomic.
        }
    }

    return NextResponse.json({ success: true, payment });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
