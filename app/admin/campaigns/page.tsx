"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function AdminCampaignsPage() {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [mode, setMode] = useState<'all' | 'list'>('all');
  const [list, setList] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>("");

  const send = async () => {
    if (!subject || !html) { setResult('Subject and HTML are required'); return; }
    setSending(true); setResult('');
    try {
      const to = mode === 'all' ? 'all' : list.split(/[,\n\s]+/).filter(Boolean);
      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html, to }),
      });
      const data = await res.json().catch(()=>({ ok:false }));
      if (res.ok && data.ok) setResult(`Sent to ${data.sent} recipient(s)`);
      else setResult(`Failed: ${data.error || 'Unknown error'}`);
    } catch (e:any) {
      setResult('Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Card className="border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Email Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600">Subject</label>
                <Input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Your subject" />
              </div>
              <div>
                <label className="text-sm text-slate-600">Recipients</label>
                <div className="flex gap-3">
                  <button className={`px-3 py-2 rounded-md border text-sm ${mode==='all'?'bg-slate-900 text-white border-slate-900':''}`} onClick={()=>setMode('all')}>All Users</button>
                  <button className={`px-3 py-2 rounded-md border text-sm ${mode==='list'?'bg-slate-900 text-white border-slate-900':''}`} onClick={()=>setMode('list')}>Custom List</button>
                </div>
              </div>
            </div>
            {mode==='list' && (
              <div>
                <label className="text-sm text-slate-600">Emails (comma/new-line separated)</label>
                <Textarea rows={4} value={list} onChange={e=>setList(e.target.value)} />
              </div>
            )}
            <div>
              <label className="text-sm text-slate-600">HTML Content</label>
              <Textarea rows={12} value={html} onChange={e=>setHtml(e.target.value)} placeholder="<h2>Hello iFresh family!</h2>" />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={send} disabled={sending} className="bg-gradient-to-r from-[#b47435] to-[#b77123]">{sending?'Sending…':'Send Campaign'}</Button>
              {result && <span className="text-sm text-slate-600">{result}</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
