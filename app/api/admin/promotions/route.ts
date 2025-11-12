import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';

async function ensureTables() {
  await execute(`CREATE TABLE IF NOT EXISTS promotions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    template VARCHAR(50) NULL,
    config JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_promotions_dates (start_date, end_date),
    INDEX idx_promotions_active (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // Backfill columns if table existed before templates were added
  try {
    const rows: any[] = await query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='promotions' AND TABLE_SCHEMA = DATABASE()`);
    const cols = new Set(rows.map((r:any)=>r.COLUMN_NAME));
    if (!cols.has('template')) {
      await execute(`ALTER TABLE promotions ADD COLUMN template VARCHAR(50) NULL AFTER end_date`);
    }
    if (!cols.has('config')) {
      await execute(`ALTER TABLE promotions ADD COLUMN config JSON NULL AFTER template`);
    }
    if (!cols.has('is_active')) {
      await execute(`ALTER TABLE promotions ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER config`);
    }
  } catch {}
  await execute(`CREATE TABLE IF NOT EXISTS promotion_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    promotion_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NULL,
    product_name VARCHAR(255) NOT NULL,
    override_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_promo_items_promotion (promotion_id),
    CONSTRAINT fk_promo_items_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

export async function GET() {
  try {
    await ensureTables();
    const promos = await query<any>(`SELECT id, name, start_date, end_date, template, config, is_active, created_at FROM promotions ORDER BY id DESC LIMIT 50`);
    if (!promos.length) return NextResponse.json({ promotions: [] }, { status: 200 });
    const ids = promos.map((p:any)=>p.id);
    const placeholders = ids.map(()=>'?').join(',');
    const items = await query<any>(`SELECT * FROM promotion_items WHERE promotion_id IN (${placeholders}) ORDER BY id ASC`, ids);
    const byPromo: Record<number, any[]> = {};
    for (const it of items) {
      if (!byPromo[it.promotion_id]) byPromo[it.promotion_id] = [];
      byPromo[it.promotion_id].push({
        id: it.id,
        productId: it.product_id,
        productName: it.product_name,
        overridePrice: Number(it.override_price),
      });
    }
    const out = promos.map((p:any)=>({
      id: p.id,
      name: p.name,
      startDate: p.start_date,
      endDate: p.end_date,
      template: p.template || null,
      config: p.config || null,
      isActive: Boolean(p.is_active),
      createdAt: p.created_at,
      items: byPromo[p.id] || [],
    }));
    return NextResponse.json({ promotions: out }, { status: 200 });
  } catch (e:any) {
    console.error('GET /api/admin/promotions', e?.message);
    return NextResponse.json({ error: 'Failed to load promotions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables();
    const body = await req.json();
    const { name, startDate, endDate, items, template = null, config = null } = body || {};
    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'name, startDate, endDate are required' }, { status: 400 });
    }
    const res = await execute(`INSERT INTO promotions (name, start_date, end_date, template, config) VALUES (?, ?, ?, ?, ?)`
      , [String(name), String(startDate), String(endDate), template ? String(template) : null, config ? JSON.stringify(config) : null]);
    const promoId = (res as any).insertId as number;
    if (Array.isArray(items)) {
      for (const it of items) {
        await execute(
          `INSERT INTO promotion_items (promotion_id, product_id, product_name, override_price) VALUES (?, ?, ?, ?)`,
          [promoId, it.productId ? Number(it.productId) : null, String(it.productName), Number(it.overridePrice)]
        );
      }
    }
    return NextResponse.json({ id: promoId }, { status: 201 });
  } catch (e:any) {
    console.error('POST /api/admin/promotions', e?.message);
    return NextResponse.json({ error: 'Failed to save promotion' }, { status: 500 });
  }
}
