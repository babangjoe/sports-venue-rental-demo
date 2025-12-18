import { NextRequest, NextResponse } from 'next/server';
import { getPendingBookings } from '@/lib/demoStore';

/**
 * DEMO MODE: Pending Bookings API
 * 
 * - GET: Reads from localStorage
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('q');

    // DEMO MODE: Read from localStorage
    const pendingBookings = getPendingBookings(search || undefined);

    return NextResponse.json({ data: pendingBookings });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
