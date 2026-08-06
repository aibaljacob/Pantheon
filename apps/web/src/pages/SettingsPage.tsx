import React from 'react';
import { MoonStar, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const logoutSession = useAuthStore((state) => state.logoutSession);
  const rememberMe = useAuthStore((state) => state.rememberMe);

  if (!currentUser) {
    return null;
  }

  const handleLogout = async () => {
    await logoutSession();
    navigate('/login', { replace: true });
  };

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-10">
        <section className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Settings</p>
          <h1 className="font-headline text-4xl font-bold text-[#ffffff]">Workspace preferences</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[#cac6bc]">
            Adjust account settings and security preferences for your Pantheon workspace.
          </p>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="p-0">
            <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6">
              <div className="flex items-center gap-3">
                <UserCog className="h-5 w-5 text-[#e6e2df]" />
                <h2 className="font-headline text-2xl font-bold text-[#ffffff]">Account</h2>
              </div>

              <div className="mt-5 space-y-4 text-sm text-[#cac6bc]">
                <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Username</div>
                  <div className="mt-2 text-[#e6e2df]">@{currentUser.username}</div>
                </div>
                <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Session persistence</div>
                  <div className="mt-2 text-[#e6e2df]">{rememberMe ? 'Remember me enabled' : 'Session stored for the browser session'}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-0">
            <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#e6e2df]" />
                <h2 className="font-headline text-2xl font-bold text-[#ffffff]">Security</h2>
              </div>

              <div className="mt-5 space-y-4 text-sm text-[#cac6bc]">
                <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Refresh token support</div>
                      <div className="mt-2 text-[#e6e2df]">Architecture is ready for future backend refresh flow.</div>
                    </div>
                    <Badge variant="bronze">Ready</Badge>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Theme</div>
                  <div className="mt-2 flex items-center gap-2 text-[#e6e2df]"><MoonStar className="h-4 w-4" /> Dark-first workspace</div>
                </div>
              </div>

              <div className="mt-6">
                <Button variant="secondary" size="md" icon={<Trash2 className="h-4 w-4" />} onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};