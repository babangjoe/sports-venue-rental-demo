import { NextRequest } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';

// PUT: Update a sport
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sportId = parseInt(params.id);
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
    const index = sports.findIndex((s: any) => s.id === sportId);

    if (index === -1) {
       return new Response(
        JSON.stringify({ error: 'Sport not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedSport = {
        ...sports[index],
        sport_name,
        sport_type,
        description: description || null,
        is_available: is_available ? 1 : 0,
        updated_at: new Date().toISOString()
    };

    sports[index] = updatedSport;
    await writeJSON('sports', sports);

    return new Response(JSON.stringify(updatedSport), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating sport:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update sport' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE: Delete a sport
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sportId = parseInt(params.id);

    // Check if sport has any fields
    const fields = await readJSON('fields');
    const fieldCount = fields.filter((f: any) => f.sport_id === sportId).length;
    
    if (fieldCount > 0) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete sport with existing fields. Please delete all related fields first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sports = await readJSON('sports');
    const newSports = sports.filter((s: any) => s.id !== sportId);

    if (newSports.length === sports.length) {
      return new Response(
        JSON.stringify({ error: 'Sport not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await writeJSON('sports', newSports);

    return new Response(
      JSON.stringify({ message: 'Sport deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting sport:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete sport' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET: Get a specific sport
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sportId = parseInt(params.id);
    const sports = await readJSON('sports');
    const sport = sports.find((s: any) => s.id === sportId);

    if (!sport) {
      return new Response(
        JSON.stringify({ error: 'Sport not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(sport), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching sport:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch sport' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
