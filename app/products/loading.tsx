import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pt-4 pb-8">
      {/* Compact heading skeleton */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-80 bg-slate-200 rounded animate-pulse" />
      </div>

      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <div className="w-80 hidden lg:block">
          <div className="p-6 border rounded-lg bg-white space-y-4">
            <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-full bg-slate-200 rounded animate-pulse" />
            ))}
            <div className="h-5 w-24 bg-slate-200 rounded animate-pulse mt-4" />
            <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Products grid skeleton */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="relative border-0 bg-white overflow-hidden rounded-2xl shadow-sm">
                <div className="aspect-square bg-slate-200 animate-pulse" />
                <CardHeader className="pb-3">
                  <div className="h-5 w-2/3 bg-slate-200 animate-pulse rounded mb-2" />
                  <div className="h-4 w-1/3 bg-slate-200 animate-pulse rounded" />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-24 bg-slate-200 animate-pulse rounded" />
                    <div className="h-9 w-9 bg-slate-200 animate-pulse rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
