import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

function getSecret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!s) throw new Error('AUTH_SECRET is required');
  return s;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const test = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  if (hash.length !== test.length) return false;
  let result = 0;
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ test.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phoneOrEmail, password } = body || {};
    if (!phoneOrEmail || !password) {
      return NextResponse.json({ error: 'phoneOrEmail and password are required' }, { status: 400 });
    }

    const rows = await query<any>(
      `SELECT id, full_name, phone, email, password_hash FROM customers WHERE phone = ? OR email = ? LIMIT 1`,
      [String(phoneOrEmail), String(phoneOrEmail)]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const customer = rows[0];
    const passwordHash = String(customer.password_hash || '');
    if (!passwordHash) {
      console.error('Customer has no password hash:', customer.id);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (!verifyPassword(String(password), passwordHash)) {
      console.error('Password verification failed for customer:', customer.id);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Try to set cookie; if secret missing, still return success without cookie
    try {
      const secret = getSecret();
      const payload = `${customer.id}:${Date.now()}`;
      const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const token = `${payload}:${sig}`;
      const res = NextResponse.json({ id: customer.id, name: customer.full_name }, { status: 200 });
      res.cookies.set('session', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === 'production' });
      return res;
    } catch {
      // Dev fallback: set an unsigned cookie 'id:timestamp' to simplify local testing
      const payload = `${customer.id}:${Date.now()}`;
      const res = NextResponse.json({ id: customer.id, name: customer.full_name, warning: 'Dev mode cookie issued without signature. Set AUTH_SECRET for signed cookies.' }, { status: 200 });
      if (process.env.NODE_ENV !== 'production') {
        res.cookies.set('session', payload, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30, secure: false });
      }
      return res;
    }
  } catch (e: any) {
    console.error('POST /api/auth/login error', { message: e?.message, code: e?.code });
    if (e?.code === 'ER_ACCESS_DENIED_ERROR') {
      return NextResponse.json({ error: 'Database access denied. Check MYSQL_USER/MYSQL_PASSWORD.' }, { status: 500 });
    }
    if (e?.code === 'ENOTFOUND' || e?.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: 'Cannot connect to MySQL. Check MYSQL_HOST/MYSQL_PORT.' }, { status: 500 });
    }
    if (e?.message?.includes('Missing required env var')) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
