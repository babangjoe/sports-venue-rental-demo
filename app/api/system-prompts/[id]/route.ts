import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Database connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch single system prompt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
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
      .eq('id', params.id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'System prompt not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching system prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch system prompt'
      },
      { status: 500 }
    );
  }
}

// PUT - Update system prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, prompt_content, description, is_active } = body;

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (prompt_content !== undefined) updateData.prompt_content = prompt_content;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) {
      updateData.is_active = is_active;
      
      // If setting this as active, deactivate all others
      if (is_active) {
        await supabase
          .from('system_prompts')
          .update({ is_active: false })
          .neq('id', params.id);
      }
    }

    // Increment version if content changed
    if (prompt_content !== undefined) {
      const { data: versionData, error: versionError } = await supabase.rpc('increment_version', { 
        prompt_id: params.id 
      });
      if (versionError) {
        console.error('Error incrementing version:', versionError);
        // Continue with manual version increment
        const { data: currentPrompt } = await supabase
          .from('system_prompts')
          .select('version')
          .eq('id', params.id)
          .single();
        updateData.version = (currentPrompt?.version || 0) + 1;
      } else {
        updateData.version = versionData;
      }
    }

    const { data, error } = await supabase
      .from('system_prompts')
      .update(updateData)
      .eq('id', params.id)
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
    console.error('Error updating system prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update system prompt'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete system prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if it's the default prompt (id 1)
    if (params.id === '1') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete default system prompt'
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('system_prompts')
      .delete()
      .eq('id', params.id)
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
    console.error('Error deleting system prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete system prompt'
      },
      { status: 500 }
    );
  }
}
