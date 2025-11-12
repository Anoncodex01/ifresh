import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-slate-200" />
          <Skeleton className="h-4 w-72 bg-slate-200" />
        </div>
        <div className="rounded-lg border bg-white divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-16 bg-slate-200" />
                <Skeleton className="h-5 w-24 bg-slate-200" />
                <Skeleton className="h-5 w-28 bg-slate-200" />
              </div>
              <Skeleton className="h-5 w-24 bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
