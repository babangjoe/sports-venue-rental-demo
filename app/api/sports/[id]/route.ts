import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { data: updatedSport, error } = await supabase
      .from('sports')
      .update({
        sport_name,
        sport_type,
        description: description || null,
        is_available: is_available ? 1 : 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', sportId)
      .select()
      .single();

    if (error || !updatedSport) {
       return new Response(
        JSON.stringify({ error: 'Sport not found or update failed' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
    const { count, error: countError } = await supabase
      .from('fields')
      .select('*', { count: 'exact', head: true })
      .eq('sport_id', sportId);

    if (countError) throw countError;
    
    if (count && count > 0) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete sport with existing fields. Please delete all related fields first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: deleteError } = await supabase
      .from('sports')
      .delete()
      .eq('id', sportId);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Sport not found or delete failed' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
    const { data: sport, error } = await supabase
      .from('sports')
      .select('*')
      .eq('id', sportId)
      .single();

    if (error || !sport) {
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
