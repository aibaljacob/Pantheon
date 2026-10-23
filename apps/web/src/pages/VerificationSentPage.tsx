import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { Mail, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { resendVerification } from '../features/auth/services/authService';
export const VerificationSentPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as {
    email?: string;
    unverified?: boolean;
    emailVerificationSent?: boolean;
  } | null;
  const [customEmail, setCustomEmail] = useState('');
  const email = state?.email || customEmail.trim();
  const initialSent = state?.emailVerificationSent !== false;

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async () => {
    if (!email || cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await resendVerification(email);
      setResendStatus({
        text: res.message || 'Verification email dispatched! Please check your inbox.',
        isError: false,
      });
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
      setResendStatus({ text: msg, isError: true });
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
              {initialSent ? 'Check Your Inbox' : 'Email Verification'}
            </h2>
            <p className="mt-1 font-sans text-xs text-[#cac6bc] leading-relaxed">
              {email ? (
                <>
                  Verification link destination:{' '}
                  <span className="font-mono text-[#e6e2df] font-semibold">{email}</span>.
                </>
              ) : (
                'Enter your registered email to request a new verification link.'
              )}
            </p>
          </div>
        </div>

        {/* Delivery delay warning if initial email failed */}
        {!initialSent && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 text-xs font-mono text-[#cac6bc] space-y-1">
            <p className="text-amber-300 font-semibold">Delivery Delayed</p>
            <p className="text-[11px] leading-relaxed text-[#cac6bc]">
              We had trouble sending your initial verification link. Please click below to dispatch a new one.
            </p>
          </div>
        )}

        {/* Email input field if visited directly without email in state */}
        {!state?.email && (
          <div className="space-y-1.5">
            <label htmlFor="resend-email" className="block text-xs font-mono font-medium text-[#cac6bc] uppercase tracking-wider">
              Registered Email
            </label>
            <input
              id="resend-email"
              type="email"
              placeholder="name@studio.com"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#141312] border border-[#48473f] text-sm font-mono text-[#e6e2df] rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#939188]/40"
            />
          </div>
        )}

        {/* Notice Card */}
        <div className="rounded-lg border border-[#363433] bg-[#141312] p-4 text-xs font-mono text-[#cac6bc] space-y-2">
          <p className="flex items-center gap-2 text-[#e6e2df] font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            Verification Link Valid for 24 Hours
          </p>
          <p className="text-[11px] leading-relaxed text-[#939188]">
            Can't find the email? Check your spam or junk folder, or request a new link below.
          </p>
        </div>

        {resendStatus && (
          <p
            className={`text-xs font-mono rounded-md p-2.5 border ${
              resendStatus.isError
                ? 'text-red-400 bg-red-950/20 border-red-500/30'
                : 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30'
            }`}
          >
            {resendStatus.text}
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleResend}
            disabled={!email || isResending || cooldown > 0}
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