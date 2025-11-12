import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

async function ensureReminderColumns() {
  try { await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS reminder_opt_in TINYINT(1) NOT NULL DEFAULT 1`); } catch {}
  try { await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_reminder_date DATE NULL`); } catch {}
  try { await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_reminder_note VARCHAR(255) NULL`); } catch {}
  try { await execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_reminder_product_id INT UNSIGNED NULL`); } catch {}
}

export async function GET(req: NextRequest) {
  try {
    await ensureReminderColumns();
    const { searchParams } = new URL(req.url);
    const customerId = Number(searchParams.get('customerId'));
    if (!customerId) return NextResponse.json({ ok:false, error:'customerId required' }, { status: 400 });
    const rows = await query<any>(`SELECT reminder_opt_in, next_reminder_date, next_reminder_note, next_reminder_product_id FROM customers WHERE id = ? LIMIT 1`, [customerId]);
    if (!rows.length) return NextResponse.json({ ok:false, error:'not found' }, { status: 404 });
    return NextResponse.json({ ok:true, reminderOptIn: !!rows[0].reminder_opt_in, nextReminderDate: rows[0].next_reminder_date, note: rows[0].next_reminder_note || '', nextReminderProductId: rows[0].next_reminder_product_id || null });
  } catch (e:any) {
    console.error('GET /api/account/reminder error', e?.message);
    return NextResponse.json({ ok:false }, { status: 500 });
  }
}

// POST { customerId, reminderOptIn?: boolean, nextReminderDate?: string(YYYY-MM-DD), note?: string, nextReminderProductId?: number|null }
export async function POST(req: NextRequest) {
  try {
    await ensureReminderColumns();
    const body = await req.json().catch(()=>({}));
    const customerId = Number(body.customerId);
    const reminderOptIn = body.reminderOptIn;
    const nextReminderDate = body.nextReminderDate;
    const note = typeof body.note === 'string' ? body.note : undefined;
    const nextReminderProductId = body.nextReminderProductId;
    if (!customerId) return NextResponse.json({ ok:false, error:'customerId required' }, { status: 400 });

    const parts: string[] = [];
    const vals: any[] = [];
    if (typeof reminderOptIn === 'boolean') { parts.push('reminder_opt_in = ?'); vals.push(reminderOptIn ? 1 : 0); }
    if (nextReminderDate !== undefined) { parts.push('next_reminder_date = ?'); vals.push(nextReminderDate || null); }
    if (note !== undefined) { parts.push('next_reminder_note = ?'); vals.push(note); }
    if (nextReminderProductId !== undefined) { parts.push('next_reminder_product_id = ?'); vals.push(nextReminderProductId || null); }
    if (!parts.length) return NextResponse.json({ ok:false, error:'nothing to update' }, { status: 400 });

    vals.push(customerId);
    await execute(`UPDATE customers SET ${parts.join(', ')} WHERE id = ?`, vals);
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    console.error('POST /api/account/reminder error', e?.message);
    return NextResponse.json({ ok:false }, { status: 500 });
  }
}
