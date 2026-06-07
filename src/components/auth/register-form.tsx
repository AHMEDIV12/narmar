'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Loader2, Gift, Briefcase, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function RegisterForm() {
  const [accountType, setAccountType] = useState<'user' | 'advertiser'>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Advertiser-specific fields
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [paymentEmail, setPaymentEmail] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setCurrentView } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = accountType === 'advertiser'
        ? '/api/auth/register-advertiser'
        : '/api/auth/register';

      const body = accountType === 'advertiser'
        ? {
          name,
          email,
          password,
          companyName,
          companyDescription: companyDescription || undefined,
          website: website || undefined,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
          paymentEmail: paymentEmail || undefined,
        }
        : {
          name,
          email,
          password,
          referralCode: referralCode || undefined,
        };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser(data.user);
      setCurrentView(accountType === 'advertiser' ? 'advertiser-dashboard' : 'dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div
              className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setCurrentView('landing')}
            >
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Choose your account type and get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Account Type Selection */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('user')}
                  className={`p-4 border-2 rounded-lg transition-all ${accountType === 'user'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  <User className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-semibold">User</div>
                  <div className="text-xs text-muted-foreground">Earn money by watching ads</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('advertiser')}
                  className={`p-4 border-2 rounded-lg transition-all ${accountType === 'advertiser'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  <Briefcase className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-semibold">Advertiser</div>
                  <div className="text-xs text-muted-foreground">Promote your business</div>
                </button>
              </div>
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            {/* User-specific fields */}
            {accountType === 'user' && (
              <div className="space-y-2">
                <Label htmlFor="referral">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Referral Code (Optional)
                  </div>
                </Label>
                <Input
                  id="referral"
                  placeholder="Enter referral code for bonus"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                />
              </div>
            )}

            {/* Advertiser-specific fields */}
            {accountType === 'advertiser' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Company Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Acme Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required={accountType === 'advertiser'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea
                    id="companyDescription"
                    placeholder="Tell us about your company..."
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="contact@company.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentEmail">Payment Email</Label>
                    <Input
                      id="paymentEmail"
                      type="email"
                      placeholder="payments@company.com"
                      value={paymentEmail}
                      onChange={(e) => setPaymentEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                `Create ${accountType === 'advertiser' ? 'Advertiser' : 'User'} Account`
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2 text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => setCurrentView('login')}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
            <button
              onClick={() => setCurrentView('landing')}
              className="text-muted-foreground hover:text-primary"
            >
              Back to home
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
