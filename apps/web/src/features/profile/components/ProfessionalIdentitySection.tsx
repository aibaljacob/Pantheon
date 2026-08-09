import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import type { ProfessionalIdentity } from '../types';

interface ProfessionalIdentitySectionProps {
  identity: ProfessionalIdentity;
}

interface TagGroupProps {
  title: string;
  items: string[];
  variant?: 'default' | 'outline' | 'accent' | 'bronze';
}

const TagGroup: React.FC<TagGroupProps> = ({ title, items, variant = 'bronze' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <Badge key={`${title}-${item}-${idx}`} variant={variant} className="normal-case font-mono text-xs">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export const ProfessionalIdentitySection: React.FC<ProfessionalIdentitySectionProps> = ({ identity }) => {
  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
        <h2 className="font-headline text-lg font-bold text-[#ffffff] tracking-wide">
          Professional Identity
        </h2>
        <span className="text-xs font-mono text-[#8c887e]">Capabilities</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagGroup title="Primary Roles" items={identity.roles} variant="accent" />
        <TagGroup title="Specializations" items={identity.specializations} variant="accent" />
        <TagGroup title="Game Engines" items={identity.gameEngines} variant="bronze" />
        <TagGroup title="Technical Skills" items={identity.skills} variant="bronze" />
        <TagGroup title="Tools & Software" items={identity.tools} variant="outline" />
        <TagGroup title="Platform Experience" items={identity.platforms} variant="outline" />
        <TagGroup title="Preferred Genres" items={identity.genres} variant="default" />
      </div>
    </Card>
  );
};
