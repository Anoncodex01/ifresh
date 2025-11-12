"use client";

import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Phone, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Footer() {
  return (
    <footer className="bg-white text-black py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Left Column - Support/Info */}
          <div>
            <h5 className="font-bold text-lg mb-6 text-black">SUPPORT & INFO</h5>
            <ul className="space-y-3 text-slate-600">
              <li><Link href="/blog" className="hover:text-[#b47435] transition-colors font-medium">BLOG</Link></li>
              <li><Link href="/support" className="hover:text-[#b47435] transition-colors font-medium">SUPPORT</Link></li>
              <li><Link href="/contact" className="hover:text-[#b47435] transition-colors font-medium">CONTACT</Link></li>
              <li><Link href="/guarantee" className="hover:text-[#b47435] transition-colors font-medium">GROWTH GUARANTEE</Link></li>
              <li><Link href="/store-locator" className="hover:text-[#b47435] transition-colors font-medium">STORE LOCATOR</Link></li>
            </ul>
          </div>
          
          {/* Center Column - Social Media & Newsletter */}
          <div className="text-center">
            {/* Social Media Icons */}
            <div className="flex justify-center space-x-4 mb-8">
              <Link href="https://facebook.com/ifreshbeard" target="_blank" className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center hover:bg-[#b47435] hover:border-[#b47435] transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="https://x.com/ifreshbeard" target="_blank" className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center hover:bg-[#b47435] hover:border-[#b47435] transition-colors" aria-label="X (Twitter)">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="https://instagram.com/ifresh.beard" target="_blank" className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center hover:bg-[#b47435] hover:border-[#b47435] transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </Link>
            </div>
            
            {/* Newsletter Signup */}
            <div className="max-w-md mx-auto">
              <h5 className="font-bold text-lg mb-2 text-black">JOIN OUR EMAIL NEWSLETTER</h5>
              <p className="text-sm text-slate-600 mb-4">Subscribe to get the latest news, promos & more!</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your Email Address"
                  className="flex-1 rounded-none border-2 border-black bg-white text-black placeholder-slate-500 focus:border-[#b47435] h-12"
                />
                <Button className="bg-black text-white hover:bg-[#b47435] rounded-none px-4 h-12">
                  →
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-sm text-slate-700">
                <a href="tel:+255758555551" className="inline-flex items-center gap-2 hover:text-[#b47435]">
                  <Phone className="w-4 h-4" /> +255 758 555 551
                </a>
                <span className="text-slate-400">|</span>
                <a href="https://wa.me/255758555551?text=Hello%20iFresh%2C%20I%20would%20like%20to%20order" target="_blank" className="inline-flex items-center gap-2 hover:text-[#b47435]">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
          
          {/* Right Column - Engagement/Legal */}
          <div>
            <h5 className="font-bold text-lg mb-6 text-black">ENGAGEMENT & LEGAL</h5>
            <ul className="space-y-3 text-slate-600">
              <li><Link href="/quiz" className="hover:text-[#b47435] transition-colors font-medium">TAKE THE QUIZ</Link></li>
              <li><Link href="/rewards" className="hover:text-[#b47435] transition-colors font-medium">REWARDS</Link></li>
              <li><Link href="/refer" className="hover:text-[#b47435] transition-colors font-medium">REFER A FRIEND</Link></li>
              <li><Link href="/reviews" className="hover:text-[#b47435] transition-colors font-medium">REVIEWS</Link></li>
              <li><Link href="/privacy" className="hover:text-[#b47435] transition-colors font-medium">PRIVACY POLICY</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Copyright Bar */}
        <div className="border-t border-slate-300 pt-8 text-center">
          <p className="text-sm text-slate-500">
            © 2025 iFresh. All rights reserved | Terms and Conditions | Privacy Policy
          </p>
        </div>
      </div>
    </footer>
  );
}
