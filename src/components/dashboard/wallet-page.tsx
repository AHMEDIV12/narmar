'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowUpRight, History, AlertCircle } from 'lucide-react';

export function WalletPage() {
  const balance = 125.50;
  const transactions = [
    { id: 1, type: 'Earning', description: 'Ad Watched', amount: 0.25, date: '2025-01-10', status: 'Completed' },
    { id: 2, type: 'Earning', description: 'Survey Completed', amount: 2.00, date: '2025-01-10', status: 'Completed' },
    { id: 3, type: 'Earning', description: 'Task Completed', amount: 1.50, date: '2025-01-09', status: 'Completed' },
    { id: 4, type: 'Withdrawal', description: 'PayPal Withdrawal', amount: -50.00, date: '2025-01-08', status: 'Completed' },
    { id: 5, type: 'Earning', description: 'Referral Bonus', amount: 5.00, date: '2025-01-07', status: 'Completed' },
  ];

  const pendingWithdrawal = 25.00;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Wallet</h2>
        <p className="text-muted-foreground">
          Manage your earnings and withdrawals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
            <Wallet className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              ${balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Withdrawal
            </CardTitle>
            <History className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              ${pendingWithdrawal.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earned
            </CardTitle>
            <ArrowUpRight className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              $1,250.00
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Withdrawal</CardTitle>
          <CardDescription>
            Withdraw your earnings to your preferred payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Minimum withdrawal: $10.00. Processing time: 24-48 hours.
            </p>
          </div>
          <Button className="w-full" disabled={balance < 10}>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Request Withdrawal
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent earnings and withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      transaction.type === 'Earning' ? 'default' : 'secondary'
                    }>
                      {transaction.type}
                    </Badge>
                    <p className="font-medium">{transaction.description}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {transaction.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
