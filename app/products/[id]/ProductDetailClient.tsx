"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, Share2, Plus, Minus, Check, Truck, Shield, RotateCcw, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/contexts/CartContext';
import NewsletterSection from '@/components/NewsletterSection';
import Footer from '@/components/Footer';

interface ProductDetailClientProps {
  productId: string;
}

type ApiProduct = {
  id: number | string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  price: number | string;
  image?: string | null;
  category?: string | null;
  stock?: number | null;
  status?: 'active' | 'low_stock' | 'out_of_stock' | 'inactive' | null;
  original_price?: number | string | null;
  discount?: number | string | null;
  discount_type?: 'percentage' | 'fixed' | null;
  discount_expiry?: string | null;
};

export default function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [similarProducts, setSimilarProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${productId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        if (alive) {
          setProduct(data.product);
          // Fetch similar products based on category
          if (data.product?.category) {
            const similarRes = await fetch(`/api/products?category=${encodeURIComponent(data.product.category)}&limit=4&exclude=${productId}`, { cache: 'no-store' });
            if (similarRes.ok) {
              const similarData = await similarRes.json();
              if (alive) {
                setSimilarProducts(similarData.products || []);
                // If no similar products found, try to get any other products
                if (similarData.products?.length === 0) {
                  const fallbackRes = await fetch(`/api/products?limit=4&exclude=${productId}`, { cache: 'no-store' });
                  if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    if (alive) setSimilarProducts(fallbackData.products || []);
                  }
                }
              }
            }
          } else {
            // If no category, get any other products
            const fallbackRes = await fetch(`/api/products?limit=4&exclude=${productId}`, { cache: 'no-store' });
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              if (alive) setSimilarProducts(fallbackData.products || []);
            }
          }
        }
      } catch {
        if (alive) setProduct(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [productId]);

  const inStock = (product?.status !== 'out_of_stock') && ((product?.stock ?? 0) > 0);
  const stockCount = Math.max(0, Number(product?.stock ?? 0));
  const price = Number(product?.price ?? 0);
  const original = Number((product as any)?.original_price ?? 0);
  const hasDiscount = original > price && price > 0;
  const pct = hasDiscount ? Math.round(((original - price) / original) * 100) : null;
  const expiry = (product as any)?.discount_expiry ? String((product as any).discount_expiry) : null;

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: String(product.id),
        name: product.name,
        tagline: product.tagline || '',
        description: product.description || '',
        price: Number(product.price),
        image: product.image || '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg',
        category: product.category || 'Uncategorized',
      });
    }
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24">
        <div className="container mx-auto px-4 py-16 text-center text-slate-600">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-slate-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link href="/products">
            <Button className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f]">
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-[#f0c770]/20 to-[#b47435]/30 rounded-2xl overflow-hidden relative">
              <img
                src={product.image || '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg'}
                alt={product.name}
                className="w-full h-full object-contain"
              />
              {hasDiscount && (
                <div className="absolute top-3 left-3">
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-md">-{pct}%</span>
                </div>
              )}
            </div>
            
            {/* No gallery yet since API returns a single image field */}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
              {product.tagline && (
                <p className="text-xl text-[#b47435] font-semibold mb-4">{product.tagline}</p>
              )}
            
              {/* Stock status */}
              <div className="flex items-center gap-2 mb-4">
                {inStock ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">In Stock{stockCount ? ` (${stockCount} available)` : ''}</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
                TSh {Number(price).toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-lg text-slate-500 line-through">TSh {Number(original).toLocaleString()}</span>
              )}
            </div>
            {expiry && (
              <div className="text-sm text-slate-600">Offer ends on <span className="font-medium">{expiry}</span></div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-50 transition-colors"
                    disabled={!inStock || (stockCount ? quantity >= stockCount : false)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] h-12 text-lg font-semibold"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={() => {
                    handleAddToCart();
                    // Redirect to checkout
                    window.location.href = '/checkout';
                  }}
                  disabled={!inStock}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-12 text-lg font-semibold"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`h-12 px-4 ${isWishlisted ? 'text-red-500 border-red-500' : ''}`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="outline" className="h-12 px-4">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Quality you can trust</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Fast delivery</span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-[#b47435]" />
                <div>
                  <p className="font-medium">Fast Delivery (1–2 days)</p>
                  <p className="text-sm text-slate-600">Eligible orders deliver in 1–2 days. Free delivery on orders over TSh 50,000.</p>
                </div>

              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#b47435]" />
                <div>
                  <p className="font-medium">Quality Guarantee</p>
                  <p className="text-sm text-slate-600">100% authentic products</p>
                </div>

              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-[#b47435]" />
                <div>
                  <p className="font-medium">Easy Returns</p>
                  <p className="text-sm text-slate-600">30-day return policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="usage">How to Use</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-700 leading-relaxed">
                    {product.description || 'No description provided.'}
                  </p>
                  <p className="text-slate-600">Ingredient information not available.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>How to Use</CardTitle>
                  <CardDescription>Get the best results with proper application</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">
                    Apply as needed to clean, dry beard. Massage gently and style as desired.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                  <CardDescription>No reviews yet</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center pt-4">
                    <Button variant="outline">Be the first to review</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-16 max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {product?.category ? 'Similar Products' : 'Other Products'}
              </h2>
              <p className="text-slate-600">
                {product?.category ? 'You might also like these products' : 'Check out these other products'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((similarProduct) => (
                <Link key={similarProduct.id} href={`/products/${similarProduct.id}`}>
                  <Card className="product-card group cursor-pointer">
                    <div className="aspect-square bg-gradient-to-br from-[#f0c770]/20 to-[#b47435]/30 rounded-t-lg overflow-hidden">
                      <img
                        src={similarProduct.image || '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg'}
                        alt={similarProduct.name}
                        className="product-image group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-[#b47435] transition-colors">
                        {similarProduct.name}
                      </h3>
                      {similarProduct.tagline && (
                        <p className="text-sm text-[#b47435] mb-2 line-clamp-1">
                          {similarProduct.tagline}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
                          TSh {Number(similarProduct.price).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f]"
                          onClick={(e) => {
                            e.preventDefault();
                            addItem({
                              id: String(similarProduct.id),
                              name: similarProduct.name,
                              tagline: similarProduct.tagline || '',
                              description: similarProduct.description || '',
                              price: Number(similarProduct.price),
                              image: similarProduct.image || '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg',
                              category: similarProduct.category || 'Uncategorized',
                            });
                          }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Newsletter Section - Full Width */}
      <NewsletterSection />

      {/* Footer - Full Width */}
      <Footer />
    </div>
  );
}

