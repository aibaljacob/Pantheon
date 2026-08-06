import React, { useState } from 'react';
import type { DashboardUser } from '../types';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';

interface DashboardLayoutProps {
  user: DashboardUser;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'graphite'>('dark');

  return (
    <div className={`min-h-screen ${themeMode === 'dark' ? 'bg-[#141312]' : 'bg-[#171615]'} text-[#e6e2df]`}>
      <div className="relative flex min-h-screen overflow-hidden">
        <aside className="hidden xl:fixed xl:inset-y-0 xl:left-0 xl:z-40 xl:block xl:w-[17rem]">
          <Sidebar user={user} onCloseMobile={() => setMobileSidebarOpen(false)} />
        </aside>

        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm xl:hidden" role="presentation" onClick={() => setMobileSidebarOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-[17rem] max-w-[86vw]" role="dialog" aria-label="Dashboard navigation drawer" onClick={(event) => event.stopPropagation()}>
              <Sidebar user={user} onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col xl:ml-[17rem] xl:w-[calc(100vw-17rem)] xl:flex-none">
          <DashboardHeader user={user} onOpenSidebar={() => setMobileSidebarOpen(true)} onToggleTheme={() => setThemeMode((mode) => (mode === 'dark' ? 'graphite' : 'dark'))} themeMode={themeMode} />
          <main className="flex-1 overflow-y-auto xl:pt-[5.5rem]">
            <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 2xl:px-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};