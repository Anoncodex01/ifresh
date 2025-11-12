import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

// Returns the first active promotion with items and resolved product details
export async function GET() {
  try {
    // Find active promotion based on current date and is_active status
    const promos = await query<any>(
      `SELECT id, name, start_date, end_date, template, config, is_active
       FROM promotions
       WHERE DATE(start_date) <= CURDATE() AND DATE(end_date) >= CURDATE() AND is_active = 1
       ORDER BY start_date DESC, id DESC
       LIMIT 1`
    );
    if (!promos.length) {
      // Fallback: return most recent promotion so UI can still display something
      const latest = await query<any>(
        `SELECT id, name, start_date, end_date, template, config
         FROM promotions ORDER BY id DESC LIMIT 1`
      );
      if (!latest.length) return NextResponse.json({ promotion: null }, { status: 200 });
      promos.push(latest[0]);
    }

    const promo = promos[0];
    const items = await query<any>(
      `SELECT id, promotion_id, product_id, product_name, override_price
       FROM promotion_items WHERE promotion_id = ? ORDER BY id ASC`,
      [promo.id]
    );

    // Resolve product details by product_id where present
    let resolved: any[] = [];
    if (items.length) {
      const ids = items.map((i:any)=> i.product_id).filter((v:any)=> v != null);
      let productsMap: Record<string, any> = {};
      if (ids.length) {
        const placeholders = ids.map(()=> '?').join(',');
        const prows = await query<any>(
          `SELECT id, name, price, image, original_price, discount, discount_type, discount_expiry, category
           FROM products WHERE id IN (${placeholders})`, ids
        );
        for (const p of prows) productsMap[String(p.id)] = p;
      }
      resolved = items.map((it:any) => {
        const p = it.product_id ? productsMap[String(it.product_id)] : null;
        return {
          id: it.id,
          productId: it.product_id,
          productName: it.product_name,
          overridePrice: Number(it.override_price),
          product: p ? {
            id: p.id,
            name: p.name,
            price: Number(p.price),
            image: p.image,
            original_price: p.original_price,
            discount: p.discount,
            discount_type: p.discount_type,
            discount_expiry: p.discount_expiry,
            category: p.category,
          } : null,
        };
      });
    }

    // Use is_active from database
    const isActive = Boolean(promo.is_active);

    return NextResponse.json({
      promotion: {
        id: promo.id,
        name: promo.name,
        startDate: promo.start_date,
        endDate: promo.end_date,
        template: promo.template,
        config: promo.config,
        items: resolved,
        isActive,
      }
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (e:any) {
    console.error('GET /api/promotions error', e?.message);
    return NextResponse.json({ promotion: null }, { status: 200 });
  }
}
