import { NextRequest, NextResponse } from 'next/server';
import {
    getPemasukan,
    getPemasukanDetail,
    getBookingById,
    getBarangById,
    createPemasukan,
    createPemasukanDetail,
    updateMultipleBookings,
    updateBarangStock,
} from '@/lib/demoStore';

/**
 * DEMO MODE: Pemasukan API
 * 
 * - GET: Reads from localStorage
 * - POST: Writes to localStorage ONLY (no Supabase mutation)
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const invoice = searchParams.get('invoice');

        // DEMO MODE: Read from localStorage
        let pemasukanList = getPemasukan({
            id: id ? parseInt(id) : undefined,
            invoice: invoice || undefined,
        });

        // Enrich with details and bookings
        const result = pemasukanList.map(pemasukan => {
            const details = getPemasukanDetail(pemasukan.id);
            const booking = pemasukan.id_booking ? getBookingById(pemasukan.id_booking) : null;

            return {
                ...pemasukan,
                pemasukan_detail: details,
                bookings: booking ? { ...booking, fields: { field_name: booking.field_name } } : null,
            };
        });

        return NextResponse.json(result);
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

        // 1. Get booking details from localStorage
        let bookingDetails: any[] = [];
        if (allBookingIds.length > 0) {
            bookingDetails = allBookingIds
                .map(id => getBookingById(id))
                .filter(b => b !== null);
        }

        // 2. Create Pemasukan in localStorage
        const primaryBookingId = allBookingIds.length > 0 ? allBookingIds[0] : undefined;

        const payment = createPemasukan({
            id_booking: primaryBookingId,
            amount: Number(amount),
            created_by: user_name || 'System',
            updated_by: user_name || 'System',
        });

        // 3. Add Booking Details to Invoice
        for (const booking of bookingDetails) {
            createPemasukanDetail({
                pemasukan_id: payment.id,
                nomor_invoice: payment.nomor_invoice,
                barang_id: undefined,
                nama_barang: `Sewa Lapangan: ${booking.field_name} (${booking.booking_date})`,
                harga_satuan: booking.total_price,
                qty: 1,
                subtotal: booking.total_price,
            });
        }

        // 4. Update Booking Status (for all linked bookings)
        if (allBookingIds.length > 0) {
            updateMultipleBookings(allBookingIds, {
                payment_status: 'paid',
                booking_status: 'confirmed',
            });
        }

        // 5. Process Items (Stock Deduction) and Add to Invoice Details
        if (items && Array.isArray(items)) {
            for (const item of items) {
                if (item.type === 'barang') {
                    const currentItem = getBarangById(item.id);

                    if (currentItem) {
                        const qty = Number(item.quantity) || 1;
                        const newStock = Math.max(0, currentItem.stok - qty);

                        // Update Stock in localStorage
                        updateBarangStock(item.id, newStock);

                        // Add to invoice details
                        createPemasukanDetail({
                            pemasukan_id: payment.id,
                            nomor_invoice: payment.nomor_invoice,
                            barang_id: currentItem.id,
                            nama_barang: currentItem.nama_barang,
                            harga_satuan: currentItem.harga,
                            qty: qty,
                            subtotal: Number(currentItem.harga) * qty,
                        });
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
