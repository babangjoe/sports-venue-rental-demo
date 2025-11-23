import { NextRequest } from 'next/server';
import { readJSON, writeJSON, getNextId } from '@/lib/json-db';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';

// GET: Fetch fields (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters for filtering
    const isAvailable = searchParams.get('isAvailable');
    const sportId = searchParams.get('sportId');
    const fieldCode = searchParams.get('fieldCode');

    const fields = await readJSON('fields');
    const sports = await readJSON('sports');

    let result = fields.map((field: any) => {
        const sport = sports.find((s: any) => s.id === field.sport_id);
        return {
            ...field,
            sport_name: sport ? sport.sport_name : null,
            sport_type: sport ? sport.sport_type : null
        };
    });

    if (isAvailable !== null) {
      const availableValue = isAvailable === 'true' || isAvailable === '1' ? 1 : 0;
      result = result.filter((f: any) => f.is_available === availableValue);
    }

    if (sportId) {
      result = result.filter((f: any) => f.sport_id === parseInt(sportId));
    }

    if (fieldCode) {
      result = result.filter((f: any) => f.field_code === fieldCode);
    }

    // Sort by field_name
    result.sort((a: any, b: any) => a.field_name.localeCompare(b.field_name));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch fields' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST: Create a new field
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      field_name,
      field_code,
      sport_id,
      price_per_hour,
      description,
      is_available = true
    } = body;

    // Validate required fields
    if (!field_name || !field_code || !sport_id || price_per_hour === undefined) {
      return new Response(
        JSON.stringify({ error: 'field_name, field_code, sport_id, and price_per_hour are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fields = await readJSON('fields');
    const newId = await getNextId('fields');
    const timestamp = new Date().toISOString();

    const newField = {
        id: newId,
        field_name,
        field_code,
        sport_id,
        price_per_hour,
        description: description || null,
        is_available: is_available ? 1 : 0,
        created_at: timestamp,
        updated_at: timestamp
    };

    fields.push(newField);
    await writeJSON('fields', fields);

    // Return with joined sport info
    const sports = await readJSON('sports');
    const sport = sports.find((s: any) => s.id === sport_id);

    const result = {
        ...newField,
        sport_name: sport ? sport.sport_name : null,
        sport_type: sport ? sport.sport_type : null
    };

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating field:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create field' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
