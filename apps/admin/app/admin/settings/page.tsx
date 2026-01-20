'use client';

import { DollarSign, Truck, Bell, Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';

export default function AdminSettingsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure pricing rules, notifications, and logistics defaults</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Fees
            </CardTitle>
            <CardDescription>Adjust service fees and buffers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceFee">Service Fee (%)</Label>
              <Input id="serviceFee" defaultValue="6.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duties">Duties Buffer (%)</Label>
              <Input id="duties" defaultValue="12" />
            </div>
            <Button className="w-full">Save Pricing</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Logistics Defaults
            </CardTitle>
            <CardDescription>Warehouse and carrier preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse">Default UK Warehouse</Label>
              <Input id="warehouse" defaultValue="London Hub" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier">Preferred Carrier</Label>
              <Input id="carrier" defaultValue="DHL Express" />
            </div>
            <Button className="w-full">Save Logistics</Button>
          </CardContent>
        </Card>
      </div>

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
            <Input id="adminEmail" defaultValue="admin@uk2me.com" />
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

