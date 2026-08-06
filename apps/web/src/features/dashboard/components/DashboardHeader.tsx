import React, { useState } from 'react';
import { Bell, MessageSquare, Search, MoonStar, SunMedium, ChevronDown, Menu, LogOut, UserRound, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import type { DashboardUser } from '../types';
import { useAuthStore } from '../../auth/store/authStore';
import { UserAvatar } from '../../auth/components/UserAvatar';

interface DashboardHeaderProps {
  user: DashboardUser;
  onOpenSidebar: () => void;
  onToggleTheme: () => void;
  themeMode: 'dark' | 'graphite';
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, onOpenSidebar, onToggleTheme, themeMode }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const logoutSession = useAuthStore((state) => state.logoutSession);

  return (
    <header className="sticky top-0 z-30 border-b border-[#2b2a29] bg-[#141312]/90 backdrop-blur-xl xl:fixed xl:left-[17rem] xl:right-0 xl:top-0 xl:z-30">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onOpenSidebar} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#363433] bg-[#1c1b1a] text-[#e6e2df] transition-colors hover:border-[#48473f] lg:hidden" aria-label="Open sidebar navigation">
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden flex-1 items-center lg:flex">
          <Search className="pointer-events-none absolute left-4 h-4 w-4 text-[#8c887e]" />
          <input type="search" aria-label="Global search" placeholder="Search projects, tasks, people, assets..." className="h-12 w-full rounded-2xl border border-[#363433] bg-[#1c1b1a] pl-11 pr-28 text-sm text-[#e6e2df] placeholder:text-[#8c887e] focus:border-[#48473f] focus:outline-none focus:ring-2 focus:ring-[#48473f]/40" />
          <span className="pointer-events-none absolute right-4 rounded-full border border-[#363433] bg-[#141312] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Cmd+K</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" aria-label="Notifications" className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#363433] bg-[#1c1b1a] text-[#e6e2df] transition-colors hover:border-[#48473f]"><Bell className="h-4 w-4" />{user.unreadNotifications ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-[#141312] bg-[#e6e2df]" /> : null}</button>
          <button type="button" aria-label="Messages" className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#363433] bg-[#1c1b1a] text-[#e6e2df] transition-colors hover:border-[#48473f]"><MessageSquare className="h-4 w-4" />{user.unreadMessages ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-[#141312] bg-[#cac6bc]" /> : null}</button>
          <button type="button" onClick={onToggleTheme} aria-label="Toggle theme" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#363433] bg-[#1c1b1a] px-4 text-sm text-[#e6e2df] transition-colors hover:border-[#48473f]">{themeMode === 'dark' ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}<span className="hidden sm:inline">{themeMode === 'dark' ? 'Dark' : 'Graphite'}</span></button>

          <div className="relative">
            <button type="button" onClick={() => setProfileMenuOpen((value) => !value)} className="flex h-11 items-center gap-3 rounded-2xl border border-[#363433] bg-[#1c1b1a] px-3 pr-4 text-left transition-colors hover:border-[#48473f]" aria-haspopup="menu" aria-expanded={profileMenuOpen}>
              <UserAvatar user={user} size="sm" />
              <span className="hidden flex-col text-left sm:flex"><span className="text-sm font-semibold text-[#ffffff]">{user.fullName}</span><span className="text-xs text-[#8c887e]">{user.role}</span></span>
              <ChevronDown className="h-4 w-4 text-[#8c887e]" />
            </button>

            {profileMenuOpen ? (
              <div role="menu" aria-label="Profile options" className="absolute right-0 top-[calc(100%+0.75rem)] w-56 rounded-2xl border border-[#363433] bg-[#1c1b1a] p-2 shadow-2xl shadow-black/40">
                <div className="border-b border-[#2b2a29] px-3 py-3">
                  <p className="text-sm font-semibold text-[#ffffff]">{user.fullName}</p>
                  <p className="text-xs text-[#8c887e]">@{user.username}</p>
                </div>
                <Link to="/profile" role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#cac6bc] transition-colors hover:bg-[#141312] hover:text-[#e6e2df]" onClick={() => setProfileMenuOpen(false)}>
                  <UserRound className="h-4 w-4" />
                  View Profile
                </Link>
                <Link to="/settings" role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#cac6bc] transition-colors hover:bg-[#141312] hover:text-[#e6e2df]" onClick={() => setProfileMenuOpen(false)}>
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#cac6bc] transition-colors hover:bg-[#141312] hover:text-[#e6e2df]">
                  Keyboard Shortcuts
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#cac6bc] transition-colors hover:bg-[#141312] hover:text-[#e6e2df]"
                  onClick={async () => {
                    await logoutSession();
                    setProfileMenuOpen(false);
                    navigate('/login', { replace: true });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
                <div className="px-3 pb-2 pt-3"><Badge variant="bronze" className="w-full justify-center">Quick Settings</Badge></div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};