import { NextRequest, NextResponse } from 'next/server';
import {
  getSports,
  createSport,
} from '@/lib/demoStore';

/**
 * DEMO MODE: Sports API
 * 
 * - GET: Reads from localStorage (demo data)
 * - POST: Writes to localStorage ONLY (no Supabase mutation)
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const showAll = searchParams.get('show_all') === 'true';

    const sports = getSports(showAll);

    return NextResponse.json(sports);
  } catch (error) {
    console.error('Error fetching sports:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sport_name,
      sport_type,
      description,
      is_available = true
    } = body;

    // Validate required fields
    if (!sport_name || !sport_type) {
      return NextResponse.json(
        { error: 'sport_name and sport_type are required' },
        { status: 400 }
      );
    }

    // DEMO MODE: Create in localStorage only
    const newSport = createSport({
      sport_name,
      sport_type,
      description,
      is_available: is_available ? 1 : 0,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json(newSport, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sports:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
