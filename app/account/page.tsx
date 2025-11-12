"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, ShoppingBag, LayoutGrid, LogOut, FileText } from 'lucide-react';

type Order = { id: number; total: number; status: string; createdAt: string; items?: any[]; paymentStatus?: string; receiptUrl?: string | null };

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [refUrl, setRefUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'orders' | 'profile'>('overview');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [reminderDate, setReminderDate] = useState<string>('');
  const [reminderOptIn, setReminderOptIn] = useState<boolean>(true);
  const [savingReminder, setSavingReminder] = useState<boolean>(false);
  const [products, setProducts] = useState<Array<{ id: number; name: string }>>([]);
  const [nextReminderProductId, setNextReminderProductId] = useState<number | ''>('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [meRes, ordersRes] = await Promise.all([
          fetch('/api/account/me', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/account/orders', { cache: 'no-store', credentials: 'include' }),
        ]);
        if (!alive) return;
        if (meRes.status === 401) {
          setError('Please login to view your account.');
          setLoading(false);
          return;
        }
        const meJson = await meRes.json().catch(() => ({}));
        const ordersJson = await ordersRes.json().catch(() => ({ orders: [] }));
        setMe(meJson || null);
        setOrders(Array.isArray(ordersJson.orders) ? ordersJson.orders : []);
        if (ordersJson?.customerId) setCustomerId(Number(ordersJson.customerId));
        // Load products for reminder dropdown
        try {
          const pr = await fetch('/api/products?limit=1000', { cache: 'no-store' });
          const pj = await pr.json().catch(()=>({ products: [] }));
          const list = Array.isArray(pj.products) ? pj.products.map((p:any)=>({ id: Number(p.id), name: String(p.name) })) : [];
          setProducts(list);
        } catch {}
        // Load points and referral link when user loaded
        if (ordersJson?.customerId) {
          try {
            const [ptsRes, refRes] = await Promise.all([
              fetch(`/api/account/points?customerId=${ordersJson.customerId}`, { cache: 'no-store', credentials: 'include' }),
              fetch(`/api/account/referral-link?userId=${meJson.id}`, { cache: 'no-store', credentials: 'include' }),
            ]);
            const ptsJson = await ptsRes.json().catch(()=>({ points:0 }));
            const refJson = await refRes.json().catch(()=>({ url:'' }));
            setPoints(Number(ptsJson.points||0));
            if (refJson?.url) setRefUrl(refJson.url);
          } catch {}
        }
        // Load reminder if we have customerId
        if (ordersJson?.customerId) {
          try {
            const r = await fetch(`/api/account/reminder?customerId=${ordersJson.customerId}`, { cache: 'no-store', credentials: 'include' });
            if (r.ok) {
              const j = await r.json();
              if (j?.ok) {
                setReminderOptIn(!!j.reminderOptIn);
                setReminderDate(j.nextReminderDate || '');
                setNextReminderProductId(j.nextReminderProductId || '');
              }
            }
          } catch {}
        }
      } catch {
        setError('Failed to load account');
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => ({
    orders: orders.length,
    spent: orders.reduce((s, o) => s + Number(o.total || 0), 0),
  }), [orders]);

  const statusPill = (s: string) => (
    <Badge className={
      s === 'delivered' ? 'bg-green-100 text-green-800' :
      s === 'shipped' ? 'bg-purple-100 text-purple-800' :
      s === 'processing' ? 'bg-blue-100 text-blue-800' :
      'bg-yellow-100 text-yellow-800'
    }>
      {s}
    </Badge>
  );

  const doLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  };

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !me?.id) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read failed'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/account/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: me.id, customerId, imageBase64: base64 }),
      });
      const data = await res.json().catch(()=>({ ok:false }));
      if (data?.ok && data.url) {
        // Prefer customer BLOB endpoint when customerId is available
        const newUrl = customerId ? `/api/account/avatar?customerId=${customerId}&t=${Date.now()}` : String(data.url);
        setMe((prev:any) => ({ ...prev, avatar_url: newUrl }));
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const copyReferral = async () => {
    if (!refUrl) return;
    try { await navigator.clipboard.writeText(refUrl); } catch {}
  };

  async function saveReminder() {
    if (!customerId) return;
    setSavingReminder(true);
    try {
      await fetch('/api/account/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, reminderOptIn, nextReminderDate: reminderDate || null, nextReminderProductId: nextReminderProductId || null }),
      });
    } finally { setSavingReminder(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-slate-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <p className="text-red-600 mb-4">{error}</p>
              <Link href="/auth/login">
                <Button className="bg-gradient-to-r from-[#b47435] to-[#b77123]">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-slate-600">Welcome back{me?.fullName ? `, ${me.fullName.split(' ')[0]}` : ''}.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            {/* Mobile top nav */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm mb-4 lg:hidden">
              <CardContent className="p-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  <button onClick={() => setTab('overview')} className={`px-3 py-2 rounded-md whitespace-nowrap border ${tab==='overview'?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-700'}`}>Overview</button>
                  <button onClick={() => setTab('orders')} className={`px-3 py-2 rounded-md whitespace-nowrap border ${tab==='orders'?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-700'}`}>Orders ({stats.orders})</button>
                  <button onClick={() => setTab('profile')} className={`px-3 py-2 rounded-md whitespace-nowrap border ${tab==='profile'?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-700'}`}>Profile</button>
                  <button onClick={doLogout} className="px-3 py-2 rounded-md whitespace-nowrap border text-red-600">Logout</button>
                </div>
              </CardContent>
            </Card>

            {/* Desktop sidebar */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm hidden lg:block lg:sticky lg:top-6">
              <CardContent className="p-0">
                <nav className="flex lg:block">
                  <button onClick={() => setTab('overview')} className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 ${tab==='overview'?'bg-slate-50 font-semibold':''}`}>
                    <LayoutGrid className="w-4 h-4" /> Overview
                  </button>
                  <button onClick={() => setTab('orders')} className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 ${tab==='orders'?'bg-slate-50 font-semibold':''}`}>
                    <ShoppingBag className="w-4 h-4" /> Orders
                    <span className="ml-auto text-xs text-slate-500">{stats.orders}</span>
                  </button>
                  <button onClick={() => setTab('profile')} className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 ${tab==='profile'?'bg-slate-50 font-semibold':''}`}>
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <Separator className="my-2" />
                  <button onClick={doLogout} className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-red-50 text-red-600">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <section className="lg:col-span-9 space-y-6">
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      { (customerId || me?.avatar_url) ? (
                        <img src={customerId ? `/api/account/avatar?customerId=${customerId}` : me?.avatar_url} alt="Avatar" className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#b47435] to-[#b77123] text-white flex items-center justify-center text-lg font-semibold">
                          {String(me?.fullName || 'U').split(' ').map((p: string)=>p[0]).join('')}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{me?.fullName}</p>
                        <p className="text-sm text-slate-600">{me?.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="inline-flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                        <span className={`inline-flex items-center px-3 py-1 rounded-md border ${uploading ? 'opacity-60 pointer-events-none':''}`}>{uploading ? 'Uploading…' : 'Change Avatar'}</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">Phone:</span> {me?.phone}</div>
                      <div><span className="text-slate-500">Region:</span> {me?.region || '—'}</div>
                      <div><span className="text-slate-500">Country:</span> {me?.country || '—'}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">My Orders</h3>
                      <a href="/account/purchases" className="text-sm text-[#b47435] underline">View Purchased Products</a>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-slate-50">
                        <p className="text-sm text-slate-600">Total Orders</p>
                        <p className="text-2xl font-bold">{stats.orders}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50">
                        <p className="text-sm text-slate-600">Total Spent</p>
                        <p className="text-2xl font-bold">TSh {stats.spent.toLocaleString()}</p>
                        <div className="mt-2">
                          <a href="/account/purchases" className="text-xs text-[#b47435] underline">View Purchased Products</a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Loyalty + Referral */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader><CardTitle>Loyalty Points</CardTitle></CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-slate-50 mb-4">
                      <p className="text-sm text-slate-600">Total Points</p>
                      <p className="text-3xl font-bold">{points.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">100 Points = TSh 1,000. Min redemption 500 Points.</p>
                    </div>
                    <a href="/products" className="inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#b47435] to-[#b77123] text-white">Redeem at Checkout</a>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader><CardTitle>Invite & Earn</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">Share your link and earn bonus points when your friend places their first delivered order.</div>
                    <div className="flex gap-2 items-center">
                      <input value={refUrl} readOnly className="flex-1 px-3 py-2 rounded-md border text-sm" />
                      <button onClick={copyReferral} className="px-3 py-2 rounded-md border text-sm">Copy</button>
                    </div>
                    <div className="flex gap-2">
                      <a className="px-3 py-2 rounded-md border text-sm" target="_blank" href={`https://wa.me/?text=${encodeURIComponent('Join me on iFresh! '+refUrl)}`}>WhatsApp</a>
                      <a className="px-3 py-2 rounded-md border text-sm" target="_blank" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refUrl)}`}>Facebook</a>
                      <a className="px-3 py-2 rounded-md border text-sm" target="_blank" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Join me on iFresh!')}&url=${encodeURIComponent(refUrl)}`}>X</a>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Next Order Reminder */}
              <div className="grid grid-cols-1">
                <Card className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader><CardTitle>Next Order</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="text-sm text-slate-600">Reminder Date</label>
                        <input type="date" value={reminderDate || ''} onChange={e=>setReminderDate(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-md border text-sm" />
                      </div>
                      <div>
                        <label className="text-sm text-slate-600">Product (optional)</label>
                        <select value={nextReminderProductId as any} onChange={e=>setNextReminderProductId(e.target.value ? Number(e.target.value) : '')} className="mt-1 w-full px-3 py-2 rounded-md border text-sm">
                          <option value="">Select a product…</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 mt-6 sm:mt-0">
                        <input type="checkbox" id="optin" checked={reminderOptIn} onChange={e=>setReminderOptIn(e.target.checked)} />
                        <label htmlFor="optin" className="text-sm">Receive reminders</label>
                      </div>
                      <div className="sm:text-right">
                        <button onClick={saveReminder} disabled={!customerId || savingReminder} className="px-4 py-2 rounded-md bg-gradient-to-r from-[#b47435] to-[#b77123] text-white">
                          {savingReminder ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                    {reminderDate && (
                      <div className="text-sm text-slate-600">Your next order date is set to <span className="font-semibold">{new Date(reminderDate).toLocaleDateString()}</span>.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
              </div>
            )}

            {tab === 'orders' && (
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader><CardTitle>My Orders</CardTitle></CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-slate-600">No orders yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((o) => (
                        <div key={o.id} className="p-4 rounded-lg border hover:bg-slate-50 transition">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-semibold">#{o.id}</span>
                              {statusPill(o.status)}
                              {o.paymentStatus && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${o.paymentStatus==='paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {o.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                </span>
                              )}
                            </div>
                            <div className="sm:text-right font-semibold">TSh {Number(o.total || 0).toLocaleString()}</div>
                          </div>
                          <p className="text-sm text-slate-600">{new Date(o.createdAt).toLocaleString()}</p>
                          {(o.paymentStatus === 'paid' || o.receiptUrl) && (
                            <div className="mt-2 flex items-center gap-3 flex-wrap text-sm">
                              {o.paymentStatus === 'paid' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">Status: Paid</span>
                              )}
                              {o.receiptUrl && (
                                <a href={o.receiptUrl} target="_blank" className="inline-flex items-center gap-1 text-[#b47435] underline">
                                  <FileText className="w-4 h-4" /> Download Receipt
                                </a>
                              )}
                            </div>
                          )}
                          {o.items?.length ? (
                            <ul className="mt-2 text-sm text-slate-700 list-disc ml-5">
                              {o.items.map((it: any, idx: number) => (
                                <li key={idx}>{it.name} × {it.quantity} — TSh {(it.price * it.quantity).toLocaleString()}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {tab === 'profile' && (
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Full Name:</span> {me?.fullName}</div>
                    <div><span className="text-slate-500">Phone:</span> {me?.phone}</div>
                    <div><span className="text-slate-500">Email:</span> {me?.email || '—'}</div>
                    <div><span className="text-slate-500">Region:</span> {me?.region || '—'}</div>
                    <div><span className="text-slate-500">Country:</span> {me?.country || '—'}</div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" disabled>Edit Profile (coming soon)</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security tab removed */}
          </section>
        </div>
      </div>
    </div>
  );
}
