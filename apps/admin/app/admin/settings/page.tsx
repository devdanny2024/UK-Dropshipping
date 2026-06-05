'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Truck, Bell, Settings as SettingsIcon, RefreshCw, X, Scale, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';

type SettingField = { key: string; label: string; hint?: string };

const DELIVERY_FIELDS: SettingField[] = [
  { key: 'delivery_processing_days', label: 'Processing days' },
  { key: 'delivery_leg1_std_min', label: 'Leg 1 standard min (days)' },
  { key: 'delivery_leg1_std_max', label: 'Leg 1 standard max (days)' },
  { key: 'delivery_leg1_express_min', label: 'Leg 1 express min (days)' },
  { key: 'delivery_leg1_express_max', label: 'Leg 1 express max (days)' },
  { key: 'delivery_despatch_weekday', label: 'Despatch weekday', hint: '0=Sun … 4=Thu … 6=Sat' },
  { key: 'delivery_despatch_cutoff_days', label: 'Despatch cutoff (days)' },
  { key: 'delivery_leg2_std_min', label: 'Leg 2 standard min (days)' },
  { key: 'delivery_leg2_std_max', label: 'Leg 2 standard max (days)' },
  { key: 'delivery_leg2_express_min', label: 'Leg 2 express min (days)' },
  { key: 'delivery_leg2_express_max', label: 'Leg 2 express max (days)' },
  { key: 'delivery_express_regions', label: 'Express regions (CSV)', hint: 'e.g. UK' }
];

const PRICING_FIELDS: SettingField[] = [
  { key: 'service_charge_us_min', label: 'US service charge min' },
  { key: 'service_charge_us_threshold', label: 'US service charge threshold' },
  { key: 'international_transfer_fee', label: 'International transfer fee' },
  { key: 'domestic_postage', label: 'Domestic postage' }
];

type FxData = {
  overrides: Record<string, number>;
  live: Record<string, number>;
};

const PAIRS = [
  { key: 'GBP_USD', label: 'GBP → USD' },
  { key: 'GBP_NGN', label: 'GBP → NGN' },
  { key: 'USD_NGN', label: 'USD → NGN' }
];

export default function AdminSettingsPage() {
  const [fxData, setFxData] = useState<FxData | null>(null);
  const [fxLoading, setFxLoading] = useState(true);
  const [overrideInputs, setOverrideInputs] = useState<Record<string, string>>({});
  const [fxSaving, setFxSaving] = useState<string | null>(null);

  const [feeValue, setFeeValue] = useState('');
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeMsg, setFeeMsg] = useState<string | null>(null);

  const [doorFee, setDoorFee] = useState('15');
  const [pickupFee, setPickupFee] = useState('0');
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryMsg, setDeliveryMsg] = useState<string | null>(null);

  const [shippingRate, setShippingRate] = useState('800');
  const [shippingRateSaving, setShippingRateSaving] = useState(false);
  const [shippingRateMsg, setShippingRateMsg] = useState<string | null>(null);

  const [settingValues, setSettingValues] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingSaving, setSettingSaving] = useState<string | null>(null);

  useEffect(() => {
    loadFx();
    loadFee();
    loadDeliveryFees();
    loadShippingRate();
    loadSettings();
  }, []);

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/proxy/v1/admin/settings', { credentials: 'include' });
      const payload = await res.json();
      const list = payload?.data?.settings ?? payload?.settings;
      if (Array.isArray(list)) {
        const map: Record<string, string> = {};
        for (const s of list) {
          if (s && s.key != null) map[String(s.key)] = s.value == null ? '' : String(s.value);
        }
        setSettingValues(map);
      }
    } catch { /* noop */ }
    finally { setSettingsLoading(false); }
  }

  async function saveSetting(key: string) {
    setSettingSaving(key);
    try {
      const res = await fetch('/api/proxy/v1/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, value: settingValues[key] ?? '' })
      });
      const payload = await res.json();
      if (res.ok && payload?.ok !== false) toast.success(`Saved ${key}`);
      else toast.error(payload?.error?.message ?? `Could not save ${key}`);
    } catch { toast.error(`Failed to save ${key}`); }
    finally { setSettingSaving(null); }
  }

  async function loadFx() {
    setFxLoading(true);
    try {
      const res = await fetch('/api/proxy/v1/admin/fx', { credentials: 'include' });
      const payload = await res.json();
      if (payload?.ok) setFxData(payload.data);
    } catch { /* noop */ }
    finally { setFxLoading(false); }
  }

  async function loadFee() {
    try {
      const res = await fetch('/api/proxy/v1/admin/finance', { credentials: 'include' });
      const payload = await res.json();
      if (payload?.ok) setFeeValue(String(payload.data?.feePercent ?? '5'));
    } catch { /* noop */ }
  }

  async function saveFxOverride(pair: string) {
    const rateStr = overrideInputs[pair];
    const rate = Number(rateStr);
    if (!rateStr || !Number.isFinite(rate) || rate <= 0) return;
    setFxSaving(pair);
    try {
      await fetch('/api/proxy/v1/admin/fx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pair, rate })
      });
      await loadFx();
      setOverrideInputs((prev) => ({ ...prev, [pair]: '' }));
    } catch { /* noop */ }
    finally { setFxSaving(null); }
  }

  async function clearFxOverride(pair: string) {
    setFxSaving(pair);
    try {
      await fetch(`/api/proxy/v1/admin/fx?pair=${encodeURIComponent(pair)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      await loadFx();
    } catch { /* noop */ }
    finally { setFxSaving(null); }
  }

  async function loadDeliveryFees() {
    try {
      const res = await fetch('/api/proxy/v1/checkout/fees');
      const payload = await res.json();
      if (payload?.ok) {
        setDoorFee(String(payload.data?.doorFee ?? '15'));
        setPickupFee(String(payload.data?.pickupFee ?? '0'));
      }
    } catch { /* noop */ }
  }

  async function saveDeliveryFees() {
    setDeliverySaving(true);
    setDeliveryMsg(null);
    try {
      await fetch('/api/proxy/v1/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'delivery_door_fee_gbp', value: doorFee })
      });
      await fetch('/api/proxy/v1/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'delivery_pickup_fee_gbp', value: pickupFee })
      });
      setDeliveryMsg('Delivery fees saved');
    } catch { setDeliveryMsg('Error saving'); }
    finally { setDeliverySaving(false); }
  }

  async function loadShippingRate() {
    try {
      const res = await fetch('/api/proxy/v1/admin/shipping-rate', { credentials: 'include' });
      const payload = await res.json();
      if (payload?.ok) setShippingRate(String(payload.data?.ratePerKgNgn ?? '800'));
    } catch { /* noop */ }
  }

  async function saveShippingRate() {
    const val = Number(shippingRate);
    if (!Number.isFinite(val) || val <= 0) return;
    setShippingRateSaving(true);
    setShippingRateMsg(null);
    try {
      await fetch('/api/proxy/v1/admin/shipping-rate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ratePerKgNgn: val })
      });
      setShippingRateMsg('Saved');
    } catch { setShippingRateMsg('Error saving'); }
    finally { setShippingRateSaving(false); }
  }

  async function saveFee() {
    const val = Number(feeValue);
    if (!Number.isFinite(val) || val < 0 || val > 100) return;
    setFeeSaving(true);
    setFeeMsg(null);
    try {
      await fetch('/api/proxy/v1/admin/finance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feePercent: val })
      });
      setFeeMsg('Saved');
    } catch { setFeeMsg('Error saving'); }
    finally { setFeeSaving(false); }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure pricing rules, notifications, and logistics defaults</p>
      </div>

      {/* Delivery timings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Delivery Timings
          </CardTitle>
          <CardDescription>
            Drives the delivery estimate shown to customers. Each field saves independently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading settings...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {DELIVERY_FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`set-${f.key}`}>{f.label}</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`set-${f.key}`}
                      value={settingValues[f.key] ?? ''}
                      onChange={(e) => setSettingValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                    <Button
                      variant="outline"
                      onClick={() => saveSetting(f.key)}
                      disabled={settingSaving === f.key}
                    >
                      {settingSaving === f.key ? '...' : 'Save'}
                    </Button>
                  </div>
                  {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Rules
          </CardTitle>
          <CardDescription>
            Service charge, transfer, and postage defaults applied during invoicing. Each field saves independently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading settings...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {PRICING_FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`set-${f.key}`}>{f.label}</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`set-${f.key}`}
                      value={settingValues[f.key] ?? ''}
                      onChange={(e) => setSettingValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                    <Button
                      variant="outline"
                      onClick={() => saveSetting(f.key)}
                      disabled={settingSaving === f.key}
                    >
                      {settingSaving === f.key ? '...' : 'Save'}
                    </Button>
                  </div>
                  {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Weight Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Shipping Rate (Weight-based)
          </CardTitle>
          <CardDescription>
            Rate per kg applied to chargeable weight. Formula: chargeable_kg &times; rate = shipping cost.
            Default: NGN 800/kg. Manage weight references in the Weight References page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shippingRate">Rate per kg (NGN)</Label>
            <Input
              id="shippingRate"
              type="number"
              min={1}
              step={50}
              value={shippingRate}
              onChange={(e) => setShippingRate(e.target.value)}
              placeholder="800"
            />
            <p className="text-xs text-muted-foreground">
              Example: a 1.5 kg item at {shippingRate || 800} NGN/kg = NGN {((Number(shippingRate) || 800) * 1.5).toLocaleString()}
            </p>
          </div>
          {shippingRateMsg && <p className="text-sm text-muted-foreground">{shippingRateMsg}</p>}
          <Button className="w-full" onClick={saveShippingRate} disabled={shippingRateSaving}>
            {shippingRateSaving ? 'Saving...' : 'Save Shipping Rate'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Fees
            </CardTitle>
            <CardDescription>Adjust service fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceFee">Service Fee (%)</Label>
              <Input
                id="serviceFee"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={feeValue}
                onChange={(e) => setFeeValue(e.target.value)}
              />
            </div>
            {feeMsg && <p className="text-sm text-muted-foreground">{feeMsg}</p>}
            <Button className="w-full" onClick={saveFee} disabled={feeSaving}>
              {feeSaving ? 'Saving...' : 'Save Pricing'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Fees (GBP)
            </CardTitle>
            <CardDescription>Charged at checkout — set 0 for free</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doorFee">Door Delivery Fee (£)</Label>
              <Input
                id="doorFee"
                type="number"
                min={0}
                step={0.5}
                value={doorFee}
                onChange={(e) => setDoorFee(e.target.value)}
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupFee">Pickup Fee (£)</Label>
              <Input
                id="pickupFee"
                type="number"
                min={0}
                step={0.5}
                value={pickupFee}
                onChange={(e) => setPickupFee(e.target.value)}
                placeholder="0"
              />
            </div>
            {deliveryMsg && <p className="text-sm text-muted-foreground">{deliveryMsg}</p>}
            <Button className="w-full" onClick={saveDeliveryFees} disabled={deliverySaving}>
              {deliverySaving ? 'Saving...' : 'Save Delivery Fees'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Currency & FX Rates
            </CardTitle>
            <CardDescription>Live rates with optional admin overrides. Overrides take precedence over live data.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-2" onClick={loadFx} disabled={fxLoading}>
            <RefreshCw className={`h-4 w-4 ${fxLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {fxLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading rates...</p>
          ) : (
            <div className="space-y-4">
              {PAIRS.map(({ key, label }) => {
                const liveRate = fxData?.live[key];
                const override = fxData?.overrides[key];
                const activeRate = override ?? liveRate;
                return (
                  <div key={key} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{label}</div>
                        <div className="text-xs text-muted-foreground">
                          Live: {liveRate != null ? liveRate.toFixed(4) : 'N/A'}
                          {override != null && (
                            <span className="ml-2 text-amber-600">
                              | Override: {override.toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeRate != null && (
                          <Badge variant={override != null ? 'default' : 'secondary'}>
                            {activeRate.toFixed(4)} {override != null ? '(override)' : '(live)'}
                          </Badge>
                        )}
                        {override != null && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearFxOverride(key)}
                            disabled={fxSaving === key}
                            title="Clear override"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder={`Set override rate (e.g. ${liveRate?.toFixed(2) ?? '0.00'})`}
                        className="h-8 text-sm"
                        value={overrideInputs[key] ?? ''}
                        onChange={(e) => setOverrideInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveFxOverride(key)}
                        disabled={fxSaving === key || !overrideInputs[key]}
                      >
                        {fxSaving === key ? 'Saving...' : 'Set'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage alerts and automation notices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Action Required Alerts</div>
              <div className="text-sm text-muted-foreground">Notify when a purchase fails or needs manual input</div>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Shipment Updates</div>
              <div className="text-sm text-muted-foreground">Receive status changes from carriers</div>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly Summary</div>
              <div className="text-sm text-muted-foreground">Email weekly operational digest</div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Admin Preferences
          </CardTitle>
          <CardDescription>Access controls and profile defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Primary Admin Email</Label>
            <Input id="adminEmail" defaultValue="soliupeter@gmail.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Time Zone</Label>
            <Input id="timezone" defaultValue="Africa/Lagos" />
          </div>
          <Button className="w-full">Update Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}
