import { NextRequest } from 'next/server';
import { readJSON, writeJSON } from '@/lib/json-db';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';

// PUT: Update a field
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fieldId = parseInt(params.id);
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
    const index = fields.findIndex((f: any) => f.id === fieldId);

    if (index === -1) {
      return new Response(
        JSON.stringify({ error: 'Field not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedField = {
        ...fields[index],
        field_name,
        field_code,
        sport_id,
        price_per_hour,
        description: description || null,
        is_available: is_available ? 1 : 0,
        updated_at: new Date().toISOString()
    };

    fields[index] = updatedField;
    await writeJSON('fields', fields);

    // Join with sports
    const sports = await readJSON('sports');
    const sport = sports.find((s: any) => s.id === sport_id);

    const result = {
        ...updatedField,
        sport_name: sport ? sport.sport_name : null,
        sport_type: sport ? sport.sport_type : null
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating field:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update field' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE: Delete a field
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fieldId = parseInt(params.id);

    // Check if field has any bookings
    const bookings = await readJSON('bookings');
    const bookingCount = bookings.filter((b: any) => b.field_id === fieldId).length;
    
    if (bookingCount > 0) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete field with existing bookings' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fields = await readJSON('fields');
    const newFields = fields.filter((f: any) => f.id !== fieldId);

    if (newFields.length === fields.length) {
      return new Response(
        JSON.stringify({ error: 'Field not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await writeJSON('fields', newFields);

    return new Response(
      JSON.stringify({ message: 'Field deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting field:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete field' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET: Get a specific field
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fieldId = parseInt(params.id);

    const fields = await readJSON('fields');
    const field = fields.find((f: any) => f.id === fieldId);

    if (!field) {
      return new Response(
        JSON.stringify({ error: 'Field not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sports = await readJSON('sports');
    const sport = sports.find((s: any) => s.id === field.sport_id);

    const result = {
        ...field,
        sport_name: sport ? sport.sport_name : null,
        sport_type: sport ? sport.sport_type : null
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching field:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch field' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
