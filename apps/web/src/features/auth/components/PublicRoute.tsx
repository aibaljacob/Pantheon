import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AuthLoadingScreen } from './AuthLoadingScreen';

export const PublicRoute: React.FC = () => {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isRestoringSession = useAuthStore((state) => state.isRestoringSession);
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!hasHydrated || isRestoringSession) {
    return <AuthLoadingScreen title="Preparing your workspace" description="Restoring your authentication state..." />;
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};