'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Wallet, Calendar, ArrowUpRight, CheckCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function DashboardOverview() {
  const { user } = useAuthStore();

  const stats = [
    {
      title: 'Available Balance',
      value: `$${user?.availableBalance?.toFixed(2) || '0.00'}`,
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      title: 'Total Earnings',
      value: `$${user?.totalEarnings?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Today\'s Earnings',
      value: `$${user?.todaysEarnings?.toFixed(2) || '0.00'}`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  const recentActivities = [
    { type: 'Ad Watched', amount: 0.50, time: '5 minutes ago', status: 'completed' },
    { type: 'Survey Completed', amount: 2.00, time: '1 hour ago', status: 'completed' },
    { type: 'Task Submitted', amount: 1.50, time: '2 hours ago', status: 'pending' },
    { type: 'Referral Bonus', amount: 5.00, time: '1 day ago', status: 'completed' },
  ];

  const installments = [
    { name: 'Credit Card - Chase', progress: 65, remaining: 1750, due: 'Dec 15, 2025' },
    { name: 'Car Loan', progress: 40, remaining: 12000, due: 'Dec 20, 2025' },
    { name: 'Student Loan', progress: 25, remaining: 15000, due: 'Jan 5, 2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest earning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      activity.status === 'completed'
                        ? 'bg-emerald-100 dark:bg-emerald-900/20'
                        : 'bg-yellow-100 dark:bg-yellow-900/20'
                    }`}>
                      {activity.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      activity.status === 'completed' ? 'text-emerald-600' : 'text-yellow-600'
                    }`}>
                      +${activity.amount.toFixed(2)}
                    </p>
                    <Badge variant={
                      activity.status === 'completed' ? 'default' : 'secondary'
                    }>
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installment Progress</CardTitle>
            <CardDescription>Track your payment progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {installments.map((installment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{installment.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {installment.due} • ${installment.remaining.toLocaleString()} remaining
                      </p>
                    </div>
                    <Badge>
                      {installment.progress}% paid
                    </Badge>
                  </div>
                  <Progress value={installment.progress} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start earning now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
              <CardHeader className="p-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Watch Ads</CardTitle>
                <CardDescription>Earn by watching videos</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
              <CardHeader className="p-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Take Surveys</CardTitle>
                <CardDescription>Share your opinion</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
              <CardHeader className="p-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Complete Tasks</CardTitle>
                <CardDescription>Micro-jobs for quick earnings</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
              <CardHeader className="p-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <ArrowUpRight className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Refer Friends</CardTitle>
                <CardDescription>Invite and earn</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
