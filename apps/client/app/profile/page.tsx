'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, MapPin, Phone, Check, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { AccountShell } from '@/app/components/AccountShell';

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
  const [savingAddress, setSavingAddress] = useState<AddressType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/proxy';

  const shippingAddress = useMemo(
    () => addresses.find((address) => address.type === 'SHIPPING' && address.isDefault) ?? addresses.find((address) => address.type === 'SHIPPING'),
    [addresses]
  );
  const billingAddress = useMemo(
    () => addresses.find((address) => address.type === 'BILLING' && address.isDefault) ?? addresses.find((address) => address.type === 'BILLING'),
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
    return () => {
      isMounted = false;
    };
  }, [apiBase]);

  const handleLogout = async () => {
    await fetch(`${apiBase}/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddressSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    type: AddressType
  ) => {
    event.preventDefault();
    setSavingAddress(type);
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
      type,
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
      setSavingAddress(null);
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
            <div className="text-sm text-muted-foreground">Manage your account and delivery addresses</div>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleProfileSubmit}>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{user?.email}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" defaultValue={user?.name ?? ''} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={user?.phone ?? ''} placeholder="+234..." />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save profile'}
              </Button>
            </div>
          </form>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipping address</CardTitle>
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
                    {shippingAddress.phone && <div>{shippingAddress.phone}</div>}
                  </>
                ) : (
                  <form className="space-y-3" onSubmit={(event) => handleAddressSubmit(event, 'SHIPPING')}>
                    <Label>Complete shipping address</Label>
                    <Input name="label" placeholder="Label (Home, Office)" />
                    <Input name="line1" placeholder="Address line 1" required />
                    <Input name="line2" placeholder="Address line 2 (optional)" />
                    <Input name="city" placeholder="City" required />
                    <Input name="state" placeholder="State/Region" />
                    <Input name="postalCode" placeholder="Postal code" required />
                    <Input name="country" placeholder="Country" required />
                    <Input name="addressPhone" placeholder="Phone for delivery" />
                    <Button type="submit" disabled={savingAddress === 'SHIPPING'}>
                      {savingAddress === 'SHIPPING' ? 'Saving...' : 'Save shipping address'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billing address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {billingAddress ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{billingAddress.label ?? 'Primary'}</span>
                      {billingAddress.isDefault && (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div>{billingAddress.line1}</div>
                    {billingAddress.line2 && <div>{billingAddress.line2}</div>}
                    <div>
                      {billingAddress.city}
                      {billingAddress.state ? `, ${billingAddress.state}` : ''} {billingAddress.postalCode}
                    </div>
                    <div>{billingAddress.country}</div>
                    {billingAddress.phone && <div>{billingAddress.phone}</div>}
                  </>
                ) : (
                  <form className="space-y-3" onSubmit={(event) => handleAddressSubmit(event, 'BILLING')}>
                    <Label>Complete billing address</Label>
                    <Input name="label" placeholder="Label (Billing, Office)" />
                    <Input name="line1" placeholder="Address line 1" required />
                    <Input name="line2" placeholder="Address line 2 (optional)" />
                    <Input name="city" placeholder="City" required />
                    <Input name="state" placeholder="State/Region" />
                    <Input name="postalCode" placeholder="Postal code" required />
                    <Input name="country" placeholder="Country" required />
                    <Input name="addressPhone" placeholder="Phone for billing" />
                    <Button type="submit" disabled={savingAddress === 'BILLING'}>
                      {savingAddress === 'BILLING' ? 'Saving...' : 'Save billing address'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

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
                    <div className="text-xs text-muted-foreground uppercase">{address.type}</div>
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
              {addresses.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    No saved addresses yet. Add shipping and billing addresses above.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </AccountShell>
  );
}

