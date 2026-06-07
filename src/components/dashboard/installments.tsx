'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, DollarSign, Plus, TrendingUp, Settings } from 'lucide-react';

export function Installments() {
  const [installments, setInstallments] = useState([
    {
      id: 1,
      title: 'Credit Card - Chase',
      creditor: 'Chase Bank',
      totalAmount: 5000,
      remainingAmount: 1750,
      monthlyPayment: 350,
      dueDay: 15,
      status: 'Active',
      autoPay: true,
      progress: 65,
    },
    {
      id: 2,
      title: 'Car Loan',
      creditor: 'Toyota Financial',
      totalAmount: 20000,
      remainingAmount: 12000,
      monthlyPayment: 450,
      dueDay: 20,
      status: 'Active',
      autoPay: true,
      progress: 40,
    },
    {
      id: 3,
      title: 'Student Loan',
      creditor: 'Department of Education',
      totalAmount: 20000,
      remainingAmount: 15000,
      monthlyPayment: 300,
      dueDay: 5,
      status: 'Active',
      autoPay: false,
      progress: 25,
    },
  ]);

  const totalPaid = installments.reduce((sum, inst) => sum + (inst.totalAmount - inst.remainingAmount), 0);
  const totalRemaining = installments.reduce((sum, inst) => sum + inst.remainingAmount, 0);
  const totalMonthly = installments.reduce((sum, inst) => sum + inst.monthlyPayment, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Installment Management</h2>
          <p className="text-muted-foreground">
            Track and manage your installment payments
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Installment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining Balance
            </CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${totalRemaining.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Payment
            </CardTitle>
            <Calendar className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${totalMonthly.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {installments.map((installment) => (
          <Card key={installment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {installment.title}
                  </CardTitle>
                  <CardDescription>{installment.creditor}</CardDescription>
                </div>
                <Badge variant="outline">{installment.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Payment Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {installment.progress}% complete
                    </span>
                  </div>
                  <Progress value={installment.progress} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-semibold">${installment.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-semibold">${installment.remainingAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monthly Payment</p>
                    <p className="font-semibold">${installment.monthlyPayment.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Day</p>
                    <p className="font-semibold">Day {installment.dueDay}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                  <Button variant="outline" size="sm">
                    Make Manual Payment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
