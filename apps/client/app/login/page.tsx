'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background py-16" />}>
      <LoginContent />
    </Suspense>
  );
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void;
          renderButton: (el: HTMLElement, opts: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Anti-bot
  const [formLoadedAt] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  const handleGoogleCredential = async (response: { credential: string }) => {
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken: response.credential })
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setError(payload?.error?.message ?? 'Google login failed. Try again.');
        return;
      }
      const next = searchParams.get('next') ?? '/dashboard';
      router.push(next);
    } catch {
      setError('Google login failed. Check your connection and try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;
    const scriptId = 'google-gsi';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogle();
      document.head.appendChild(script);
    } else if (window.google) {
      initGoogle();
    }

    function initGoogle() {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: googleBtnRef.current.offsetWidth || 400,
        text: 'continue_with',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (honeypot) return;
    if (Date.now() - formLoadedAt < 1500) {
      setError('Please wait a moment before submitting.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    try {
      const response = await fetch(`${apiBase}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        const code = payload?.error?.code;
        if (code === 'EMAIL_NOT_VERIFIED') {
          setInfo('Please verify your email before logging in.');
        } else {
          setError(payload?.error?.message ?? 'Login failed. Try again.');
        }
        return;
      }

      const next = searchParams.get('next') ?? '/dashboard';
      router.push(next);
    } catch {
      setError('Login failed. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Log in to Uk2meonline</CardTitle>
            <CardDescription>Access your orders and saved addresses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {googleClientId ? (
              <div ref={googleBtnRef} className="w-full min-h-[44px]" aria-label="Continue with Google" />
            ) : (
              <Button variant="outline" className="w-full gap-2" disabled>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.13 4.13 0 0 1-1.8 2.7v2.24h2.9c1.7-1.57 2.7-3.9 2.7-6.58z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.24c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.58-5.05-3.7H.98v2.32A9 9 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.95 10.74A5.4 5.4 0 0 1 3.66 9c0-.6.1-1.17.28-1.74V4.94H.98A9 9 0 0 0 0 9c0 1.45.35 2.82.98 4.06l2.97-2.32z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .98 4.94l2.97 2.32C4.66 5.14 6.65 3.58 9 3.58z"/>
                </svg>
                Google sign-in not configured
              </Button>
            )}
            {googleLoading && <p className="text-sm text-center text-muted-foreground">Signing in with Google...</p>}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>
            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Anti-bot honeypot */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="website" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="********" required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {info && (
                <p className="text-sm text-muted-foreground">
                  {info}{' '}
                  <Link className="underline" href="/verify-email">
                    Verify email
                  </Link>
                </p>
              )}
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">
              New here?{' '}
              <Link href="/signup" className="text-foreground underline">
                Create an account
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Forgot your password?{' '}
              <Link href="/forgot-password" className="text-foreground underline">
                Reset it
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
