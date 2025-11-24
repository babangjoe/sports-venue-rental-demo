import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    let query = supabase
      .from('fields')
      .select('*, sports(sport_name, sport_type)')
      .order('field_name', { ascending: true });

    if (isAvailable !== null) {
      const availableValue = isAvailable === 'true' || isAvailable === '1' ? 1 : 0;
      query = query.eq('is_available', availableValue);
    }

    if (sportId) {
      query = query.eq('sport_id', parseInt(sportId));
    }

    if (fieldCode) {
      query = query.eq('field_code', fieldCode);
    }

    const { data: fields, error } = await query;

    if (error) throw error;

    const result = fields.map((field: any) => {
        const sport = field.sports; // Supabase returns joined data in nested object
        const { sports, ...fieldData } = field; // Remove nested object
        return {
            ...fieldData,
            sport_name: sport ? sport.sport_name : null,
            sport_type: sport ? sport.sport_type : null
        };
    });

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

    const { data: newField, error: insertError } = await supabase
      .from('fields')
      .insert([{
        field_name,
        field_code,
        sport_id,
        price_per_hour,
        description: description || null,
        is_available: is_available ? 1 : 0
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // Return with joined sport info
    const { data: sport } = await supabase
      .from('sports')
      .select('*')
      .eq('id', sport_id)
      .single();

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
