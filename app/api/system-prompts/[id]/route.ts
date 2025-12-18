import { NextRequest, NextResponse } from 'next/server';
import {
  getSystemPromptById,
  updateSystemPrompt,
  deleteSystemPrompt,
} from '@/lib/demoStore';

/**
 * DEMO MODE: System Prompts [id] API
 * 
 * - GET: Reads from localStorage
 * - PUT: Updates localStorage ONLY
 * - DELETE: Deletes from localStorage ONLY
 */

export const dynamic = 'force-dynamic';

// GET - Fetch single system prompt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const promptId = parseInt(params.id);

    // DEMO MODE: Read from localStorage
    const prompt = getSystemPromptById(promptId);

    if (!prompt) {
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
      data: prompt
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
    const promptId = parseInt(params.id);
    const body = await request.json();
    const { name, prompt_content, description, is_active } = body;

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (prompt_content !== undefined) updateData.prompt_content = prompt_content;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    // DEMO MODE: Update in localStorage only
    const updatedPrompt = updateSystemPrompt(promptId, updateData);

    if (!updatedPrompt) {
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
      data: updatedPrompt
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
    const promptId = parseInt(params.id);

    // Check if it's the default prompt (id 1)
    if (promptId === 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete default system prompt'
        },
        { status: 400 }
      );
    }

    // DEMO MODE: Delete from localStorage only
    const deleted = deleteSystemPrompt(promptId);

    if (!deleted) {
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
      data: { id: promptId }
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
