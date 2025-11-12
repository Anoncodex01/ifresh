'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type AnalyticsData = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    total: number;
    status: string;
    date: string;
  }>;
};

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel
        const [ordersRes, productsRes, customersRes] = await Promise.all([
          fetch('/api/orders', { cache: 'no-store' }),
          fetch('/api/products', { cache: 'no-store' }),
          fetch('/api/customers', { cache: 'no-store' }),
        ]);

        const ordersData = await ordersRes.json().catch(() => ({ orders: [] }));
        const productsData = await productsRes.json().catch(() => ({ products: [] }));
        const customersData = await customersRes.json().catch(() => ({ customers: [] }));

        if (!alive) return;

        const orders = Array.isArray(ordersData.orders) ? ordersData.orders : [];
        const products = Array.isArray(productsData.products) ? productsData.products : [];
        const customers = Array.isArray(customersData.customers) ? customersData.customers : [];

        // Calculate analytics
        const totalRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
        const totalOrders = orders.length;
        const totalCustomers = customers.length;
        const totalProducts = products.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // This month calculations
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const ordersThisMonth = orders.filter((order: any) => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        }).length;
        const revenueThisMonth = orders.filter((order: any) => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        }).reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

        // Top products (simplified - using product names from orders)
        const productSales: Record<string, { sales: number; revenue: number }> = {};
        orders.forEach((order: any) => {
          if (Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const productName = item.name || 'Unknown Product';
              if (!productSales[productName]) {
                productSales[productName] = { sales: 0, revenue: 0 };
              }
              productSales[productName].sales += Number(item.quantity || 1);
              productSales[productName].revenue += Number(item.price || 0) * Number(item.quantity || 1);
            });
          }
        });

        const topProducts = Object.entries(productSales)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        // Recent orders
        const recentOrders = orders
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((order: any) => ({
            id: String(order.id),
            customer: order.customer_name || 'Guest',
            total: Number(order.total || 0),
            status: order.status || 'pending',
            date: new Date(order.created_at).toLocaleDateString(),
          }));

        setAnalyticsData({
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts,
          averageOrderValue,
          ordersThisMonth,
          revenueThisMonth,
          topProducts,
          recentOrders,
        });

      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    })();
    return () => { alive = false; };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Key performance indicators and insights</p>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex items-center space-x-3 mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#b47435]" />
            <h2 className="text-xl font-semibold text-gray-900">Loading Analytics...</h2>
          </div>
          <p className="text-gray-600 text-center max-w-md">
            Please wait while we calculate your store performance metrics.
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

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Key performance indicators and insights</p>
          </div>
        </div>
        <div className="text-center py-20">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      title: 'Total Revenue', 
      value: `TSh ${analyticsData.totalRevenue.toLocaleString()}`, 
      icon: DollarSign,
      color: 'text-green-600'
    },
    { 
      title: 'Total Orders', 
      value: analyticsData.totalOrders.toString(), 
      icon: ShoppingCart,
      color: 'text-blue-600'
    },
    { 
      title: 'Total Customers', 
      value: analyticsData.totalCustomers.toString(), 
      icon: Users,
      color: 'text-purple-600'
    },
    { 
      title: 'Total Products', 
      value: analyticsData.totalProducts.toString(), 
      icon: Package,
      color: 'text-orange-600'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Key performance indicators and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-gray-500">All time</span>
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

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Orders</span>
                <span className="font-semibold">{analyticsData.ordersThisMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="font-semibold">TSh {analyticsData.revenueThisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Order Value</span>
                <span className="font-semibold">TSh {analyticsData.averageOrderValue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topProducts.length > 0 ? (
                analyticsData.topProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 truncate">{product.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{product.sales} sold</div>
                      <div className="text-xs text-gray-500">TSh {product.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No product sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.recentOrders.length > 0 ? (
              analyticsData.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">#{order.id}</span>
                    <span className="text-sm text-gray-600">{order.customer}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">TSh {order.total.toLocaleString()}</span>
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
    </div>
  );
}