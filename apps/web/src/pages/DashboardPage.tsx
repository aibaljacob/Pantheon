import React from 'react';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { HeroSection } from '../features/dashboard/components/HeroSection';
import { ProjectCarousel } from '../features/dashboard/components/ProjectCarousel';
import { TaskSection } from '../features/dashboard/components/TaskSection';
import { NotificationFeed } from '../features/dashboard/components/NotificationFeed';
import { AIInsightsPanel } from '../features/dashboard/components/AIInsightsPanel';
import { DiscoverSection } from '../features/dashboard/components/DiscoverSection';
import { ActivityTimeline } from '../features/dashboard/components/ActivityTimeline';
import { PortfolioSnapshot } from '../features/dashboard/components/PortfolioSnapshot';
import { QuickActions } from '../features/dashboard/components/QuickActions';
import { FounderCard } from '../features/dashboard/components/FounderCard';
import { StudioOverview } from '../features/dashboard/components/StudioOverview';
import { projects, tasks, notifications, insights, activity } from '../features/dashboard/mockDashboardData';

export const DashboardPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser) {
    return null;
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-10">
        <HeroSection user={currentUser} />
        <ProjectCarousel projects={projects} />
        <TaskSection tasks={tasks} />
        <NotificationFeed notifications={notifications} />
        <AIInsightsPanel insights={insights} />
        <DiscoverSection />
        <ActivityTimeline activity={activity} />
        <PortfolioSnapshot user={currentUser} />
        <QuickActions />
        {currentUser.isFounder ? <StudioOverview /> : <FounderCard />}
      </div>
    </DashboardLayout>
  );
};