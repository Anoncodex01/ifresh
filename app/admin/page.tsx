'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Eye,
  Plus,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type OrderRow = {
  id: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        const [ordersRes, productsRes, customersRes] = await Promise.all([
          fetch('/api/orders', { cache: 'no-store' }),
          fetch('/api/products', { cache: 'no-store' }),
          fetch('/api/customers', { cache: 'no-store' }),
        ]);
        const ordersJson = await ordersRes.json().catch(() => ({ orders: [] }));
        const productsJson = await productsRes.json().catch(() => ({ products: [] }));
        const customersJson = await customersRes.json().catch(() => ({ customers: [] }));
        if (!alive) return;
        setOrders(Array.isArray(ordersJson.orders) ? ordersJson.orders : []);
        setProductsCount(Array.isArray(productsJson.products) ? productsJson.products.length : 0);
        setCustomersCount(Array.isArray(customersJson.customers) ? customersJson.customers.length : 0);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const totalRevenue = useMemo(() => orders.reduce((sum, o: any) => sum + Number(o.total || 0), 0), [orders]);
  const totalOrders = orders.length;

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((o: any) => ({
        id: `#${o.id}`,
        customer: o.customer_name || 'Customer',
        products: Array.isArray(o.items) ? o.items.length : undefined,
        total: `TSh ${Number(o.total || 0).toLocaleString()}`,
        status: o.status,
        date: new Date(o.created_at).toISOString().slice(0, 10),
      }));
  }, [orders]);

  const stats = [
    { title: 'Total Revenue', value: `TSh ${totalRevenue.toLocaleString()}`, change: '', trend: 'up', icon: DollarSign },
    { title: 'Total Orders', value: `${totalOrders}`, change: '', trend: 'up', icon: ShoppingCart },
    { title: 'Total Products', value: `${productsCount}`, change: '', trend: 'up', icon: Package },
    { title: 'Total Customers', value: `${customersCount}`, change: '', trend: 'up', icon: Users },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View Store
            </Button>
            <Button className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f]">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex items-center space-x-3 mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#b47435]" />
            <h2 className="text-xl font-semibold text-gray-900">Loading Dashboard...</h2>
          </div>
          <p className="text-gray-600 text-center max-w-md">
            Please wait while we fetch your store statistics, recent orders, and other important information.
          </p>
          
          {/* Loading Skeleton Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 w-full">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="p-3 bg-gray-200 rounded-lg animate-pulse">
                      <div className="w-6 h-6"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View Store
          </Button>
          <Button className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f]">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-lg">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders - Full Width */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Recent Orders
          </CardTitle>
          <Button variant="ghost" size="sm">View All</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{order.id}</span>
                    <span className="text-sm text-gray-600">{order.customer}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{order.total}</span>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <span className="text-sm text-gray-500">{order.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent orders available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Package className="w-6 h-6" />
              <span>Add New Product</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <ShoppingCart className="w-6 h-6" />
              <span>Process Orders</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="w-6 h-6" />
              <span>View Customers</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
