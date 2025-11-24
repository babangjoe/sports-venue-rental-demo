import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category');
  const search = request.nextUrl.searchParams.get('q');

  let query = supabase
    .from('barang')
    .select('*')
    .eq('is_available', 1);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.ilike('nama_barang', `%${search}%`);
  }

  query = query.order('nama_barang', { ascending: true });

  try {
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching barang:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
