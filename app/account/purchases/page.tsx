"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PurchasesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<{ordersCount:number,totalSpent:number}>({ordersCount:0,totalSpent:0});

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/account/purchases', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.products || []);
      setStats(data.stats || {ordersCount:0,totalSpent:0});
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchased Products</h1>
            <p className="text-slate-600">Total Spent: TSh {stats.totalSpent.toLocaleString()} · Orders: {stats.ordersCount}</p>
          </div>
          <Link href="/account" className="text-[#b47435] underline">Back to Account</Link>
        </div>

        <Card className="border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-slate-600">No purchases yet.</p>
            ) : (
              <ul className="divide-y">
                {items.map((p, idx) => (
                  <li key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-slate-600">Qty: {p.qty}</p>
                    </div>
                    <div className="font-semibold">TSh {Number(p.spent||0).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
