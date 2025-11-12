"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Star, Check, Users, Leaf, Award, ArrowLeft, Facebook, Twitter, Instagram, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  additionalImages?: string[];
  rating?: number;
  reviews?: number;
  category?: string;
  badge?: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const { addItem } = useCart();
  const { toast } = useToast();
  const [promotion, setPromotion] = useState<any | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const promoShownThisLoad = useRef(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Helpers for daily capping
  const getTodayKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${y}${m}${dd}`;
  };
  const canShowToday = (maxPerDay = 3) => {
    try {
      const key = `promo_show_count_${getTodayKey()}`;
      const count = parseInt(localStorage.getItem(key) || '0');
      return count < maxPerDay;
    } catch { return true; }
  };
  const incrementShowCount = () => {
    try {
      const key = `promo_show_count_${getTodayKey()}`;
      const count = parseInt(localStorage.getItem(key) || '0');
      localStorage.setItem(key, String(count + 1));
    } catch {}
  };

  // Fallback products if no API products are available
  const fallbackProducts: Product[] = [
    {
      id: "beard-oil",
      name: "Tonic + Elixir Beard Oil Bundle",
      tagline: "24/7 Hydration",
      description: "Our signature beard oil is a lightweight, fast-absorbing blend of natural oils that hydrate, softens, and strengthens your beard from root to tip.",
      price: "34.99",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.35.jpeg"
    },
    {
      id: "radiance-bundle",
      name: "Radiance Bundle",
      tagline: "Made to hydrate, strengthen, and enhance softness.",
      description: "Control frizz, shape your beard, and moisturize deeply with our rich balm. Ideal for styling and deep conditioning.",
      price: "34.99",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.28 (1).jpeg"
    },
    {
      id: "heated-beard-brush",
      name: "Heated Beard Brush",
      tagline: "Smooth, Style, and Straighten",
      description: "A gentle yet effective beard wash that cleanses without stripping natural oils, leaving your beard fresh and soft.",
      price: "98.00",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.23.jpeg"
    },
    {
      id: "viking-shield-heat-spray",
      name: "Viking Shield Heat Spray",
      tagline: "Guards against heat damage",
      description: "Protect your beard from heat damage caused by styling tools with our lightweight, non-greasy heat protectant spray.",
      price: "20.99",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.21.jpeg"
    },
    {
      id: "beard-comb-set",
      name: "Premium Beard Comb Set",
      tagline: "Professional Grooming Tools",
      description: "Complete set of wooden combs for all beard lengths. Handcrafted from sustainable materials for the perfect grooming experience.",
      price: "15.99",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.24.jpeg"
    },
    {
      id: "beard-brush",
      name: "Natural Bristle Beard Brush",
      tagline: "Smooth & Style Daily",
      description: "High-quality natural bristle brush that distributes oils evenly and stimulates hair follicles for healthier beard growth.",
      price: "12.99",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.27.jpeg"
    },
    {
      id: "derma-roller",
      name: "Derma Roller Kit",
      tagline: "Stimulate Growth Naturally",
      description: "Professional derma roller with multiple needle sizes to stimulate beard growth and improve skin health.",
      price: "25.99",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg"
    },
    {
      id: "beard-trimmer",
      name: "Precision Beard Trimmer",
      tagline: "Professional Grade Trimming",
      description: "Advanced trimmer with multiple length settings and precision blades for the perfect beard shape and length.",
      price: "89.99",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.20.jpeg"
    },
    {
      id: "beard-wax",
      name: "Beard Styling Wax",
      tagline: "Strong Hold, Natural Look",
      description: "Premium styling wax with strong hold for shaping and taming even the most unruly beards. All-day control.",
      price: "18.99",
      image: "/products/WhatsApp Image 2025-09-01 at 11.28.19.jpeg"
    }
  ];

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const apiProducts: Product[] = (data.products || []).map((p: any) => ({
          id: String(p.id),
          name: p.name,
          tagline: p.tagline || '',
          description: p.description || '',
          price: typeof p.price === 'number' ? String(p.price) : (p.price || '0'),
          originalPrice: p.original_price ? String(p.original_price) : undefined,
          discount: p.discount ? String(p.discount) : undefined,
          image: p.image || '/products/logo.jpeg',
          additionalImages: p.additional_images && p.additional_images !== 'null' && p.additional_images !== '' ? 
            p.additional_images.split(',').filter((url: string) => url.trim()) : [],
        }));
        if (isMounted) {
          setProducts(apiProducts.length > 0 ? apiProducts : fallbackProducts);
        }
      } catch (err) {
        // fail silently; fallback to bundled products
        if (isMounted) {
          setProducts(fallbackProducts);
        }
      }
    }
    loadProducts();
    // Load active promotion for homepage
    (async () => {
      try {
        const res = await fetch('/api/promotions', { cache: 'no-store' });
        const data = await res.json().catch(()=> ({ promotion: null }));
        if (isMounted) setPromotion(data.promotion || null);
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Show popup after 2.5s when promotion is loaded and daily cap allows
  useEffect(() => {
    if (!promotion) return;
    if (!canShowToday(3)) return;
    if (promoShownThisLoad.current) return;
    const t = setTimeout(() => {
      if (promoShownThisLoad.current) return;
      promoShownThisLoad.current = true;
      setShowPromoModal(true);
      incrementShowCount();
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotion]);

  const kits = [
    {
      id: "ifresh-grooming-kit",
      name: "iFresh Grooming Kit",
      tagline: "Grow Like a King",
      description: "Everything you need in one premium box: Complete grooming solution for the ultimate.",
      includes: ["30ml Beard Oil", "60g Beard Balm", "250ml Beard Wash", "250ml Conditioner", "Beard Comb", "Medium Brush", "0.5mm Derma Roller"],
      price: "215,000",
      badge: "Most Popular",
      image: "/promo/WhatsApp Image 2025-09-01 at 11.28.30.jpeg"
    },
    {
      id: "starter-kit",
      name: "Starter Kit",
      tagline: "Your First Step to a Legendary Beard",
      description: "Perfect for beginners, this kit includes the essentials to kickstart your grooming journey.",
      includes: ["50ml Beard Oil", "60g Beard Balm", "0.5mm Beard Roller", "Double Sides Comb"],
      price: "145,000",
      badge: "Best for Beginners",
      image: "/promo/WhatsApp Image 2025-09-01 at 11.28.34.jpeg"
    },
    {
      id: "pro-grooming-kit",
      name: "Pro Grooming Kit",
      tagline: "The Ultimate Beard Upgrade",
      description: "Everything you need to grow, groom, style, and maintain your beard like a professional.",
      includes: ["Beard Trimmer", "500ml Wash", "250ml Conditioner", "50ml Oil", "60g Balm", "Comb", "Big Brush", "Derma Roller"],
      price: "290,000",
      badge: "Premium Choice",
      image: "/promo/WhatsApp Image 2025-09-01 at 11.28.35 (1).jpeg"
    },
    {
      id: "luxury-beard-kit",
      name: "Luxury Beard Kit",
      tagline: "Elite Grooming Experience",
      description: "Premium collection for the discerning gentleman. Handcrafted tools and organic ingredients for the ultimate grooming experience.",
      includes: ["100ml Premium Oil", "120g Luxury Balm", "500ml Organic Wash", "500ml Deep Conditioner", "Wooden Comb", "Boar Bristle Brush", "0.75mm Derma Roller", "Styling Wax"],
      price: "385,000",
      badge: "Luxury",
      image: "/promo/WhatsApp Image 2025-09-01 at 11.28.28.jpeg"
    },
    {
      id: "travel-grooming-kit",
      name: "Travel Grooming Kit",
      tagline: "Grooming on the Go",
      description: "Compact and travel-friendly kit perfect for business trips, vacations, or daily commutes. Everything you need in a portable package.",
      includes: ["30ml Travel Oil", "30g Travel Balm", "100ml Travel Wash", "Travel Comb", "Mini Derma Roller"],
      price: "95,000",
      badge: "Travel Ready",
      image: "/promo/WhatsApp Image 2025-09-01 at 11.28.24.jpeg"
    },
    {
      id: "growth-acceleration-kit",
      name: "Growth Acceleration Kit",
      tagline: "Maximize Your Beard Potential",
      description: "Scientifically formulated to stimulate faster, thicker beard growth. Perfect for patchy beards or slow growers.",
      includes: ["Growth Serum", "1.0mm Derma Roller", "Growth Oil", "Scalp Massager", "Vitamin Supplements", "Growth Guide"],
      price: "175,000",
      badge: "Growth Focused",
      image: "/promo/WhatsApp Image 2025-09-01 at 11.28.21.jpeg"
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-20">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/Untitled_1920_x_1080_px.webp')"
          }}
        ></div>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-transparent to-slate-900/30"></div>
        
        {/* Content */}
        <div className="container mx-auto px-4 pt-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <h1 className="text-4xl lg:text-5xl font-bold mb-8 text-white leading-tight font-outfit-bold text-left">
                <span className="bg-gradient-to-r from-white via-[#f0c770] to-white bg-clip-text text-transparent">
                  EXTRAORDINARY MEN
                </span>
                <br />
                <span className="bg-gradient-to-r from-white via-[#f0c770] to-white bg-clip-text text-transparent">
                  DON'T HAVE ORDINARY
                </span>
                <br />
                <span className="bg-gradient-to-r from-white via-[#f0c770] to-white bg-clip-text text-transparent">
                  FACES
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed font-outfit-regular text-left">
                We don't just sell products. We deliver results that build confidence, command respect, and help you stand out. It's not just a beard, it's a statement.
              </p>
              
              {/* Reviews Section */}
              <div className="flex items-center gap-2 mb-8">
                <div className="flex">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className="text-[#f0c770] text-2xl">★</span>
                  ))}
                  <span className="text-gray-400 text-2xl">★</span>
                </div>
                <span className="text-white font-outfit-regular text-lg">7,000+ FOUR-STAR REVIEWS</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Link href="/products">
                  <Button className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] text-white px-8 py-4 rounded text-xl font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-[#b47435]/25 font-outfit-bold">
                    SHOP NOW →
                  </Button>
                </Link>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Popup Modal */}
      {promotion && showPromoModal && (() => {
        let cfg: any = promotion.config || {};
        if (typeof cfg === 'string') { try { cfg = JSON.parse(cfg); } catch { cfg = {}; } }
        const colorFrom = cfg.colorFrom || '#b47435';
        const colorTo = cfg.colorTo || '#b77123';
        const item = (promotion.items || [])[0] || null;
        const p = item?.product || null;
        const displayName = p?.name || item?.productName || promotion.name;
        const img = p?.image || '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg';
        const price = item?.overridePrice ?? p?.price ?? 0;
        const original = p?.original_price && Number(p.original_price) > Number(price) ? Number(p.original_price) : null;
        const hasDiscount = original !== null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => { setShowPromoModal(false); }} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="p-4 text-white" style={{ background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase opacity-90">Featured Promotion</div>
                    <div className="text-xl font-bold">{cfg.headline || promotion.name}</div>
                    {cfg.subtext && <div className="text-sm opacity-90">{cfg.subtext}</div>}
                  </div>
                  <button
                    className="text-white/90 hover:text-white transition-colors"
                    onClick={() => { setShowPromoModal(false); }}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {/* Small Product Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    <img 
                      src={img} 
                      alt={displayName} 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">{displayName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[#b47435]">TSh {Number(price).toLocaleString()}</span>
                      {hasDiscount && (
                        <>
                          <span className="text-sm text-slate-500 line-through">TSh {Number(original).toLocaleString()}</span>
                          <Badge className="bg-green-100 text-green-800 text-xs">-{Math.round(((original!-Number(price))/original!)*100)}%</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Promotion Period */}
                <div className="text-xs text-slate-500 mb-4">
                  Valid until: {new Date(promotion.endDate).toLocaleDateString()}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] text-white font-medium" 
                    onClick={() => {
                      // Create a proper product object for the cart
                      const productForCart = {
                        id: p ? String(p.id) : `promo-${item?.id || 'unknown'}`,
                        name: displayName,
                        tagline: '',
                        description: p?.description || '',
                        price: Number(price),
                        originalPrice: original ? Number(original) : undefined,
                        image: img,
                        category: p?.category || 'Promotion',
                        rating: p?.rating,
                        reviews: p?.reviews,
                        badge: hasDiscount ? 'Special Offer' : undefined
                      };
                      
                      addItem(productForCart);
                      setShowPromoModal(false);
                      
                      // Show success toast
                      toast({
                        title: "Added to Cart!",
                        description: `${displayName} has been added to your cart.`,
                        duration: 3000,
                      });
                    }}
                  >
                    Add To Cart
                  </Button>
                  <Button 
                    variant="outline" 
                    className="px-4 border-slate-300 text-slate-600 hover:bg-slate-50"
                    onClick={() => { setShowPromoModal(false); }}
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Why Choose iFresh */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23b47435%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#f0c770]/10 to-[#b47435]/10 border border-[#b47435]/20 mb-6">
              <span className="text-[#b47435] font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
            </div>
            <h3 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-[#b47435] to-slate-900 bg-clip-text text-transparent leading-tight">
              Why Choose iFresh?
            </h3>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Experience the difference with our premium, science-backed approach to beard care
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="group relative">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-105">
                <div className="absolute -top-4 left-8">
                  <div className="bg-gradient-to-br from-[#f0c770] to-[#b47435] w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="pt-6">
                  <h4 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-[#b47435] transition-colors duration-300">
                    100% Natural Ingredients
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Pure, natural formulations without harmful chemicals. Every ingredient is carefully selected for maximum effectiveness and safety.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group relative">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-105">
                <div className="absolute -top-4 left-8">
                  <div className="bg-gradient-to-br from-[#f0c770] to-[#b47435] w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="pt-6">
                  <h4 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-[#b47435] transition-colors duration-300">
                    Designed for Coarse & Curly Beards
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Specially formulated for all beard textures. Our products work with your natural hair pattern, not against it.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group relative lg:col-span-1 md:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-105">
                <div className="absolute -top-4 left-8">
                  <div className="bg-gradient-to-br from-[#f0c770] to-[#b47435] w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="pt-6">
                  <h4 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-[#b47435] transition-colors duration-300">
                    No Parabens. No Sulfates. No Nonsense.
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Clean ingredients for optimal beard health. We believe in transparency and quality you can trust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop All Products Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-[#b47435] to-slate-900 bg-clip-text text-transparent font-outfit-bold">
              Shop All Products
            </h2>
            <p className="text-xl text-slate-600 font-outfit-regular">Everything Your Beard Needs</p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {['All', 'Beard Oil', 'Beard Balm', 'Grooming Tools', 'New Arrivals'].map((category, index) => (
              <button
                key={category}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  index === 0 
                    ? 'bg-gradient-to-r from-[#b47435] to-[#b77123] text-white shadow-lg' 
                    : 'bg-white text-slate-600 hover:bg-[#b47435] hover:text-white border border-slate-200'
                } font-outfit-regular`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-8">
            {products.map((product, index) => (
              <div 
                key={index} 
                className="group relative hover:shadow-2xl transition-all duration-300 bg-white border-0 overflow-hidden rounded-2xl shadow-lg hover:-translate-y-2 cursor-pointer"
                onClick={() => {
                  // Navigate to product detail page
                  window.location.href = `/products/${product.id}`;
                }}
              >
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Badge */}
                  {product.badge && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#b47435] to-[#b77123] text-white shadow-sm">
                        {product.badge}
                      </span>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {(product.originalPrice || product.discount) && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500 text-white shadow-sm">
                        {product.discount ? `-${product.discount}%` : `-${Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice!)) * 100)}%`}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-6 pb-3">
                  <h3 className="text-lg font-outfit-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-[#b47435] font-semibold text-sm font-outfit-regular">
                    {product.tagline}
                  </p>
                  <p className="text-slate-600 text-sm mt-2 line-clamp-2 font-outfit-regular">
                    {product.description}
                  </p>
                </div>
                
                <div className="px-6 pb-6 pt-0">
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'fill-[#f0c770] text-[#f0c770]' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 font-outfit-regular">
                      {product.rating || 0} ({product.reviews || 0} reviews)
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent font-outfit-bold">
                        TSh {product.price}
                      </span>
                      {(product.originalPrice || product.discount) && (
                        <span className="text-sm text-slate-500 line-through ml-2 font-outfit-regular">
                          TSh {product.originalPrice || Math.round(parseFloat(product.price) / (1 - parseFloat(product.discount!) / 100))}
                        </span>
                      )}
                    </div>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] rounded-full shadow-md hover:shadow-lg transition-all duration-200 font-outfit-bold"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation when clicking the button
                        addItem({
                          ...product,
                          price: parseFloat(product.price),
                          originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : undefined,
                          category: product.category || 'Beard Care'
                        });
                        toast({
                          title: "Added to Cart",
                          description: `${product.name} has been added to your cart.`,
                          duration: 3000,
                        });
                      }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Products Button */}
          <div className="text-center mt-12">
            <Link href="/products">
              <Button className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] text-white px-8 py-4 rounded-lg text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-[#b47435]/25 font-outfit-bold">
                View All Products
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Grooming Kits Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23b47435%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#f0c770]/10 to-[#b47435]/10 border border-[#b47435]/20 mb-6">
              <span className="text-[#b47435] font-semibold text-sm uppercase tracking-wider font-outfit-bold">Premium Collections</span>
            </div>
            <h3 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-[#b47435] to-slate-900 bg-clip-text text-transparent leading-tight font-outfit-bold">
              Complete Grooming Kits
            </h3>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-outfit-regular">
              Everything you need for the perfect beard journey. Professional-grade kits designed for every stage of your grooming routine.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {kits.map((kit, index) => (
              <Link key={index} href={`/products/${kit.id}`}>
                <Card className="group relative hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 overflow-hidden rounded-3xl shadow-xl cursor-pointer hover:-translate-y-2 hover:scale-105">
                  {kit.badge && (
                    <div className="absolute top-4 right-4 z-20">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] text-white shadow-lg">
                        {kit.badge}
                      </span>
                    </div>
                  )}
                  
                  {/* Kit Image */}
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#f0c770]/10 to-[#b47435]/20">
                    <img 
                      src={kit.image} 
                      alt={kit.name}
                      className="w-full h-full object-contain object-center group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  
                  <CardHeader className="pb-4 px-6 pt-6">
                    <CardTitle className="text-xl font-outfit-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent group-hover:text-[#b47435] transition-colors duration-300">
                      {kit.name}
                    </CardTitle>
                    <CardDescription className="text-[#b47435] font-semibold text-sm font-outfit-regular">
                      {kit.tagline}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="px-6 pb-6">
                    <p className="text-slate-600 text-sm mb-6 line-clamp-3 font-outfit-regular leading-relaxed">{kit.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent font-outfit-bold">
                          TSh {kit.price}
                        </span>
                        <span className="text-xs text-slate-500 font-outfit-regular">Complete Kit</span>
                      </div>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-outfit-bold"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addItem({
                            ...kit,
                            price: parseFloat(kit.price),
                            category: 'Grooming Kit'
                          });
                          toast({
                            title: "Kit Added to Cart",
                            description: `${kit.name} grooming kit has been added to your cart.`,
                            duration: 3000,
                          });
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add Kit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* Product Recommendations Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
              Recommended for You
            </h3>
            <p className="text-xl text-slate-600">Products that work great together</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Beard Oil + Balm Combo */}
            <Card className="relative hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-yellow-50 group overflow-hidden rounded-2xl shadow-lg">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                    O+B
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">Beard Oil + Balm Combo</h4>
                    <p className="text-[#b47435] font-semibold">Perfect Daily Routine</p>
                  </div>
                </div>
                <p className="text-slate-600 mb-4">Complete your beard care with our signature oil for hydration and balm for styling control.</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
                    TSh 53.98
                  </span>
                  <Badge className="bg-green-100 text-green-800">Save 15%</Badge>
                </div>
              </div>
            </Card>

            {/* Complete Grooming Kit */}
            <Card className="relative hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-yellow-50 group overflow-hidden rounded-2xl shadow-lg">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                    CG
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">Complete Grooming Kit</h4>
                    <p className="text-[#b47435] font-semibold">Everything You Need</p>
                  </div>
                </div>
                <p className="text-slate-600 mb-4">Oil, balm, wash, conditioner, brush, and comb - everything for the perfect beard care routine.</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
                    TSh 89.99
                  </span>
                  <Badge className="bg-green-100 text-green-800">Save 25%</Badge>
                </div>
              </div>
            </Card>

            {/* Growth Starter Pack */}
            <Card className="relative hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-yellow-50 group overflow-hidden rounded-2xl shadow-lg">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                    GS
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">Growth Starter Pack</h4>
                    <p className="text-[#b47435] font-semibold">Boost Your Growth</p>
                  </div>
                </div>
                <p className="text-slate-600 mb-4">Derma roller, growth oil, and vitamins to stimulate and nourish your beard growth.</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
                    TSh 67.99
                  </span>
                  <Badge className="bg-green-100 text-green-800">Save 20%</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
              Frequently Asked Questions
            </h3>
            <p className="text-xl text-slate-600">Everything you need to know about iFresh</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h4 className="text-lg font-semibold text-slate-800 mb-3">How long does shipping take?</h4>
                  <p className="text-slate-600">We offer free shipping on orders over TSh 50,000. Standard delivery takes 3-5 business days within Tanzania.</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h4 className="text-lg font-semibold text-slate-800 mb-3">Are your products natural?</h4>
                  <p className="text-slate-600">Yes! All our products are made with natural ingredients and are free from harmful chemicals.</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h4 className="text-lg font-semibold text-slate-800 mb-3">Do you offer returns?</h4>
                  <p className="text-slate-600">We offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your purchase.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h4 className="text-lg font-semibold text-slate-800 mb-3">How often should I use beard oil?</h4>
                  <p className="text-slate-600">For best results, apply beard oil daily after showering when your beard is slightly damp.</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h4 className="text-lg font-semibold text-slate-800 mb-3">What's the difference between oil and balm?</h4>
                  <p className="text-slate-600">Beard oil is lighter and great for daily hydration, while balm provides hold and styling control.</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h4 className="text-lg font-semibold text-slate-800 mb-3">Do you ship internationally?</h4>
                  <p className="text-slate-600">Currently we ship within Tanzania. International shipping coming soon!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
              What Our Customers Say
            </h3>
            <p className="text-xl text-slate-600">Real reviews from real customers</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-[#f0c770]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 mb-4">"The iFresh grooming kit completely transformed my beard care routine. My beard has never looked better!"</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div className="ml-3">
                  <h5 className="font-semibold text-slate-800">Michael R.</h5>
                  <p className="text-sm text-slate-500">Verified Customer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-[#f0c770]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 mb-4">"Excellent quality products and fast shipping. The beard oil has made such a difference in my daily routine."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-full flex items-center justify-center text-white font-bold">
                  J
                </div>
                <div className="ml-3">
                  <h5 className="font-semibold text-slate-800">James K.</h5>
                  <p className="text-sm text-slate-500">Verified Customer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-[#f0c770]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 mb-4">"The starter kit was perfect for me as a beginner. Great value and everything I needed to get started."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div className="ml-3">
                  <h5 className="font-semibold text-slate-800">Ahmed S.</h5>
                  <p className="text-sm text-slate-500">Verified Customer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/Untitled_1920_x_1080_px.webp')"
          }}
        ></div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/70"></div>
        
        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-5xl lg:text-6xl font-bold mb-6 text-white">
              DISCOVER YOUR BEST BEARD
            </h3>
            <p className="text-xl text-white/90 mb-12">
              Say goodbye to your beard issues and unlock 35% off
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
              <Input
                type="email"
                placeholder="Your Email Address"
                className="flex-1 rounded-none border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:bg-white/20 focus:border-white/50 h-14 text-lg"
              />
              <Button className="bg-[#f0c770] text-black hover:bg-[#f0c770]/90 rounded-none px-8 h-14 text-lg font-bold">
                Subscribe →
              </Button>
            </div>
            
            <p className="text-sm text-white/70">
              Join our email newsletter for the latest news, promos & more!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-black py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* Left Column - Support/Info */}
            <div>
              <h5 className="font-bold text-lg mb-6 text-black">SUPPORT & INFO</h5>
              <ul className="space-y-3 text-slate-600">
                <li><Link href="/blog" className="hover:text-[#b47435] transition-colors font-medium">BLOG</Link></li>
                <li><Link href="/support" className="hover:text-[#b47435] transition-colors font-medium">SUPPORT</Link></li>
                <li><Link href="/contact" className="hover:text-[#b47435] transition-colors font-medium">CONTACT</Link></li>
                <li><Link href="/guarantee" className="hover:text-[#b47435] transition-colors font-medium">GROWTH GUARANTEE</Link></li>
                <li><Link href="/store-locator" className="hover:text-[#b47435] transition-colors font-medium">STORE LOCATOR</Link></li>
              </ul>
            </div>
            
            {/* Center Column - Social Media & Newsletter */}
            <div className="text-center">
              {/* Social Media Icons */}
              <div className="flex justify-center space-x-4 mb-8">
                <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center hover:bg-[#b47435] hover:border-[#b47435] transition-colors cursor-pointer">
                  <Facebook className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center hover:bg-[#b47435] hover:border-[#b47435] transition-colors cursor-pointer">
                  <Twitter className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center hover:bg-[#b47435] hover:border-[#b47435] transition-colors cursor-pointer">
                  <Instagram className="w-5 h-5" />
                </div>
              </div>
              
              {/* Newsletter Signup */}
              <div className="max-w-md mx-auto">
                <h5 className="font-bold text-lg mb-2 text-black">JOIN OUR EMAIL NEWSLETTER</h5>
                <p className="text-sm text-slate-600 mb-4">Subscribe to get the latest news, promos & more!</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Your Email Address"
                    className="flex-1 rounded-none border-2 border-black bg-white text-black placeholder-slate-500 focus:border-[#b47435] h-12"
                  />
                  <Button className="bg-black text-white hover:bg-[#b47435] rounded-none px-4 h-12">
                    →
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Right Column - Engagement/Legal */}
            <div>
              <h5 className="font-bold text-lg mb-6 text-black">ENGAGEMENT & LEGAL</h5>
              <ul className="space-y-3 text-slate-600">
                <li><Link href="/quiz" className="hover:text-[#b47435] transition-colors font-medium">TAKE THE QUIZ</Link></li>
                <li><Link href="/rewards" className="hover:text-[#b47435] transition-colors font-medium">REWARDS</Link></li>
                <li><Link href="/refer" className="hover:text-[#b47435] transition-colors font-medium">REFER A FRIEND</Link></li>
                <li><Link href="/reviews" className="hover:text-[#b47435] transition-colors font-medium">REVIEWS</Link></li>
                <li><Link href="/privacy" className="hover:text-[#b47435] transition-colors font-medium">PRIVACY POLICY</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Copyright Bar */}
          <div className="border-t border-slate-300 pt-8 text-center">
            <p className="text-sm text-slate-500">
              © 2025 iFresh. All rights reserved | Terms and Conditions | Privacy Policy
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}