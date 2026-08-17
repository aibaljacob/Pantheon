import React from 'react';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { DashboardOverviewHero } from '../features/dashboard/components/DashboardOverviewHero';
import { DashboardProjectsSection } from '../features/dashboard/components/DashboardProjectsSection';
import { UserProfileCard } from '../features/dashboard/components/UserProfileCard';
import { AccountStatusCard } from '../features/dashboard/components/AccountStatusCard';
import { ProfileReadinessCard } from '../features/dashboard/components/ProfileReadinessCard';
import { AdminDashboardPage } from '../features/admin/components/AdminDashboardPage';

export const DashboardPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser) {
    return null;
  }

  // Role-based Dashboard selection derived from authenticated session
  if (currentUser.role === 'Administrator') {
    return <AdminDashboardPage user={currentUser} />;
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* 1. Dashboard Overview Hero (User + UserProfile core identity) */}
        <DashboardOverviewHero user={currentUser} />

        {/* 2. Real Database Dashboard Projects Section */}
        <DashboardProjectsSection />

        {/* 3. Developer Profile Feature (Mapped 1-to-1 to UserProfile Prisma Table) */}
        <UserProfileCard user={currentUser} />

        {/* 4. Account & Identity Status Feature (Mapped 1-to-1 to User Prisma Table) */}
        <AccountStatusCard user={currentUser} />

        {/* 5. Profile & Talent Readiness Checklist */}
        <ProfileReadinessCard user={currentUser} />
      </div>
    </DashboardLayout>
  );
};