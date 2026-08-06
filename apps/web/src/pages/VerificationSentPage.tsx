import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { Mail, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { resendVerification } from '../features/auth/services/authService';
export const VerificationSentPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { email?: string; unverified?: boolean } | null;
  const email = state?.email || 'your registered email address';
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await resendVerification(email);
      setResendStatus(res.message || 'Verification email resent!');
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend email.';
      setResendStatus(msg);
    } finally {
      setIsResending(false);
    }
  };
  return (
    <AuthLayout>
      <div className="space-y-6 text-left">
        {/* Header Icon & Title */}
        <div className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#48473f] bg-[#1c1b1a] text-[#e6e2df]">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-2xl text-[#ffffff] tracking-tight">
              Check Your Inbox
            </h2>
            <p className="mt-1 font-sans text-xs text-[#cac6bc] leading-relaxed">
              We've sent a verification link to{' '}
              <span className="font-mono text-[#e6e2df] font-semibold">{email}</span>. Please click the link in the email to activate your account.
            </p>
          </div>
        </div>
        {/* Notice Card */}
        <div className="rounded-lg border border-[#363433] bg-[#141312] p-4 text-xs font-mono text-[#cac6bc] space-y-2">
          <p className="flex items-center gap-2 text-[#e6e2df] font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            Verification Link Valid for 24 Hours
          </p>
          <p className="text-[11px] leading-relaxed text-[#939188]">
            Can't find the email? Check your spam or junk folder, or click below to request a new link.
          </p>
        </div>
        {resendStatus && (
          <p className="text-xs font-mono text-emerald-400 bg-[#141312] border border-emerald-500/30 rounded-md p-2.5">
            {resendStatus}
          </p>
        )}
        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            icon={isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            className="w-full justify-center text-xs font-mono"
          >
            {isResending
              ? 'Sending...'
              : cooldown > 0
              ? `Resend Link (${cooldown}s)`
              : 'Resend Verification Email'}
          </Button>
          <Link to="/login" className="block w-full">
            <Button
              type="button"
              variant="ghost"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              className="w-full justify-center text-xs font-mono text-[#cac6bc] hover:text-[#e6e2df]"
            >
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};