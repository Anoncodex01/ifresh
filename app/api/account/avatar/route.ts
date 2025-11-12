import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { execute, query } from '@/lib/db';

async function ensureAvatarColumns() {
  try { await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_blob LONGBLOB NULL`); } catch {}
  try { await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_mime VARCHAR(64) NULL`); } catch {}
}

// Upload avatar: expects { customerId, dataUrl: 'data:image/png;base64,...' }
export async function POST(req: NextRequest) {
  try {
    await ensureAvatarColumns();
    const body = await req.json().catch(()=>({}));
    let customerId = Number(body.customerId);
    const email: string | undefined = body.email;
    const phone: string | undefined = body.phone;
    const dataUrl: string | undefined = body.dataUrl;
    if (!customerId) {
      if (email || phone) {
        const r = await query<any>(`SELECT id FROM customers WHERE (email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?) LIMIT 1`, [email||'', phone||'']);
        if (r?.length) customerId = Number(r[0].id);
      }
    }
    if (!customerId) return NextResponse.json({ ok:false, error:'customer not found' }, { status: 404 });
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return NextResponse.json({ ok:false, error:'dataUrl required: data:image/*;base64,...' }, { status: 400 });
    }

    const m = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.*)$/);
    if (!m) return NextResponse.json({ ok:false, error:'invalid image data' }, { status: 400 });
    const mime = m[1].replace('jpg','jpeg');
    const b64 = m[2];
    const buf = Buffer.from(b64, 'base64');

    const res = await execute(`UPDATE customers SET avatar_blob = ?, avatar_mime = ? WHERE id = ?`, [buf, mime, customerId]) as any;
    const changed = (res?.affectedRows || res?.rowCount || 0) > 0;
    if (!changed) return NextResponse.json({ ok:false, error:'no row updated (invalid customerId)' }, { status: 404 });
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    console.error('POST /api/account/avatar error', e?.message);
    return NextResponse.json({ ok:false }, { status: 500 });
  }
}

// Get avatar by customerId: /api/account/avatar?customerId=123
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = Number(searchParams.get('customerId'));
    if (!customerId) return NextResponse.json({ ok:false, error:'customerId required' }, { status: 400 });
    await ensureAvatarColumns();
    const rows = await query<any>(`SELECT avatar_blob, avatar_mime FROM customers WHERE id = ? LIMIT 1`, [customerId]);
    if (!rows.length || !rows[0].avatar_blob) return new NextResponse('Not Found', { status: 404 });
    const mime = rows[0].avatar_mime || 'image/jpeg';
    const buf: Buffer = rows[0].avatar_blob as Buffer;
    const body = new Uint8Array(buf);
    return new Response(body, { status: 200, headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' } });
  } catch (e:any) {
    console.error('GET /api/account/avatar error', e?.message);
    return new NextResponse('Server Error', { status: 500 });
  }
}
