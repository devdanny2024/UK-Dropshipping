import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

const roles = [
  {
    name: 'Super Admin',
    description: 'Full access to every module and configuration setting.',
    permissions: [
      'Manage users & roles',
      'Approve purchases',
      'Edit adapters',
      'Override payments',
      'View financials',
      'Manage shipments'
    ]
  },
  {
    name: 'Operations',
    description: 'Runs the day-to-day order processing and shipment flow.',
    permissions: ['View orders', 'Update order status', 'Create shipments', 'Manage purchase attempts']
  },
  {
    name: 'Support',
    description: 'Handles customer enquiries and order follow-ups.',
    permissions: ['View orders', 'View customers', 'Add order notes']
  },
  {
    name: 'Finance',
    description: 'Controls payments, refunds, and reconciliations.',
    permissions: ['View payments', 'Approve refunds', 'Export reports']
  }
];

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-2">
          Define who can manage orders, money movement, and store adapters.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {role.name}
                <Badge variant="secondary">{role.permissions.length} permissions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{role.description}</p>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <Badge key={permission} variant="outline">
                    {permission}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
