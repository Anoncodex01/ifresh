import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import crypto from 'crypto';
import { signToken } from '@/lib/adminAuth';

export const runtime = 'nodejs';

async function verifyPassword(password: string, stored: string): Promise<{ ok: boolean; needsBcrypt?: boolean }>{
  if (!stored) return { ok: false };
  // Detect bcrypt ($2a$ or $2b$ or $2y$)
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    try {
      const bcrypt = await import('bcryptjs');
      const ok = await bcrypt.compare(password, stored);
      return { ok };
    } catch {
      // bcryptjs not installed
      return { ok: false, needsBcrypt: true };
    }
  }
  // PBKDF2 format: salt:hash
  if (stored.indexOf(':') === -1) return { ok: false };
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return { ok: false };
  const test = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  if (hash.length !== test.length) return { ok: false };
  let result = 0;
  for (let i = 0; i < hash.length; i++) result |= hash.charCodeAt(i) ^ test.charCodeAt(i);
  return { ok: result === 0 };
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    // Ensure admins table exists
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

    // Optional seeding from env on first run
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPass) {
      const existing = await query<any>(`SELECT id FROM admins WHERE email = ? LIMIT 1`, [adminEmail]);
      if (existing.length === 0) {
        await execute(`INSERT INTO admins (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`, [
          process.env.ADMIN_NAME || 'Admin User',
          adminEmail,
          hashPassword(adminPass),
          'owner',
        ]);
      }
    }

    const rows = await query<any>(`SELECT id, full_name, email, password_hash FROM admins WHERE email = ? LIMIT 1`, [String(email)]);
    if (!rows.length) {
      // Check if this is a database connection issue
      console.error('Admin login: No user found or database query failed', { email });
      return NextResponse.json({ 
        error: 'Invalid credentials or database connection issue. Check Vercel logs for details.' 
      }, { status: 401 });
    }
    const admin = rows[0];
    const v = await verifyPassword(String(password), String(admin.password_hash));
    if (!v.ok) {
      if (v.needsBcrypt) {
        return NextResponse.json({ error: 'Server missing bcryptjs to verify password. Please install: npm i bcryptjs' }, { status: 500 });
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken(admin.id);
    const res = NextResponse.json({ id: admin.id, name: admin.full_name, email: admin.email }, { status: 200 });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (e: any) {
    console.error('POST /api/admin/login error', { 
      message: e?.message, 
      code: e?.code,
      stack: e?.stack 
    });
    
    // Database connection errors
    if (e?.code === 'ER_ACCESS_DENIED_ERROR') {
      return NextResponse.json({ 
        error: 'Database access denied. Check MYSQL_USER and MYSQL_PASSWORD in Vercel environment variables.',
        hint: 'Verify database credentials are correct'
      }, { status: 500 });
    }
    if (e?.code === 'ENOTFOUND' || e?.code === 'ECONNREFUSED' || e?.code === 'ETIMEDOUT') {
      return NextResponse.json({ 
        error: 'Cannot connect to MySQL database.',
        hint: 'Check MYSQL_HOST, MYSQL_PORT, and database firewall settings. Vercel needs access to your database.',
        details: 'Make sure your database allows connections from all IPs (0.0.0.0/0) or whitelist Vercel IPs.'
      }, { status: 500 });
    }
    if (e?.message?.includes('Missing required env var')) {
      return NextResponse.json({ 
        error: e.message,
        hint: 'Add all required database environment variables in Vercel project settings'
      }, { status: 500 });
    }
    if (e?.message?.includes('not configured')) {
      return NextResponse.json({ 
        error: 'Database not configured properly.',
        hint: 'Check all MYSQL_* environment variables are set in Vercel'
      }, { status: 500 });
    }
    return NextResponse.json({ 
      error: 'Login failed',
      hint: 'Check Vercel function logs for detailed error information'
    }, { status: 500 });
  }
}
