"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewsletterSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/Untitled_1920_x_1080_px.webp')"
        }}
      ></div>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70"></div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-5xl lg:text-6xl font-bold mb-6 text-white font-outfit-bold">
            DISCOVER YOUR BEST BEARD
          </h3>
          <p className="text-xl text-white/90 mb-12 font-outfit-regular">
            Say goodbye to your beard issues and unlock 35% off
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
            <Input
              type="email"
              placeholder="Your Email Address"
              className="flex-1 rounded-none border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:bg-white/20 focus:border-white/50 h-14 text-lg"
            />
            <Button className="bg-[#f0c770] text-black hover:bg-[#f0c770]/90 rounded-none px-8 h-14 text-lg font-bold font-outfit-bold">
              Subscribe →
            </Button>
          </div>

          <p className="text-sm text-white/70">
            Join our email newsletter for the latest news, promos & more!
          </p>
          <p className="text-sm text-white/80 mt-2">
            Or contact us directly: <a href="tel:+255758555551" className="underline hover:no-underline">+255 758 555 551</a>
          </p>
        </div>
      </div>
    </section>
  );
}
