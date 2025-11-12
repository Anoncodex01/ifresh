import { NextResponse } from 'next/server';
import { pool, execute, query } from '@/lib/db';
import { awardPointsForDeliveredOrder, reversePointsForCancelledOrder, getRedeemablePoints, redeemPointsForOrder, recreditRedeemedPointsOnCancel } from '@/lib/loyalty';

export const runtime = 'nodejs';

type OrderItem = {
  productId: number | string;
  name: string;
  price: number;
  quantity: number;
};

async function ensureOrderTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      customer_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) NULL,
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255) NULL,
      city VARCHAR(100) NULL,
      notes TEXT NULL,
      delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      status ENUM('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
      payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',
      payment_method VARCHAR(50) NULL,
      location_type ENUM('dar','other') NULL,
      receipt_url VARCHAR(255) NULL,
      paid_at TIMESTAMP NULL,
      promotion_id INT UNSIGNED NULL,
      coupon_code VARCHAR(64) NULL,
      promotion_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_orders_status (status),
      INDEX idx_orders_phone (phone),
      INDEX idx_orders_promotion (promotion_id),
      CONSTRAINT fk_orders_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Ensure new columns exist for older databases
  await execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid'`);
  await execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NULL`);
  await execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_type ENUM('dar','other') NULL`);
  await execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(255) NULL`);
  await execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL`);
  await execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS promotion_id INT UNSIGNED NULL`);
  await execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(64) NULL`);
  await execute(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS promotion_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00`);

  await execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      order_id INT UNSIGNED NOT NULL,
      product_id INT UNSIGNED NULL,
      product_name VARCHAR(255) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      quantity INT UNSIGNED NOT NULL DEFAULT 1,
      line_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_order_items_order_id (order_id),
      CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

export async function GET(req: Request) {
  try {
    await ensureOrderTables();

    const { searchParams } = new URL(req.url);
    const includeItems = searchParams.get('includeItems') === 'true';
    const status = searchParams.get('status');

    const orders = await query<any>(
      `SELECT id, customer_name, phone, email, address_line1, address_line2, city, notes,
              delivery_fee, subtotal, discount, total, status,
              payment_status, payment_method, location_type, receipt_url, paid_at,
              created_at, updated_at
       FROM orders
       ${status ? 'WHERE status = ?' : ''}
       ORDER BY id DESC
       LIMIT 200`,
      status ? [status] : []
    );

    if (!includeItems || !orders.length) {
      return NextResponse.json({ orders }, { status: 200 });
    }

    const ids = orders.map((o: any) => o.id);
    const placeholders = ids.map(() => '?').join(',');
    const items = await query<any>(
      `SELECT order_id, product_id, product_name, unit_price, quantity, line_total
       FROM order_items
       WHERE order_id IN (${placeholders})
       ORDER BY id ASC`,
      ids
    );

    const grouped: Record<number, any[]> = {};
    for (const it of items) {
      const key = Number(it.order_id);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        productId: it.product_id,
        name: it.product_name,
        price: Number(it.unit_price),
        quantity: Number(it.quantity),
        lineTotal: Number(it.line_total),
      });
    }

    const result = orders.map((o: any) => ({
      ...o,
      items: grouped[o.id] || [],
    }));

    return NextResponse.json({ orders: result }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/orders error', { message: error?.message, code: error?.code });
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, paymentStatus, receiptUrl, paymentMethod } = body || {};
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }
    const parts: string[] = [];
    const vals: any[] = [];
    if (status) { parts.push('status = ?'); vals.push(String(status)); }
    if (paymentStatus) { parts.push('payment_status = ?'); vals.push(String(paymentStatus)); }
    if (paymentMethod) { parts.push('payment_method = ?'); vals.push(String(paymentMethod)); }
    if (receiptUrl) { parts.push('receipt_url = ?'); vals.push(String(receiptUrl)); }
    if (paymentStatus === 'paid') { parts.push('paid_at = CURRENT_TIMESTAMP'); }
    if (!parts.length) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    vals.push(Number(orderId));
    await execute(`UPDATE orders SET ${parts.join(', ')} WHERE id = ?`, vals);

    // Loyalty hooks
    if (status === 'delivered') {
      try { await awardPointsForDeliveredOrder(Number(orderId)); } catch (e) { console.warn('award points failed', e); }
    }
    if (status === 'cancelled') {
      try { await reversePointsForCancelledOrder(Number(orderId)); } catch (e) { console.warn('reverse points failed', e); }
      try { await recreditRedeemedPointsOnCancel(Number(orderId)); } catch (e) { console.warn('recredit points failed', e); }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/orders error', { message: error?.message, code: error?.code });
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureOrderTables();

    const body = await req.json();
    const {
      customerName,
      phone,
      email = null,
      addressLine1,
      addressLine2 = null,
      city = null,
      notes = null,
      deliveryFee = 0,
      subtotal,
      discount = 0,
      total,
      items,
      locationType = null,
      paymentMethod = null,
      redeemedPoints: requestedRedeemedPoints,
    } = body || {};

    if (!customerName || !phone || !addressLine1) {
      return NextResponse.json({ error: 'Missing required customer fields' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must include at least one item' }, { status: 400 });
    }

    const numericSubtotal = Number(subtotal || 0);
    let numericDiscount = Number(discount || 0);
    const numericDelivery = Number(deliveryFee || 0);
    let numericTotal = Number(total || 0);
    let pointsDiscountTZS = 0;
    let appliedRedeemedPoints = 0;

    // Basic totals validation
    if (numericTotal !== +(numericSubtotal - numericDiscount + numericDelivery).toFixed(2)) {
      // do not block, but log discrepancy
      console.warn('Order total mismatch', { numericSubtotal, numericDiscount, numericDelivery, numericTotal });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Load active price window (if any)
      let windowPriceByProduct: Record<number, number> = {};
      try {
        const active = await query<any>(
          `SELECT id FROM price_windows WHERE start_date <= CURDATE() AND end_date >= CURDATE() ORDER BY id DESC LIMIT 1`
        );
        if (active?.length) {
          const winId = active[0].id;
          const rows = await query<any>(`SELECT product_id, price FROM price_window_items WHERE window_id = ?`, [winId]);
          for (const r of rows) windowPriceByProduct[Number(r.product_id)] = Number(r.price);
        }
      } catch {}

      // Attempt to apply points redemption (server-clamped) BEFORE creating order
      try {
        const cust = await query<any>(`SELECT id FROM customers WHERE (email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?) LIMIT 1`, [email||'', phone||'']);
        const customerId = cust?.[0]?.id ? Number(cust[0].id) : null;
        if (customerId && Number(requestedRedeemedPoints||0) >= 500) {
          const redeemable = await getRedeemablePoints(customerId);
          const reqPts = Math.floor(Number(requestedRedeemedPoints));
          const clampedToStep = Math.floor(reqPts / 100) * 100; // step 100
          const capByBalance = Math.min(clampedToStep, Math.floor(redeemable / 100) * 100);
          const maxByAmountTZS = Math.max(0, Math.floor((numericSubtotal - numericDiscount) / 1000) * 1000);
          const maxByAmountPts = Math.floor(maxByAmountTZS / 10); // 100 pts => 1000 tzs
          appliedRedeemedPoints = Math.min(capByBalance, maxByAmountPts);
          if (appliedRedeemedPoints >= 500) {
            pointsDiscountTZS = Math.floor(appliedRedeemedPoints / 100) * 1000;
            numericDiscount += pointsDiscountTZS;
            numericTotal = +(numericSubtotal - numericDiscount + numericDelivery).toFixed(2);
          } else {
            appliedRedeemedPoints = 0;
            pointsDiscountTZS = 0;
          }
        }
      } catch {}

      const [orderResult] = await conn.execute(
        `INSERT INTO orders (customer_name, phone, email, address_line1, address_line2, city, notes, delivery_fee, subtotal, discount, total, status, payment_status, payment_method, location_type, promotion_id, coupon_code, promotion_discount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?, ?, ?, ?)`,
        [
          String(customerName),
          String(phone),
          email ? String(email) : null,
          String(addressLine1),
          addressLine2 ? String(addressLine2) : null,
          city ? String(city) : null,
          notes ? String(notes) : null,
          numericDelivery,
          numericSubtotal,
          numericDiscount,
          numericTotal,
          paymentMethod ? String(paymentMethod) : null,
          locationType ? String(locationType) : null,
          null, // promotion_id - will be set if promotion is active
          null, // coupon_code - will be set if coupon is applied
          pointsDiscountTZS,    // use promotion_discount to store points discount amount (TZS)
        ]
      );

      const orderId = (orderResult as any).insertId as number;

      for (const it of items as OrderItem[]) {
        let unit = Number(it.price || 0);
        const qty = Math.max(1, Number(it.quantity || 1));
        const line = +(unit * qty).toFixed(2);
        const pid = isNaN(Number(it.productId)) ? null : Number(it.productId);

        // Override with active window price if available
        if (pid !== null && windowPriceByProduct[pid] !== undefined) {
          unit = Number(windowPriceByProduct[pid]);
        }

        await conn.execute(
          `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, pid, String(it.name), unit, qty, +(unit * qty).toFixed(2)]
        );

        // Optional: reduce stock if product_id is known
        if (pid !== null) {
          await conn.execute(
            `UPDATE products SET stock = GREATEST(0, stock - ?) , status = CASE WHEN stock - ? <= 0 THEN 'out_of_stock' WHEN stock - ? <= 10 THEN 'low_stock' ELSE 'active' END WHERE id = ?`,
            [qty, qty, qty, pid]
          );
        }
      }

      // set a simple receipt_url
      const receiptUrl = `/api/orders/${orderId}/receipt`;
      await conn.execute(`UPDATE orders SET receipt_url = ? WHERE id = ?`, [receiptUrl, orderId]);

      // If discount/total were changed after insert, persist (normally already set via insert above)
      await conn.execute(`UPDATE orders SET discount = ?, total = ? WHERE id = ?`, [numericDiscount, numericTotal, orderId]);

      // Record redemption ledger after items are saved
      try {
        if (appliedRedeemedPoints > 0) {
          const cust = await query<any>(`SELECT id FROM customers WHERE (email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?) LIMIT 1`, [email||'', phone||'']);
          const customerId = cust?.[0]?.id ? Number(cust[0].id) : null;
          if (customerId) {
            await redeemPointsForOrder(orderId, customerId, appliedRedeemedPoints);
          }
        }
      } catch {}

      await conn.commit();
      return NextResponse.json({ orderId, receiptUrl }, { status: 201 });
    } catch (e) {
      await (conn as any).rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error('POST /api/orders error', { message: error?.message, code: error?.code });
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
