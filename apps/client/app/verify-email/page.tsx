'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

type VerifyState = 'idle' | 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background py-16" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<VerifyState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendError, setResendError] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const runVerify = async () => {
      setStatus('verifying');
      setMessage(null);
      try {
        const response = await fetch(`${apiBase}/v1/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          if (!isMounted) return;
          setStatus('error');
          setMessage(payload?.error?.message ?? 'Verification failed. Try again.');
          return;
        }
        if (!isMounted) return;
        setStatus('success');
        setMessage('Email verified. You can log in now.');
      } catch {
        if (!isMounted) return;
        setStatus('error');
        setMessage('Verification failed. Check your connection and try again.');
      }
    };

    void runVerify();
    return () => {
      isMounted = false;
    };
  }, [apiBase, token]);

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendError(null);
    setResendStatus('sending');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();

    try {
      const response = await fetch(`${apiBase}/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setResendStatus('error');
        setResendError(payload?.error?.message ?? 'Unable to send verification email.');
        return;
      }
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
      setResendError('Unable to send verification email.');
    }
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>Confirm your email to unlock all features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!token && (
              <p className="text-sm text-muted-foreground">
                Paste the verification link we emailed to you. If you can&apos;t find it, request a
                new one below.
              </p>
            )}
            {status === 'verifying' && <p className="text-sm text-muted-foreground">Verifying…</p>}
            {message && (
              <p className={status === 'error' ? 'text-sm text-destructive' : 'text-sm text-foreground'}>
                {message}
              </p>
            )}
            {status === 'success' && (
              <Button asChild className="w-full">
                <Link href="/login">Continue to log in</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resend verification</CardTitle>
            <CardDescription>We&apos;ll send a fresh link to your inbox.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resendStatus === 'sent' ? (
              <p className="text-sm text-muted-foreground">Check your inbox for a new link.</p>
            ) : (
              <form className="space-y-4" onSubmit={handleResend}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                {resendError && <p className="text-sm text-destructive">{resendError}</p>}
                <Button className="w-full" type="submit" disabled={resendStatus === 'sending'}>
                  {resendStatus === 'sending' ? 'Sending...' : 'Send verification'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground text-center">
          Already verified?{' '}
          <Link href="/login" className="text-foreground underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
