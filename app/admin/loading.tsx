import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-slate-200" />
          <Skeleton className="h-4 w-80 bg-slate-200" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-white">
              <Skeleton className="h-4 w-24 mb-3 bg-slate-200" />
              <Skeleton className="h-7 w-32 bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Recent orders skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-40 bg-slate-200" />
          <div className="rounded-lg border bg-white p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20 bg-slate-200" />
                  <Skeleton className="h-4 w-16 bg-slate-200" />
                </div>
                <Skeleton className="h-4 w-24 bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
