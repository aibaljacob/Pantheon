import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { DiscoverProjectsView } from '../features/projects/components/DiscoverProjectsView';

export const DiscoverProjectsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (currentUser) {
    return <Navigate to="/projects" replace />;
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
