import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Mock products data for when database is not available
const mockProducts = [
  {
    id: 1,
    name: 'Beard Oil',
    category: 'Hair Care',
    tagline: 'Stronger - Thicker - Longer Hair',
    description: 'Premium beard oil for enhanced hair growth and styling. Made with natural ingredients.',
    price: 45000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg',
    stock: 50,
    status: 'active'
  },
  {
    id: 2,
    name: 'Hair Growth Serum',
    category: 'Hair Care',
    tagline: 'Advanced Hair Growth Formula',
    description: 'Professional-grade hair growth serum with proven ingredients.',
    price: 55000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.19.jpeg',
    stock: 30,
    status: 'active'
  },
  {
    id: 3,
    name: 'Beard Balm',
    category: 'Hair Care',
    tagline: 'Styling and Conditioning',
    description: 'All-natural beard balm for styling and conditioning your beard.',
    price: 35000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.20.jpeg',
    stock: 25,
    status: 'active'
  },
  {
    id: 4,
    name: 'Hair Shampoo',
    category: 'Hair Care',
    tagline: 'Gentle Daily Cleansing',
    description: 'Sulfate-free shampoo for daily hair care and maintenance.',
    price: 25000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.21.jpeg',
    stock: 40,
    status: 'active'
  },
  {
    id: 5,
    name: 'Face Moisturizer',
    category: 'Skincare',
    tagline: 'Hydrating Daily Care',
    description: 'Lightweight moisturizer for all skin types.',
    price: 30000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.23.jpeg',
    stock: 35,
    status: 'active'
  },
  {
    id: 6,
    name: 'Vitamin C Serum',
    category: 'Skincare',
    tagline: 'Brightening and Anti-Aging',
    description: 'High-potency vitamin C serum for radiant skin.',
    price: 65000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.24.jpeg',
    stock: 20,
    status: 'active'
  }
];

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
      // Try to find in mock data
      const mockProduct = mockProducts.find(p => p.id === Number(id));
      if (mockProduct) {
        return NextResponse.json({ product: mockProduct }, { status: 200 });
      }
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ product: rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/products/[id] error', { message: error?.message, code: error?.code });
    
    // Fallback to mock data
    const id = params.id;
    const mockProduct = mockProducts.find(p => p.id === Number(id));
    if (mockProduct) {
      return NextResponse.json({ product: mockProduct }, { status: 200 });
    }
    
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
  }
}
