import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import type { DashboardUser } from '../types';
import pantheonlogo from '../../../assets/pantheon-logowhole.png';
import { LayoutDashboard, FolderKanban, BadgeHelp, Settings, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '../../auth/components/UserAvatar';

interface SidebarProps {
  user: DashboardUser;
  onCloseMobile: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
}

const userNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  // { label: 'Discover', href: '/dashboard#discover', icon: Compass },
  // { label: 'Messages', href: '/dashboard#messages', icon: MessagesSquare },
  // { label: 'Notifications', href: '/dashboard#notifications', icon: BellRing },
  { label: 'Profile & Portfolio', href: '/profile', icon: BadgeHelp },
  // { label: 'Tasks', href: '/dashboard#tasks', icon: CheckSquare },
  // { label: 'Calendar', href: '/dashboard#calendar', icon: CalendarDays, comingSoon: true },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const adminNavItems: NavItem[] = [
  { label: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ user, onCloseMobile }) => {
  const isAdmin = user.role === 'Administrator';
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="flex h-full flex-col border-r border-[#2b2a29] bg-[#141312]">
      <div className="flex items-center justify-between border-b border-[#2b2a29] px-5 py-5">
        <div><img src={pantheonlogo} alt="Pantheon Logo" className="w-15" /><h1 className="mt-2 font-headline text-xl font-bold text-[#ffffff]">Workspace</h1></div>
        <button type="button" onClick={onCloseMobile} className="lg:hidden rounded-xl border border-[#363433] bg-[#1c1b1a] p-2 text-[#e6e2df]" aria-label="Close sidebar navigation"><ChevronRight className="h-4 w-4" /></button>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-5" aria-label="Dashboard navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const targetHref = item.href === '/profile' ? `/u/${user.username}` : item.href;
          return (
            <Link key={item.label} to={targetHref} onClick={onCloseMobile} className="group flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-sm text-[#cac6bc] transition-colors hover:border-[#363433] hover:bg-[#1c1b1a] hover:text-[#ffffff]">
              <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-[#8c887e] transition-colors group-hover:text-[#e6e2df]" />{item.label}</span>
              <span>{item.comingSoon ? <Badge variant="bronze" className="text-[9px]">Soon</Badge> : null}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#2b2a29] p-3">
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-3.5">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="lg" />
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#ffffff]">{user.fullName}</p><p className="truncate text-xs text-[#8c887e]">{user.role}</p></div>
          </div>
          {/* <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#2b2a29] bg-[#141312] px-3 py-2"><div><p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Quick settings</p><p className="text-xs text-[#cac6bc]">Personalize workspace</p></div><UserCog className="h-4 w-4 text-[#e6e2df]" /></div> */}
        </div>
      </div>
    </aside>
  );
};