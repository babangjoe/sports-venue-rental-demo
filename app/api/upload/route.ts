import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${uuidv4()}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), 'public/images');
    
    // Ensure the directory exists (although public/images should exist)
    // await mkdir(uploadDir, { recursive: true }); 

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const relativePath = `/images/${filename}`;

    return NextResponse.json({ url: relativePath });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
