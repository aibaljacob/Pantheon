import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { DashboardOverviewHero } from '../features/dashboard/components/DashboardOverviewHero';
import { DashboardProjectsSection } from '../features/dashboard/components/DashboardProjectsSection';
import { DashboardInvitationsSection } from '../features/dashboard/components/DashboardInvitationsSection';
import { DashboardApplicationsSection } from '../features/dashboard/components/DashboardApplicationsSection';
import { UserProfileCard } from '../features/dashboard/components/UserProfileCard';
import { ProfileReadinessCard } from '../features/dashboard/components/ProfileReadinessCard';
import { AdminDashboardPage } from '../features/admin/components/AdminDashboardPage';
import type { ProfileData } from '../features/profile/types';
import { fetchOwnProfile } from '../features/profile/services/profileService';

export const DashboardPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();
  const isInvitationsTab = location.hash === '#invitations';
  const isApplicationsTab = location.hash === '#applications';

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(Boolean(accessToken));

  useEffect(() => {
    if (!accessToken || isInvitationsTab || isApplicationsTab) return;
    let ignore = false;

    fetchOwnProfile(accessToken)
      .then((data) => {
        if (!ignore) {
          setProfile(data);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.warn('Dashboard profile fetch failed:', err);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [accessToken, isInvitationsTab, isApplicationsTab]);

  if (!currentUser) {
    return null;
  }

  // Role-based Dashboard selection derived from authenticated session
  if (currentUser.role === 'Administrator') {
    return <AdminDashboardPage user={currentUser} />;
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-10 max-w-7xl mx-auto pb-12">
        {isInvitationsTab ? (
          <DashboardInvitationsSection />
        ) : isApplicationsTab ? (
          <DashboardApplicationsSection />
        ) : (
          <>
            {/* 1. Workspace Welcome & Identity */}
            <DashboardOverviewHero user={currentUser} />

            {/* 2. Active Studio Productions / Projects */}
            <DashboardProjectsSection />

            {/* 3. Studio Invitations & Candidate Applications */}
            <div className="space-y-8">
              <DashboardInvitationsSection />
              <DashboardApplicationsSection />
            </div>

            {/* 4. Secondary: Developer Profile & Talent Readiness */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <UserProfileCard user={currentUser} profile={profile} isLoading={isLoadingProfile} />
              <ProfileReadinessCard user={currentUser} profile={profile} isLoading={isLoadingProfile} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};