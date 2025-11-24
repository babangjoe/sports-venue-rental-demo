import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Update field
    const { data: updatedField, error: updateError } = await supabase
      .from('fields')
      .update({
        field_name,
        field_code,
        sport_id,
        price_per_hour,
        description: description || null,
        is_available: is_available ? 1 : 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', fieldId)
      .select()
      .single();

    if (updateError || !updatedField) {
       return new Response(
        JSON.stringify({ error: 'Field not found or update failed' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Join with sports
    const { data: sport } = await supabase
        .from('sports')
        .select('*')
        .eq('id', sport_id)
        .single();

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
    const { count, error: countError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('field_id', fieldId);
    
    if (countError) throw countError;

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete field with existing bookings' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: deleteError } = await supabase
        .from('fields')
        .delete()
        .eq('id', fieldId);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Field not found or delete failed' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    const { data: field, error: fieldError } = await supabase
        .from('fields')
        .select('*')
        .eq('id', fieldId)
        .single();

    if (fieldError || !field) {
      return new Response(
        JSON.stringify({ error: 'Field not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: sport } = await supabase
        .from('sports')
        .select('*')
        .eq('id', field.sport_id)
        .single();

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
