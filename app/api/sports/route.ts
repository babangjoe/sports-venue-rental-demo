import { NextRequest } from 'next/server';
import { readJSON, writeJSON, getNextId } from '@/lib/json-db';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';

// GET: Fetch sports (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters for filtering
    const isAvailable = searchParams.get('isAvailable');
    const sportType = searchParams.get('sportType');

    let sports = await readJSON('sports');

    if (isAvailable !== null) {
      const availableValue = isAvailable === 'true' || isAvailable === '1' ? 1 : 0;
      sports = sports.filter((sport: any) => sport.is_available === availableValue);
    }

    if (sportType) {
      sports = sports.filter((sport: any) => sport.sport_type === sportType);
    }

    // Sort by sport_name
    sports.sort((a: any, b: any) => a.sport_name.localeCompare(b.sport_name));

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

    const sports = await readJSON('sports');
    const newId = await getNextId('sports');
    const timestamp = new Date().toISOString();

    const newSport = {
        id: newId,
        sport_name,
        sport_type,
        description: description || null,
        is_available: is_available ? 1 : 0,
        created_at: timestamp,
        updated_at: timestamp
    };

    sports.push(newSport);
    await writeJSON('sports', sports);

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
