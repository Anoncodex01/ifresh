import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const promoId = Number(params.id);
    if (isNaN(promoId)) {
      return NextResponse.json({ error: 'Invalid promotion ID' }, { status: 400 });
    }

    // Delete promotion items first (due to foreign key constraint)
    await execute(`DELETE FROM promotion_items WHERE promotion_id = ?`, [promoId]);
    
    // Delete the promotion
    await execute(`DELETE FROM promotions WHERE id = ?`, [promoId]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/admin/promotions/[id] error', error?.message);
    return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const promoId = Number(params.id);
    if (isNaN(promoId)) {
      return NextResponse.json({ error: 'Invalid promotion ID' }, { status: 400 });
    }

    const body = await req.json();
    const { isActive } = body || {};

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    // Update promotion status
    await execute(
      `UPDATE promotions SET is_active = ? WHERE id = ?`,
      [isActive ? 1 : 0, promoId]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/admin/promotions/[id] error', error?.message);
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 });
  }
}
