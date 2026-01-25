'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus('sending');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();

    try {
      const response = await fetch(`${apiBase}/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus('error');
        setError(payload?.error?.message ?? 'Unable to send reset email.');
        return;
      }
      setStatus('sent');
    } catch {
      setStatus('error');
      setError('Unable to send reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>Enter your email to receive a reset link.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'sent' ? (
              <p className="text-sm text-muted-foreground">
                If that email exists, a reset link is on the way. Check your inbox and spam folder.
              </p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full" type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>
            )}
            <p className="text-sm text-muted-foreground">
              Remembered it?{' '}
              <Link href="/login" className="text-foreground underline">
                Back to login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
