'use client';

import { useEffect, useState } from 'react';
import { Wallet as WalletIcon } from 'lucide-react';
import { AccountShell } from '@/app/components/AccountShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';

type Transaction = {
  id?: string;
  type?: string;
  description?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
};

type WalletData = {
  balances?: Record<string, number>;
  transactions?: Transaction[];
};

const SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', NGN: '₦' };

function formatAmount(amount: number | undefined, currency?: string) {
  if (amount == null) return '—';
  const symbol = currency ? SYMBOLS[currency] ?? `${currency} ` : '';
  const signed = amount < 0 ? `-${symbol}${Math.abs(amount).toFixed(2)}` : `${symbol}${amount.toFixed(2)}`;
  return signed;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/v1/wallet', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setWallet(payload?.data ?? payload ?? null))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const balances = wallet?.balances ?? {};
  const transactions = wallet?.transactions ?? [];
  const balanceEntries = Object.entries(balances);

  return (
    <AccountShell title="Wallet">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5" /> Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading wallet…</p>
            ) : balanceEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No balances yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {balanceEntries.map(([currency, amount]) => (
                  <div key={currency} className="rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">{currency}</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--brand-violet)' }}>
                      {formatAmount(amount, currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet.</p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx, i) => (
                      <TableRow key={tx.id ?? i}>
                        <TableCell className="whitespace-nowrap">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-GB') : '—'}
                        </TableCell>
                        <TableCell>{tx.type ?? '—'}</TableCell>
                        <TableCell className="max-w-[240px] truncate">{tx.description ?? '—'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(tx.amount, tx.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AccountShell>
  );
}
