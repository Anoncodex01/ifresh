import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

async function ensurePointsColumn() {
  try {
    await execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0`);
  } catch {}
  try {
    await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0`);
  } catch {}
}

export async function GET(req: NextRequest) {
  try {
    await ensurePointsColumn();
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get('userId'));
    const customerId = Number(searchParams.get('customerId'));
    if (!userId && !customerId) return NextResponse.json({ ok: false, error: 'userId or customerId required' }, { status: 400 });
    let points = 0;
    if (customerId) {
      const r1 = await query<any>(`SELECT points FROM customers WHERE id = ?`, [customerId]);
      if (r1?.length) points = Number(r1[0].points || 0);
    }
    if (!points && userId) {
      const r2 = await query<any>(`SELECT points FROM users WHERE id = ?`, [userId]);
      if (r2?.length) points = Number(r2[0].points || 0);
    }
    return NextResponse.json({ ok: true, points: Number(points) });
  } catch (e:any) {
    console.error('GET /api/account/points error', e?.message);
    return NextResponse.json({ ok: false, points: 0 }, { status: 200 });
  }
}
