import React from 'react';
import { Link } from 'react-router-dom';
import { User, AlertCircle, ArrowUpRight, Sparkles } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { DashboardUser } from '../types';

interface DashboardOverviewHeroProps {
  user: DashboardUser;
}

export const DashboardOverviewHero: React.FC<DashboardOverviewHeroProps> = ({ user }) => {
  const isEmailVerified = user.emailVerified ?? false;

  return (
    <div className="space-y-6">
      {/* Unverified Email Notice Banner (Supported by User.emailVerified) */}
      {!isEmailVerified && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-200 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-mono font-bold">Email Verification Required</p>
              <p className="text-xs text-amber-300/80 font-sans">
                Please verify your email address (<span className="font-mono">{user.email}</span>) to unlock full studio recruitment features.
              </p>
            </div>
          </div>
          <Link
            to="/verification-sent"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-900/40 px-3.5 py-1.5 font-mono text-xs text-amber-200 hover:border-amber-300 hover:text-white transition-colors shrink-0"
          >
            <span>Verify Email</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Hero Welcome Card (Supported by User + UserProfile models) */}
      <div className="relative overflow-hidden rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-br from-[#48473f]/20 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs uppercase tracking-widest text-[#8c887e]">
                Workspace Overview
              </span>
              <span className="text-[#363433]">·</span>
              <Badge variant="accent" className="normal-case">
                {user.role}
              </Badge>
              {user.isFounder && (
                <Badge variant="bronze" className="normal-case">
                  Founder
                </Badge>
              )}
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-[#ffffff] tracking-tight">
              Welcome back, {user.firstName || user.fullName}
            </h1>

            <p className="text-sm leading-relaxed text-[#cac6bc] font-sans">
              Manage your game development identity, review profile completeness, and access studio workspace settings.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#8c887e] pt-1">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#e6e2df]" />
                @{user.username}
              </span>
              <span>·</span>
              {/* <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Auth Provider: {user.provider || 'LOCAL'}
              </span> */}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link to={`/u/${user.username}`}>
              <Button variant="primary" size="md" icon={<Sparkles className="h-4 w-4" />}>
                View Public Profile
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="secondary" size="md">
                Account Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
