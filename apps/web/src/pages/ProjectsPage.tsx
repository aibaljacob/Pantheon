import React from 'react';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { DashboardProjectsSection } from '../features/dashboard/components/DashboardProjectsSection';
import { TaskSection } from '../features/dashboard/components/TaskSection';
import { QuickActions } from '../features/dashboard/components/QuickActions';
import { DiscoverSection } from '../features/dashboard/components/DiscoverSection';
import { tasks } from '../features/dashboard/mockDashboardData';

export const ProjectsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser) {
    return null;
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-10">
        <section className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Projects</p>
          <h1 className="font-headline text-4xl font-bold text-[#ffffff]">Your production portfolio</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[#cac6bc]">
            Review active projects, track milestones, and jump into the work that matters most.
          </p>
        </section>

        <DashboardProjectsSection />
        <TaskSection tasks={tasks} />
        <DiscoverSection />
        <QuickActions />
      </div>
    </DashboardLayout>
  );
};