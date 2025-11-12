import { NextRequest, NextResponse } from 'next/server';
import { getRedeemablePoints } from '@/lib/loyalty';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let customerId = Number(searchParams.get('customerId'));
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    if (!customerId) {
      if (email || phone) {
        const r = await query<any>(`SELECT id FROM customers WHERE (email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?) LIMIT 1`, [email||'', phone||'']);
        if (r?.length) customerId = Number(r[0].id);
      }
    }
    if (!customerId) return NextResponse.json({ ok:false, error:'customer not found' }, { status: 404 });
    const redeemable = await getRedeemablePoints(customerId);
    return NextResponse.json({ ok:true, redeemable });
  } catch (e:any) {
    console.error('GET /api/account/points/redeemable error', e?.message);
    return NextResponse.json({ ok:false, redeemable: 0 }, { status: 200 });
  }
}
