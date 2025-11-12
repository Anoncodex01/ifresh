import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-52 bg-slate-200" />
            <Skeleton className="h-4 w-80 bg-slate-200" />
          </div>
          <Skeleton className="h-10 w-32 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-4 space-y-3">
              <Skeleton className="h-40 w-full bg-slate-200" />
              <Skeleton className="h-5 w-2/3 bg-slate-200" />
              <Skeleton className="h-4 w-1/2 bg-slate-200" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20 bg-slate-200" />
                <Skeleton className="h-8 w-24 bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
