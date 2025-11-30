import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Database connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    // Read SQL file content
    const fs = require('fs');
    const path = require('path');
    
    const createTableSql = fs.readFileSync(
      path.join(process.cwd(), 'create-system-prompts-table.sql'),
      'utf8'
    );
    
    const functionsSql = fs.readFileSync(
      path.join(process.cwd(), 'add-system-prompts-functions.sql'),
      'utf8'
    );

    // Execute SQL statements
    const createTableResult = await supabase.rpc('exec_sql', { sql: createTableSql });
    const functionsResult = await supabase.rpc('exec_sql', { sql: functionsSql });

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      results: {
        createTable: createTableResult,
        functions: functionsResult
      }
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
