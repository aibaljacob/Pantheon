import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { verifyEmail } from '../features/auth/services/authService';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verificationExecutedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('Verification token is missing from URL.');
      return;
    }

    if (verificationExecutedRef.current === token) {
      return;
    }
    verificationExecutedRef.current = token;

    async function executeVerification() {
      try {
        await verifyEmail(token as string);
        navigate('/email-verified', { replace: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to verify email token.';
        setError(msg);
        setIsLoading(false);
      }
    }

    executeVerification();
  }, [token, navigate]);

  return (
    <AuthLayout>
      <div className="space-y-6 text-left">
        {isLoading ? (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#e6e2df] animate-spin mx-auto" />
            <div>
              <h2 className="font-headline font-bold text-xl text-[#ffffff]">
                Verifying Email Address
              </h2>
              <p className="font-sans text-xs text-[#cac6bc] mt-1">
                Please wait while we confirm your email token with the server...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-headline font-bold text-2xl text-[#ffffff] tracking-tight">
                  Verification Failed
                </h2>
                <p className="mt-1 font-sans text-xs text-red-400 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-[#363433] bg-[#141312] p-4 text-xs font-mono text-[#cac6bc]">
              The verification link may have expired or already been used. Please request a new verification link.
            </div>
            <div className="space-y-3 pt-2">
              <Link to="/verification-sent" className="block w-full">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="w-full justify-center text-xs font-semibold"
                >
                  Resend Verification Email
                </Button>
              </Link>
              <Link to="/login" className="block w-full">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  className="w-full justify-center text-xs font-mono text-[#cac6bc]"
                >
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
};