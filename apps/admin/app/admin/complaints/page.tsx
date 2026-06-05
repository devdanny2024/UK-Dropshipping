'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquareWarning } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { StatusBadge } from '@/app/components/StatusBadge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/app/components/ui/dialog';

type Complaint = {
  id: string;
  orderId: string;
  status: string;
  reason: string;
  detail: string | null;
  resolutionNote: string | null;
  createdAt: string;
  order?: { id: string } | null;
  user?: { email: string | null } | null;
};

type ActionStatus = 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

const ACTIONS: Array<{ status: ActionStatus; label: string }> = [
  { status: 'UNDER_REVIEW', label: 'Under review' },
  { status: 'RESOLVED', label: 'Resolved' },
  { status: 'REJECTED', label: 'Rejected' }
];

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = (filter: string) => {
    setLoading(true);
    const url = filter === 'all'
      ? '/api/proxy/v1/admin/complaints'
      : `/api/proxy/v1/admin/complaints?status=${filter}`;
    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => { if (payload?.ok) setComplaints(payload.data?.complaints ?? []); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const handleAction = async (id: string, status: ActionStatus) => {
    setPendingId(id);
    try {
      const res = await fetch(`/api/proxy/v1/admin/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, resolutionNote: notes[id]?.trim() || undefined })
      });
      const payload = await res.json();
      if (payload?.ok && payload.data?.complaint) {
        const updated = payload.data.complaint as Complaint;
        setComplaints((prev) =>
          // If a status filter is active and the new status no longer matches, drop the row.
          prev
            .map((c) => (c.id === id ? { ...c, ...updated } : c))
            .filter((c) => statusFilter === 'all' || c.status === statusFilter)
        );
        toast.success(`Complaint set to ${status.replace('_', ' ').toLowerCase()}`);
      } else {
        toast.error(payload?.error?.message ?? 'Could not update complaint');
      }
    } catch {
      toast.error('Failed to update complaint');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Complaints</h1>
          <p className="text-muted-foreground mt-2">Review and resolve customer complaints</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Complaints</CardTitle>
          <Badge variant="secondary">{complaints.length} complaints</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading complaints...</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No complaints found
                      </TableCell>
                    </TableRow>
                  ) : (
                    complaints.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Button
                            variant="link"
                            className="h-auto p-0 font-medium"
                            onClick={() => router.push(`/admin/orders/${c.orderId}`)}
                          >
                            {c.orderId}
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.user?.email ?? '—'}</TableCell>
                        <TableCell className="max-w-[260px]">
                          <div className="font-medium truncate">{c.reason}</div>
                          {c.detail && <div className="text-sm text-muted-foreground truncate">{c.detail}</div>}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <MessageSquareWarning className="h-4 w-4" />
                                Update
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update complaint</DialogTitle>
                                <DialogDescription>
                                  Order {c.orderId} — {c.reason}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`note-${c.id}`}>Resolution note (optional)</Label>
                                  <Textarea
                                    id={`note-${c.id}`}
                                    placeholder="Add a note for the customer..."
                                    value={notes[c.id] ?? c.resolutionNote ?? ''}
                                    onChange={(e) => setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                  />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {ACTIONS.map((a) => (
                                    <Button
                                      key={a.status}
                                      variant={a.status === 'REJECTED' ? 'destructive' : a.status === 'RESOLVED' ? 'default' : 'outline'}
                                      size="sm"
                                      disabled={pendingId === c.id}
                                      onClick={() => handleAction(c.id, a.status)}
                                    >
                                      {a.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
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
