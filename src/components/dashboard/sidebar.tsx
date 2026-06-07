'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  Play,
  FileText,
  CheckSquare,
  Calendar,
  DollarSign,
  Users,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  setCurrentView: (view: string) => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'ads', label: 'Watch Ads', icon: Play },
  { id: 'surveys', label: 'Surveys', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'installments', label: 'Installments', icon: Calendar },
  { id: 'wallet', label: 'Wallet', icon: DollarSign },
  { id: 'referrals', label: 'Referrals', icon: Users },
];

export function Sidebar({ isOpen, onClose, activeTab, onTabChange, setCurrentView }: SidebarProps) {
  const { logout, user } = useAuthStore();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen
          w-64 bg-card border-r
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setCurrentView('landing')}
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg">Narmar</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="mb-4 p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.subscriptionTier || 'FREE'} Plan
              </p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onTabChange('settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
