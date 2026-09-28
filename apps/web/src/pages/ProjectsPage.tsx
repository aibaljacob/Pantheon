import React from 'react';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { DashboardProjectsSection } from '../features/dashboard/components/DashboardProjectsSection';

export const ProjectsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser) {
    return null;
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-6">
        <DashboardProjectsSection
          showViewAllLink={false}
          headerTitle="Production Portfolio"
          headerSubtitle="All Studio Projects"
        />
      </div>
    </DashboardLayout>
  );
};