import { NextRequest, NextResponse } from 'next/server';
import {
  getSystemPrompts,
  createSystemPrompt,
} from '@/lib/demoStore';

/**
 * DEMO MODE: System Prompts API
 * 
 * - GET: Reads from localStorage
 * - POST: Writes to localStorage ONLY (no Supabase mutation)
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only');

    // DEMO MODE: Read from localStorage
    const prompts = getSystemPrompts(activeOnly === 'true');

    return NextResponse.json({
      success: true,
      data: prompts
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

    // DEMO MODE: Create in localStorage only
    const newPrompt = createSystemPrompt({
      name,
      prompt_content,
      description: description || null,
      created_by: created_by || null,
      is_active: false, // Default to inactive for new prompts
    });

    return NextResponse.json({
      success: true,
      data: newPrompt
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
