import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(req: Request) {
  try {
    const tokenHeader = req.headers.get('x-seed-token') || '';
    const expected = process.env.ADMIN_SEED_TOKEN || '';

    const body = await req.json().catch(() => ({}));
    const { email, password, name = 'Admin User', role = 'owner' } = body || {};
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    // Ensure table
    await execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('owner','admin') NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // If no token provided or mismatch, allow only in dev AND only if there are zero admins
    if (!expected || tokenHeader !== expected) {
      const countRows = await query<any>(`SELECT COUNT(*) AS c FROM admins`);
      const total = Number(countRows?.[0]?.c || 0);
      const dev = process.env.NODE_ENV !== 'production';
      if (!(dev && total === 0)) {
        return NextResponse.json({ error: 'Forbidden: invalid seed token' }, { status: 403 });
      }
    }

    const existing = await query<any>(`SELECT id FROM admins WHERE email = ? LIMIT 1`, [email]);
    if (existing.length) {
      return NextResponse.json({ ok: true, message: 'Admin already exists' }, { status: 200 });
    }

    await execute(`INSERT INTO admins (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`, [
      String(name),
      String(email),
      hashPassword(String(password)),
      role === 'owner' ? 'owner' : 'admin',
    ]);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/admin/seed error', { message: e?.message, code: e?.code });
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
