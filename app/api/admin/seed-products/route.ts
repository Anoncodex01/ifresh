import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';

const sampleProducts = [
  {
    name: 'Beard Oil',
    category: 'Hair Care',
    tagline: 'Stronger - Thicker - Longer Hair',
    description: 'Premium beard oil for enhanced hair growth and styling. Made with natural ingredients.',
    price: 45000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg',
    stock: 50
  },
  {
    name: 'Hair Growth Serum',
    category: 'Hair Care',
    tagline: 'Advanced Hair Growth Formula',
    description: 'Professional-grade hair growth serum with proven ingredients.',
    price: 55000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.19.jpeg',
    stock: 30
  },
  {
    name: 'Beard Balm',
    category: 'Hair Care',
    tagline: 'Styling and Conditioning',
    description: 'All-natural beard balm for styling and conditioning your beard.',
    price: 35000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.20.jpeg',
    stock: 25
  },
  {
    name: 'Hair Shampoo',
    category: 'Hair Care',
    tagline: 'Gentle Daily Cleansing',
    description: 'Sulfate-free shampoo for daily hair care and maintenance.',
    price: 25000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.21.jpeg',
    stock: 40
  },
  {
    name: 'Face Moisturizer',
    category: 'Skincare',
    tagline: 'Hydrating Daily Care',
    description: 'Lightweight moisturizer for all skin types.',
    price: 30000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.23.jpeg',
    stock: 35
  },
  {
    name: 'Vitamin C Serum',
    category: 'Skincare',
    tagline: 'Brightening and Anti-Aging',
    description: 'High-potency vitamin C serum for radiant skin.',
    price: 65000,
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.24.jpeg',
    stock: 20
  }
];

export async function POST(req: Request) {
  try {
    // Check if products already exist
    const existingProducts = await query<any>('SELECT COUNT(*) as count FROM products');
    const productCount = existingProducts[0]?.count || 0;
    
    if (productCount > 0) {
      return NextResponse.json({ 
        ok: true, 
        message: `Products already exist (${productCount} products found)` 
      }, { status: 200 });
    }

    // Create products table if it doesn't exist
    await execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        tagline VARCHAR(255) NULL,
        description TEXT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        image VARCHAR(1024) NULL,
        category VARCHAR(100) NULL,
        stock INT UNSIGNED NOT NULL DEFAULT 0,
        status ENUM('active','low_stock','out_of_stock','inactive') NOT NULL DEFAULT 'active',
        original_price DECIMAL(10,2) NULL,
        discount DECIMAL(10,2) NULL,
        discount_type ENUM('percentage','fixed') NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_products_category (category),
        INDEX idx_products_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert sample products
    for (const product of sampleProducts) {
      const normalizedStock = Number(product.stock || 0);
      const computedStatus = normalizedStock <= 0 ? 'out_of_stock' : normalizedStock <= 10 ? 'low_stock' : 'active';
      
      await execute(
        `INSERT INTO products (name, category, tagline, description, price, image, stock, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name,
          product.category,
          product.tagline,
          product.description,
          product.price,
          product.image,
          normalizedStock,
          computedStatus
        ]
      );
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Successfully created ${sampleProducts.length} sample products` 
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/admin/seed-products error', { message: error?.message, code: error?.code });
    return NextResponse.json({ error: 'Failed to seed products' }, { status: 500 });
  }
}
