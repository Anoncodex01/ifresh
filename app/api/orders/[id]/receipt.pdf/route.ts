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

    // Dynamically import pdfkit so the app can run without it if not installed
    let PDFDocument: any;
    try {
      // @ts-ignore
      PDFDocument = (await import('pdfkit')).default;
    } catch {
      return NextResponse.json({
        error: 'PDF generator not available. Please install "pdfkit" (npm i pdfkit) to enable PDF receipts.'
      }, { status: 501 });
    }

    const data = await getOrder(orderId);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { order, items } = data;

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Uint8Array[] = [];
    const stream = doc as any;

    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => {
      stream.on('end', () => resolve(Buffer.concat(chunks as any)));
    });

    doc.fontSize(20).text(`Receipt #${order.id} - iFresh`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).fillColor('#64748b').text(`Date: ${new Date(order.created_at).toLocaleString()}`);
    doc.text(`Status: ${order.status} | Payment: ${order.payment_status}${order.paid_at ? ` (paid at ${new Date(order.paid_at).toLocaleString()})` : ''}`);
    doc.moveDown();

    doc.fillColor('#0f172a').fontSize(12).text('Customer');
    doc.fontSize(10).text(`Name: ${order.customer_name}`);
    doc.text(`Phone: ${order.phone}`);
    if (order.email) doc.text(`Email: ${order.email}`);
    doc.text(`Address: ${order.address_line1}${order.city ? ', ' + order.city : ''}`);
    doc.moveDown();

    doc.fontSize(12).text('Items');
    doc.moveDown(0.5);
    items.forEach((it: any) => {
      doc.fontSize(10).text(`${it.product_name}`, { continued: true }).text(`  x${it.quantity}`, { continued: true }).text(`  TSh ${Number(it.line_total).toLocaleString()}`);
    });
    doc.moveDown();

    doc.fontSize(12).text('Totals');
    doc.fontSize(10).text(`Subtotal: TSh ${Number(order.subtotal).toLocaleString()}`);
    doc.text(`Delivery Fee: TSh ${Number(order.delivery_fee).toLocaleString()}`);
    if (Number(order.discount)) doc.text(`Discount: - TSh ${Number(order.discount).toLocaleString()}`);
    doc.fontSize(12).text(`Total: TSh ${Number(order.total).toLocaleString()}`);

    doc.moveDown();
    doc.fontSize(9).fillColor('#64748b').text('Thank you for choosing iFresh.');

    doc.end();
    const buffer = await done;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=receipt-${order.id}.pdf`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
