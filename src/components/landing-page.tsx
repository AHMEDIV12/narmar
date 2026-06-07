'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, TrendingUp, Wallet, Users, Zap, Shield, Star } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function LandingPage() {
  const { setCurrentView, isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setCurrentView('landing')}
          >
            <Wallet className="h-6 w-6" />
            <span className="text-xl font-bold">Narmar</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Testimonials
            </a>
          </nav>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => setCurrentView('dashboard')}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setCurrentView('login')}>
                  Login
                </Button>
                <Button onClick={() => setCurrentView('register')}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-4 md:py-32">
          <div className="container max-w-6xl mx-auto text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm bg-secondary">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Earn money while paying off your installments</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Turn Your Free Time Into Financial Freedom
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Watch ads, complete surveys, and finish micro-tasks to earn money that automatically applies to your installments. No more financial stress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button size="lg" className="text-lg px-8" onClick={() => setCurrentView('dashboard')}>
                  Go to Dashboard
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button size="lg" className="text-lg px-8" onClick={() => setCurrentView('register')}>
                  Start Earning Today
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              )}
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Learn More
                </Button>
              </a>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-muted-foreground">Active Users</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold">$2M+</div>
                <div className="text-muted-foreground">Earned by Users</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold">4.9</div>
                <div className="text-muted-foreground">User Rating</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 px-4 bg-muted/50">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need to Pay Off Your Installments
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Multiple earning methods, automatic payments, and full control over your financial journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Play className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Watch Ads</CardTitle>
                  <CardDescription>
                    Earn money by watching short video ads from top brands. Complete in your spare time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Complete Surveys</CardTitle>
                  <CardDescription>
                    Share your opinion and get paid. Surveys matched to your profile and interests.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Micro-Tasks</CardTitle>
                  <CardDescription>
                    Small tasks like data entry, image tagging, and more. Quick and rewarding.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Referral Program</CardTitle>
                  <CardDescription>
                    Invite friends and earn commission on their earnings. Multi-tier rewards system.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Premium Subscription</CardTitle>
                  <CardDescription>
                    Upgrade to earn 2x more, get instant withdrawals, and unlock exclusive offers.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Wallet className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Secure Payments</CardTitle>
                  <CardDescription>
                    Your money is safe. Automatic installment payments with multiple withdrawal options.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start earning in just 3 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-2xl font-bold mb-2">Create Account</h3>
                <p className="text-muted-foreground">
                  Sign up for free, add your installment details, and get your unique referral code.
                </p>
              </div>

              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-2xl font-bold mb-2">Earn Money</h3>
                <p className="text-muted-foreground">
                  Complete tasks, watch ads, take surveys, and refer friends to build your balance.
                </p>
              </div>

              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-2xl font-bold mb-2">Auto Pay</h3>
                <p className="text-muted-foreground">
                  Your earnings automatically apply to your installments. Watch your debt decrease!
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 px-4 bg-muted/50">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of satisfied users who have transformed their finances
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <CardDescription className="text-base">
                    &ldquo;I&apos;ve paid off $5,000 in credit card debt in just 8 months! Narmar made it so easy to earn extra money.&rdquo;
                  </CardDescription>
                  <div className="mt-4 font-semibold">Sarah M.</div>
                  <div className="text-sm text-muted-foreground">Premium Member</div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <CardDescription className="text-base">
                    &ldquo;The referral program is amazing! I earn $200/month just from my network. Highly recommend!&rdquo;
                  </CardDescription>
                  <div className="mt-4 font-semibold">Michael R.</div>
                  <div className="text-sm text-muted-foreground">Free Member</div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <CardDescription className="text-base">
                    &ldquo;The automatic payment feature is a game-changer. I don&apos;t have to worry about due dates anymore!&rdquo;
                  </CardDescription>
                  <div className="mt-4 font-semibold">Emily T.</div>
                  <div className="text-sm text-muted-foreground">Premium Plus Member</div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Journey to Financial Freedom?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users who are already earning and paying off their installments.
            </p>
            {isAuthenticated ? (
              <Button size="lg" className="text-lg px-8" onClick={() => setCurrentView('dashboard')}>
                View Your Dashboard
                <TrendingUp className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button size="lg" className="text-lg px-8" onClick={() => setCurrentView('register')}>
                Create Free Account
                <TrendingUp className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-6 w-6" />
                <span className="text-xl font-bold">Narmar</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Turn your free time into financial freedom. Earn money while paying off your installments.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-primary">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 Narmar. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
