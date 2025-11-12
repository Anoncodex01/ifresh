import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Number(searchParams.get('limit') || 100));

    // Ensure table exists and has next_order_date
    await execute(`CREATE TABLE IF NOT EXISTS customers (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_order_date DATE NULL`);

    const rows = await query<any>(
      `SELECT c.id, c.full_name, c.phone, c.email, c.region, c.country, c.next_order_date,
              (SELECT COUNT(*) FROM orders o WHERE (o.phone IS NOT NULL AND o.phone = c.phone) OR (o.email IS NOT NULL AND o.email = c.email)) AS orders_count,
              (SELECT COALESCE(SUM(o.total),0) FROM orders o WHERE (o.phone IS NOT NULL AND o.phone = c.phone) OR (o.email IS NOT NULL AND o.email = c.email)) AS total_spent,
              c.created_at, c.updated_at
       FROM customers c
       ORDER BY c.id DESC
       LIMIT ?`,
      [limit]
    );

    const customers = rows.map(r => ({
      id: r.id,
      fullName: r.full_name,
      phone: r.phone,
      email: r.email,
      region: r.region,
      country: r.country,
      nextOrderDate: r.next_order_date,
      ordersCount: Number(r.orders_count || 0),
      totalSpent: Number(r.total_spent || 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ customers }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/admin/customers error', e?.message);
    return NextResponse.json({ error: 'Failed to load customers' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { customerId, nextOrderDate } = body || {};
    if (!customerId) return NextResponse.json({ error: 'customerId required' }, { status: 400 });

    await execute(`UPDATE customers SET next_order_date = ? WHERE id = ?`, [nextOrderDate ? String(nextOrderDate) : null, Number(customerId)]);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error('PATCH /api/admin/customers error', e?.message);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
