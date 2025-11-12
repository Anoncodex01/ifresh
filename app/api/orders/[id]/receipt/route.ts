import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

async function getOrder(id: number) {
  const rows = await query<any>(
    `SELECT id, customer_name, phone, email, address_line1, address_line2, city, notes,
            delivery_fee, subtotal, discount, total, status, payment_status, payment_method,
            location_type, created_at, paid_at
     FROM orders WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) return null;
  const items = await query<any>(
    `SELECT product_name, unit_price, quantity, line_total FROM order_items WHERE order_id = ? ORDER BY id ASC`,
    [id]
  );
  return { order: rows[0], items };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number(params.id);
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    }
    const data = await getOrder(orderId);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { order, items } = data;

    const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<title>Receipt #${order.id} - iFresh</title>
<style>
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.5;color:#0f172a;padding:24px}
  h1{font-size:20px;margin:0 0 8px}
  .muted{color:#64748b}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left}
  .right{text-align:right}
  .total{font-weight:700}
</style>
</head>
<body>
  <h1>Receipt #${order.id}</h1>
  <div class="muted">Date: ${new Date(order.created_at).toLocaleString()}</div>
  <div class="muted">Status: ${order.status} | Payment: ${order.payment_status}${order.paid_at ? ` (paid at ${new Date(order.paid_at).toLocaleString()})` : ''}</div>
  <hr />
  <p><strong>Customer:</strong> ${order.customer_name}<br/>
     <strong>Phone:</strong> ${order.phone}${order.email ? ` | <strong>Email:</strong> ${order.email}`:''}<br/>
     <strong>Address:</strong> ${order.address_line1}${order.city?`, ${order.city}`:''}
  </p>
  <table>
    <thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Unit</th><th class="right">Line</th></tr></thead>
    <tbody>
      ${items.map((it:any)=>`<tr><td>${it.product_name}</td><td class=right>${it.quantity}</td><td class=right>TSh ${Number(it.unit_price).toLocaleString()}</td><td class=right>TSh ${Number(it.line_total).toLocaleString()}</td></tr>`).join('')}
    </tbody>
    <tfoot>
      <tr><td colspan="3" class="right">Subtotal</td><td class="right">TSh ${Number(order.subtotal).toLocaleString()}</td></tr>
      <tr><td colspan="3" class="right">Delivery Fee</td><td class="right">TSh ${Number(order.delivery_fee).toLocaleString()}</td></tr>
      ${Number(order.discount) ? `<tr><td colspan="3" class="right">Discount</td><td class="right">- TSh ${Number(order.discount).toLocaleString()}</td></tr>`:''}
      <tr><td colspan="3" class="right total">Total</td><td class="right total">TSh ${Number(order.total).toLocaleString()}</td></tr>
    </tfoot>
  </table>
  <p class="muted">Thank you for choosing iFresh.</p>
</body></html>`;

    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to render receipt' }, { status: 500 });
  }
}
