"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsletterSection";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const waText = encodeURIComponent(`Hello iFresh, my name is ${name}. ${message}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent mb-2">
          Contact Us
        </h1>
        <p className="text-slate-700 mb-8">We'd love to hear from you. Reach us via call, WhatsApp, or the form below.</p>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader><CardTitle>Get in touch</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-600">Full Name</label>
                <Input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600">Email (optional)</label>
                  <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Phone</label>
                  <Input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600">Message</label>
                <textarea value={message} onChange={(e)=>setMessage(e.target.value)} className="w-full mt-1 p-3 border rounded-md min-h-[120px]" placeholder="How can we help?" />
              </div>
              <div className="flex gap-3">
                <a href={`https://wa.me/255758555551?text=${waText}`} target="_blank" className="px-4 h-11 inline-flex items-center justify-center rounded-md bg-green-600 text-white hover:bg-green-700">WhatsApp</a>
                <a href="tel:+255758555551" className="px-4 h-11 inline-flex items-center justify-center rounded-md border hover:bg-slate-50">Call +255 758 555 551</a>
                <Button disabled className="h-11">Send (email coming soon)</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader><CardTitle>Store Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <p><span className="font-semibold">Phone:</span> +255 758 555 551</p>
              <p><span className="font-semibold">WhatsApp:</span> +255 758 555 551</p>
              <p><span className="font-semibold">Hours:</span> Mon–Sat, 9:00–18:00</p>
              <p><span className="font-semibold">Social:</span> Instagram @ifresh.beard, X @ifreshbeard, Facebook @ifreshbeard</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <NewsletterSection />
      <Footer />
    </div>
  );
}
