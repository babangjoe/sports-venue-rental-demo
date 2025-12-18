import { NextRequest } from 'next/server';
import {
  getFieldById,
  getFieldImages,
  getSportById,
  updateField,
  deleteField,
  getBookings,
} from '@/lib/demoStore';

/**
 * DEMO MODE: Fields [id] API
 * 
 * - GET: Reads from localStorage
 * - PUT: Updates localStorage ONLY
 * - DELETE: Deletes from localStorage ONLY
 */

export const dynamic = 'force-dynamic';

// PUT: Update a field
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fieldId = parseInt(params.id);
    const body = await request.json();

    const {
      field_name,
      field_code,
      sport_id,
      price_per_hour,
      description,
      url_image,
      images, // Array of strings
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
    let finalImages: string[] | undefined = undefined;
    if (images && Array.isArray(images)) {
      finalImages = images;
    }

    // DEMO MODE: Update in localStorage only
    const updatedField = updateField(fieldId, {
      field_name,
      field_code,
      sport_id: parseInt(sport_id),
      price_per_hour,
      description: description || null,
      url_image: url_image || (finalImages && finalImages.length > 0 ? finalImages[0] : null),
      is_available: is_available ? 1 : 0,
    }, finalImages);

    if (!updatedField) {
      return new Response(
        JSON.stringify({ error: 'Field not found or update failed' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get sport and updated images for response
    const sport = getSportById(parseInt(sport_id));
    const updatedImages = getFieldImages(fieldId);

    const result = {
      ...updatedField,
      sport_name: sport ? sport.sport_name : null,
      sport_type: sport ? sport.sport_type : null,
      images: updatedImages.map(i => i.url_image)
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating field:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update field' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE: Delete a field
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fieldId = parseInt(params.id);

    // Check if field has any bookings (from localStorage)
    const bookings = getBookings({ fieldId });

    if (bookings.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete field with existing bookings' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DEMO MODE: Delete from localStorage only
    const deleted = deleteField(fieldId);

    if (!deleted) {
      return new Response(
        JSON.stringify({ error: 'Field not found or delete failed' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Field deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting field:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete field' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET: Get a specific field
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fieldId = parseInt(params.id);

    // DEMO MODE: Read from localStorage
    const field = getFieldById(fieldId);

    if (!field) {
      return new Response(
        JSON.stringify({ error: 'Field not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get sport and images
    const sport = getSportById(field.sport_id);
    const images = getFieldImages(fieldId);
    const imageUrls = images.map(img => img.url_image);

    const result = {
      ...field,
      sport_name: sport ? sport.sport_name : null,
      sport_type: sport ? sport.sport_type : null,
      images: imageUrls,
      url_image: imageUrls.length > 0 ? imageUrls[0] : field.url_image
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching field:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch field' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
