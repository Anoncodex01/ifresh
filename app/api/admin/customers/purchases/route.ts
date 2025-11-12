import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = Number(searchParams.get('customerId'));
    if (!customerId) {
      return NextResponse.json({ error: 'customerId required' }, { status: 400 });
    }

    const cust = await query<any>(`SELECT id, phone, email FROM customers WHERE id = ? LIMIT 1`, [customerId]);
    if (!cust.length) return NextResponse.json({ products: [] }, { status: 200 });
    const c = cust[0];

    const rows = await query<any>(
      `SELECT oi.product_name as name, SUM(oi.quantity) as qty, SUM(oi.line_total) as spent
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE (o.phone IS NOT NULL AND o.phone = ?)
          OR (o.email IS NOT NULL AND o.email = ?)
       GROUP BY oi.product_name
       ORDER BY spent DESC
       LIMIT 1000`,
      [c.phone || '', c.email || '']
    );

    return NextResponse.json({ products: rows }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/admin/customers/purchases error', e?.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
