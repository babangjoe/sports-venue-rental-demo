import { NextRequest, NextResponse } from 'next/server';
import { getBarang } from '@/lib/demoStore';

/**
 * DEMO MODE: Barang API
 * 
 * - GET: Reads from localStorage
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('q');

    // DEMO MODE: Read from localStorage
    const items = getBarang({
      category: category || undefined,
      search: search || undefined,
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching barang:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
