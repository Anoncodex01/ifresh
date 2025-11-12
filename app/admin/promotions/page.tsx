"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Save, Trash2, ToggleLeft, ToggleRight, Edit, Eye } from "lucide-react";

// Modern templates to choose from
const TEMPLATE_OPTIONS = [
  {
    id: "minimal",
    name: "Minimal Promo",
    defaultConfig: {
      headline: "Limited time offer",
      subtext: "Save more on select products",
      colorFrom: "#b47435",
      colorTo: "#b77123",
    },
  },
  {
    id: "percent-badge",
    name: "Percent Badge",
    defaultConfig: {
      headline: "Up to 25% OFF",
      subtext: "Discount auto-applies at checkout",
      colorFrom: "#16a34a",
      colorTo: "#059669",
    },
  },
  {
    id: "countdown",
    name: "Countdown Banner",
    defaultConfig: {
      headline: "Sale ends soon",
      subtext: "Hurry before it ends",
      colorFrom: "#b91c1c",
      colorTo: "#ef4444",
    },
  },
] as const;

type TemplateId = (typeof TEMPLATE_OPTIONS)[number]["id"];

export default function PromotionsAdminPage() {
  const [loading, setLoading] = useState(false);
  const [promos, setPromos] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [template, setTemplate] = useState<TemplateId>("minimal");
  const [config, setConfig] = useState<any>(TEMPLATE_OPTIONS[0].defaultConfig);
  const [items, setItems] = useState<Array<{ productName: string; productId?: number | null; overridePrice: string }>>([
    { productName: "", overridePrice: "" },
  ]);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [generateCoupon, setGenerateCoupon] = useState(false);

  // Load recent promotions
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/promotions", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setPromos(data.promotions || []);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  const activeTemplate = useMemo(() => TEMPLATE_OPTIONS.find(t => t.id === template)!, [template]);

  const applyTemplate = (id: TemplateId) => {
    setTemplate(id);
    const tpl = TEMPLATE_OPTIONS.find(t => t.id === id)!;
    setConfig(tpl.defaultConfig);
  };

  const addItem = () => setItems(prev => [...prev, { productName: "", overridePrice: "" }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const generateRandomCoupon = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponCode(result);
  };

  const savePromotion = async () => {
    if (!name || !startDate || !endDate) return;
    try {
      setLoading(true);
      const cleanedItems = items
        .filter(it => it.productName && it.overridePrice)
        .map(it => ({ productName: it.productName, productId: null, overridePrice: Number(it.overridePrice) }));

      const payload = { name, startDate, endDate, items: cleanedItems, template, config };
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const promoData = await res.json();
        
        // Create coupon if requested
        if (generateCoupon && couponCode) {
          try {
            await fetch("/api/admin/coupons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: couponCode,
                type: "percentage",
                value: 10, // Default 10% discount
                min_spend: 0,
                expires_at: endDate,
                usage_limit: 100,
                promotion_id: promoData.id
              }),
            });
          } catch (e) {
            console.error("Failed to create coupon:", e);
          }
        }
        
        setName(""); setStartDate(""); setEndDate(""); setItems([{ productName: "", overridePrice: "" }]);
        setCouponCode(""); setGenerateCoupon(false);
        const data = await fetch("/api/admin/promotions", { cache: "no-store" }).then(r => r.json()).catch(() => ({ promotions: [] }));
        setPromos(data.promotions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const deletePromotion = async (promoId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/promotions/${promoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await fetch("/api/admin/promotions", { cache: "no-store" }).then(r => r.json()).catch(() => ({ promotions: [] }));
        setPromos(data.promotions || []);
        setShowDeleteDialog(false);
        setSelectedPromo(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePromotionStatus = async (promoId: number, isActive: boolean) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/promotions/${promoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        const data = await fetch("/api/admin/promotions", { cache: "no-store" }).then(r => r.json()).catch(() => ({ promotions: [] }));
        setPromos(data.promotions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600">Create and schedule promotions with templates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: Templates */}
        <Card className="lg:col-span-1 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {TEMPLATE_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className={`w-full text-left px-3 py-2 rounded-md border ${template===t.id? 'border-slate-900 bg-slate-50':'border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-600">{t.defaultConfig.headline}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>New Promotion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="October Super Sale" />
              </div>
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
              </div>
            </div>

            {/* Template Config */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Headline</Label>
                <Input value={config.headline || ""} onChange={(e)=>setConfig({ ...config, headline: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Subtext</Label>
                <Input value={config.subtext || ""} onChange={(e)=>setConfig({ ...config, subtext: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Gradient From</Label>
                <Input type="color" value={config.colorFrom || "#b47435"} onChange={(e)=>setConfig({ ...config, colorFrom: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Gradient To</Label>
                <Input type="color" value={config.colorTo || "#b77123"} onChange={(e)=>setConfig({ ...config, colorTo: e.target.value })} />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Promotion Items</div>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="grid md:grid-cols-3 gap-3 items-end">
                  <div className="grid gap-2">
                    <Label>Product Name</Label>
                    <Input value={it.productName} onChange={(e)=>{
                      const copy=[...items]; copy[idx].productName=e.target.value; setItems(copy);
                    }} placeholder="Beard Oil" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Override Price (TSh)</Label>
                    <Input type="number" value={it.overridePrice} onChange={(e)=>{
                      const copy=[...items]; copy[idx].overridePrice=e.target.value; setItems(copy);
                    }} placeholder="40000" />
                  </div>
                  <div>
                    <Button variant="destructive" onClick={()=>removeItem(idx)}><Trash2 className="w-4 h-4 mr-1"/>Remove</Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="generateCoupon"
                  checked={generateCoupon}
                  onChange={(e) => setGenerateCoupon(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="generateCoupon">Generate Coupon Code</Label>
              </div>
              
              {generateCoupon && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Coupon Code</Label>
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="SUMMER2024"
                        className="uppercase"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateRandomCoupon}
                        className="whitespace-nowrap"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      defaultValue="10"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <div className="font-medium">Live Preview</div>
              <div
                className="rounded-xl p-6 text-white"
                style={{ background: `linear-gradient(90deg, ${config.colorFrom}, ${config.colorTo})` }}
              >
                <div className="text-2xl font-bold">{config.headline || activeTemplate.defaultConfig.headline}</div>
                <div className="opacity-90">{config.subtext || activeTemplate.defaultConfig.subtext}</div>
                {generateCoupon && couponCode && (
                  <div className="mt-3 text-sm bg-white/20 rounded px-3 py-1 inline-block">
                    Use code: {couponCode}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={savePromotion} className="bg-gradient-to-r from-[#b47435] to-[#b77123]" disabled={loading}>
                {loading ? (<span className="inline-flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Saving...</span>) : (<span className="inline-flex items-center"><Save className="w-4 h-4 mr-2"/>Save Promotion</span>)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent promotions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Promotions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {promos.length === 0 && <div className="text-slate-600">No promotions yet.</div>}
          {promos.map((p:any)=> {
            const isActive = p.isActive && new Date(p.startDate) <= new Date() && new Date(p.endDate) >= new Date();
            const isExpired = new Date(p.endDate) < new Date();
            const isUpcoming = new Date(p.startDate) > new Date();
            
            return (
              <div key={p.id} className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{p.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isActive ? 'bg-green-100 text-green-800' :
                        isExpired ? 'bg-red-100 text-red-800' :
                        isUpcoming ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {isActive ? 'Active' : isExpired ? 'Expired' : isUpcoming ? 'Upcoming' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {p.startDate} → {p.endDate} {p.template ? `• ${p.template}`:''}
                    </div>
                    <div className="text-xs text-gray-500">{(p.items||[]).length} items</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePromotionStatus(p.id, p.isActive)}
                      disabled={loading}
                      className="flex items-center gap-1"
                    >
                      {p.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {p.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPromo(p);
                        setShowDeleteDialog(true);
                      }}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedPromo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Promotion</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{selectedPromo.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedPromo(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deletePromotion(selectedPromo.id)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
