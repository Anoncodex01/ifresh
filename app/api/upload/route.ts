import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import path from 'path';

export const runtime = 'nodejs';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/gif',
	'image/webp',
];

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const file: any = formData.get('file');
		
		if (!file) {
			return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
		}

		// Validate file type
		const fileType = file.type || 'application/octet-stream';
		if (!ALLOWED_TYPES.includes(fileType)) {
			return NextResponse.json(
				{ error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.' },
				{ status: 400 }
			);
		}

		// Support both File and Blob-like objects
		const arrayBuffer = typeof file.arrayBuffer === 'function' ? await file.arrayBuffer() : null;
		if (!arrayBuffer) {
			return NextResponse.json({ error: 'Invalid file data' }, { status: 400 });
		}

		// Check file size
		if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: 'File too large. Maximum size is 10MB.' },
				{ status: 400 }
			);
		}

		const bytes = Buffer.from(arrayBuffer);
		
		// Generate unique filename
		const name = typeof file.name === 'string' ? file.name : 'upload.jpg';
		const ext = path.extname(name) || '.jpg';
		const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

		// Upload using storage adapter (supports local filesystem and cloud storage)
		const url = await storage.upload(bytes, filename, fileType);

		return NextResponse.json({ url }, { status: 201 });
	} catch (e: any) {
		console.error('Upload error', e);
		
		// Provide helpful error messages
		if (e.message?.includes('AWS') || e.message?.includes('S3')) {
			return NextResponse.json(
				{ error: 'Storage configuration error. Please configure AWS S3 or Cloudinary.' },
				{ status: 500 }
			);
		}
		
		if (e.message?.includes('Cloudinary')) {
			return NextResponse.json(
				{ error: 'Storage configuration error. Please configure Cloudinary credentials.' },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: 'Upload failed. Please try again.' },
			{ status: 500 }
		);
	}
}


