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

    // Get customer profile
    const rows = await query<any>(
      `SELECT id, full_name, phone, email FROM customers WHERE id = ? LIMIT 1`,
      [session.customerId]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const c = rows[0];

    // Find orders by phone/email match
    const orders = await query<any>(
      `SELECT id, customer_name, phone, email, address_line1, city, subtotal, delivery_fee, discount, total, status,
              payment_status, receipt_url, created_at
       FROM orders
       WHERE (phone IS NOT NULL AND phone = ?)
          OR (email IS NOT NULL AND email = ?)
       ORDER BY id DESC
       LIMIT 200`,
      [c.phone || '', c.email || '']
    );

    // Fetch items for these orders
    let itemsByOrder: Record<number, any[]> = {};
    if (orders.length) {
      const ids = orders.map((o: any) => o.id);
      const placeholders = ids.map(() => '?').join(',');
      const items = await query<any>(
        `SELECT order_id, product_name, unit_price, quantity, line_total
         FROM order_items
         WHERE order_id IN (${placeholders})
         ORDER BY id ASC`,
        ids
      );
      for (const it of items) {
        const k = Number(it.order_id);
        if (!itemsByOrder[k]) itemsByOrder[k] = [];
        itemsByOrder[k].push({
          name: it.product_name,
          price: Number(it.unit_price),
          quantity: Number(it.quantity),
          lineTotal: Number(it.line_total),
        });
      }
    }

    const out = orders.map((o: any) => ({
      id: o.id,
      total: Number(o.total || 0),
      status: o.status,
      paymentStatus: o.payment_status,
      receiptUrl: o.receipt_url || null,
      createdAt: o.created_at,
      items: itemsByOrder[o.id] || [],
    }));

    return NextResponse.json({ orders: out, customerId: session.customerId }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/account/orders error', { message: e?.message, code: e?.code });
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}
