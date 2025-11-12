"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';

export default function Cart() {
  const { state, removeItem, updateQuantity, applyCoupon, removeCoupon, getSubtotal, getDiscount, getTotal } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  // Sample coupons for demonstration
  const availableCoupons = [
    { code: 'WELCOME10', discount: 10, type: 'percentage' as const, minAmount: 50 },
    { code: 'SAVE20', discount: 20, type: 'fixed' as const, minAmount: 100 },
    { code: 'BEARD15', discount: 15, type: 'percentage' as const, maxDiscount: 50 },
  ];

  const handleApplyCoupon = () => {
    const coupon = availableCoupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
    if (coupon) {
      applyCoupon(coupon);
      setCouponError('');
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Delivery Note */}
        <div className="mb-4 text-sm text-slate-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          Eligible orders deliver in 1–2 days. Delivery fees (if any) are applied at checkout based on your region.
        </div>
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center text-[#b47435] hover:text-[#a0662f] mb-8 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
              Shopping Cart ({state.items.length} items)
            </h1>
            
            {state.items.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-slate-600 mb-6">Add some products to get started!</p>
                  <Link href="/">
                    <Button className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] rounded-full">
                      Start Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <Card key={item.id} className="bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#f0c770]/20 to-[#b47435]/30 rounded-lg overflow-hidden">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-[#b47435] text-sm">{item.tagline}</p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
                            TSh {item.price.toLocaleString()}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            Subtotal: TSh {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">TSh {getSubtotal().toLocaleString()}</span>
                </div>
                {state.appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({state.appliedCoupon.code})</span>
                    <span className="font-semibold">-TSh {getDiscount().toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold">TSh {state.deliveryFee.toLocaleString()}</span>
                </div>

                {/* Invoice Summary */}
                <div className="bg-slate-50 rounded-lg p-3 text-sm border">
                  <div className="font-semibold mb-2">Invoice Summary</div>
                  <div className="flex justify-between"><span>Product Total</span><span>TSh {getSubtotal().toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee</span><span>TSh {state.deliveryFee.toLocaleString()}</span></div>
                  {state.appliedCoupon && (
                    <div className="flex justify-between text-green-700"><span>Discount</span><span>-TSh {getDiscount().toLocaleString()}</span></div>
                  )}
                  <div className="flex justify-between mt-1 border-t pt-2 font-semibold">
                    <span>Invoice Total</span>
                    <span className="bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">TSh {getTotal().toLocaleString()}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</div>
                </div>
                {/* Coupon Code */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        variant="outline"
                        disabled={!couponCode.trim()}
                      >
                        <Tag className="w-4 h-4 mr-2" />
                        Apply
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-red-500 text-sm">{couponError}</p>
                    )}
                    {state.appliedCoupon && (
                      <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                        <span className="text-green-700 text-sm">
                          Coupon "{state.appliedCoupon.code}" applied
                        </span>
                        <Button
                          onClick={removeCoupon}
                          variant="ghost"
                          size="sm"
                          className="text-green-700 hover:text-green-800"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
                      TSh {getTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <Link href="/checkout">
                  <Button 
                    className="w-full bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] h-12 text-lg font-semibold"
                    disabled={state.items.length === 0}
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}