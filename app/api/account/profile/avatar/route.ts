import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { execute } from '@/lib/db';
export const runtime = 'nodejs';

async function ensureUserColumns() {
  try {
    await execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) NULL`);
  } catch {}
}

async function ensureCustomerAvatarColumns() {
  try { await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_blob LONGBLOB NULL`); } catch {}
  try { await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_mime VARCHAR(64) NULL`); } catch {}
}

// POST { userId: number, imageBase64: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = Number(body.userId);
    const customerId = Number(body.customerId || 0);
    const imageBase64 = String(body.imageBase64 || '');

    if (!imageBase64.startsWith('data:image/')) {
      return NextResponse.json({ ok: false, error: 'imageBase64 must be a data:image/*;base64,... string' }, { status: 400 });
    }

    await ensureUserColumns();
    await ensureCustomerAvatarColumns();

    // Decode base64
    const [meta, data] = imageBase64.split(',');
    const ext = meta.includes('image/png') ? 'png' : meta.includes('image/webp') ? 'webp' : 'jpg';
    const buffer = Buffer.from(data, 'base64');
    const mime = meta.includes('image/png') ? 'image/png' : meta.includes('image/webp') ? 'image/webp' : 'image/jpeg';

    // 1) Persist to customers table as BLOB if customerId provided
    let customerUrl: string | null = null;
    if (customerId) {
      const res = await execute(`UPDATE customers SET avatar_blob = ?, avatar_mime = ? WHERE id = ?`, [buffer, mime, customerId]) as any;
      if ((res?.affectedRows || res?.rowCount || 0) > 0) {
        customerUrl = `/api/account/avatar?customerId=${customerId}`;
      }
    }

    // 2) Keep existing behavior: store a file and update users.avatar_url for backward compatibility (if userId present)
    let publicUrl: string | null = null;
    if (userId) {
      const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      await fs.mkdir(dir, { recursive: true });
      const filename = `${userId}_${Date.now()}.${ext}`;
      const filePath = path.join(dir, filename);
      await fs.writeFile(filePath, buffer);
      publicUrl = `/uploads/avatars/${filename}`;
      await execute(`UPDATE users SET avatar_url = ? WHERE id = ?`, [publicUrl, userId]);
    }

    if (!customerUrl && !publicUrl) {
      return NextResponse.json({ ok: false, error: 'No target identified: provide customerId and/or userId' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, url: customerUrl || publicUrl });
  } catch (e: any) {
    console.error('POST /api/account/profile/avatar error', e?.message);
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 });
  }
}
