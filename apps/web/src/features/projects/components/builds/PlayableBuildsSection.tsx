import React from 'react';
import {
  Download,
  Package,
  Flag,
  Calendar,
  FileCode,
  HardDrive,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { PlayableBuildItem } from '../../types';

interface PlayableBuildsSectionProps {
  playableBuilds: PlayableBuildItem[];
  onOpenRegisterModal?: () => void;
  isFounderOrAdmin: boolean;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

export const PlayableBuildsSection: React.FC<PlayableBuildsSectionProps> = ({
  playableBuilds,
  onOpenRegisterModal,
  isFounderOrAdmin,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
        <div className="flex items-center gap-2.5">
          <Package className="h-4 w-4 text-amber-400" />
          <h3 className="font-headline text-base font-bold text-[#ffffff]">
            Playable Releases & Packages
          </h3>
          <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-2 py-0.2 text-[10px] font-mono text-[#cac6bc]">
            {playableBuilds.length}
          </span>
        </div>

        {isFounderOrAdmin && onOpenRegisterModal && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenRegisterModal}
            icon={<Package className="h-3.5 w-3.5" />}
          >
            Register Release
          </Button>
        )}
      </div>

      {playableBuilds.length === 0 ? (
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-8 text-center space-y-2">
          <Package className="mx-auto h-8 w-8 text-[#66645c]" />
          <p className="text-xs font-mono text-[#cac6bc] font-semibold">
            No playable builds released yet.
          </p>
          <p className="text-[11px] font-mono text-[#8c887e]">
            When automated build jobs succeed, verified game packages and executable zips will appear here for playtesting.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {playableBuilds.map((pb) => {
            const hasArtifact = Boolean(pb.storagePath);

            return (
              <div
                key={pb.id}
                className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 sm:p-5 space-y-3 transition-all hover:border-[#363433]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="rounded-md border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                        {pb.version}
                      </span>
                      <h4 className="font-headline text-base font-bold text-[#ffffff]">
                        {pb.title}
                      </h4>
                      <span className="rounded-md border border-[#363433] bg-[#1c1b1a] px-2 py-0.5 text-[11px] font-mono text-[#cac6bc]">
                        {pb.platform}
                      </span>
                    </div>

                    {pb.releaseNotes && (
                      <p className="mt-1.5 text-xs font-mono text-[#cac6bc] leading-relaxed">
                        {pb.releaseNotes}
                      </p>
                    )}
                  </div>

                  {/* Download Action */}
                  <div className="flex items-center gap-2">
                    {hasArtifact ? (
                      <a
                        href={pb.storagePath || '#'}
                        download
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-950/30 px-3.5 py-1.5 text-xs font-mono font-semibold text-amber-300 hover:bg-amber-900/40 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Build</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-[11px] font-mono text-[#8c887e]">
                        <AlertCircle className="h-3.5 w-3.5 text-[#8c887e]" />
                        <span>Artifact pending packaging</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center gap-4 text-[11px] font-mono text-[#8c887e] border-t border-[#201f1e] pt-2.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-[#66645c]" />
                    <span>{formatBytes(pb.fileSizeBytes)}</span>
                  </div>

                  {pb.fileChecksum && (
                    <div className="flex items-center gap-1 truncate max-w-xs" title={pb.fileChecksum}>
                      <FileCode className="h-3 w-3 text-[#66645c]" />
                      <span className="truncate">Checksum: {pb.fileChecksum}</span>
                    </div>
                  )}

                  {pb.milestone && (
                    <div className="flex items-center gap-1 text-amber-300/80">
                      <Flag className="h-3 w-3 text-amber-400" />
                      <span>{pb.milestone.title}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-[#66645c]">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(pb.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
