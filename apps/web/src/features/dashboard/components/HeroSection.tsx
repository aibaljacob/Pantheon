import React from 'react';
import { ArrowRight, BriefcaseBusiness, Crown, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import type { DashboardUser } from '../types';
import { featuredProject } from '../mockDashboardData';
import { ContinueProjectCard } from './ContinueProjectCard';
import { EmptyState } from './EmptyState';

interface HeroSectionProps {
  user: DashboardUser;
  onBecomeFounder?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ user, onBecomeFounder }) => {
  const hasProjectAccess = (user.projectsCount ?? 0) > 0;

  return (
    <section id="overview" className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          <Sparkles className="h-3.5 w-3.5" />
          Game Production Workspace
        </Badge>
        <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Welcome back, {user.firstName}</span>
      </div>

      <Card className="p-0" glow>
        <div className="rounded-3xl border border-[#48473f] bg-gradient-to-br from-[#201f1e] via-[#1c1b1a] to-[#141312] p-6 md:p-8 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-[0.28em] text-[#8c887e]">Continue Working</p>
                <h1 className="max-w-2xl font-headline text-4xl font-bold tracking-tight text-[#ffffff] md:text-5xl lg:text-6xl">Continue where you left off.</h1>
                <p className="max-w-2xl text-base leading-relaxed text-[#cac6bc] md:text-lg">Your studio pipeline is live, your recommendations are ready, and your next milestone is already waiting.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" />}>Continue Project</Button>
                <Button variant="secondary" size="lg" icon={<BriefcaseBusiness className="h-4 w-4" />}>Browse Projects</Button>
                <Button variant="secondary" size="lg" onClick={onBecomeFounder} icon={<Crown className="h-4 w-4" />}>Become a Founder</Button>
              </div>
            </div>

            <div>
              {hasProjectAccess ? (
                <ContinueProjectCard project={featuredProject} memberName={user.fullName} />
              ) : (
                <EmptyState
                  title="No active projects yet"
                  description="Browse the Discover feed to join an existing production or start your own founder journey."
                  actionLabel="Browse Projects"
                  secondaryActionLabel="Become a Founder"
                />
              )}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};