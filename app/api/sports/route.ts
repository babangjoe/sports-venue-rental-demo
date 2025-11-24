import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';

// GET: Fetch sports (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters for filtering
    const isAvailable = searchParams.get('isAvailable');
    const sportType = searchParams.get('sportType');

    let query = supabase
      .from('sports')
      .select('*')
      .order('sport_name', { ascending: true });

    if (isAvailable !== null) {
      const availableValue = isAvailable === 'true' || isAvailable === '1' ? 1 : 0;
      query = query.eq('is_available', availableValue);
    }

    if (sportType) {
      query = query.eq('sport_type', sportType);
    }

    const { data: sports, error } = await query;

    if (error) throw error;

    return new Response(JSON.stringify(sports), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching sports:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch sports' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST: Create a new sport
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
      return new Response(
        JSON.stringify({ error: 'sport_name and sport_type are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: newSport, error } = await supabase
      .from('sports')
      .insert([{
        sport_name,
        sport_type,
        description: description || null,
        is_available: is_available ? 1 : 0
      }])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(newSport), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating sport:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create sport' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
