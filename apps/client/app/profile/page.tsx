'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, Check, LogOut, Eye, EyeOff, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { AccountShell } from '@/app/components/AccountShell';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

type AddressType = 'SHIPPING' | 'BILLING';

type ProfileUser = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
};

type Address = {
  id: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
  type: AddressType;
  isDefault: boolean;
};

export default function ClientProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';

  const shippingAddress = useMemo(
    () => addresses.find((a) => a.type === 'SHIPPING' && a.isDefault) ?? addresses.find((a) => a.type === 'SHIPPING'),
    [addresses]
  );

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiBase}/v1/me`, { credentials: 'include' });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          throw new Error(payload?.error?.message ?? 'Unable to load profile');
        }
        if (!isMounted) return;
        setUser(payload.user);
        setAddresses(payload.addresses ?? []);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load profile');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void loadProfile();
    return () => { isMounted = false; };
  }, [apiBase]);

  const handleLogout = async () => {
    await fetch(`${apiBase}/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);
    setProfileSuccess(false);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();

    try {
      const response = await fetch(`${apiBase}/v1/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name || undefined,
          phone: phone || undefined
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload?.error?.message ?? 'Unable to update profile');
      }
      setUser(payload.user);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPwLoading(true);
    setPwError(null);
    setPwSuccess(false);

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get('currentPassword') ?? '');
    const newPassword = String(formData.get('newPassword') ?? '');
    const confirmPassword = String(formData.get('confirmNewPassword') ?? '');

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      setPwLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      setPwLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/v1/me/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload?.error?.message ?? 'Unable to change password');
      }
      setPwSuccess(true);
      setChangingPassword(false);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Unable to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleAddressSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAddress(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      label: String(formData.get('label') ?? '').trim() || undefined,
      line1: String(formData.get('line1') ?? '').trim(),
      line2: String(formData.get('line2') ?? '').trim() || undefined,
      city: String(formData.get('city') ?? '').trim(),
      state: String(formData.get('state') ?? '').trim() || undefined,
      postalCode: String(formData.get('postalCode') ?? '').trim(),
      country: String(formData.get('country') ?? '').trim(),
      phone: String(formData.get('addressPhone') ?? '').trim() || undefined,
      type: 'SHIPPING' as const,
      isDefault: true
    };

    try {
      const response = await fetch(`${apiBase}/v1/me/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message ?? 'Unable to save address');
      }
      setAddresses((prev) => [data.address, ...prev.filter((a) => a.id !== data.address.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading) {
    return (
      <AccountShell title="Profile">
        <Card>
          <CardContent className="p-6 text-muted-foreground">Loading profile…</CardContent>
        </Card>
      </AccountShell>
    );
  }

  return (
    <AccountShell title="Profile">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Profile</CardTitle>
            <div className="text-sm text-muted-foreground">Manage your account and delivery address</div>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-3 rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" defaultValue={user?.name ?? ''} placeholder="Your name" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground shrink-0">
                    <span>🇳🇬</span>
                    <span>+234</span>
                  </div>
                  <Input id="phone" name="phone" type="tel" defaultValue={user?.phone ?? ''} placeholder="800 000 0000" className="flex-1" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save profile'}
              </Button>
              {profileSuccess && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="h-4 w-4" /> Saved</span>}
            </div>
          </form>

          <Separator />

          {/* Change Password */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" /> Password
              </h3>
              {!changingPassword && (
                <Button variant="outline" size="sm" onClick={() => { setChangingPassword(true); setPwSuccess(false); }}>
                  Change password
                </Button>
              )}
            </div>

            {pwSuccess && !changingPassword && (
              <p className="text-sm text-green-600 flex items-center gap-1"><Check className="h-4 w-4" /> Password changed successfully</p>
            )}

            {changingPassword && (
              <form className="space-y-3 max-w-sm" onSubmit={handlePasswordChange}>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <div className="relative">
                    <Input id="currentPassword" name="currentPassword" type={showCurrentPw ? 'text' : 'password'} required />
                    <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                      {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Input id="newPassword" name="newPassword" type={showNewPw ? 'text' : 'password'} required minLength={8} />
                    <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm new password</Label>
                  <Input id="confirmNewPassword" name="confirmNewPassword" type="password" required minLength={8} />
                </div>
                {pwError && <p className="text-sm text-destructive">{pwError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={pwLoading}>
                    {pwLoading ? 'Changing...' : 'Change password'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => { setChangingPassword(false); setPwError(null); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>

          <Separator />

          {/* Shipping Address (= Billing Address) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping / Billing Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {shippingAddress ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{shippingAddress.label ?? 'Primary'}</span>
                    {shippingAddress.isDefault && (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div>{shippingAddress.line1}</div>
                  {shippingAddress.line2 && <div>{shippingAddress.line2}</div>}
                  <div>
                    {shippingAddress.city}
                    {shippingAddress.state ? `, ${shippingAddress.state}` : ''} {shippingAddress.postalCode}
                  </div>
                  <div>{shippingAddress.country}</div>
                  {shippingAddress.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {shippingAddress.phone}
                    </div>
                  )}
                </>
              ) : (
                <form className="space-y-3" onSubmit={handleAddressSubmit}>
                  <Label>Complete your address</Label>
                  <Input name="label" placeholder="Nickname (Home, Shop)" />
                  <Input name="line1" placeholder="Address line 1" required />
                  <Input name="line2" placeholder="Address line 2 (optional)" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input name="city" placeholder="City" required />
                    <select
                      name="state"
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      defaultValue=""
                    >
                      <option value="" disabled>Select state</option>
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input name="postalCode" placeholder="Postal code" required />
                    <Input name="country" placeholder="Country" defaultValue="Nigeria" required />
                  </div>
                  <Input name="addressPhone" placeholder="Phone for delivery" />
                  <Button type="submit" disabled={savingAddress}>
                    {savingAddress ? 'Saving...' : 'Save address'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Saved Addresses</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {addresses.map((address) => (
                    <Card key={address.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{address.label ?? 'Address'}</div>
                          {address.isDefault && (
                            <Badge variant="default" className="gap-1">
                              <Check className="h-3 w-3" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>{address.line1}</div>
                          {address.line2 && <div>{address.line2}</div>}
                          <div>
                            {address.city}
                            {address.state ? `, ${address.state}` : ''} {address.postalCode}
                          </div>
                          <div>{address.country}</div>
                          {address.phone && <div>{address.phone}</div>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AccountShell>
  );
}
