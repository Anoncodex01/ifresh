/**
 * File Storage Utility
 * Supports both local filesystem (VPS) and cloud storage (Vercel/Serverless)
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface StorageAdapter {
  upload(file: Buffer, filename: string, mimetype?: string): Promise<string>;
  delete(filename: string): Promise<void>;
}

/**
 * Local filesystem storage (for VPS deployment)
 */
class LocalStorage implements StorageAdapter {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  }

  async upload(file: Buffer, filename: string): Promise<string> {
    await fs.mkdir(this.uploadsDir, { recursive: true });
    const filePath = path.join(this.uploadsDir, filename);
    // Buffer is compatible with fs.writeFile
    await fs.writeFile(filePath, file as unknown as Uint8Array);
    return `/uploads/${filename}`;
  }

  async delete(filename: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
      console.warn(`Failed to delete file ${filename}:`, error);
    }
  }
}

/**
 * AWS S3 storage (optional - only if using AWS S3)
 * Note: Install @aws-sdk/client-s3 package: npm install @aws-sdk/client-s3
 */
class S3Storage implements StorageAdapter {
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required for S3 storage');
    }
  }

  async upload(file: Buffer, filename: string, mimetype?: string): Promise<string> {
    // Use dynamic require to avoid build-time errors if package not installed
    let S3Client: any, PutObjectCommand: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const s3Module = require('@aws-sdk/client-s3');
      S3Client = s3Module.S3Client;
      PutObjectCommand = s3Module.PutObjectCommand;
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('AWS SDK not installed. Run: npm install @aws-sdk/client-s3');
      }
      throw error;
    }
    
    const s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: `uploads/${filename}`,
      Body: file,
      ContentType: mimetype || 'application/octet-stream',
      ACL: 'public-read',
    });

    await s3Client.send(command);
    
    // Return public URL (adjust if using CloudFront or custom domain)
    const publicUrl = process.env.AWS_S3_PUBLIC_URL 
      ? `${process.env.AWS_S3_PUBLIC_URL}/uploads/${filename}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/uploads/${filename}`;
    return publicUrl;
  }

  async delete(filename: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const s3Module = require('@aws-sdk/client-s3');
      const S3Client = s3Module.S3Client;
      const DeleteObjectCommand = s3Module.DeleteObjectCommand;
      
      const s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: `uploads/${filename}`,
      });

      await s3Client.send(command);
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.warn('AWS SDK not installed, cannot delete from S3');
        return;
      }
      throw error;
    }
  }
}

/**
 * Cloudinary storage (alternative to S3)
 * Note: Install cloudinary package: npm install cloudinary
 */
class CloudinaryStorage implements StorageAdapter {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = process.env.CLOUDINARY_API_KEY || '';
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error('Cloudinary environment variables are required');
    }
  }

  async upload(file: Buffer, filename: string, mimetype?: string): Promise<string> {
    try {
      // Use base64 encoding for Cloudinary
      const base64 = file.toString('base64');
      const dataUri = `data:${mimetype || 'image/jpeg'};base64,${base64}`;
      
      const formData = new URLSearchParams();
      formData.append('file', dataUri);
      formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'unsigned');
      formData.append('folder', 'uploads');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudinary upload failed: ${error}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error: any) {
      throw new Error(`Cloudinary upload error: ${error.message}`);
    }
  }

  async delete(filename: string): Promise<void> {
    // Extract public_id from URL or filename
    const publicId = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/^uploads\//, '');
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const crypto = await import('crypto');
    const message = `public_id=uploads/${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(message).digest('hex');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_id: `uploads/${publicId}`,
          timestamp,
          signature,
          api_key: this.apiKey,
        }),
      }
    );

    if (!response.ok) {
      console.warn(`Failed to delete Cloudinary image: ${publicId}`);
    }
  }
}

/**
 * Get the appropriate storage adapter based on environment
 */
export function getStorageAdapter(): StorageAdapter {
  // Priority 1: Cloudinary (easiest, no extra packages needed)
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return new CloudinaryStorage();
  }

  // Priority 2: AWS S3 (requires @aws-sdk/client-s3 package)
  if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return new S3Storage();
  }

  // Priority 3: Local storage (works on VPS/Hetzner, will fail on Vercel)
  // On Vercel, you MUST configure cloud storage (Cloudinary recommended)
  if (process.env.VERCEL) {
    console.warn(
      '⚠️  Running on Vercel without cloud storage configured. ' +
      'File uploads will fail. Please configure Cloudinary (recommended) or AWS S3.'
    );
  }

  return new LocalStorage();
}

export const storage = getStorageAdapter();

