"use client";

import React, { useEffect, useState } from 'react';
import { Search, Calendar, Phone, Mail, MapPin, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type AdminCustomer = {
  id: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  region: string | null;
  country: string | null;
  nextOrderDate: string | null;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
};

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [viewId, setViewId] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch('/api/admin/customers?limit=200', { cache: 'no-store' });
      const data = await res.json().catch(() => ({ customers: [] }));
      setRows(Array.isArray(data.customers) ? data.customers : []);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) =>
    (r.fullName || '').toLowerCase().includes(q.toLowerCase()) ||
    (r.email || '').toLowerCase().includes(q.toLowerCase()) ||
    (r.phone || '').includes(q)
  );

  const saveNextDate = async (id: number, nextOrderDate: string | null) => {
    await fetch('/api/admin/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: id, nextOrderDate }),
    });
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, nextOrderDate } : r)));
  };

  const openPurchases = async (id: number) => {
    setViewId(id);
    const res = await fetch(`/api/admin/customers/purchases?customerId=${id}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({ products: [] }));
    setPurchases(data.products || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage next order dates and purchase history</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search by name, email, or phone" className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-600">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-600">No customers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2">Name</th>
                    <th className="py-2">Contact</th>
                    <th className="py-2">Region</th>
                    <th className="py-2">Next Order Date</th>
                    <th className="py-2">Orders</th>
                    <th className="py-2">Total Spent</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="py-3 font-medium">{c.fullName}</td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone || '—'}</span>
                          <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.region || '—'}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={c.nextOrderDate ? String(c.nextOrderDate).slice(0,10) : ''}
                            onChange={(e)=> saveNextDate(c.id, e.target.value || null)}
                            className="h-9 w-[170px]"
                          />
                        </div>
                      </td>
                      <td className="py-3">{c.ordersCount}</td>
                      <td className="py-3">TSh {c.totalSpent.toLocaleString()}</td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" onClick={()=>openPurchases(c.id)}>
                          <Eye className="w-4 h-4 mr-1" /> Purchases
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewId} onOpenChange={()=>{ setViewId(null); setPurchases([]); }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Purchased Products</DialogTitle>
          </DialogHeader>
          {purchases.length === 0 ? (
            <p className="text-slate-600">No purchases found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2">Product</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p:any, idx:number)=> (
                    <tr key={idx} className="border-t">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2">{p.qty}</td>
                      <td className="py-2">TSh {Number(p.spent||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
