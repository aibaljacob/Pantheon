import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, CheckCircle2, AlertCircle, Calendar, KeyRound } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { DashboardUser } from '../types';

interface AccountStatusCardProps {
  user: DashboardUser;
}

export const AccountStatusCard: React.FC<AccountStatusCardProps> = ({ user }) => {
  const isVerified = user.emailVerified ?? false;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Recent';

  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
        <div>
          <h2 className="font-headline text-lg font-bold text-[#ffffff]">
            Account & Identity Status
          </h2>
          <p className="text-xs text-[#8c887e]">
            Data mapped directly from <code className="font-mono text-[#e6e2df]">User</code> database table
          </p>
        </div>
        <Badge variant={user.role === 'Administrator' ? 'accent' : 'bronze'} className="normal-case">
          {user.role}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {/* Email & Verified Status */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[#8c887e]">
            <Mail className="h-3.5 w-3.5" />
            <span>Email</span>
          </div>
          <p className="font-bold text-[#ffffff] truncate" title={user.email}>{user.email}</p>
          <div className="flex items-center gap-1 text-[11px] pt-1">
            {isVerified ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Unverified
              </span>
            )}
          </div>
        </div>

        {/* Username */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[#8c887e]">
            <Shield className="h-3.5 w-3.5" />
            <span>Username</span>
          </div>
          <p className="font-bold text-[#ffffff]">@{user.username}</p>
          <p className="text-[10px] text-[#8c887e]">Public Identifier</p>
        </div>

        {/* Auth Provider */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[#8c887e]">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Auth Provider</span>
          </div>
          <p className="font-bold text-[#ffffff]">{user.provider || 'LOCAL'}</p>
          <p className="text-[10px] text-[#8c887e]">Authentication Type</p>
        </div>

        {/* Joined Date */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[#8c887e]">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created At</span>
          </div>
          <p className="font-bold text-[#ffffff]">{memberSince}</p>
          <p className="text-[10px] text-[#8c887e]">Registration Timestamp</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#2b2a29] pt-4 text-xs font-mono">
        <span className="text-[#8c887e]">Table: User (id: {user.id.slice(0, 8)}...)</span>
        <Link to="/settings" className="text-[#e6e2df] hover:text-[#ffffff] underline">
          Account Settings →
        </Link>
      </div>
    </div>
  );
};
