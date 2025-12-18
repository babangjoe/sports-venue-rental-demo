import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Demo Seeding API
 * 
 * This route fetches initial data from Supabase (READ ONLY)
 * and returns it for client-side localStorage seeding.
 * 
 * CRITICAL: Supabase is ONLY used for SELECT queries here.
 * No mutations will ever be made to Supabase.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Fetch all data from Supabase (READ ONLY)
        const [
            sportsResult,
            fieldsResult,
            fieldImagesResult,
            bookingsResult,
            barangResult,
            pemasukanResult,
            pemasukanDetailResult,
            systemPromptsResult,
        ] = await Promise.all([
            supabase.from('sports').select('*').order('id', { ascending: true }),
            supabase.from('fields').select('*').order('field_name', { ascending: true }),
            supabase.from('field_images').select('*'),
            supabase.from('bookings').select('*').order('created_at', { ascending: false }),
            supabase.from('barang').select('*').order('nama_barang', { ascending: true }),
            supabase.from('pemasukan').select('*').order('created_at', { ascending: false }),
            supabase.from('pemasukan_detail').select('*'),
            supabase.from('system_prompts').select('*').order('created_at', { ascending: false }),
        ]);

        // Check for errors but don't fail completely if some tables don't exist
        const handleResult = <T>(result: { data: T[] | null; error: any }): T[] => {
            if (result.error) {
                console.warn('Error fetching data:', result.error.message);
                return [];
            }
            return result.data || [];
        };

        const seedData = {
            sports: handleResult(sportsResult),
            fields: handleResult(fieldsResult),
            fieldImages: handleResult(fieldImagesResult),
            bookings: handleResult(bookingsResult),
            barang: handleResult(barangResult),
            pemasukan: handleResult(pemasukanResult),
            pemasukanDetail: handleResult(pemasukanDetailResult),
            systemPrompts: handleResult(systemPromptsResult),
        };

        return NextResponse.json({
            success: true,
            data: seedData,
            message: 'Demo seed data fetched successfully from Supabase (READ ONLY)'
        });

    } catch (error) {
        console.error('Error fetching demo seed data:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch demo seed data',
                data: {
                    sports: [],
                    fields: [],
                    fieldImages: [],
                    bookings: [],
                    barang: [],
                    pemasukan: [],
                    pemasukanDetail: [],
                    systemPrompts: [],
                }
            },
            { status: 500 }
        );
    }
}
