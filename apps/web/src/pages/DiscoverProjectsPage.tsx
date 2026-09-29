import React from 'react';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { DiscoverProjectsView } from '../features/projects/components/DiscoverProjectsView';

export const DiscoverProjectsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (currentUser) {
    return (
      <DashboardLayout user={currentUser}>
        <div className="max-w-7xl mx-auto pb-12">
          <DiscoverProjectsView />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-pantheon-bg text-pantheon-ivory flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <DiscoverProjectsView />
      </main>
      <Footer />
    </div>
  );
};
export default DiscoverProjectsPage;
