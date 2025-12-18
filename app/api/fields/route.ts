import { NextRequest } from 'next/server';
import {
  getFields,
  getFieldImages,
  getSportById,
  createField,
} from '@/lib/demoStore';

/**
 * DEMO MODE: Fields API
 * 
 * - GET: Reads from localStorage
 * - POST: Writes to localStorage ONLY (no Supabase mutation)
 */

export const dynamic = 'force-dynamic';

// GET: Fetch fields (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters for filtering
    const isAvailable = searchParams.get('isAvailable');
    const sportId = searchParams.get('sportId');
    const fieldCode = searchParams.get('fieldCode');

    // DEMO MODE: Read from localStorage
    const fields = getFields({
      isAvailable: isAvailable !== null ? (isAvailable === 'true' || isAvailable === '1') : undefined,
      sportId: sportId ? parseInt(sportId) : undefined,
      fieldCode: fieldCode || undefined,
    });

    // Get images for these fields
    const fieldImages = getFieldImages();
    const imagesMap: Record<number, string[]> = {};
    fieldImages.forEach((img) => {
      if (!imagesMap[img.field_id]) {
        imagesMap[img.field_id] = [];
      }
      imagesMap[img.field_id].push(img.url_image);
    });

    // Get sports data for joining
    const result = fields.map((field) => {
      const sport = getSportById(field.sport_id);
      const images = imagesMap[field.id] || [];
      const mainImage = images.length > 0 ? images[0] : field.url_image;

      return {
        ...field,
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

    // Prepare images array
    let finalImages: string[] = [];
    if (images && Array.isArray(images)) {
      finalImages = images.filter((url: string) => url);
    } else if (url_image) {
      finalImages = [url_image];
    }

    // DEMO MODE: Create in localStorage only
    const newField = createField({
      field_name,
      field_code,
      sport_id: parseInt(sport_id),
      price_per_hour,
      description: description || null,
      url_image: finalImages.length > 0 ? finalImages[0] : null,
      is_available: is_available ? 1 : 0,
    }, finalImages);

    // Get sport info for response
    const sport = getSportById(parseInt(sport_id));

    const result = {
      ...newField,
      sport_name: sport ? sport.sport_name : null,
      sport_type: sport ? sport.sport_type : null,
      images: finalImages
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
