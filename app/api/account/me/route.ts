import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { readSessionFromCookie } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = readSessionFromCookie();
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await query<any>(
      `SELECT id, full_name, phone, email, region, country, next_order_date, created_at, updated_at
       FROM customers WHERE id = ? LIMIT 1`,
      [session.customerId]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const me = rows[0];

    return NextResponse.json({
      id: me.id,
      fullName: me.full_name,
      phone: me.phone,
      email: me.email,
      region: me.region,
      country: me.country,
      nextOrderDate: me.next_order_date,
      createdAt: me.created_at,
      updatedAt: me.updated_at,
    }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/account/me error', { message: e?.message, code: e?.code });
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
