import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  subscriptionTier: string;
  availableBalance: number;
  totalEarnings: number;
  todaysEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalWithdrawn: number;
  avatarUrl?: string;
  referralCode?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentView: 'landing' | 'login' | 'register' | 'dashboard' | 'advertiser-dashboard' | string;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setCurrentView: (view: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      currentView: 'landing',
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setCurrentView: (currentView) => set({ currentView }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, currentView: 'landing' }),
    }),
    {
      name: 'narmar-auth',
    }
  )
);
