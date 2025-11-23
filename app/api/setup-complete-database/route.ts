import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({
      message: 'Database setup is disabled in JSON mode. Please manage dbjson files directly.',
    });
}

export async function GET() {
    return NextResponse.json({
      status: 'disabled',
      message: 'Database status check is disabled in JSON mode.'
    });
}
