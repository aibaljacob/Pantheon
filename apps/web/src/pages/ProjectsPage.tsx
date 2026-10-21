import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Compass, FolderKanban, Crown } from 'lucide-react';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { DashboardProjectsSection } from '../features/dashboard/components/DashboardProjectsSection';
import { DiscoverProjectsView } from '../features/projects/components/DiscoverProjectsView';
import { Button } from '../components/ui/Button';
import { CreateProjectModal } from '../features/profile/components/CreateProjectModal';
import { fetchUserDashboardProjects } from '../features/projects/services/projectService';
import type { DashboardProjectItem } from '../features/projects/types';

export const ProjectsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'mine' ? 'mine' : 'discover';

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [myProjectsCount, setMyProjectsCount] = useState<number | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let ignore = false;

    fetchUserDashboardProjects(accessToken)
      .then((res) => {
        if (!ignore) {
          setMyProjectsCount(res.projects?.length ?? 0);
        }
      })
      .catch(() => {
        // Non-blocking
      });

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  const handleTabChange = (tab: 'discover' | 'mine') => {
    setSearchParams({ tab });
  };

  const handleProjectCreated = (newProject: DashboardProjectItem) => {
    setIsCreateModalOpen(false);
    setMyProjectsCount((prev) => (prev !== null ? prev + 1 : 1));
    navigate(`/projects/${newProject.id}`);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Unified Projects Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pantheon-border bg-pantheon-low px-3 py-1 text-xs font-mono text-pantheon-ivory">
              <FolderKanban className="h-3.5 w-3.5 text-pantheon-dim" />
              Studio Directory
            </span>
            <span className="text-xs font-mono text-pantheon-dim">
              LIVE PRODUCTIONS
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-headline text-3xl sm:text-4xl font-bold text-pantheon-ivory tracking-tight">
                Projects
              </h1>
              <p className="mt-1 text-sm text-pantheon-muted max-w-2xl leading-relaxed">
                Discover active studio productions and open talent roles across the Pantheon ecosystem, or filter into your own studio projects.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                icon={<Crown className="h-3.5 w-3.5 text-amber-400" />}
              >
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* View / Filter Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pantheon-border pb-4">
          <div className="inline-flex items-center p-1 rounded-2xl border border-pantheon-border bg-pantheon-low">
            <button
              type="button"
              onClick={() => handleTabChange('discover')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                currentTab === 'discover'
                  ? 'bg-pantheon-high text-pantheon-ivory border border-pantheon-border font-bold shadow-md'
                  : 'text-pantheon-muted hover:text-pantheon-ivory hover:bg-pantheon-mid'
              }`}
            >
              <Compass className={`h-4 w-4 ${currentTab === 'discover' ? 'text-amber-400' : 'text-pantheon-dim'}`} />
              <span>Discover Projects</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('mine')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                currentTab === 'mine'
                  ? 'bg-pantheon-high text-pantheon-ivory border border-pantheon-border font-bold shadow-md'
                  : 'text-pantheon-muted hover:text-pantheon-ivory hover:bg-pantheon-mid'
              }`}
            >
              <FolderKanban className={`h-4 w-4 ${currentTab === 'mine' ? 'text-amber-400' : 'text-pantheon-dim'}`} />
              <span>My Projects</span>
              {myProjectsCount !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    currentTab === 'mine'
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                      : 'bg-pantheon-bg text-pantheon-dim'
                  }`}
                >
                  {myProjectsCount}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs font-mono text-pantheon-dim">
            {currentTab === 'discover'
              ? 'Exploring community productions & open talent roles'
              : 'Viewing your founded and joined studio productions'}
          </div>
        </div>

        {/* Content View */}
        {currentTab === 'mine' ? (
          <DashboardProjectsSection
            showHeader={false}
            showViewAllLink={false}
            onSwitchToDiscover={() => handleTabChange('discover')}
            onProjectsLoaded={(count) => setMyProjectsCount(count)}
          />
        ) : (
          <DiscoverProjectsView
            showHeader={false}
            onSwitchToMyProjects={() => handleTabChange('mine')}
          />
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleProjectCreated}
      />
    </DashboardLayout>
  );
};

export default ProjectsPage;
