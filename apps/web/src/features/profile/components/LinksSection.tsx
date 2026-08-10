import React from 'react';
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
        return <Code2 className="h-3.5 w-3.5 text-[#e6e2df]" />;
      case 'linkedin':
        return <Globe className="h-3.5 w-3.5 text-sky-400" />;
      case 'artstation':
        return <Sparkles className="h-3.5 w-3.5 text-emerald-400" />;
      case 'itchio':
      case 'steam':
        return <Gamepad className="h-3.5 w-3.5 text-amber-400" />;
      case 'website':
      default:
        return <Globe className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a]/60 p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-[#8c887e]">Links & Profiles</span>
        {isOwner && (
          <button
            type="button"
            onClick={onAddLink}
            className="text-xs font-mono text-[#cac6bc] hover:text-[#ffffff] flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>Add</span>
          </button>
        )}
      </div>

      {links.length === 0 ? (
        <p className="text-xs font-mono text-[#8c887e] italic">No links added.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-[#363433] bg-[#141312] px-2.5 py-1.5 font-mono text-xs text-[#e6e2df] hover:border-[#48473f] transition-colors"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#ffffff]"
              >
                {getLinkIcon(link.platform)}
                <span>{link.displayName}</span>
                <ExternalLink className="h-3 w-3 text-[#8c887e] group-hover:text-[#e6e2df]" />
              </a>

              {isOwner && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 border-l border-[#2b2a29] pl-1">
                  {onEditLink && (
                    <button
                      type="button"
                      onClick={() => onEditLink(link)}
                      className="text-[#8c887e] hover:text-[#e6e2df]"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                  {onDeleteLink && (
                    <button
                      type="button"
                      onClick={() => onDeleteLink(link.id)}
                      className="text-[#8c887e] hover:text-red-400"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
