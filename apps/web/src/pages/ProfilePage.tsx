import React from 'react';
import { Globe, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { UserAvatar } from '../features/auth/components/UserAvatar';

export const ProfilePage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser) {
    return null;
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-10">
        <section className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Profile</p>
          <h1 className="font-headline text-4xl font-bold text-[#ffffff]">Your public identity</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[#cac6bc]">
            Keep your profile complete so studios can discover your work and reach out faster.
          </p>
        </section>

        <Card className="p-0" glow>
          <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <UserAvatar user={currentUser} size="xl" />
                <div className="space-y-3">
                  <div>
                    <h2 className="font-headline text-3xl font-bold text-[#ffffff]">{currentUser.fullName}</h2>
                    <p className="text-sm text-[#cac6bc]">@{currentUser.username}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="accent">{currentUser.role}</Badge>
                    {currentUser.isFounder ? <Badge variant="bronze">Founder</Badge> : <Badge variant="outline">Creator</Badge>}
                  </div>
                </div>
              </div>

              <Button variant="secondary" size="md" icon={<Sparkles className="h-4 w-4" />}>
                Manage Portfolio
              </Button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Profile completion</div>
                <div className="mt-2 text-3xl font-bold text-[#ffffff]">{currentUser.profileCompletion}%</div>
              </div>
              <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Portfolio completion</div>
                <div className="mt-2 text-3xl font-bold text-[#ffffff]">{currentUser.portfolioCompletion}%</div>
              </div>
              <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Created</div>
                <div className="mt-2 text-sm text-[#e6e2df]">{new Date(currentUser.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Current status</div>
                <div className="mt-2 text-sm text-[#e6e2df]">{currentUser.isFounder ? 'Founder active' : 'Available for projects'}</div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8c887e]">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <p className="mt-3 text-sm text-[#e6e2df]">{currentUser.email}</p>
              </div>
              <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8c887e]">
                  <Globe className="h-4 w-4" />
                  Skills
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentUser.skills.length > 0 ? currentUser.skills.map((skill) => <Badge key={skill} variant="bronze">{skill}</Badge>) : <span className="text-sm text-[#8c887e]">No skills added yet.</span>}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8c887e]">
                <ShieldCheck className="h-4 w-4" />
                Account Notes
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#cac6bc]">
                Keep your portfolio and profile details current so recruitment and project discovery stay accurate.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};