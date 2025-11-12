import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { query } from '@/lib/db';

// Manual campaign sender from Admin panel
// POST body: { subject: string; html: string; to?: string[] | 'all'; segment?: 'all'|'reminder_today'|'day_25'; template?: 'ifresh_day' }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subject = String(body.subject || '').trim();
    const html = String(body.html || '').trim();
    const to = body.to as string[] | 'all' | undefined;
    const segment = (body.segment || 'all') as 'all'|'reminder_today'|'day_25';
    const template = body.template as 'ifresh_day' | undefined;

    if (!subject || !html) {
      return NextResponse.json({ ok: false, error: 'subject and html are required' }, { status: 400 });
    }

    // Determine recipient list (prefer customers table)
    type Cust = { email: string; full_name: string | null };
    let customers: Cust[] = [];
    if (segment === 'reminder_today') {
      customers = await query<Cust>(`SELECT email, full_name FROM customers WHERE email IS NOT NULL AND email <> '' AND next_reminder_date = CURDATE()`);
    } else if (segment === 'day_25') {
      customers = await query<Cust>(`SELECT email, full_name FROM customers WHERE email IS NOT NULL AND email <> ''`);
      // Caller should ideally send only on 25th; we won't block here
    } else if (to === 'all') {
      customers = await query<Cust>(`SELECT email, full_name FROM customers WHERE email IS NOT NULL AND email <> ''`);
    } else if (Array.isArray(to)) {
      customers = to.filter(Boolean).map((e: string) => ({ email: e, full_name: null }));
    } else {
      return NextResponse.json({ ok: false, error: 'provide to:[...] or to:"all" or segment' }, { status: 400 });
    }

    // Optional: apply template preset
    let subj = subject;
    let baseHtml = html;
    if (template === 'ifresh_day') {
      subj = 'Monthly Reminder – It\'s iFresh Day!';
      baseHtml = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>Hi [Customer Name],</h2>
          <p>It\'s the 25th - your perfect day to refresh your beard care routine with iFresh!</p>
          <p>Place your order today and enjoy:</p>
          <ul>
            <li>Fresh stock of your favorite products</li>
            <li>Loyalty points on every purchase</li>
            <li>Fast delivery, wherever you are</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/products" style="display:inline-block;background:#b47435;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Shop Now</a></p>
          <p>Thank you for being part of the iFresh family!</p>
        </div>`;
    }

    const recipients = customers.map(c => c.email).filter(Boolean);
    if (!recipients.length) {
      return NextResponse.json({ ok: false, error: 'no recipients found' }, { status: 400 });
    }

    // Personalize by sending one-by-one to substitute [Customer Name]
    let sent = 0;
    for (const c of customers) {
      const personalizedHtml = baseHtml.replaceAll('[Customer Name]', c.full_name || 'there');
      await sendEmail({ to: [c.email], subject: subj, html: personalizedHtml });
      sent += 1;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (e: any) {
    console.error('POST /api/admin/email/send error', e?.message);
    return NextResponse.json({ ok: false, error: 'send failed' }, { status: 500 });
  }
}
