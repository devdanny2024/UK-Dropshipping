'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background py-16" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Reset token is missing. Please request a new reset link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('saving');
    try {
      const response = await fetch(`${apiBase}/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus('idle');
        setError(payload?.error?.message ?? 'Reset failed. Try again.');
        return;
      }
      setStatus('success');
    } catch {
      setStatus('idle');
      setError('Reset failed. Check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>Pick a strong password to secure your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'success' ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Your password has been updated. You can log in now.
                </p>
                <Button asChild className="w-full">
                  <Link href="/login">Go to login</Link>
                </Button>
              </>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
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
                <Button className="w-full" type="submit" disabled={status === 'saving'}>
                  {status === 'saving' ? 'Saving...' : 'Reset password'}
                </Button>
              </form>
            )}
            <p className="text-sm text-muted-foreground">
              Need a new link?{' '}
              <Link href="/forgot-password" className="text-foreground underline">
                Request another
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
