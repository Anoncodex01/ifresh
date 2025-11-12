"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, SlidersHorizontal, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NewsletterSection from '@/components/NewsletterSection';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams?.get('q') ?? '';
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popularity'); // 'ending-soon' supported
  // absolute TZS slider [min, max], default max 300000
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300000]);
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState([]);
  const [onSale, setOnSale] = useState(false);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [priceWindow, setPriceWindow] = useState<{ start_date: string; end_date: string } | null>(null);
  const [priceOverrides, setPriceOverrides] = useState<Record<number, number>>({});
  const [products, setProducts] = useState<Array<{
    id: string | number;
    name: string;
    tagline?: string | null;
    description?: string | null;
    price: number | string;
    image?: string | null;
    category?: string | null;
    stock?: number;
    status?: 'active' | 'low_stock' | 'out_of_stock' | 'inactive';
  }>>([]);

  // Sample products for display - exactly 3 products
  const sampleProducts = [
    {
      id: "sample-1",
      name: "Premium Beard Oil",
      tagline: "24/7 Hydration",
      description: "Lightweight, fast-absorbing blend of natural oils that hydrate, soften, and strengthen your beard from root to tip.",
      price: "45,000",
      originalPrice: "50,000",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.35.jpeg",
      category: "Beard Oil",
      stock: 50,
      status: "active" as const
    },
    {
      id: "sample-2", 
      name: "Beard Balm",
      tagline: "Style & Nourish",
      description: "Perfect for styling and conditioning your beard. Provides hold while keeping your beard soft and manageable.",
      price: "35,000",
      originalPrice: "40,000",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg",
      category: "Beard Care",
      stock: 30,
      status: "active" as const
    },
    {
      id: "sample-3",
      name: "Beard Wash",
      tagline: "Deep Clean Formula", 
      description: "Gentle yet effective beard wash that removes dirt, oil, and product buildup while keeping your beard soft and healthy.",
      price: "25,000",
      originalPrice: "30,000",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.19.jpeg",
      category: "Beard Care",
      stock: 40,
      status: "active" as const
    }
  ];
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [shareProduct, setShareProduct] = useState<any>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>(() => ({ show: false, message: '' }));

  // Keep search input in sync with URL changes
  useEffect(() => {
    const q = searchParams?.get('q') ?? '';
    setSearchQuery(q);
  }, [searchParams]);

  // Load products from API (supports on_sale, sort=expiry_asc, category)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const qs = new URLSearchParams();
        if (onSale) qs.set('on_sale', 'true');
        if (sortBy === 'ending-soon') qs.set('sort', 'expiry_asc');
        if (selectedCategory !== 'all') qs.set('category', selectedCategory);
        const url = qs.toString() ? `/api/products?${qs.toString()}` : '/api/products';
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json().catch(() => ({ products: [] }));
        if (alive) {
          const apiProducts = Array.isArray(data.products) ? data.products : [];
          // Use sample products if no API products are available
          setProducts(apiProducts.length > 0 ? apiProducts : sampleProducts);
        }
      } catch {
        if (alive) setProducts(sampleProducts);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [onSale, sortBy, selectedCategory]);

  // Load promotions for sidebar display
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/promotions', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setPromotions(data.promotions || []);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  // Detect login status for share gating
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/account/me', { cache: 'no-store', credentials: 'include' });
        if (!alive) return;
        setIsAuthenticated(res.ok);
      } catch {
        if (alive) setIsAuthenticated(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load active admin price window for display overrides
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/prices', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json().catch(()=>({ window:null, items:[] }));
        if (!data?.window) { if (alive) { setPriceWindow(null); setPriceOverrides({}); } return; }
        const s = String(data.window.start_date || '');
        const e = String(data.window.end_date || '');
        const today = new Date();
        const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const todayStr = toYMD(today);
        const active = s && e && s <= todayStr && todayStr <= e;
        if (!active) { if (alive) { setPriceWindow(null); setPriceOverrides({}); } return; }
        const map: Record<number, number> = {};
        for (const it of (data.items || [])) {
          const pid = Number(it.product_id);
          const pr = Number(it.price);
          if (Number.isFinite(pid) && Number.isFinite(pr)) map[pid] = pr;
        }
        if (alive) { setPriceWindow({ start_date: s, end_date: e }); setPriceOverrides(map); }
      } catch {
        if (alive) { setPriceWindow(null); setPriceOverrides({}); }
      }
    })();
    return () => { alive = false; };
  }, []);

  // Categories derived from API data
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const list = Object.entries(counts).map(([id, count]) => ({ id, name: id, count }));
    return [{ id: 'all', name: 'All Products', count: products.length }, ...list];
  }, [products]);

  // No need for dynamic max; cap UI at 300,000 TSh as requested
  const MAX_TZS = 300000;

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        String(product.name).toLowerCase().includes(q) ||
        String(product.tagline || '').toLowerCase().includes(q) ||
        String(product.description || '').toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Price filter: absolute TZS up to MAX_TZS
    filtered = filtered.filter(product => {
      const price = parseFloat(String(product.price));
      if (isNaN(price)) return false;
      const minAllowed = priceRange[0];
      const maxAllowed = priceRange[1];
      return price >= minAllowed && price <= maxAllowed;
    });

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a: any, b: any) => parseFloat(String(a.price)) - parseFloat(String(b.price)));
        break;
      case 'price-high':
        filtered = [...filtered].sort((a: any, b: any) => parseFloat(String(b.price)) - parseFloat(String(a.price)));
        break;
      case 'ending-soon':
        filtered = [...filtered].sort((a: any, b: any) => {
          const ax = a.discount_expiry || null; const bx = b.discount_expiry || null;
          if (ax && bx) return String(ax).localeCompare(String(bx));
          if (ax && !bx) return -1; if (!ax && bx) return 1; return 0;
        });
        break;
      default:
        // default do not sort by popularity since API has none
        break;
    }

    return filtered;
  }, [searchQuery, selectedCategory, sortBy, priceRange, products]);

  const openShare = (p: any) => {
    if (!isAuthenticated) {
      setShareProduct({ ...p, requireAuth: true });
      setShareOpen(true);
      return;
    }
    setShareProduct({ ...p, requireAuth: false });
    setShareOpen(true);
  };

  const closeShare = () => { setShareOpen(false); setShareProduct(null); };

  // Helper to compute discount details
  const getDiscount = (p: any) => {
    const idNum = Number(p?.id);
    const override = priceOverrides[idNum];
    let price = Number(p?.price ?? 0);
    let original = Number(p?.original_price ?? 0);
    let expiry = p?.discount_expiry ? String(p.discount_expiry) : null;
    if (override !== undefined) {
      // Treat override as current price; treat current price as original for badge
      original = price > 0 ? price : original || price;
      price = Number(override);
      // Show window end date if available
      if (priceWindow?.end_date) expiry = String(priceWindow.end_date);
    }
    const hasDiscount = original > price && price > 0;
    const pct = hasDiscount ? Math.round(((original - price) / original) * 100) : null;
    return { hasDiscount, pct, original, price, expiry };
  };

  // Recommendation logic removed since we no longer use dummy popularity/rating data.

  const addToCart = (product: { id: string | number; name: string; price: string | number }) => {
    console.log('Added to cart:', product);
    // TODO: integrate with global cart context here
    setToast({ show: true, message: `${product.name} added to cart` });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23b47435%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60"></div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#f0c770]/10 to-[#b47435]/10 border border-[#b47435]/20 mb-6">
              <span className="text-[#b47435] font-semibold text-sm uppercase tracking-wider font-outfit-bold">Premium Collection</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-[#b47435] to-slate-900 bg-clip-text text-transparent leading-tight font-outfit-bold">
              All Products
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-outfit-regular mb-4">
              Discover our complete range of premium grooming products designed for the modern gentleman
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500 font-outfit-regular">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Fast 1-2 day delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#b47435] rounded-full"></div>
                <span>Premium quality</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Free shipping over TSh 50,000</span>
              </div>
            </div>
          </div>
        {/* Categories Grid (quick navigation) */}
        <div className="mt-12">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === c.id 
                    ? 'bg-gradient-to-r from-[#b47435] to-[#b77123] text-white shadow-lg hover:shadow-xl' 
                    : 'bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200 hover:bg-[#b47435]/10 hover:border-[#b47435]/30 hover:text-[#b47435]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-outfit-bold">{c.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory === c.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
          </div>
        </div>

      <div className="container mx-auto px-4 py-8">
        {/* On-page Search */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const params = new URLSearchParams(searchParams?.toString() ?? '');
                    if (searchQuery) params.set('q', searchQuery); else params.delete('q');
                    router.push(`/products?${params.toString()}`);
                  }
                }}
                placeholder="Search for products, categories, or brands..."
                className="h-14 pl-14 pr-6 rounded-full border-2 border-slate-200 focus:border-[#b47435] focus:ring-[#b47435] text-lg font-outfit-regular"
              />
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* Filter Toggle for Mobile */}
        <div className="lg:hidden mb-8">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-3 w-full h-12 rounded-full border-2 border-slate-200 hover:border-[#b47435] hover:bg-[#b47435]/5 font-outfit-bold"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters & Sort</span>
          </Button>
        </div>
        
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className={`w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#b47435] to-[#b77123] flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-outfit-bold">Filters</h3>
              </div>

              {/* Active Promotion */}
              {(() => {
                const toYMD = (d: Date) => {
                  const y = d.getFullYear();
                  const m = String(d.getMonth()+1).padStart(2,'0');
                  const dd = String(d.getDate()).padStart(2,'0');
                  return `${y}-${m}-${dd}`;
                };
                const todayStr = toYMD(new Date());
                const norm = (s: any): string => {
                  if (!s) return '';
                  // If already YYYY-MM-DD keep; if Date string, convert to local date YMD
                  if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
                  const d = new Date(s);
                  if (isNaN(d.getTime())) return '';
                  return toYMD(d);
                };
                const isActive = (p: any) => {
                  const s = norm(p.startDate);
                  const e = norm(p.endDate);
                  if (!s || !e) return false;
                  return s <= todayStr && todayStr <= e;
                };
                const active = (promotions || []).find(isActive);
                if (!active) return null;
                let cfg: any = active.config || {};
                if (typeof cfg === 'string') {
                  try { cfg = JSON.parse(cfg); } catch {}
                }
                const colorFrom = cfg.colorFrom || '#b47435';
                const colorTo = cfg.colorTo || '#b77123';
                return (
                  <div className="mb-6">
                    <div
                      className="rounded-xl p-4 text-white"
                      style={{ background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }}
                    >
                      <div className="text-sm uppercase opacity-90">Promotion</div>
                      <div className="text-lg font-bold">{cfg.headline || active.name}</div>
                      {cfg.subtext && <div className="text-sm opacity-90">{cfg.subtext}</div>}
                      <div className="mt-2 text-xs opacity-90">{String(active.startDate).toString()} → {String(active.endDate).toString()}</div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Categories */}
              <div className="mb-8">
                <h4 className="font-semibold mb-4 text-slate-900 font-outfit-bold">Categories</h4>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-[#b47435] to-[#b77123] text-white shadow-lg'
                          : 'hover:bg-slate-50 border border-slate-200 hover:border-[#b47435]/30 hover:text-[#b47435]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-outfit-regular">{category.name}</span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          selectedCategory === category.id
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {category.count}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range (TZS 0 – 300,000) */}
              <div className="mb-8">
                <h4 className="font-semibold mb-4 text-slate-900 font-outfit-bold">Price Range</h4>
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <label className="text-sm text-slate-600 font-outfit-regular mb-3 block">Max Price</label>
                    <input
                      type="range"
                      min={0}
                      max={MAX_TZS}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #b47435 0%, #b47435 ${(priceRange[1] / MAX_TZS) * 100}%, #e2e8f0 ${(priceRange[1] / MAX_TZS) * 100}%, #e2e8f0 100%)`
                      }}
                    />
                    <div className="flex justify-between text-sm text-slate-600 mt-3 font-outfit-regular">
                      <span>Min: TSh {priceRange[0].toLocaleString()}</span>
                      <span className="font-semibold text-[#b47435]">Max: TSh {priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* On Sale Toggle */}
              <div className="mb-8">
                <div className="bg-slate-50 rounded-xl p-4">
                  <label className="inline-flex items-center gap-3 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onSale}
                      onChange={(e) => setOnSale(e.target.checked)}
                      className="w-5 h-5 text-[#b47435] border-2 border-slate-300 rounded focus:ring-[#b47435] focus:ring-2"
                    />
                    <span className="font-outfit-regular">On Sale only</span>
                  </label>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h4 className="font-semibold mb-4 text-slate-900 font-outfit-bold">Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-[#b47435] focus:ring-[#b47435] focus:ring-2 focus:outline-none bg-white font-outfit-regular"
                >
                  <option value="popularity">Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="ending-soon">Ending Soon</option>
                </select>
              </div>
            </Card>
            </div>

            {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 font-outfit-bold">
                  {filteredProducts.length} Products Found
                </h2>
                <p className="text-slate-600 font-outfit-regular mt-1">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-sm text-slate-500 font-outfit-regular">
                  Sort by: <span className="font-semibold text-[#b47435] capitalize">{sortBy.replace('-', ' ')}</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="relative bg-white overflow-hidden rounded-3xl border border-slate-100">
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
                    <CardHeader className="pb-3">
                      <div className="h-5 w-2/3 bg-slate-200/80 animate-pulse rounded mb-2" />
                      <div className="h-4 w-1/3 bg-slate-200/80 animate-pulse rounded" />
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="h-6 w-24 bg-slate-200/80 animate-pulse rounded" />
                        <div className="h-9 w-9 bg-slate-200/80 animate-pulse rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {filteredProducts.map((product: any) => (
                <Link key={String(product.id)} href={`/products/${product.id}`}>
                  <Card className="group relative hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 overflow-hidden rounded-3xl shadow-xl cursor-pointer hover:-translate-y-2 hover:scale-105">
                    {/* Product Image */}
                    <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-[#f0c770]/10 to-[#b47435]/20">
                      <img 
                        src={product.image || '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg'} 
                        alt={product.name}
                        className="w-full h-full object-contain object-center group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      {/* Discount badge */}
                      {(() => { const d = getDiscount(product); return d.hasDiscount ? (
                        <span className="absolute top-4 left-4 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg">-{d.pct}%</span>
                      ) : null; })()}
                    </div>
                    
                    <CardHeader className="pb-4 px-6 pt-6">
                      <CardTitle className="text-lg font-outfit-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent line-clamp-2 group-hover:text-[#b47435] transition-colors duration-300">
                        {product.name}
                      </CardTitle>
                      {product.tagline && (
                        <CardDescription className="text-[#b47435] font-semibold text-sm font-outfit-regular">
                          {product.tagline}
                        </CardDescription>
                      )}
                      {product.description && (
                        <p className="text-slate-600 text-sm mt-2 line-clamp-2 font-outfit-regular">
                          {product.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {(() => { const d = getDiscount(product); return (
                            <>
                              <span className="text-xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent font-outfit-bold">
                                TSh {Number(d.price).toLocaleString()}
                              </span>
                              {d.hasDiscount && (
                                <span className="text-sm text-slate-500 line-through font-outfit-regular">TSh {Number(d.original).toLocaleString()}</span>
                              )}
                              {d.expiry && (
                                <div className="text-xs text-slate-500 font-outfit-regular">Ends on {d.expiry}</div>
                              )}
                            </>
                          ); })()}
                          {product.status === 'out_of_stock' && (
                            <Badge className="mt-1 bg-red-100 text-red-800 text-xs">Out of Stock</Badge>
                          )}
                          {product.status === 'low_stock' && (
                            <Badge className="mt-1 bg-yellow-100 text-yellow-800 text-xs">Low Stock</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-outfit-bold"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(product);
                          }}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                        <button
                          aria-label="Recommend"
                          title="Recommend"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openShare(product); }}
                          className="w-10 h-10 inline-flex items-center justify-center rounded-full border-2 border-slate-200 hover:bg-[#b47435]/10 hover:border-[#b47435] text-slate-700 hover:text-[#b47435] transition-all duration-300"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No products found</h3>
                <p className="text-slate-500">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>
    </div>

    {/* Newsletter Section */}
    <NewsletterSection />

    {/* Footer */}
    <Footer />

    {/* Share / Recommend Modal */}
    {shareOpen && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={closeShare}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e)=>e.stopPropagation()}>
          {shareProduct?.requireAuth ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">You need to sign up to share this product.</h3>
              <p className="text-sm text-slate-600 mb-4">Create an account or log in to recommend products to friends.</p>
              <div className="flex gap-3">
                <Link href="/auth/register" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-[#b47435] to-[#b77123]">Sign Up</Button>
                </Link>
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full">Log In</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-2">Recommend this product</h3>
              <p className="text-sm text-slate-600 mb-4">Share via Email, WhatsApp or social media.</p>
              {(() => {
                const url = typeof window !== 'undefined' ? `${window.location.origin}/products/${shareProduct?.id}` : '';
                const text = encodeURIComponent(`Check out ${shareProduct?.name} on iFresh: ${url}`);
                const emailHref = `mailto:?subject=${encodeURIComponent('iFresh product recommendation')}&body=${text}`;
                const waHref = `https://wa.me/?text=${text}`;
                const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                const xHref = `https://twitter.com/intent/tweet?text=${text}`;
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <a href={emailHref} target="_blank" className="block">
                      <Button variant="outline" className="w-full">Email</Button>
                    </a>
                    <a href={waHref} target="_blank" className="block">
                      <Button variant="outline" className="w-full">WhatsApp</Button>
                    </a>
                    <a href={fbHref} target="_blank" className="block">
                      <Button variant="outline" className="w-full">Facebook</Button>
                    </a>
                    <a href={xHref} target="_blank" className="block">
                      <Button variant="outline" className="w-full">X</Button>
                    </a>
                  </div>
                );
              })()}
              <div className="mt-4 text-right">
                <Button variant="ghost" onClick={closeShare}>Close</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    {/* Toast */}
    {toast.show && (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg text-sm">
          {toast.message}
        </div>
      </div>
    )}
    </div>
  );
}