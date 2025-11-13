import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// No mock products - only return database products

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const rows = await query<any>(
      `SELECT id, name, tagline, description, price, image, category, stock, status
       FROM products
       WHERE id = ?
       LIMIT 1`,
      [Number(id)]
    );

    if (!rows || rows.length === 0) {
      // Only return database products - no mock data fallback
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/products/[id] error', { message: error?.message, code: error?.code });
    
    // Return error - no mock data fallback
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
  }
}
