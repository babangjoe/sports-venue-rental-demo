import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, whatsapp_number, field_id, field_name, booking_date, time_slots, total_price: totalPrice } = body;

    console.log('AI Chat Booking Request:', { customer_name, whatsapp_number, field_id, field_name, booking_date, time_slots, totalPrice });

    // Validation
    if (!customer_name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama pelanggan wajib diisi!' },
        { status: 400 }
      );
    }

    if (!whatsapp_number.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nomor WhatsApp wajib diisi!' },
        { status: 400 }
      );
    }

    if (!time_slots || time_slots.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pilih minimal 1 jam untuk booking!' },
        { status: 400 }
      );
    }

    // Send booking request to main booking API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_BASE_URL 
      : 'http://localhost:4000';
    
    console.log('Making booking request to:', baseUrl);
    
    // Prepare booking data
    const bookingData = {
      customer_name: customer_name.trim(),
      customer_phone: whatsapp_number.trim(),
      field_id: typeof field_id === 'string' ? parseInt(field_id) : field_id,
      field_name: field_name,
      booking_date: booking_date,
      time_slots: time_slots,
      total_price: totalPrice
    };
    
    console.log('Sending booking data:', bookingData);
    
    const response = await fetch(`${baseUrl}/api/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

 if (response.ok) {
      const result = await response.json();
      return NextResponse.json({
        success: true,
        data: {
          id: result.id,
          message: `Booking berhasil!\n\nDetail:\n- Lapangan: ${field_name}\n- Tanggal: ${booking_date}\n- Jam: ${time_slots.sort().join(', ')}\n- Total: Rp ${totalPrice.toLocaleString('id-ID')}\n- Durasi: ${time_slots.length} jam\n\nBooking ID: ${result.id}\n\nSilakan lanjutkan ke pembayaran.`
        }
      });
    } else {
      let errorMessage = 'Booking gagal';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('Backend error response:', errorData);
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Server error (${response.status})`;
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('In-chat booking error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat membuat booking. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
