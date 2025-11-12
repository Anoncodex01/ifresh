"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Product = { id: number; name: string };
type Row = { productId: number | ''; price: string };

export default function AdminPricesPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<Row[]>([{ productId: '', price: '' }]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // products for dropdown
        const pr = await fetch('/api/products?limit=1000', { cache: 'no-store' });
        const pj = await pr.json().catch(()=>({ products: [] }));
        const list: Product[] = Array.isArray(pj.products) ? pj.products.map((p:any)=>({ id:Number(p.id), name:String(p.name) })) : [];
        setProducts(list);

        // existing window
        const r = await fetch('/api/admin/prices', { cache: 'no-store' });
        const j = await r.json().catch(()=>({ window:null, items:[] }));
        if (j?.window) {
          setStartDate(j.window.start_date?.slice(0,10) || "");
          setEndDate(j.window.end_date?.slice(0,10) || "");
        }
        if (Array.isArray(j?.items) && j.items.length) {
          setRows(j.items.slice(0,10).map((it:any)=>({ productId: Number(it.product_id), price: String(it.price) })));
        }
      } catch {}
    })();
  }, []);

  const canAdd = useMemo(()=> rows.length < 10, [rows.length]);

  function addRow() { if (rows.length < 10) setRows([...rows, { productId: '', price: '' }]); }
  function removeRow(i:number) { setRows(rows.filter((_,idx)=>idx!==i)); }
  function updateRow(i:number, patch: Partial<Row>) {
    const next = rows.slice();
    next[i] = { ...next[i], ...patch };
    setRows(next);
  }

  async function save() {
    setSaving(true); setMessage("");
    try {
      const items = rows
        .filter(r=> Number(r.productId) > 0 && Number(r.price) >= 0)
        .map(r=> ({ productId: Number(r.productId), price: Number(r.price) }));
      const res = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, items })
      });
      const j = await res.json().catch(()=>({ ok:false }));
      setMessage(j?.ok ? 'Saved' : `Failed: ${j?.error || 'Unknown error'}`);
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Card className="border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Price Window</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600">Start Date</label>
                <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-slate-600">End Date</label>
                <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Products (max 10)</div>
                {canAdd && (
                  <button onClick={addRow} className="px-3 py-2 rounded-md border text-sm">Add Product Price</button>
                )}
              </div>
              <div className="space-y-2">
                {rows.map((r, i) => (
                  <div key={i} className="grid md:grid-cols-12 gap-3">
                    <div className="md:col-span-7">
                      <label className="text-xs text-slate-500">Product</label>
                      <select value={r.productId as any} onChange={e=>updateRow(i, { productId: e.target.value ? Number(e.target.value) : '' })} className="mt-1 w-full px-3 py-2 rounded-md border text-sm">
                        <option value="">Select a product…</option>
                        {products.map(p=> (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-xs text-slate-500">Price (TZS)</label>
                      <Input type="number" value={r.price} onChange={e=>updateRow(i, { price: e.target.value })} />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <button onClick={()=>removeRow(i)} className="px-3 py-2 rounded-md border text-sm w-full">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-[#b47435] to-[#b77123]">{saving?'Saving…':'Save Prices'}</Button>
              {message && <span className="text-sm text-slate-600">{message}</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
