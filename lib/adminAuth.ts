import crypto from 'crypto';

export type AdminSession = { adminId: number } | null;

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

export function signToken(id: number): string {
  const ts = Date.now();
  const payload = `${id}:${ts}`;
  const secret = getSecret();
  if (!secret) return payload; // dev fallback
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

export function verifyToken(raw: string): AdminSession {
  try {
    const parts = raw.split(':');
    const secret = getSecret();
    if (secret && parts.length === 3) {
      const [idStr, tsStr, sig] = parts;
      const payload = `${idStr}:${tsStr}`;
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      if (!safeEqual(expected, sig)) return null;
      const id = Number(idStr);
      return Number.isFinite(id) ? { adminId: id } : null;
    }
    if (!secret && process.env.NODE_ENV !== 'production' && parts.length === 2) {
      const id = Number(parts[0]);
      return Number.isFinite(id) ? { adminId: id } : null;
    }
    return null;
  } catch {
    return null;
  }
}
