import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import type { DashboardUser } from '../types';
import pantheonlogo from '../../../assets/pantheon-logowhole.png';
import { LayoutDashboard, FolderKanban, BadgeHelp, Settings, ChevronRight, Mail, Send } from 'lucide-react';
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
  { label: 'Invitations', href: '/dashboard#invitations', icon: Mail },
  { label: 'Applications', href: '/dashboard#applications', icon: Send },
  { label: 'Profile & Portfolio', href: '/profile', icon: BadgeHelp },
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
    <aside className="flex h-full flex-col border-r border-pantheon-border-dark bg-pantheon-bg">
      <div className="flex items-center justify-between border-b border-pantheon-border-dark px-5 py-5">
        <div><img src={pantheonlogo} alt="Pantheon Logo" className="w-15" /><h1 className="mt-2 font-headline text-xl font-bold text-pantheon-ivory">Workspace</h1></div>
        <button type="button" onClick={onCloseMobile} className="lg:hidden rounded-xl border border-pantheon-border bg-pantheon-low p-2 text-pantheon-ivory hover:border-pantheon-border-light" aria-label="Close sidebar navigation"><ChevronRight className="h-4 w-4" /></button>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-5" aria-label="Dashboard navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const targetHref = item.href === '/profile' ? `/u/${user.username}` : item.href;
          return (
            <Link key={item.label} to={targetHref} onClick={onCloseMobile} className="group flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-sm text-pantheon-muted transition-colors hover:border-pantheon-border hover:bg-pantheon-low hover:text-pantheon-ivory">
              <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-pantheon-dim transition-colors group-hover:text-pantheon-ivory" />{item.label}</span>
              <span>{item.comingSoon ? <Badge variant="bronze" className="text-[9px]">Soon</Badge> : null}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-pantheon-border-dark p-3">
        <div className="rounded-3xl border border-pantheon-border bg-pantheon-low p-3.5">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="lg" />
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-pantheon-ivory">{user.fullName}</p><p className="truncate text-xs text-pantheon-dim">{user.role}</p></div>
          </div>
        </div>
      </div>
    </aside>
  );
};