import React, { useState } from 'react';
import { Bell, MessageSquare, Search, ChevronDown, Menu, LogOut, UserRound, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { DashboardUser } from '../types';
import { useAuthStore } from '../../auth/store/authStore';
import { UserAvatar } from '../../auth/components/UserAvatar';
import { ThemeSwitcher } from '../../theme/ThemeSwitcher';

interface DashboardHeaderProps {
  user: DashboardUser;
  onOpenSidebar: () => void;
  onToggleTheme?: () => void;
  themeMode?: 'dark' | 'graphite';
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, onOpenSidebar }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const logoutSession = useAuthStore((state) => state.logoutSession);

  return (
    <header className="sticky top-0 z-30 border-b border-pantheon-border-dark bg-pantheon-bg/90 backdrop-blur-xl xl:fixed xl:left-[17rem] xl:right-0 xl:top-0 xl:z-30">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onOpenSidebar} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-pantheon-border bg-pantheon-low text-pantheon-ivory transition-colors hover:border-pantheon-border-light lg:hidden" aria-label="Open sidebar navigation">
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden flex-1 items-center lg:flex">
          <Search className="pointer-events-none absolute left-4 h-4 w-4 text-pantheon-dim" />
          <input type="search" aria-label="Global search" placeholder="Search projects, tasks, people, assets..." className="h-12 w-full rounded-2xl border border-pantheon-border bg-pantheon-low pl-11 pr-28 text-sm text-pantheon-ivory placeholder:text-pantheon-dim focus:border-pantheon-border-light focus:outline-none focus:ring-2 focus:ring-pantheon-border/40" />
          <span className="pointer-events-none absolute right-4 rounded-full border border-pantheon-border bg-pantheon-bg px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-pantheon-dim">Cmd+K</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" aria-label="Notifications" className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-pantheon-border bg-pantheon-low text-pantheon-ivory transition-colors hover:border-pantheon-border-light"><Bell className="h-4 w-4" />{user.unreadNotifications ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-pantheon-bg bg-pantheon-ivory" /> : null}</button>
          <button type="button" aria-label="Messages" className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-pantheon-border bg-pantheon-low text-pantheon-ivory transition-colors hover:border-pantheon-border-light"><MessageSquare className="h-4 w-4" />{user.unreadMessages ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-pantheon-bg bg-pantheon-muted" /> : null}</button>
          <ThemeSwitcher variant="compact" />

          <div className="relative">
            <button type="button" onClick={() => setProfileMenuOpen((value) => !value)} className="flex h-11 items-center gap-3 rounded-2xl border border-pantheon-border bg-pantheon-low px-3 pr-4 text-left transition-colors hover:border-pantheon-border-light" aria-haspopup="menu" aria-expanded={profileMenuOpen}>
              <UserAvatar user={user} size="sm" />
              <span className="hidden flex-col text-left sm:flex"><span className="text-sm font-semibold text-pantheon-ivory">{user.fullName}</span><span className="text-xs text-pantheon-dim">{user.role}</span></span>
              <ChevronDown className="h-4 w-4 text-pantheon-dim" />
            </button>

            {profileMenuOpen ? (
              <div role="menu" aria-label="Profile options" className="absolute right-0 top-[calc(100%+0.75rem)] w-56 rounded-2xl border border-pantheon-border bg-pantheon-low p-2 shadow-2xl shadow-black/40">
                <div className="border-b border-pantheon-border-dark px-3 py-3">
                  <p className="text-sm font-semibold text-pantheon-ivory">{user.fullName}</p>
                  <p className="text-xs text-pantheon-dim">@{user.username}</p>
                </div>
                <Link to={`/u/${user.username}`} role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-pantheon-muted transition-colors hover:bg-pantheon-mid hover:text-pantheon-ivory" onClick={() => setProfileMenuOpen(false)}>
                  <UserRound className="h-4 w-4" />
                  View Profile
                </Link>
                <Link to="/settings" role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-pantheon-muted transition-colors hover:bg-pantheon-mid hover:text-pantheon-ivory" onClick={() => setProfileMenuOpen(false)}>
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-pantheon-muted transition-colors hover:bg-pantheon-mid hover:text-pantheon-ivory"
                  onClick={async () => {
                    await logoutSession();
                    setProfileMenuOpen(false);
                    navigate('/login', { replace: true });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};