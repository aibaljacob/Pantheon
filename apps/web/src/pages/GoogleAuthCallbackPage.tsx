import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AuthLoadingScreen } from '../features/auth/components/AuthLoadingScreen';
import { useAuthStore } from '../features/auth/store/authStore';

function parseOAuthParams(hash: string, search: string): URLSearchParams {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
  if (normalizedHash) {
    return new URLSearchParams(normalizedHash);
  }

  return new URLSearchParams(search);
}

function getFriendlyError(errorCode: string): string {
  switch (errorCode) {
    case 'google_auth_cancelled':
      return 'Google sign-in was cancelled before completion.';
    case 'google_auth_failed':
      return 'Google sign-in could not be completed. Please try again.';
    case 'google_auth_state_invalid':
      return 'Your Google sign-in session expired. Please try again.';
    case 'google_auth_unavailable':
      return 'Google sign-in is temporarily unavailable.';
    default:
      return 'Unable to complete Google sign-in.';
  }
}

export const GoogleAuthCallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initializeSession = useAuthStore((state) => state.initializeSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const authError = useAuthStore((state) => state.error);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(true);

  const oauthParams = useMemo(() => parseOAuthParams(location.hash, location.search), [location.hash, location.search]);

  useEffect(() => {
    const errorCode = oauthParams.get('error');
    if (errorCode) {
      clearSession();
      setLocalError(getFriendlyError(errorCode));
      setIsCompleting(false);
      return;
    }

    const accessToken = oauthParams.get('accessToken');
    const refreshToken = oauthParams.get('refreshToken');
    const rememberMe = oauthParams.get('rememberMe') === 'true';

    if (!accessToken) {
      setLocalError('Google sign-in did not return a session token. Please try again.');
      setIsCompleting(false);
      return;
    }

    setIsCompleting(true);
    void initializeSession({
      accessToken,
      refreshToken: refreshToken || null,
      rememberMe,
    }).then((user) => {
      if (user) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setLocalError(useAuthStore.getState().error ?? 'Unable to load your Google session.');
      setIsCompleting(false);
    });
  }, [clearSession, initializeSession, navigate, oauthParams]);

  if (isCompleting && !localError) {
    return <AuthLoadingScreen title="Completing Google sign-in" description="Verifying your account and loading your workspace..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141312] px-6 text-[#e6e2df]">
      <div className="w-full max-w-md rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#48473f] bg-[#2A2724] text-[#e6e2df]">
          <span className="font-mono text-lg font-semibold">!</span>
        </div>
        <h1 className="mt-6 font-headline text-2xl font-bold text-[#ffffff]">Google Sign-In</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#cac6bc]">{localError ?? authError ?? 'Unable to complete Google sign-in.'}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" variant="primary" onClick={() => navigate('/login', { replace: true })} className="w-full sm:w-auto">
            Back to Sign In
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/register', { replace: true })} className="w-full sm:w-auto">
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
};