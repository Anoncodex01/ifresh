import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  // Clear cookie by setting empty value and maxAge 0
  res.cookies.set('session', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0, secure: process.env.NODE_ENV === 'production' });
  return res;
}
