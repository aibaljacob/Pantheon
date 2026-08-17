import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowRight, Crown, Sparkles, Users, FolderKanban } from 'lucide-react';

interface FounderCardProps {
  onOpen?: () => void;
}

export const FounderCard: React.FC<FounderCardProps> = ({ onOpen }) => {
  return (
    <section id="founder" className="space-y-4">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">
          Founder / Studio Section
        </p>
        <h2 className="mt-2 font-headline text-2xl font-bold text-[#ffffff]">Become a founder</h2>
      </div>
      <Card className="p-0" glow>
        <div className="rounded-3xl border border-[#48473f] bg-[#1c1b1a] p-6 md:p-8">
          <Badge variant="accent" className="mb-4">
            <Crown className="h-3.5 w-3.5" />
            Founder Mode
          </Badge>
          <div className="space-y-4">
            <h3 className="font-headline text-2xl font-bold text-[#ffffff]">
              Turn your profile into a studio command center.
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-[#cac6bc]">
              Founders can publish projects, review applicants, shape recruitment pipelines, and coordinate production from one premium workspace.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
              <Sparkles className="h-4 w-4 text-[#e6e2df]" />
              <p className="mt-3 text-sm font-semibold text-[#ffffff]">Launch a studio identity</p>
            </div>
            <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
              <Users className="h-4 w-4 text-[#e6e2df]" />
              <p className="mt-3 text-sm font-semibold text-[#ffffff]">Manage applicants and team size</p>
            </div>
            <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
              <FolderKanban className="h-4 w-4 text-[#e6e2df]" />
              <p className="mt-3 text-sm font-semibold text-[#ffffff]">Centralize project operations</p>
            </div>
          </div>
          <div className="mt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={onOpen}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Become a Founder
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
};