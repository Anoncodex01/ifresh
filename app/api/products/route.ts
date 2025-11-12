import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Simple in-memory cache for products
let productsCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Cache helper functions
function getCachedProducts(): any | null {
  if (!productsCache) return null;
  
  const now = Date.now();
  if (now - productsCache.timestamp > CACHE_DURATION) {
    productsCache = null; // Expire cache
    return null;
  }
  
  return productsCache.data;
}

function setCachedProducts(data: any): void {
  productsCache = {
    data,
    timestamp: Date.now()
  };
}

function invalidateCache(): void {
  productsCache = null;
}

type DbProduct = {
	id: string | number;
	name: string;
	tagline?: string | null;
	description?: string | null;
	price: number | string;
	image?: string | null;
	category?: string | null;
};

async function ensureTable() {
    // Create table if missing
    await query(
        `CREATE TABLE IF NOT EXISTS products (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    );

    // Conditionally add columns by checking INFORMATION_SCHEMA to avoid errors across versions
    const dbNameRows = await query<{ db: string }>(`SELECT DATABASE() AS db`);
    const dbName = dbNameRows?.[0]?.db;
    const columnMissing = async (column: string) => {
        if (!dbName) return false;
        const rows = await query<{ cnt: number }>(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = ?`,
            [dbName, column]
        );
        return (rows?.[0]?.cnt || 0) === 0;
    };

    if (await columnMissing('stock')) {
        await execute(`ALTER TABLE products ADD COLUMN stock INT UNSIGNED NOT NULL DEFAULT 0`);
    }
    if (await columnMissing('status')) {
        await execute(`ALTER TABLE products ADD COLUMN status ENUM('active','low_stock','out_of_stock','inactive') NOT NULL DEFAULT 'active'`);
    }
    if (await columnMissing('original_price')) {
        await execute(`ALTER TABLE products ADD COLUMN original_price DECIMAL(10,2) NULL`);
    }
    if (await columnMissing('discount')) {
        await execute(`ALTER TABLE products ADD COLUMN discount DECIMAL(10,2) NULL`);
    }
    if (await columnMissing('discount_type')) {
        await execute(`ALTER TABLE products ADD COLUMN discount_type ENUM('percentage','fixed') NULL`);
    }
    if (await columnMissing('discount_expiry')) {
        await execute(`ALTER TABLE products ADD COLUMN discount_expiry DATE NULL`);
    }
    if (await columnMissing('additional_images')) {
        await execute(`ALTER TABLE products ADD COLUMN additional_images JSON NULL`);
    }

    // Create index on discount_expiry if missing (for filtering/sorting by expiry)
    if (dbName) {
        const idxRows = await query<{ cnt: number }>(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_discount_expiry'`,
            [dbName]
        );
        const missingIdx = (idxRows?.[0]?.cnt || 0) === 0;
        if (missingIdx) {
            await execute(`CREATE INDEX idx_products_discount_expiry ON products (discount_expiry)`);
        }
    }

    // Create additional_images table if it doesn't exist
    await execute(`
        CREATE TABLE IF NOT EXISTS additional_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            image_url VARCHAR(1024) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_additional_images_product_id (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
}

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const limit = searchParams.get('limit');
        const exclude = searchParams.get('exclude');
        const onSale = (searchParams.get('on_sale') || '').toLowerCase() === 'true';
        const sort = (searchParams.get('sort') || '').toLowerCase();
        
        // Check if we can use cached data (only for basic queries without filters)
        const isBasicQuery = !category && !exclude && !onSale && !limit && !sort;
        
        if (isBasicQuery) {
            const cachedData = getCachedProducts();
            if (cachedData) {
                return NextResponse.json(
                    { products: cachedData }, 
                    { 
                        status: 200,
                        headers: {
                            'Cache-Control': 'public, max-age=300', // 5 minutes browser cache
                            'X-Cache': 'HIT'
                        }
                    }
                );
            }
        }
        
        await ensureTable();
        
        let sqlQuery = `SELECT p.id, p.name, p.tagline, p.description, p.price, p.image, p.category, p.stock, p.status,
                               p.original_price, p.discount, p.discount_type, p.discount_expiry,
                               GROUP_CONCAT(ai.image_url) as additional_images
                        FROM products p
                        LEFT JOIN additional_images ai ON p.id = ai.product_id
                        WHERE p.status IN ('active', 'low_stock')
                        GROUP BY p.id`;
        const params: any[] = [];
        
        if (category) {
            sqlQuery += ` AND p.category = ?`;
            params.push(category);
        }
        
        if (exclude) {
            sqlQuery += ` AND p.id != ?`;
            params.push(exclude);
        }
        
        if (onSale) {
            sqlQuery += ` AND p.original_price IS NOT NULL AND p.original_price > p.price AND (p.discount_expiry IS NULL OR p.discount_expiry >= CURDATE())`;
        }

        if (sort === 'expiry_asc') {
            // Order by earliest expiry first; place NULLs last
            sqlQuery += ` ORDER BY (p.discount_expiry IS NULL), p.discount_expiry ASC, p.id DESC`;
        } else {
            sqlQuery += ` ORDER BY p.id DESC`;
        }
        
        if (limit) {
            sqlQuery += ` LIMIT ?`;
            params.push(parseInt(limit));
        } else {
            sqlQuery += ` LIMIT 100`;
        }
        
        const rows = await query<any>(sqlQuery, params);

        // If no products from database, return mock data
        if (rows.length === 0) {
            let filteredProducts = mockProducts;
            
            if (category) {
                filteredProducts = mockProducts.filter(p => p.category === category);
            }
            
            if (exclude) {
                filteredProducts = filteredProducts.filter(p => p.id.toString() !== exclude);
            }

            if (onSale) {
                filteredProducts = filteredProducts.filter((p: any) => Number(p.original_price || 0) > Number(p.price || 0));
            }
            
            const limitNum = limit ? parseInt(limit) : 100;
            if (sort === 'expiry_asc') {
                filteredProducts = [...filteredProducts].sort((a: any, b: any) => {
                    const ax = a.discount_expiry || null; const bx = b.discount_expiry || null;
                    if (ax && bx) return String(ax).localeCompare(String(bx));
                    if (ax && !bx) return -1; if (!ax && bx) return 1; return 0;
                });
            }
            filteredProducts = filteredProducts.slice(0, limitNum);
            
            // Cache mock data for basic queries
            if (isBasicQuery) {
                setCachedProducts(filteredProducts);
            }
            
            return NextResponse.json(
                { products: filteredProducts }, 
                { 
                    status: 200,
                    headers: {
                        'Cache-Control': 'public, max-age=300',
                        'X-Cache': 'MOCK'
                    }
                }
            );
        }

        // Cache database results for basic queries
        if (isBasicQuery) {
            setCachedProducts(rows);
        }

        return NextResponse.json(
            { products: rows }, 
            { 
                status: 200,
                headers: {
                    'Cache-Control': 'public, max-age=300',
                    'X-Cache': 'DB'
                }
            }
        );
    } catch (error: any) {
        console.error('GET /api/products error', { message: error?.message, code: error?.code });
        
        // Try to return cached data if available
        const cachedData = getCachedProducts();
        if (cachedData) {
            return NextResponse.json(
                { products: cachedData }, 
                { 
                    status: 200,
                    headers: {
                        'Cache-Control': 'public, max-age=300',
                        'X-Cache': 'FALLBACK'
                    }
                }
            );
        }
        
        // Return mock data if database fails and no cache
        let filteredProducts = mockProducts;
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const limit = searchParams.get('limit');
        const exclude = searchParams.get('exclude');
        
        if (category) {
            filteredProducts = mockProducts.filter(p => p.category === category);
        }
        
        if (exclude) {
            filteredProducts = filteredProducts.filter(p => p.id.toString() !== exclude);
        }
        
        const limitNum = limit ? parseInt(limit) : 100;
        filteredProducts = filteredProducts.slice(0, limitNum);
        
        return NextResponse.json(
            { products: filteredProducts, warning: 'Using mock data' }, 
            { 
                status: 200,
                headers: {
                    'Cache-Control': 'public, max-age=60',
                    'X-Cache': 'ERROR-FALLBACK'
                }
            }
        );
    }
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const {
			name,
			category = null,
			tagline = null,
			description = null,
			price,
			image = null,
			stock = 0,
			originalPrice = null,
			discount = null,
			discountType = null,
			discountExpiry: discountExpiryInput = null,
			additionalImages = [],
		} = body || {};

		if (!name || price === undefined || price === null || isNaN(Number(price))) {
			return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
		}

		await ensureTable();

		// Normalize category to fixed set
		const mapCategory = (val: any): string | null => {
			if (!val) return null;
			const s = String(val).toLowerCase();
			if (s.includes('beard')) return 'Beard';
			if (s.includes('skin')) return 'Skin';
			if (s.includes('hair')) return 'Hair';
			if (s.includes('salon') || s.includes('saloon')) return 'Saloon solutions';
			return String(val); // keep as provided
		};
		const normalizedCategory = mapCategory(category);

		const normalizedStock = Number(stock || 0);
		const computedStatus = normalizedStock <= 0 ? 'out_of_stock' : normalizedStock <= 10 ? 'low_stock' : 'active';

		// Auto-calc discount percentage and expiry if originalPrice provided and higher than selling price
		let finalOriginal: number | null = originalPrice !== null && originalPrice !== undefined ? Number(originalPrice) : null;
		let finalDiscount: number | null = discount !== null && discount !== undefined ? Number(discount) : null;
		let finalDiscountType: 'percentage' | 'fixed' | null = discountType as any || null;
		let discountExpiry: string | null = discountExpiryInput ? String(discountExpiryInput).slice(0,10) : null;
		if (!discountExpiry && finalOriginal && !isNaN(finalOriginal) && Number(price) && finalOriginal > Number(price)) {
			const pct = Math.round(((finalOriginal - Number(price)) / finalOriginal) * 100);
			finalDiscount = pct;
			finalDiscountType = 'percentage';
			// 30 days from today
			discountExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,10);
		}
		const result = await execute(
			`INSERT INTO products (name, category, tagline, description, price, image, stock, status, original_price, discount, discount_type, discount_expiry)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				String(name),
				normalizedCategory,
				tagline,
				description,
				Number(price),
				image,
				normalizedStock,
				computedStatus,
				finalOriginal !== null && finalOriginal !== undefined ? Number(finalOriginal) : null,
				finalDiscount !== null && finalDiscount !== undefined ? Number(finalDiscount) : null,
				finalDiscountType,
				discountExpiry,
			]
		);

		// Insert additional images into the separate table
		const productId = (result as any).insertId;
		if (additionalImages && additionalImages.length > 0) {
			for (const imageUrl of additionalImages) {
				await execute(
					`INSERT INTO additional_images (product_id, image_url) VALUES (?, ?)`,
					[productId, imageUrl]
				);
			}
		}

		// Invalidate cache when new product is added
		invalidateCache();

		const rows = await query<DbProduct>(
			`SELECT id, name, tagline, description, price, image, category FROM products WHERE id = ?`,
			[(result as any).insertId]
		);

		return NextResponse.json({ product: rows[0] }, { status: 201 });
	} catch (error: any) {
		console.error('POST /api/products error', { message: error?.message, code: error?.code });
		const message = typeof error?.message === 'string' ? error.message : 'Failed to create product';
		const code = error?.code || undefined;
		return NextResponse.json({ error: message, code }, { status: 500 });
	}
}
