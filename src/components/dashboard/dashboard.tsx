'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from './sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  TrendingUp,
  Calendar,
  LogOut,
  Menu,
  X,
  Play,
  FileText,
  CheckSquare,
  Users,
  Gift,
  Settings,
  Bell,
  Home,
  DollarSign,
  ArrowUpRight,
  CheckCircle,
  Clock,
  CreditCard,
  Copy,
  Share2,
  AlertCircle,
  Plus,
} from 'lucide-react';

export function Dashboard() {
  const { user, logout, setCurrentView } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);

  interface Ad {
    id: string;
    title: string;
    durationSeconds: number;
    earningsPerView: number;
    category: string;
    dailyViewLimit?: number;
    remainingViews?: number;
    canWatch?: boolean;
    isViewedToday?: boolean;
  }

  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/earn/ads');
        console.log('API Response status:', response.status);
        console.log('API Response data:', response.data);
        console.log('Number of ads returned:', response.data.ads?.length || 0);

        // Use sample ads if no ads are returned from API (for testing)
        if (response.data.ads && response.data.ads.length > 0) {
          setAds(response.data.ads);
        } else {
          console.log('No ads from API, using fallback ads for testing');
          const fallbackAds = [
            { id: '1', title: 'Tech Product Launch', durationSeconds: 30, earningsPerView: 0.25, category: 'Tech', dailyViewLimit: 3, remainingViews: 3, canWatch: true, isViewedToday: false },
            { id: '2', title: 'Fashion Collection', durationSeconds: 45, earningsPerView: 0.40, category: 'Fashion', dailyViewLimit: 3, remainingViews: 3, canWatch: true, isViewedToday: false },
            { id: '3', title: 'Automotive Showcase', durationSeconds: 60, earningsPerView: 0.50, category: 'Automotive', dailyViewLimit: 3, remainingViews: 3, canWatch: true, isViewedToday: false }
          ];
          setAds(fallbackAds);
        }
      } catch (error: any) {
        console.error('Failed to fetch ads:', error);
        if (error.response) {
          console.error('API Error status:', error.response.status);
          console.error('API Error data:', error.response.data);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error setting up request:', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'ads') {
      fetchAds();
    }
  }, [activeTab]);

  if (!user) {
    return null;
  }

  const handleWatchAd = async (adId: string) => {
    try {
      const response = await axios.post(`/api/earn/ads/${adId}/complete`);

      alert(response.data.message);

      // Refresh user data to update balance immediately
      const userResponse = await axios.get('/api/auth/me');
      if (userResponse.data.user) {
        useAuthStore.setState({ user: userResponse.data.user });
      }

      // Refresh ads list (removes watched ads)
      const adsResponse = await axios.get('/api/earn/ads');
      setAds(adsResponse.data.ads || []);
    } catch (error: any) {
      console.error('Error watching ad:', error);
      if (error.response) {
        alert(error.response.data.error || 'Failed to complete ad');
      } else if (error.request) {
        alert('No response from server. Please try again.');
      } else {
        alert('Failed to watch ad');
      }
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'ads', label: 'Watch Ads', icon: Play },
    { id: 'surveys', label: 'Surveys', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'installments', label: 'Installments', icon: Calendar },
    { id: 'wallet', label: 'Wallet', icon: DollarSign },
    { id: 'referrals', label: 'Referrals', icon: Users },
  ];

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

  const installmentsData = [
    { name: 'Credit Card - Chase', progress: 65, remaining: 1750, due: 'Dec 15, 2025' },
    { name: 'Car Loan', progress: 40, remaining: 12000, due: 'Dec 20, 2025' },
    { name: 'Student Loan', progress: 25, remaining: 15000, due: 'Jan 5, 2026' },
  ];

  const sampleAds = [
    { id: 1, title: 'Tech Product Launch', duration: 30, earnings: 0.25, category: 'Tech' },
    { id: 2, title: 'Fashion Collection', duration: 45, earnings: 0.40, category: 'Fashion' },
    { id: 3, title: 'Automotive Showcase', duration: 60, earnings: 0.50, category: 'Automotive' },
  ];

  const surveys = [
    { id: 1, title: 'Consumer Tech Habits', provider: 'TechInsights', duration: 10, earnings: 2.00, responses: 847, maxResponses: 1000 },
    { id: 2, title: 'Shopping Preferences', provider: 'MarketPulse', duration: 15, earnings: 3.50, responses: 523, maxResponses: 800 },
  ];

  const tasks = [
    { id: 1, title: 'Image Tagging', description: 'Tag 100 product images', category: 'Image Tagging', difficulty: 'Easy', duration: 15, earnings: 1.50 },
    { id: 2, title: 'Data Entry', description: 'Enter business data from receipts', category: 'Data Entry', difficulty: 'Medium', duration: 30, earnings: 3.00 },
  ];

  const referralCode = user?.referralCode || 'NARMAR1234';
  const referralLink = `https://narmar.com/register?ref=${referralCode}`;

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <div className="flex flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          setCurrentView={setCurrentView}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <header className="border-b bg-background/95 backdrop-blur">
            <div className="container flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setCurrentView('landing')}
                >
                  <Wallet className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">Narmar</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {user.subscriptionTier}
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4" />
                  <span className="font-semibold">${user?.availableBalance?.toFixed(2) || '0.00'}</span>
                </div>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <div className="container max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-muted-foreground">
                  Continue your journey to financial freedom
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="hidden md:flex overflow-x-auto">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <TabsTrigger key={item.id} value={item.id} className="gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value="overview">
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
                                  <div className={`p-2 rounded-full ${activity.status === 'completed'
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
                                  <p className={`font-semibold ${activity.status === 'completed' ? 'text-emerald-600' : 'text-yellow-600'
                                    }`}>
                                    +${activity.amount.toFixed(2)}
                                  </p>
                                  <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
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
                            {installmentsData.map((installment, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{installment.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Due: {installment.due} • ${installment.remaining.toLocaleString()} remaining
                                    </p>
                                  </div>
                                  <Badge>{installment.progress}% paid</Badge>
                                </div>
                                <Progress value={installment.progress} />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ads">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Watch Ads & Earn</h2>
                      <p className="text-muted-foreground">Watch short video ads and earn money for each view</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {loading ? (
                        <div className="col-span-3 text-center py-8">
                          <p className="text-muted-foreground">Loading ads...</p>
                        </div>
                      ) : ads.length === 0 ? (
                        <div className="col-span-3 text-center py-8">
                          <p className="text-muted-foreground">No ads available at the moment. Check back later!</p>
                        </div>
                      ) : (
                        ads.map((ad: Ad) => (
                          <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleWatchAd(ad.id)}>
                            <div className="aspect-video bg-muted relative flex items-center justify-center">
                              <Play className="h-12 w-12 text-primary" />
                              <Badge className="absolute top-2 right-2">{ad.category}</Badge>
                            </div>
                            <CardHeader>
                              <CardTitle className="text-lg">{ad.title}</CardTitle>
                              <CardDescription>
                                <span className="flex items-center gap-1 mr-4">
                                  <Clock className="h-4 w-4" />
                                  {ad.durationSeconds}s
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                  <DollarSign className="h-4 w-4" />
                                  ${ad.earningsPerView.toFixed(2)}
                                </span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Button className="w-full">
                                <Play className="mr-2 h-4 w-4" />
                                Watch & Earn
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="surveys">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Complete Surveys</h2>
                      <p className="text-muted-foreground">Share your opinion and get paid</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {surveys.map((survey) => (
                        <Card key={survey.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <CardTitle className="text-lg">{survey.title}</CardTitle>
                              <Badge>{survey.provider}</Badge>
                            </div>
                            <CardDescription>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {survey.duration} min
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                  <DollarSign className="h-4 w-4" />
                                  {survey.earnings.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                {survey.responses} / {survey.maxResponses} responses
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button className="w-full">Start Survey</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tasks">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Complete Tasks</h2>
                      <p className="text-muted-foreground">Complete micro-tasks and earn money</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tasks.map((task) => (
                        <Card key={task.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <CardTitle className="text-lg">{task.title}</CardTitle>
                              <Badge variant="outline">{task.difficulty}</Badge>
                            </div>
                            <CardDescription>{task.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{task.category}</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {task.duration} min
                                </span>
                              </div>
                              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                <DollarSign className="h-4 w-4" />
                                {task.earnings.toFixed(2)}
                              </span>
                            </div>
                            <Button className="w-full">Start Task</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="installments">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Installment Management</h2>
                        <p className="text-muted-foreground">Track and manage your installment payments</p>
                      </div>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Installment
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {installmentsData.map((installment, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  <CreditCard className="h-5 w-5" />
                                  {installment.name}
                                </CardTitle>
                                <CardDescription>Auto-pay enabled</CardDescription>
                              </div>
                              <Badge variant="outline">Active</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Payment Progress</span>
                                  <span className="text-sm text-muted-foreground">
                                    {installment.progress}% complete
                                  </span>
                                </div>
                                <Progress value={installment.progress} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="wallet">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Wallet</h2>
                      <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
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
                            ${user?.availableBalance?.toFixed(2) || '0.00'}
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
                            ${user?.totalEarnings?.toFixed(2) || '0.00'}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Request Withdrawal</CardTitle>
                        <CardDescription>Withdraw your earnings to your preferred payment method</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <p className="text-sm text-yellow-800 dark:text-yellow-400">
                            Minimum withdrawal: $10.00. Processing time: 24-48 hours.
                          </p>
                        </div>
                        <Button className="w-full" disabled={user.availableBalance < 10}>
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Request Withdrawal
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="referrals">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
                      <p className="text-muted-foreground">Invite friends and earn commission on their earnings</p>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Referral Link</CardTitle>
                        <CardDescription>Share this link with friends and earn 10% commission</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input value={referralLink} readOnly className="font-mono" />
                            <Button variant="outline" size="icon">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button className="flex-1">
                              <Share2 className="mr-2 h-4 w-4" />
                              Share Link
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
