import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    // Aggregate customers from orders table (delivery-only flow)
    // Use phone when available as a stable identifier; fallback to email; else name
    const rows = await query<any>(
      `SELECT 
         COALESCE(NULLIF(TRIM(phone),''), NULLIF(TRIM(email),''), NULLIF(TRIM(customer_name),'')) AS customer_key,
         MAX(customer_name) AS name,
         MAX(NULLIF(TRIM(email),'')) AS email,
         MAX(NULLIF(TRIM(phone),'')) AS phone,
         MAX(NULLIF(TRIM(CONCAT_WS(', ', address_line1, address_line2, city)),'')) AS address,
         MIN(created_at) AS join_date,
         MAX(created_at) AS last_order,
         COUNT(*) AS total_orders,
         SUM(total) AS total_spent
       FROM orders
       GROUP BY customer_key
       ORDER BY last_order DESC
       LIMIT 500`);

    const customers = rows
      .filter((r: any) => r.customer_key)
      .map((r: any) => ({
        id: String(r.customer_key),
        name: r.name || 'Guest',
        email: r.email || null,
        phone: r.phone || null,
        address: r.address || null,
        joinDate: r.join_date,
        lastOrder: r.last_order,
        totalOrders: Number(r.total_orders || 0),
        totalSpent: Number(r.total_spent || 0),
        status: 'active',
        segment: (Number(r.total_orders || 0) >= 10 ? 'vip' : Number(r.total_orders || 0) >= 3 ? 'returning' : 'new')
      }));

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/customers error', { message: error?.message, code: error?.code });
    return NextResponse.json({ error: 'Failed to load customers' }, { status: 500 });
  }
}
