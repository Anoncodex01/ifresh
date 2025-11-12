import { cookies } from 'next/headers';
import crypto from 'crypto';

export type Session = { customerId: number } | null;

function getSecret(): string | null {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || '';
  return s || null;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function readSessionFromCookie(): Session {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return null;

    const parts = token.split(':');
    const secret = getSecret();

    if (parts.length === 3 && secret) {
      const [idStr, tsStr, sig] = parts;
      const payload = `${idStr}:${tsStr}`;
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      if (!safeEqual(expected, sig)) return null;
      const id = Number(idStr);
      if (!Number.isFinite(id)) return null;
      return { customerId: id };
    }

    // Dev fallback: if no secret and token looks like 'id:ts', accept when not in production
    if (!secret && process.env.NODE_ENV !== 'production' && parts.length === 2) {
      const id = Number(parts[0]);
      if (!Number.isFinite(id)) return null;
      return { customerId: id };
    }

    return null;
  } catch {
    return null;
  }
}
