'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { LandingPage } from '@/components/landing-page';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Dashboard } from '@/components/dashboard/dashboard';
import { AdvertiserDashboard } from '@/components/advertiser/dashboard';

export default function Home() {
  const { currentView, isAuthenticated, setUser, setToken } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(document.cookie.replace(/(?:(?:^|.*;\s*)auth-token\s*=\s*([^;]*).*$)|^.*$/, '$1'));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, [setUser, setToken]);

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <LoginForm />;
      case 'register':
        return <RegisterForm />;
      case 'dashboard':
        return <Dashboard />;
      case 'advertiser-dashboard':
        return <AdvertiserDashboard />;
      default:
        return <LandingPage />;
    }
  };

  return <div className="min-h-screen">{renderView()}</div>;
}
