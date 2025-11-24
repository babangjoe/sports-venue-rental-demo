import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simple query to check connection
    const { data, error } = await supabase
      .from('roles')
      .select('count')
      .limit(1)
      .single();

    if (error) throw error;

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        storage: 'supabase',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json({
      status: 'unhealthy',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        storage: 'supabase'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
