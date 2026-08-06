import React from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../features/auth/store/authStore';
export const EmailVerifiedPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  return (
    <AuthLayout>
      <div className="space-y-6 text-left">
        {/* Header Icon & Title */}
        <div className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-2xl text-[#ffffff] tracking-tight">
              Email Address Verified
            </h2>
            <p className="mt-1 font-sans text-xs text-[#cac6bc] leading-relaxed">
              Your Pantheon studio account is now fully activated and verified.
            </p>
          </div>
        </div>
        {/* Details Card */}
        <div className="rounded-lg border border-[#363433] bg-[#141312] p-4 text-xs font-mono text-[#cac6bc] space-y-2">
          <p className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Account Ready for Production
          </p>
          <p className="text-[11px] leading-relaxed text-[#939188]">
            You now have access to project workspaces, talent collaboration suites, and AI project health analytics.
          </p>
        </div>
        {/* CTA Button */}
        <div className="pt-2">
          {currentUser ? (
            <Link to="/dashboard" className="block w-full">
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                className="w-full justify-center text-sm font-semibold"
              >
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login" className="block w-full">
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                className="w-full justify-center text-sm font-semibold"
              >
                Sign In to Your Workspace
              </Button>
            </Link>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};
