import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

async function ensureTables() {
  await execute(`CREATE TABLE IF NOT EXISTS price_windows (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    INDEX idx_window_dates (start_date, end_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await execute(`CREATE TABLE IF NOT EXISTS price_window_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    window_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE KEY uniq_window_product (window_id, product_id),
    CONSTRAINT fk_pwi_window FOREIGN KEY (window_id) REFERENCES price_windows(id) ON DELETE CASCADE,
    INDEX idx_pwi_product (product_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

export async function GET() {
  try {
    await ensureTables();
    // latest window + its items
    const rows = await query<any>(`SELECT id, start_date, end_date, created_at FROM price_windows ORDER BY id DESC LIMIT 1`);
    if (!rows.length) return NextResponse.json({ window: null, items: [] }, { status: 200 });
    const window = rows[0];
    const items = await query<any>(`SELECT product_id, price FROM price_window_items WHERE window_id = ? ORDER BY id ASC`, [window.id]);
    return NextResponse.json({ window, items }, { status: 200 });
  } catch (e:any) {
    console.error('GET /api/admin/prices error', e?.message);
    return NextResponse.json({ window: null, items: [] }, { status: 200 });
  }
}

// POST { startDate, endDate, items: [{ productId, price }] }
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const body = await req.json().catch(()=>({}));
    const { startDate, endDate, allowOverlap = false } = body || {};
    let items: Array<{ productId: number; price: number }> = Array.isArray(body?.items) ? body.items : [];
    if (!startDate || !endDate) return NextResponse.json({ ok:false, error:'startDate and endDate required' }, { status: 400 });
    if (!items.length) return NextResponse.json({ ok:false, error:'at least one product required' }, { status: 400 });
    items = items.slice(0, 10).filter(it => Number.isFinite(Number(it.productId)) && Number.isFinite(Number(it.price)) && Number(it.price) >= 0);

    // Prevent overlapping windows unless explicitly allowed
    if (!allowOverlap) {
      const overlap = await query<any>(
        `SELECT COUNT(*) AS cnt FROM price_windows WHERE NOT (end_date < ? OR start_date > ?)`,
        [startDate, endDate]
      );
      if ((overlap?.[0]?.cnt || 0) > 0) {
        return NextResponse.json({ ok:false, error:'Overlapping price window exists' }, { status: 400 });
      }
    }

    const res = await execute(`INSERT INTO price_windows (start_date, end_date) VALUES (?, ?)`, [startDate, endDate]);
    const windowId = (res as any).insertId as number;
    for (const it of items) {
      await execute(`INSERT INTO price_window_items (window_id, product_id, price) VALUES (?,?,?)`, [windowId, Number(it.productId), Number(it.price)]);
    }
    return NextResponse.json({ ok:true, id: windowId }, { status: 200 });
  } catch (e:any) {
    console.error('POST /api/admin/prices error', e?.message);
    return NextResponse.json({ ok:false }, { status: 500 });
  }
}
