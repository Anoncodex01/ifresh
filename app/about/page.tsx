"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsletterSection";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent mb-4">
          About iFresh
        </h1>
        <p className="text-slate-700 mb-8">
          iFresh exists to bring premium, effective grooming products closer to you. We believe in freshness, style and convenience for everyone—delivered fast across Tanzania.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Our Promise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-700">
              <p>• Quality you can trust</p>
              <p>• Fast delivery for eligible orders in 1–2 days</p>
              <p>• Helpful support on call or WhatsApp: +255 758 555 551</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Payments & Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-700">
              <p>• Within Dar es Salaam: Cash on Delivery available</p>
              <p>• Outside Dar es Salaam: 100% upfront, delivery fee TSh 10,000–15,000</p>
              <p>• Lipa Number: 5191175</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-slate-700">
          <p>
            Follow us on social media for updates and offers: {" "}
            <Link href="https://instagram.com/ifresh.beard" className="text-[#b47435] underline">Instagram</Link>, {" "}
            <Link href="https://x.com/ifreshbeard" className="text-[#b47435] underline">X</Link>, {" "}
            <Link href="https://facebook.com/ifreshbeard" className="text-[#b47435] underline">Facebook</Link>.
          </p>
        </div>
      </div>

      <NewsletterSection />
      <Footer />
    </div>
  );
}
