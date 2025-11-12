import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';

async function ensureCouponsTable() {
  await execute(`CREATE TABLE IF NOT EXISTS coupons (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    type ENUM('percentage','fixed') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    min_spend DECIMAL(10,2) NULL,
    stackable TINYINT(1) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    usage_limit INT UNSIGNED NULL,
    used_count INT UNSIGNED NOT NULL DEFAULT 0,
    expires_at DATETIME NULL,
    promotion_id INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_coupons_code (code),
    INDEX idx_coupons_expiry (expires_at),
    INDEX idx_coupons_active (active),
    INDEX idx_coupons_promotion (promotion_id),
    CONSTRAINT fk_coupons_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

export async function GET() {
  try {
    await ensureCouponsTable();
    const rows = await query<any>(`
      SELECT c.id, c.code, c.type, c.value, c.min_spend, c.stackable, c.active, 
             c.usage_limit, c.used_count, c.expires_at, c.promotion_id, c.created_at,
             p.name as promotion_name
      FROM coupons c
      LEFT JOIN promotions p ON c.promotion_id = p.id
      ORDER BY c.created_at DESC
      LIMIT 50
    `);
    return NextResponse.json({ coupons: rows }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/admin/coupons error', e?.message);
    return NextResponse.json({ error: 'Failed to load coupons' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureCouponsTable();
    const body = await req.json();
    const { 
      code, 
      type, 
      value, 
      min_spend = 0, 
      expires_at, 
      usage_limit = 100, 
      promotion_id = null 
    } = body || {};

    if (!code || !type || !value) {
      return NextResponse.json({ error: 'code, type, and value are required' }, { status: 400 });
    }

    const res = await execute(
      `INSERT INTO coupons (code, type, value, min_spend, expires_at, usage_limit, promotion_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        String(code).toUpperCase(),
        String(type),
        Number(value),
        Number(min_spend),
        expires_at ? new Date(expires_at).toISOString().slice(0, 19).replace('T', ' ') : null,
        Number(usage_limit),
        promotion_id ? Number(promotion_id) : null
      ]
    );

    return NextResponse.json({ id: (res as any).insertId }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/admin/coupons error', e?.message);
    if (e.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
