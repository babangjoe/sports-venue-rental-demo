import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const showAll = searchParams.get('show_all') === 'true';

    let query = supabase.from('sports').select('*');

    // If not showing all, only show available ones
    if (!showAll) {
      query = query.eq('is_available', 1);
    }

    // Add ordering
    query = query.order('id', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
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

    const { data, error } = await supabase
      .from('sports')
      .insert([
        {
          sport_name,
          sport_type,
          description,
          is_available: is_available ? 1 : 0,
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating sport:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sports:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
