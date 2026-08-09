import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ExternalLink, Globe, Plus, Trash2, Edit2, Gamepad, Sparkles, Code2 } from 'lucide-react';
import type { ProfileLink } from '../types';

interface LinksSectionProps {
  links: ProfileLink[];
  isOwner: boolean;
  onAddLink?: () => void;
  onEditLink?: (link: ProfileLink) => void;
  onDeleteLink?: (id: string) => void;
}

export const LinksSection: React.FC<LinksSectionProps> = ({
  links,
  isOwner,
  onAddLink,
  onEditLink,
  onDeleteLink,
}) => {
  const getLinkIcon = (platform: ProfileLink['platform']) => {
    switch (platform) {
      case 'github':
        return <Code2 className="h-4 w-4 text-[#e6e2df]" />;
      case 'linkedin':
        return <Globe className="h-4 w-4 text-sky-400" />;
      case 'artstation':
        return <Sparkles className="h-4 w-4 text-emerald-400" />;
      case 'itchio':
      case 'steam':
        return <Gamepad className="h-4 w-4 text-amber-400" />;
      case 'website':
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
        <div>
          <h2 className="font-headline text-base font-bold text-[#ffffff]">Professional Links</h2>
          <p className="text-[11px] text-[#8c887e]">External profiles & portfolios</p>
        </div>

        {isOwner && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddLink}
            icon={<Plus className="h-3.5 w-3.5" />}
            iconPosition="left"
          >
            Add Link
          </Button>
        )}
      </div>

      {links.length === 0 ? (
        <p className="text-xs text-[#8c887e] italic py-2">No external links added.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="group flex items-center justify-between rounded-xl border border-[#2b2a29] bg-[#141312] p-3 transition-colors hover:border-[#363433]"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 min-w-0 flex-1 hover:text-[#ffffff] transition-colors"
              >
                <div className="rounded-lg bg-[#201f1e] p-2 text-[#cac6bc] group-hover:text-[#ffffff]">
                  {getLinkIcon(link.platform)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-mono font-semibold text-[#e6e2df] group-hover:text-[#ffffff]">
                    {link.displayName}
                  </p>
                  <p className="truncate text-[10px] font-mono text-[#8c887e]">
                    {link.url.replace(/^https?:\/\//, '')}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-[#8c887e] opacity-0 group-hover:opacity-100 transition-opacity mr-2" />
              </a>

              {isOwner && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditLink && (
                    <button
                      type="button"
                      onClick={() => onEditLink(link)}
                      className="p-1 text-[#8c887e] hover:text-[#e6e2df]"
                      title="Edit link"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  )}
                  {onDeleteLink && (
                    <button
                      type="button"
                      onClick={() => onDeleteLink(link.id)}
                      className="p-1 text-[#8c887e] hover:text-red-400"
                      title="Delete link"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
