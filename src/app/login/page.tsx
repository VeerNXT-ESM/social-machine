'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button, Field, Input } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not sign in.');
      }
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center bg-neutral-100 px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-neutral-300 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-neutral-200">
          <div className="w-10 h-10 bg-neutral-100 border border-neutral-300 p-1 flex items-center justify-center">
            <Image src="/logo.png" alt="VeerNXT" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-900">VeerNXT Social</h1>
            <p className="text-xs text-neutral-600">Sign in to continue</p>
          </div>
        </div>

        <Field label="Email">
          <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>

        {error && (
          <p className="text-sm text-neutral-900 border border-neutral-800 p-2" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" block disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </main>
  );
}
