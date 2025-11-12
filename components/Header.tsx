'use client';

import React, { useState } from 'react';
import { ShoppingCart, Menu, X, User, ArrowLeft, Search, Phone, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
// import { useLoyalty } from '@/contexts/LoyaltyContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function Header({ showBackButton = false, onBackClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { getItemCount } = useCart();
  // const { state: loyaltyState } = useLoyalty();
  const router = useRouter();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      window.history.back();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar - Gold */}
      <div className="bg-gradient-to-r from-[#b47435] to-[#b77123] text-white py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-sm"></div>
            </div>
            <span className="font-medium">FREE SHIPPING OVER TSh 50,000</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>+255 758 555 551</span>
            </div>
            <Link href="/auth/login" className="flex items-center space-x-2 hover:text-yellow-200 transition-colors">
              <User className="w-4 h-4" />
              <span>ACCOUNT</span>
            </Link>
            <Link href="/cart" className="flex items-center space-x-2 hover:text-yellow-200 transition-colors relative">
              <ShoppingCart className="w-4 h-4" />
              <span>CART</span>
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-[#b47435] text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {getItemCount()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar - White */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleBackClick}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <Link href="/" className="text-2xl font-bold text-gray-900">
                iFresh
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <div className="relative group">
                <a href="/products" className="flex items-center space-x-1 text-gray-700 hover:text-[#b47435] transition-colors font-bold">
                  <span>SHOP</span>
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>
              <div className="relative group">
                <a href="/about" className="flex items-center space-x-1 text-gray-700 hover:text-[#b47435] transition-colors font-bold">
                  <span>ABOUT</span>
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>
              <div className="relative group">
                <a href="/contact" className="flex items-center space-x-1 text-gray-700 hover:text-[#b47435] transition-colors font-bold">
                  <span>HELP</span>
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>
              <a href="/rewards" className="text-gray-700 hover:text-[#b47435] transition-colors font-bold">REWARDS</a>
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="SEARCH"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      router.push(`/products?q=${encodeURIComponent(query)}`);
                    }
                  }}
                  className="pl-4 pr-12 py-3 w-80 bg-white border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-[#b47435] focus:border-[#b47435] text-gray-900 placeholder-gray-500 font-medium"
                />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
              <Input
                type="text"
                placeholder="SEARCH"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsMenuOpen(false);
                    router.push(`/products?q=${encodeURIComponent(query)}`);
                  }
                }}
                className="pl-4 pr-12 py-3 w-full bg-white border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-[#b47435] focus:border-[#b47435] text-gray-900 placeholder-gray-500 font-medium"
              />
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/products" className="text-gray-700 hover:text-[#b47435] py-2 font-bold transition-colors">SHOP</a>
              <a href="/about" className="text-gray-700 hover:text-[#b47435] py-2 font-bold transition-colors">ABOUT</a>
              <a href="/contact" className="text-gray-700 hover:text-[#b47435] py-2 font-bold transition-colors">HELP</a>
              <a href="/rewards" className="text-gray-700 hover:text-[#b47435] py-2 font-bold transition-colors">REWARDS</a>
            </nav>
            <div className="flex items-center space-x-4 pt-2 border-t border-gray-200">
              <Link href="/auth/login" className="flex-1">
                <Button variant="ghost" size="sm" className="w-full hover:bg-gray-100 hover:text-[#b47435] transition-colors">
                  <User className="w-5 h-5 mr-2" />
                  ACCOUNT
                </Button>
              </Link>
              <a
                href="tel:+255758555551"
                className="flex-1 text-center text-sm font-medium text-slate-700 hover:text-[#b47435]"
              >
                Call: +255 758 555 551
              </a>
              <Link href="/cart" className="flex-1">
                <Button variant="ghost" size="sm" className="w-full relative hover:bg-gray-100 hover:text-[#b47435] transition-colors">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  CART
                  {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#b47435] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {getItemCount()}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
