import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';
import type { DashboardUser } from '../types';

interface AccountSecurityCardProps {
  user: DashboardUser;
}

export const AccountSecurityCard: React.FC<AccountSecurityCardProps> = ({ user }) => {
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Recent';

  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          <h2 className="font-headline text-lg font-bold text-[#ffffff]">
            Account Security & Auth Session
          </h2>
        </div>
        <span className="font-mono text-xs text-[#8c887e]">AuthSession Model</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-1">
          <span className="text-[#8c887e]">Authentication</span>
          <p className="font-bold text-[#ffffff] text-sm">{user.provider || 'LOCAL'}</p>
          <p className="text-[10px] text-[#8c887e]">JWT Bearer Tokens</p>
        </div>

        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-1">
          <span className="text-[#8c887e]">Account Status</span>
          <div className="flex items-center gap-1.5 pt-0.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-[#ffffff] text-sm">Active</span>
          </div>
          <p className="text-[10px] text-[#8c887e]">Role: {user.role}</p>
        </div>

        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-1">
          <span className="text-[#8c887e]">Member Since</span>
          <p className="font-bold text-[#ffffff] text-sm">{memberSince}</p>
          <p className="text-[10px] text-[#8c887e]">Pantheon v1.0.0</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#8c887e]">
          <Lock className="h-3.5 w-3.5" />
          <span>Password hashing via bcrypt & JWT session rotation</span>
        </div>
        <Link
          to="/settings"
          className="text-[#cac6bc] hover:text-[#ffffff] underline"
        >
          Security Settings →
        </Link>
      </div>
    </div>
  );
};
