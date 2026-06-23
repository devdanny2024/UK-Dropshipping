'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, MailCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background py-16" />}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  // Anti-bot: record when the form was rendered
  const [formLoadedAt] = useState(() => Date.now());
  // Anti-bot: honeypot field — real users leave this blank
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
        setError(payload?.error?.message ?? 'Google sign-up failed. Try again.');
        return;
      }
      const next = searchParams.get('next') ?? '/dashboard';
      router.push(next);
    } catch {
      setError('Google sign-up failed. Check your connection and try again.');
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
        text: 'signup_with',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (passwordScore <= 1) return 'Weak';
    if (passwordScore === 2) return 'Fair';
    if (passwordScore === 3) return 'Good';
    return 'Strong';
  }, [passwordScore]);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Anti-bot: reject if honeypot is filled or form submitted under 2 seconds
    if (honeypot) return;
    if (Date.now() - formLoadedAt < 2000) {
      setError('Please wait a moment before submitting.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '');
    const email = String(formData.get('email') ?? '');
    const phone = String(formData.get('phone') ?? '').trim();
    const formPassword = String(formData.get('password') ?? '');
    const formConfirm = String(formData.get('confirmPassword') ?? '');

    if (formPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsSubmitting(false);
      return;
    }

    if (formPassword !== formConfirm) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password: formPassword, phone: phone || undefined })
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        const apiMessage = payload?.error?.message;
        if (Array.isArray(payload?.error?.details)) {
          const detail = payload.error.details[0]?.message;
          setError(detail ?? apiMessage ?? 'Signup failed. Try again.');
        } else {
          setError(apiMessage ?? 'Signup failed. Try again.');
        }
        return;
      }

      if (payload.data?.verificationRequired) {
        setRegisteredEmail(email);
        setVerifyEmailSent(true);
        return;
      }

      const next = searchParams.get('next') ?? '/dashboard';
      router.push(next);
    } catch {
      setError('Signup failed. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verifyEmailSent) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-7 w-7 text-primary" />
              </div>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We sent a verification link to <strong>{registeredEmail}</strong>.
                Click the link in the email to activate your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Didn&apos;t get it? Check your spam folder, or{' '}
                <button
                  type="button"
                  className="underline text-foreground"
                  onClick={async () => {
                    await fetch(`${apiBase}/v1/auth/resend-verification`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ email: registeredEmail })
                    });
                  }}
                >
                  resend the email
                </button>
                .
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Go to login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Create your Uk2meonline account</CardTitle>
            <CardDescription>Save addresses, track deliveries, and get faster quotes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {googleClientId ? (
              <div ref={googleBtnRef} className="w-full min-h-[44px]" aria-label="Sign up with Google" />
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
            {googleLoading && <p className="text-sm text-center text-muted-foreground">Signing up with Google...</p>}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>
            <form className="space-y-4" onSubmit={handleSignup}>
              {/* Anti-bot honeypot — hidden from real users */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  name="website"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" placeholder="Jane Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground shrink-0">
                    <span>🇳🇬</span>
                    <span>+234</span>
                  </div>
                  <Input id="phone" name="phone" type="tel" placeholder="800 000 0000" className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passwordScore <= 1
                            ? 'bg-red-500'
                            : passwordScore === 2
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordScore / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{strengthLabel}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Use 8+ characters, a number, and a symbol for a stronger password.
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-foreground underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
