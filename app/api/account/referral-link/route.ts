import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

async function ensureUserReferralColumns() {
  try {
    const cols = await query<any>(`SELECT COLUMN_NAME as name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`);
    const set = new Set((cols || []).map((c:any)=>String(c.name).toLowerCase()));
    if (!set.has('referral_code')) await execute(`ALTER TABLE users ADD COLUMN referral_code VARCHAR(16) UNIQUE NULL`);
    if (!set.has('referred_by')) await execute(`ALTER TABLE users ADD COLUMN referred_by VARCHAR(16) NULL`);
    if (!set.has('points')) await execute(`ALTER TABLE users ADD COLUMN points INT NOT NULL DEFAULT 0`);
  } catch {}
}

function genCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

export async function GET(req: NextRequest) {
  try {
    await ensureUserReferralColumns();
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get('userId'));
    if (!userId) return NextResponse.json({ ok:false, error:'userId required' }, { status: 400 });

    const rows = await query<any>(`SELECT id, referral_code FROM users WHERE id = ?`, [userId]);
    if (!rows.length) return NextResponse.json({ ok:false, error:'user not found' }, { status: 404 });
    let code = rows[0].referral_code as string | null;

    if (!code) {
      // generate unique
      for (let i=0;i<5;i++) {
        const candidate = genCode(8);
        const exist = await query<any>(`SELECT id FROM users WHERE referral_code = ? LIMIT 1`, [candidate]);
        if (!exist.length) { code = candidate; break; }
      }
      if (!code) code = genCode(10);
      await execute(`UPDATE users SET referral_code = ? WHERE id = ?`, [code, userId]);
    }

    const domain = process.env.NEXT_PUBLIC_SITE_URL || 'https://ifresh.co.tz';
    const url = `${domain.replace(/\/$/, '')}/r/${code}`;
    return NextResponse.json({ ok:true, code, url });
  } catch (e:any) {
    console.error('GET /api/account/referral-link error', e?.message);
    return NextResponse.json({ ok:false }, { status: 500 });
  }
}
