import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, context: { params: { code: string } }) {
  const code = context.params.code;
  const res = NextResponse.redirect(new URL('/', _req.url));
  // 30 days referral cookie
  res.cookies.set('ref', code, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
}
