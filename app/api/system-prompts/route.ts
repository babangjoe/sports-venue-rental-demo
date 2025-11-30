import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Database connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only');

    let query = supabase
      .from('system_prompts')
      .select(`
        id,
        name,
        prompt_content,
        is_active,
        created_at,
        updated_at,
        version,
        description,
        created_by (username, full_name)
      `)
      .order('created_at', { ascending: false });

    if (activeOnly === 'true') {
      query = query.eq('is_active', true).limit(1);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch system prompts'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, prompt_content, description, created_by } = body;

    // Validate required fields
    if (!name || !prompt_content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and prompt content are required'
        },
        { status: 400 }
      );
    }

    // Create new system prompt
    const { data, error } = await supabase
      .from('system_prompts')
      .insert([
        {
          name,
          prompt_content,
          description: description || null,
          created_by: created_by || null,
          is_active: false // Default to inactive for new prompts
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error creating system prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create system prompt'
      },
      { status: 500 }
    );
  }
}
