'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Users, TrendingUp, Gift, Share2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function Referrals() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const referralCode = user?.referralCode || 'NARMAR1234';
  const referralLink = `https://narmar.com/register?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    {
      title: 'Total Referrals',
      value: '24',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Total Earnings',
      value: '$240.00',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      title: 'Active Referrals',
      value: '18',
      icon: Gift,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  const referralEarnings = [
    { name: 'John D.', earnings: 15.00, status: 'Active', joinedDate: '2025-01-05' },
    { name: 'Sarah M.', earnings: 12.50, status: 'Active', joinedDate: '2025-01-03' },
    { name: 'Mike R.', earnings: 10.00, status: 'Active', joinedDate: '2024-12-28' },
    { name: 'Emily T.', earnings: 8.00, status: 'Inactive', joinedDate: '2024-12-20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
        <p className="text-muted-foreground">
          Invite friends and earn commission on their earnings
        </p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with friends and earn 10% commission on their earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="referral-code">Referral Code</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="referral-code"
                  value={referralCode}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="referral-link">Referral Link</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="referral-link"
                  value={referralLink}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </Button>
              <Button variant="outline" className="flex-1">
                <Users className="mr-2 h-4 w-4" />
                Invite Friends
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Gift className="h-4 w-4" />
        <AlertDescription>
          Earn <strong>10%</strong> commission on all your direct referrals' earnings and
          <strong> 5%</strong> on indirect referrals. There's no limit to how much you can earn!
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Referral Earnings</CardTitle>
          <CardDescription>
            Track your referral earnings and activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {referralEarnings.map((referral, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{referral.name}</p>
                    <Badge variant={referral.status === 'Active' ? 'default' : 'secondary'}>
                      {referral.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Joined: {referral.joinedDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">
                    +${referral.earnings.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">earned</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
