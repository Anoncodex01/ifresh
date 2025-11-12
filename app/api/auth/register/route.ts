import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

function getSecret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!s) throw new Error('AUTH_SECRET is required');
  return s;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, phone, email, region, country, password, nextOrderDate } = body || {};
    if (!fullName || !phone || !password) {
      return NextResponse.json({ error: 'fullName, phone and password are required' }, { status: 400 });
    }

    // ensure table
    await execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NULL,
        region VARCHAR(100) NULL,
        country VARCHAR(100) NULL,
        next_order_date DATE NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_customers_phone (phone),
        UNIQUE KEY uk_customers_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    );

    // Ensure new column exists on older databases
    await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_order_date DATE NULL`);

    // check duplicates
    const dup = await query<any>(`SELECT id FROM customers WHERE phone = ? OR (email IS NOT NULL AND email = ?) LIMIT 1`, [String(phone), email || null]);
    if (dup.length) {
      return NextResponse.json({ error: 'Account with phone or email already exists' }, { status: 409 });
    }

    const pwd = hashPassword(String(password));
    const res = await execute(
      `INSERT INTO customers (full_name, phone, email, region, country, next_order_date, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [String(fullName), String(phone), email ? String(email) : null, region ? String(region) : null, country ? String(country) : null, nextOrderDate ? String(nextOrderDate) : null, pwd]
    );
    const insertId = (res as any).insertId as number;

    // create session token cookie (simple HMAC)
    // Try to set a session cookie. If AUTH_SECRET is missing, still return 201 without cookie.
    try {
      const secret = getSecret();
      const payload = `${insertId}:${Date.now()}`;
      const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const token = `${payload}:${sig}`;
      const response = NextResponse.json({ id: insertId }, { status: 201 });
      response.cookies.set('session', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === 'production' });
      return response;
    } catch (e: any) {
      // Missing secret: return success, but without cookie so the client can redirect to login.
      return NextResponse.json({ id: insertId, warning: 'Account created. Set AUTH_SECRET to enable auto-login.' }, { status: 201 });
    }
  } catch (error: any) {
    console.error('POST /api/auth/register error', { message: error?.message, code: error?.code });
    // Common MySQL issues
    if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
      return NextResponse.json({ error: 'Database access denied. Check MYSQL_USER/MYSQL_PASSWORD.' }, { status: 500 });
    }
    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: 'Cannot connect to MySQL. Check MYSQL_HOST/MYSQL_PORT.' }, { status: 500 });
    }
    if (error?.message?.includes('Missing required env var')) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
