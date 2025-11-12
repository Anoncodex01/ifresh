'use client';

import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function Layout({ children, showBackButton = false, onBackClick }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header showBackButton={showBackButton} onBackClick={onBackClick} />
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}
