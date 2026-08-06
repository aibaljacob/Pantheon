import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AuthLoadingScreen } from './AuthLoadingScreen';

interface AuthBootstrapProps {
  children: React.ReactNode;
}

export const AuthBootstrap: React.FC<AuthBootstrapProps> = ({ children }) => {
  const location = useLocation();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isRestoringSession = useAuthStore((state) => state.isRestoringSession);
  const initializeSession = useAuthStore((state) => state.initializeSession);
  const initializedRef = useRef(false);
  const isGoogleCallback = location.pathname === '/auth/google/callback' && location.hash.length > 1;

  useEffect(() => {
    if (!hasHydrated || initializedRef.current || isGoogleCallback) {
      return;
    }

    initializedRef.current = true;
    void initializeSession();
  }, [hasHydrated, initializeSession, isGoogleCallback]);

  if (!hasHydrated || isRestoringSession) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
};