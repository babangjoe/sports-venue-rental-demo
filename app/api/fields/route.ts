import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';

// GET: Fetch fields (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters for filtering
    const isAvailable = searchParams.get('isAvailable');
    const sportId = searchParams.get('sportId');
    const fieldCode = searchParams.get('fieldCode');

    // Fallback: Try to select field_images if relationship exists, otherwise select fields only
    // Note: Supabase schema cache might take time to update. 
    // For now, we will try to select without field_images join if the user reported error, 
    // OR we can fix the query to use explicit join if possible, but PostgREST relies on FKs.
    
    // The error 'PGRST200' means the FK is not detected. 
    // This happens if the migration wasn't run or schema cache is stale.
    // We will try to fetch fields first, then fetch images separately to avoid joining error.
    
    let query = supabase
      .from('fields')
      .select('*, sports(sport_name, sport_type)')
      .order('field_name', { ascending: true });

    if (isAvailable !== null) {
      const availableValue = isAvailable === 'true' || isAvailable === '1' ? 1 : 0;
      query = query.eq('is_available', availableValue);
    }

    if (sportId) {
      query = query.eq('sport_id', parseInt(sportId));
    }

    if (fieldCode) {
      query = query.eq('field_code', fieldCode);
    }

    const { data: fields, error } = await query;

    if (error) throw error;

    // Manually fetch images for these fields
    const fieldIds = fields.map((f: any) => f.id);
    let imagesMap: Record<number, string[]> = {};
    
    if (fieldIds.length > 0) {
        const { data: images, error: imagesError } = await supabase
            .from('field_images')
            .select('field_id, url_image')
            .in('field_id', fieldIds);
        
        if (!imagesError && images) {
            images.forEach((img: any) => {
                if (!imagesMap[img.field_id]) {
                    imagesMap[img.field_id] = [];
                }
                imagesMap[img.field_id].push(img.url_image);
            });
        } else {
            // If table doesn't exist or error, just ignore images and proceed with field data only
            // console.warn('Could not fetch field_images', imagesError);
        }
    }

    const result = fields.map((field: any) => {
        const sport = field.sports;
        // Get images from separate fetch
        const images = imagesMap[field.id] || [];
        
        // Use the first image from field_images if available, else use the url_image column
        const mainImage = images.length > 0 ? images[0] : field.url_image;
        
        const { sports, ...fieldData } = field;
        return {
            ...fieldData,
            sport_name: sport ? sport.sport_name : null,
            sport_type: sport ? sport.sport_type : null,
            url_image: mainImage, 
            images: images 
        };
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch fields' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST: Create a new field
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      field_name,
      field_code,
      sport_id,
      price_per_hour,
      description,
      url_image,
      images, // Expecting array of strings
      is_available = true
    } = body;

    // Validate required fields
    if (!field_name || !field_code || !sport_id || price_per_hour === undefined) {
      return new Response(
        JSON.stringify({ error: 'field_name, field_code, sport_id, and price_per_hour are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert field
    const { data: newField, error: insertError } = await supabase
      .from('fields')
      .insert([{
        field_name,
        field_code,
        sport_id,
        price_per_hour,
        description: description || null,
        url_image: url_image || (images && images.length > 0 ? images[0] : null), // Use first image as fallback
        is_available: is_available ? 1 : 0
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // Insert images if provided
    const imagesToInsert = [];
    if (images && Array.isArray(images)) {
        images.forEach((url: string) => {
            if (url) imagesToInsert.push({ field_id: newField.id, url_image: url });
        });
    } else if (url_image) {
        // Fallback if only url_image provided
        imagesToInsert.push({ field_id: newField.id, url_image: url_image });
    }

    if (imagesToInsert.length > 0) {
        const { error: imagesError } = await supabase
            .from('field_images')
            .insert(imagesToInsert);
        
        // If error (e.g., table doesn't exist), log it but don't fail the whole request
        // as the field itself was created successfully.
        if (imagesError) console.error('Error inserting field images:', imagesError);
    }

    // Return with joined sport info
    const { data: sport } = await supabase
      .from('sports')
      .select('*')
      .eq('id', sport_id)
      .single();

    const result = {
        ...newField,
        sport_name: sport ? sport.sport_name : null,
        sport_type: sport ? sport.sport_type : null,
        images: imagesToInsert.map(i => i.url_image)
    };

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating field:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create field' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
