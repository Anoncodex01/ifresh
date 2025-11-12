"use client";

import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Star, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useLoyalty } from '@/contexts/LoyaltyContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { state, getSubtotal, getDiscount, getTotal, clearCart, setDelivery } = useCart();
  const { earnPoints, calculatePointsForPurchase } = useLoyalty();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    notes: ''
  });
  const [locationType, setLocationType] = useState<'dar' | 'other'>('dar');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'lipa' | 'cod'>('cod');
  const [redeemablePoints, setRedeemablePoints] = useState<number>(0);
  const [redeemPointsInput, setRedeemPointsInput] = useState<string>('');

  const subtotal = getSubtotal();
  const deliveryFee = state.deliveryFee;
  const discount = getDiscount();
  // Client-side preview of points discount
  const requestedPts = Math.floor(Number(redeemPointsInput || 0));
  const stepPts = Math.floor(requestedPts / 100) * 100;
  const minOk = stepPts >= 500;
  const cappedByBalance = Math.min(stepPts, Math.floor(redeemablePoints / 100) * 100);
  const maxByAmountTZS = Math.max(0, Math.floor((subtotal - discount) / 1000) * 1000);
  const maxByAmountPts = Math.floor(maxByAmountTZS / 10);
  const appliedPts = minOk ? Math.min(cappedByBalance, maxByAmountPts) : 0;
  const pointsDiscountTZS = Math.floor(appliedPts / 100) * 1000;
  const total = Math.max(0, subtotal - discount - pointsDiscountTZS + deliveryFee);

  // Check authentication and prefill from account profile
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/account/me', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        const me = await res.json();
        if (!alive || !me) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        setIsAuthenticated(true);
        // Prefill basic contact info if empty
        setShippingInfo((prev) => ({
          ...prev,
          fullName: prev.fullName || me.fullName || '',
          phone: prev.phone || me.phone || '',
          email: prev.email || me.email || '',
          region: prev.region || me.region || '',
        }));
        applyRegionRules(String(me.region || ''));
        // Load redeemable points
        try {
          const url = new URL('/api/account/points/redeemable', window.location.origin);
          if (me?.id && me?.customerId) url.searchParams.set('customerId', String(me.customerId));
          else {
            if (me?.email) url.searchParams.set('email', me.email);
            if (me?.phone) url.searchParams.set('phone', me.phone);
          }
          const pr = await fetch(url.toString(), { cache: 'no-store', credentials: 'include' });
          const pj = await pr.json().catch(()=>({ redeemable: 0 }));
          setRedeemablePoints(Number(pj.redeemable || 0));
        } catch {}
        const region = String(me.region || '').toLowerCase();
        if (region.includes('dar')) {
          setLocationType('dar');
        } else if (region) {
          setLocationType('other');
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Apply region-specific rules: Dodoma and any non-Dar => 10,000 and no COD; Dar => FREE + COD allowed
  function applyRegionRules(regionStr: string) {
    const r = (regionStr || '').toLowerCase().trim();
    const isDar = r.includes('dar') || r.includes('dar es salaam');
    if (isDar) {
      setLocationType('dar');
      setDelivery('Dar es Salaam', 0);
      // Allow COD in Dar, keep payment method as is
    } else {
      setLocationType('other');
      setDelivery('Other Region', 10000);
      // Enforce no COD outside Dar
      if (paymentMethod === 'cod') setPaymentMethod('lipa');
    }
  }

  // Auto-detect from profile and on manual region change
  useEffect(() => {
    if (isAuthenticated) {
      const r = (shippingInfo.region || shippingInfo.city || '').toLowerCase();
      applyRegionRules(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, shippingInfo.region]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.items.length === 0) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: shippingInfo.fullName,
          phone: shippingInfo.phone,
          email: shippingInfo.email || null,
          addressLine1: shippingInfo.address,
          addressLine2: null,
          city: shippingInfo.city || null,
          notes: `${shippingInfo.notes || ''}`.trim() || null,
          deliveryFee: state.deliveryFee,
          subtotal,
          discount,
          total,
          locationType,
          paymentMethod,
          redeemedPoints: appliedPts,
          items: state.items.map(it => ({
            productId: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to place order. Please try again.');
        return;
      }

      // award points
      const pointsToEarn = calculatePointsForPurchase(total);
      earnPoints(pointsToEarn, `Order ${data.orderId} - TSh ${total.toLocaleString()}`, String(data.orderId));

      // Store order data and show confirmation popup
      setOrderData({
        orderId: data.orderId,
        total: total,
        pointsEarned: pointsToEarn,
        customerName: shippingInfo.fullName,
        phone: shippingInfo.phone
      });
      setShowConfirmation(true);
      clearCart();
      
      // Show success toast
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${data.orderId} has been confirmed.`,
        duration: 5000,
      });
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b47435] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
              <p className="text-slate-600 mb-6">
                You need to be logged in to complete your checkout. Please sign in to continue.
              </p>
              <div className="space-y-3">
                <Link href="/auth/login?next=/checkout">
                  <Button className="w-full bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register?next=/checkout">
                  <Button variant="outline" className="w-full">
                    Create Account
                  </Button>
                </Link>
                <Link href="/cart" className="inline-flex items-center text-[#b47435] hover:text-[#a0662f] text-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24">
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Link href="/cart" className="inline-flex items-center text-[#b47435] hover:text-[#a0662f] mb-8 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-slate-600">Complete your order</p>
        </div>

        <form onSubmit={handleSubmitOrder}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form (Delivery Only) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Auto-detected Delivery Information */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-700">Delivery Location:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        locationType === 'dar' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {locationType === 'dar' ? 'Dar es Salaam' : 'Outside Dar es Salaam'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">Delivery Fee:</span>
                      <span className="font-bold text-[#b47435]">
                        {locationType === 'dar' ? 'FREE' : 'TSh 10,000'}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
                      {locationType === 'dar' ? (
                        <p>✅ Cash on Delivery available for Dar es Salaam</p>
                      ) : (
                        <p>⚠️ Outside Dar es Salaam: 100% upfront payment required</p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        💡 Delivery location is automatically detected based on your city
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Delivery Information */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <select
                        id="region"
                        value={shippingInfo.region}
                        onChange={(e)=> setShippingInfo({ ...shippingInfo, region: e.target.value })}
                        onBlur={(e)=> applyRegionRules(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:border-[#b47435] focus:outline-none"
                      >
                        <option value="">Select Region</option>
                        <option>Dar es Salaam</option>
                        <option>Dodoma</option>
                        <option>Arusha</option>
                        <option>Mwanza</option>
                        <option>Mbeya</option>
                        <option>Morogoro</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Input
                        id="notes"
                        value={shippingInfo.notes}
                        onChange={(e) => setShippingInfo({...shippingInfo, notes: e.target.value})}
                        placeholder="Landmark or delivery instructions"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Payment Methods */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className={`flex items-center gap-2 ${locationType==='other' && paymentMethod==='cod' ? 'opacity-50' : ''}`}>
                      <input type="radio" name="pay" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} disabled={locationType==='other'} />
                      Cash on Delivery (Dar es Salaam only)
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="pay" checked={paymentMethod==='online'} onChange={()=>setPaymentMethod('online')} />
                      Online Payment (recommended outside Dar)
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="pay" checked={paymentMethod==='lipa'} onChange={()=>setPaymentMethod('lipa')} />
                      Lipa Number: <span className="font-semibold">5191175</span>
                    </label>
                  </div>
                  <div className="text-sm text-slate-700">
                    {locationType==='other' ? (
                      <p>Outside Dar es Salaam: Customers must pay 100% upfront (Online or Lipa 5191175). Delivery fee TSh 10,000 applies.</p>
                    ) : (
                      <p>Within Dar es Salaam: Cash on Delivery is available. Free delivery applies.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="border-0 bg-white/80 backdrop-blur-sm sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {state.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-600">{item.category} × {item.quantity}</p>
                        </div>
                        <p className="font-medium">TSh {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Pricing Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>TSh {subtotal.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                        {deliveryFee === 0 ? 'FREE' : `TSh ${deliveryFee.toLocaleString()}`}
                      </span>
                    </div>
                    
                    {state.appliedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({state.appliedCoupon.code})</span>
                        <span>-TSh {discount.toLocaleString()}</span>
                      </div>
                    )}
                    {appliedPts > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Points Discount ({appliedPts} pts)</span>
                        <span>-TSh {pointsDiscountTZS.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">TSh {total.toLocaleString()}</span>
                  </div>

                  <Separator />

                  {/* Points Preview */}
                  <div className="bg-yellow-50 p-3 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900">You'll earn</span>
                      </div>
                      <span className="text-sm font-bold text-yellow-600">
                        {calculatePointsForPurchase(total)} loyalty points
                      </span>
                    </div>
                    <div className="text-sm text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>Redeemable points</span>
                        <span className="font-semibold">{redeemablePoints.toLocaleString()} pts</span>
                      </div>
                      <div className="mt-2">
                        <label className="block mb-1">Use points (min 500, step 100)</label>
                        <input type="number" min={0} step={100} value={redeemPointsInput} onChange={(e)=>setRedeemPointsInput(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. 500" />
                        {appliedPts > 0 && (
                          <div className="text-xs text-slate-600 mt-1">Applying {appliedPts} pts → TSh {pointsDiscountTZS.toLocaleString()} off</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] h-12 text-lg font-semibold"
                    disabled={state.items.length === 0 || submitting}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Order Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-gray-900">
              Order Confirmed!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Thank you for choosing iFresh! Your order has been successfully placed.
            </DialogDescription>
          </DialogHeader>
          
          {orderData && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">#{orderData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{orderData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{orderData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg text-[#b47435]">TSh {orderData.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loyalty Points Earned:</span>
                    <span className="font-medium text-yellow-600">{orderData.pointsEarned} points</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900 mb-1">What’s Next!</h5>
                    <p className="text-sm text-blue-700">
                      We’re now preparing it carefully and will notify you once it’s on the way.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => router.push('/')}
                  className="flex-1 bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f]"
                >
                  Continue Shopping
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/account')}
                  className="flex-1"
                >
                  View Orders
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}