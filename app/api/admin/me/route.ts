import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const token = cookies().get('admin_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = verifyToken(token);
    if (!session?.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = await query<any>(`SELECT id, full_name, email, role, created_at FROM admins WHERE id = ? LIMIT 1`, [session.adminId]);
    if (!rows.length) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const a = rows[0];
    return NextResponse.json({ id: a.id, name: a.full_name, email: a.email, role: a.role, createdAt: a.created_at });
  } catch (e: any) {
    console.error('GET /api/admin/me error', { 
      message: e?.message, 
      code: e?.code,
      stack: e?.stack 
    });
    
    // Database connection errors
    if (e?.code === 'ENOTFOUND' || e?.code === 'ECONNREFUSED' || e?.code === 'ETIMEDOUT') {
      return NextResponse.json({ 
        error: 'Database connection failed',
        hint: 'Check database environment variables and firewall settings in Vercel'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch admin data',
      hint: 'Check Vercel function logs for details'
    }, { status: 500 });
  }
}
