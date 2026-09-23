import React from 'react';
import { ShieldCheck, Trash2, UserCog, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ThemeSwitcher } from '../features/theme/ThemeSwitcher';

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
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-pantheon-dim">Settings</p>
          <h1 className="font-headline text-4xl font-bold text-pantheon-ivory">Workspace preferences</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-pantheon-muted">
            Personalize your workspace theme, studio lighting ambiance, account credentials, and security configurations.
          </p>
        </section>

        {/* Studio Theme & Lighting Preferences */}
        <Card className="p-0">
          <div className="rounded-3xl border border-pantheon-border bg-pantheon-low p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-pantheon-ivory" />
                <div>
                  <h2 className="font-headline text-2xl font-bold text-pantheon-ivory">Studio Appearance & Lighting</h2>
                  <p className="text-xs text-pantheon-muted mt-0.5">
                    Switch between Cinematic Noir and Cinematic Daylight themes. Preferences persist across all sessions.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <ThemeSwitcher variant="segmented" />
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Account Card */}
          <Card className="p-0">
            <div className="rounded-3xl border border-pantheon-border bg-pantheon-low p-6">
              <div className="flex items-center gap-3">
                <UserCog className="h-5 w-5 text-pantheon-ivory" />
                <h2 className="font-headline text-2xl font-bold text-pantheon-ivory">Account</h2>
              </div>

              <div className="mt-5 space-y-4 text-sm text-pantheon-muted">
                <div className="rounded-2xl border border-pantheon-border-dark bg-pantheon-bg p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-pantheon-dim">Username</div>
                  <div className="mt-2 text-pantheon-ivory">@{currentUser.username}</div>
                </div>
                <div className="rounded-2xl border border-pantheon-border-dark bg-pantheon-bg p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-pantheon-dim">Session persistence</div>
                  <div className="mt-2 text-pantheon-ivory">{rememberMe ? 'Remember me enabled' : 'Session stored for the browser session'}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Card */}
          <Card className="p-0">
            <div className="rounded-3xl border border-pantheon-border bg-pantheon-low p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-pantheon-ivory" />
                <h2 className="font-headline text-2xl font-bold text-pantheon-ivory">Security</h2>
              </div>

              <div className="mt-5 space-y-4 text-sm text-pantheon-muted">
                <div className="rounded-2xl border border-pantheon-border-dark bg-pantheon-bg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-pantheon-dim">Refresh token support</div>
                      <div className="mt-2 text-pantheon-ivory">Architecture is ready for future backend refresh flow.</div>
                    </div>
                    <Badge variant="bronze">Ready</Badge>
                  </div>
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