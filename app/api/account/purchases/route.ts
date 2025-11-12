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

    // Find customer by id
    const customers = await query<any>(`SELECT id, phone, email FROM customers WHERE id = ? LIMIT 1`, [session.customerId]);
    if (!customers.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const c = customers[0];

    // Get items across all orders for this customer
    const rows = await query<any>(
      `SELECT oi.product_name as name, SUM(oi.quantity) as qty, SUM(oi.line_total) as spent
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE (o.phone IS NOT NULL AND o.phone = ?)
          OR (o.email IS NOT NULL AND o.email = ?)
       GROUP BY oi.product_name
       ORDER BY spent DESC
       LIMIT 500`,
      [c.phone || '', c.email || '']
    );

    const totals = await query<any>(
      `SELECT COUNT(*) as ordersCount, SUM(total) as totalSpent
       FROM orders o
       WHERE (o.phone IS NOT NULL AND o.phone = ?)
          OR (o.email IS NOT NULL AND o.email = ?)`,
      [c.phone || '', c.email || '']
    );

    const stats = { ordersCount: Number(totals[0]?.ordersCount || 0), totalSpent: Number(totals[0]?.totalSpent || 0) };

    return NextResponse.json({ products: rows, stats }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/account/purchases error', e?.message);
    return NextResponse.json({ error: 'Failed to load purchases' }, { status: 500 });
  }
}
