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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_coupons_code (code),
    INDEX idx_coupons_expiry (expires_at),
    INDEX idx_coupons_active (active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

// GET: (optional) list recent coupons (admin tooling)
export async function GET() {
  try {
    await ensureCouponsTable();
    const rows = await query<any>(`SELECT id, code, type, value, min_spend, stackable, active, usage_limit, used_count, expires_at, created_at FROM coupons ORDER BY id DESC LIMIT 50`);
    return NextResponse.json({ coupons: rows }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/coupons error', e?.message);
    return NextResponse.json({ error: 'Failed to load coupons' }, { status: 500 });
  }
}

// POST: validate or create (MVP focuses on validate)
// Payload for validate: { action: 'validate', code: string, cartTotal?: number }
// Optional future action: create/update coupons via same route.
export async function POST(req: Request) {
  try {
    await ensureCouponsTable();
    const body = await req.json();
    const { action, code, cartTotal } = body || {};

    if (action === 'validate') {
      if (!code || typeof code !== 'string') {
        return NextResponse.json({ valid: false, message: 'Coupon code required' }, { status: 400 });
      }
      const rows = await query<any>(`SELECT id, code, type, value, min_spend, stackable, active, usage_limit, used_count, expires_at FROM coupons WHERE code = ?`, [code.trim()]);
      const c = rows?.[0];
      if (!c) return NextResponse.json({ valid: false, message: 'Invalid coupon' }, { status: 200 });

      // Basic checks
      if (!c.active) return NextResponse.json({ valid: false, message: 'Coupon inactive' }, { status: 200 });
      if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ valid: false, message: 'Coupon expired' }, { status: 200 });
      }
      if (c.usage_limit !== null && c.usage_limit !== undefined && Number(c.used_count || 0) >= Number(c.usage_limit)) {
        return NextResponse.json({ valid: false, message: 'Coupon usage limit reached' }, { status: 200 });
      }
      if (c.min_spend && Number(cartTotal || 0) < Number(c.min_spend)) {
        return NextResponse.json({ valid: false, message: `Minimum spend TSh ${Number(c.min_spend).toLocaleString()}` }, { status: 200 });
      }

      return NextResponse.json({
        valid: true,
        code: c.code,
        discountType: c.type,    // 'percentage' | 'fixed'
        discountValue: Number(c.value),
        stackable: Boolean(c.stackable),
        message: 'Coupon valid',
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (e: any) {
    console.error('POST /api/coupons error', e?.message);
    return NextResponse.json({ error: 'Failed to process coupon' }, { status: 500 });
  }
}
