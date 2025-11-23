import { NextResponse } from 'next/server';
import { readJSON } from '@/lib/json-db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dbDir = path.join(process.cwd(), 'dbjson');
    const exists = fs.existsSync(dbDir);

    const tables = ['users', 'roles', 'sports', 'fields'];
    const foundTables = [];

    for (const table of tables) {
        const data = await readJSON(table);
        // We consider the table exists if readJSON returns an array (even empty)
        // readJSON returns [] if file doesn't exist, so we check file existence explicitly if we want to be strict,
        // but for now, if readJSON works, it's good. 
        // Actually readJSON catches errors and returns [].
        // Let's check file existence properly.
        if (fs.existsSync(path.join(dbDir, `${table}.json`))) {
            foundTables.push(table);
        }
    }

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: exists,
        storage: 'json',
        tablesFound: foundTables.length,
        tables: foundTables
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json({
      status: 'unhealthy',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
