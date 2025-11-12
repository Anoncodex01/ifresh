"use client";

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get('next') || '/account';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('Tanzania');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, email, region, country, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      router.push(nextPath);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h1>
            <p className="text-slate-600">Join iFresh</p>

            <div className="mt-4 mb-6 rounded-lg border bg-slate-50 p-4">
              <h2 className="font-semibold text-slate-900">Join the iFresh Family!</h2>
              <p className="text-slate-700 text-sm mt-1">Be part of a growing community that values freshness, style, and convenience.</p>
              <div className="mt-3">
                <p className="text-sm font-medium text-slate-900">Sign up today to enjoy:</p>
                <ul className="list-disc pl-5 text-sm text-slate-700 mt-1 space-y-1">
                  <li>Exclusive discounts</li>
                  <li>Loyalty rewards</li>
                  <li>Personalized offers</li>
                  <li>Early access to new products</li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12"
                required
              />
              <Input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12"
                required
              />
              <Input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
              <div>
                <label className="text-sm text-slate-600">Region (Tanzania)</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="mt-1 h-12 w-full border rounded-md px-3"
                  required
                >
                  <option value="" disabled>Select your region</option>
                  <option>Dar es Salaam</option>
                  <option>Dodoma</option>
                  <option>Arusha</option>
                  <option>Mwanza</option>
                  <option>Mbeya</option>
                  <option>Tanga</option>
                  <option>Morogoro</option>
                  <option>Kilimanjaro</option>
                  <option>Tabora</option>
                  <option>Songwe</option>
                  <option>Geita</option>
                  <option>Shinyanga</option>
                  <option>Iringa</option>
                  <option>Kagera</option>
                  <option>Katavi</option>
                  <option>Lindi</option>
                  <option>Manyara</option>
                  <option>Mara</option>
                  <option>Mtwara</option>
                  <option>Njombe</option>
                  <option>Pwani</option>
                  <option>Rukwa</option>
                  <option>Ruvuma</option>
                  <option>Simiyu</option>
                  <option>Singida</option>
                  <option>Zanzibar</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Country</label>
                <Input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-700 hover:to-yellow-900 text-white font-semibold"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="text-yellow-700 font-semibold">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}