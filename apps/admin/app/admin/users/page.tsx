'use client';

import { useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

const ROLES: Role[] = ['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'];

type User = {
  id: string;
  name: string;
  email: string;
  role?: Role | string | null;
  orderCount: number;
  totalSpend: number;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleSaving, setRoleSaving] = useState<string | null>(null);

  const changeRole = async (user: User, role: Role) => {
    if (role === user.role) return;
    setRoleSaving(user.id);
    try {
      const res = await fetch(`/api/proxy/v1/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role })
      });
      const payload = await res.json();
      if (res.ok && payload?.ok !== false) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
        toast.success(`Role updated to ${role}`);
      } else if (payload?.error?.code === 'LAST_ADMIN' || payload?.error?.message === 'LAST_ADMIN') {
        toast.error('Cannot change role: this is the last admin account.');
      } else {
        toast.error(payload?.error?.message ?? 'Could not update role');
      }
    } catch {
      toast.error('Failed to update role');
    } finally {
      setRoleSaving(null);
    }
  };

  useEffect(() => {
    fetch('/api/proxy/v1/admin/users', { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => { if (payload?.ok) setUsers(payload.data ?? []); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-2">Customer records and engagement history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading users...</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spend</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {search ? 'No users match your search.' : 'No users yet.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={ROLES.includes(user.role as Role) ? (user.role as Role) : undefined}
                            onValueChange={(value) => changeRole(user, value as Role)}
                            disabled={roleSaving === user.id}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder={user.role ?? 'Set role'} />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{user.orderCount}</TableCell>
                        <TableCell>GBP {user.totalSpend.toFixed(2)}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
