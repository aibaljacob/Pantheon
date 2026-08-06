import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AuthLoadingScreen } from './AuthLoadingScreen';
export const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isRestoringSession = useAuthStore((state) => state.isRestoringSession);
  const currentUser = useAuthStore((state) => state.currentUser);
  if (!hasHydrated || isRestoringSession) {
    return <AuthLoadingScreen title="Securing workspace" description="Checking your authenticated session..." />;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (currentUser.emailVerified === false) {
    return <Navigate to="/verification-sent" replace state={{ email: currentUser.email, unverified: true }} />;
  }
  return <Outlet />;
};