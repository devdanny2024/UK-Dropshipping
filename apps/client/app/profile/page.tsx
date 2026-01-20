'use client';

import { MapPin, Phone, Mail, Plus, Check, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { currentUser } from '@/data/mockData';

export default function ClientProfilePage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-5xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Profile</CardTitle>
              <div className="text-sm text-muted-foreground">Manage your account and delivery addresses</div>
            </div>
            <Button variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{currentUser.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{currentUser.addresses[0]?.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Default Address</div>
                  <div className="font-medium">{currentUser.addresses[0]?.city}</div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Saved Addresses</h3>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Address
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {currentUser.addresses.map((address) => (
                  <Card key={address.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{address.label}</div>
                        {currentUser.defaultAddressId === address.id && (
                          <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>{address.street}</div>
                        <div>
                          {address.city}, {address.state}
                        </div>
                        <div>{address.country}</div>
                        <div>{address.phone}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

