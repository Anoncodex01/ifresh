import { execute, query } from '@/lib/db';

async function ensureLoyaltyTables() {
  // Ledger tracks awarded points per order to prevent duplicates and allow reversals
  await execute(`CREATE TABLE IF NOT EXISTS points_ledger (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NULL,
    order_id INT UNSIGNED NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE KEY uniq_order_reason (order_id, reason)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  // Ensure points column on customers
  try { await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0`); } catch {}
}

function calculateEligiblePoints({ subtotal, deliveryFee, discount, items }:{
  subtotal: number; // sum of item lines before discounts
  deliveryFee: number;
  discount: number; // full order-level discounts
  items: Array<{ lineTotal: number; discounted?: boolean; isGiftCard?: boolean }>
}) {
  // Exclude delivery
  let eligible = 0;
  for (const it of items) {
    if (it.isGiftCard) continue;
    if (it.discounted) continue;
    eligible += Number(it.lineTotal || 0);
  }
  // Subtract proportional share of discount from eligible pool
  const totalLines = items.reduce((s, it)=> s + Number(it.lineTotal||0), 0);
  if (eligible > 0 && discount > 0 && totalLines > 0) {
    const ratio = eligible / totalLines;
    eligible = Math.max(0, eligible - discount * ratio);
  }
  // Earn rate: 50 points per 50,000 TZS => 0.001 points per TZS
  const points = Math.floor(eligible * 0.001);
  return { eligible: Math.floor(eligible), points };
}

export async function awardPointsForDeliveredOrder(orderId: number) {
  await ensureLoyaltyTables();
  // fetch order and items
  const rows = await query<any>(`SELECT id, phone, email, delivery_fee, subtotal, discount, total FROM orders WHERE id = ? LIMIT 1`, [orderId]);
  if (!rows.length) return { ok:false, error:'order not found' };
  const o = rows[0];
  const items = await query<any>(`SELECT product_id, product_name, unit_price, quantity, line_total FROM order_items WHERE order_id = ?`, [orderId]);
  const mapped = items.map((it:any)=>({ lineTotal: Number(it.line_total||0), discounted: false, isGiftCard: false }));

  const { points } = calculateEligiblePoints({
    subtotal: Number(o.subtotal||0),
    deliveryFee: Number(o.delivery_fee||0),
    discount: Number(o.discount||0),
    items: mapped,
  });
  if (points <= 0) return { ok:true, points: 0 };

  // resolve customer by email/phone
  const cust = await query<any>(`SELECT id, points FROM customers WHERE (email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?) LIMIT 1`, [o.email||'', o.phone||'']);
  if (!cust.length) return { ok:false, error:'customer not found for order' };
  const customerId = cust[0].id;

  // guard duplicate award via ledger unique key
  await execute(`INSERT IGNORE INTO points_ledger (customer_id, order_id, points, reason) VALUES (?,?,?,'order_delivered')`, [customerId, orderId, points]);
  // rows affected? If not 1, already awarded
  const awarded = await query<any>(`SELECT SUM(points) as p FROM points_ledger WHERE order_id = ? AND reason = 'order_delivered'`, [orderId]);
  if (!awarded.length || Number(awarded[0].p||0) === 0) return { ok:true, points: 0 };

  await execute(`UPDATE customers SET points = points + ? WHERE id = ?`, [points, customerId]);
  return { ok:true, points };
}

export async function reversePointsForCancelledOrder(orderId: number) {
  await ensureLoyaltyTables();
  const rows = await query<any>(`SELECT id FROM points_ledger WHERE order_id = ? AND reason = 'order_delivered'`, [orderId]);
  if (!rows.length) return { ok:true, reversed: 0 };

  // find customer
  const custRow = await query<any>(`SELECT customer_id, points FROM points_ledger WHERE order_id = ? AND reason = 'order_delivered' LIMIT 1`, [orderId]);
  const customerId = custRow?.[0]?.customer_id;
  if (!customerId) return { ok:true, reversed: 0 };

  const sumRow = await query<any>(`SELECT SUM(points) as p FROM points_ledger WHERE order_id = ? AND reason = 'order_delivered'`, [orderId]);
  const pts = Number(sumRow?.[0]?.p || 0);
  if (pts <= 0) return { ok:true, reversed: 0 };

  await execute(`UPDATE customers SET points = GREATEST(0, points - ?) WHERE id = ?`, [pts, customerId]);
  // keep the ledger rows for audit; add a reversal entry (optional)
  await execute(`INSERT INTO points_ledger (customer_id, order_id, points, reason) VALUES (?,?,?, 'order_cancelled_reversal')`, [customerId, orderId, -pts]);
  return { ok:true, reversed: pts };
}

// Compute redeemable points within last 12 months minus already redeemed in that period
export async function getRedeemablePoints(customerId: number) {
  await ensureLoyaltyTables();
  // earned in last 12 months
  const earned = await query<any>(
    `SELECT COALESCE(SUM(points),0) AS p FROM points_ledger WHERE customer_id = ? AND reason IN ('order_delivered','ref_bonus') AND created_at >= (CURRENT_DATE - INTERVAL 12 MONTH)`,
    [customerId]
  );
  const redeemed = await query<any>(
    `SELECT COALESCE(SUM(-points),0) AS p FROM points_ledger WHERE customer_id = ? AND reason = 'redeem' AND created_at >= (CURRENT_DATE - INTERVAL 12 MONTH)`,
    [customerId]
  );
  const redeemable = Math.max(0, Number(earned?.[0]?.p || 0) - Number(redeemed?.[0]?.p || 0));
  return redeemable;
}

// Redeem points for an order (records negative ledger and deducts from customers.points)
export async function redeemPointsForOrder(orderId: number, customerId: number, points: number) {
  await ensureLoyaltyTables();
  const p = Math.floor(Number(points || 0));
  if (p <= 0) return { ok:true, redeemed: 0 };
  await execute(`INSERT INTO points_ledger (customer_id, order_id, points, reason) VALUES (?,?,?,'redeem')`, [customerId, orderId, -p]);
  await execute(`UPDATE customers SET points = GREATEST(0, points - ?) WHERE id = ?`, [p, customerId]);
  return { ok:true, redeemed: p };
}

// Re-credit redeemed points on cancellation
export async function recreditRedeemedPointsOnCancel(orderId: number) {
  await ensureLoyaltyTables();
  const row = await query<any>(`SELECT customer_id, COALESCE(SUM(-points),0) AS used FROM points_ledger WHERE order_id = ? AND reason = 'redeem'`, [orderId]);
  const customerId = row?.[0]?.customer_id;
  const used = Number(row?.[0]?.used || 0);
  if (!customerId || used <= 0) return { ok:true, recredited: 0 };
  await execute(`UPDATE customers SET points = points + ? WHERE id = ?`, [used, customerId]);
  await execute(`INSERT INTO points_ledger (customer_id, order_id, points, reason) VALUES (?,?,?,'redeem_cancelled_recredit')`, [customerId, orderId, used]);
  return { ok:true, recredited: used };
}
