import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, FolderKanban } from 'lucide-react';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { DashboardProjectsSection } from '../features/dashboard/components/DashboardProjectsSection';
import { DiscoverProjectsView } from '../features/projects/components/DiscoverProjectsView';

export const ProjectsPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'mine' ? 'mine' : 'discover';

  if (!currentUser) {
    return null;
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-pantheon-border pb-4">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'discover' })}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-colors ${
              currentTab === 'discover'
                ? 'bg-pantheon-high text-pantheon-ivory border border-pantheon-border font-bold shadow-md'
                : 'text-pantheon-muted hover:text-pantheon-ivory hover:bg-pantheon-low'
            }`}
          >
            <Compass className="h-4 w-4 text-amber-400" />
            <span>Discover Studios</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'mine' })}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-colors ${
              currentTab === 'mine'
                ? 'bg-pantheon-high text-pantheon-ivory border border-pantheon-border font-bold shadow-md'
                : 'text-pantheon-muted hover:text-pantheon-ivory hover:bg-pantheon-low'
            }`}
          >
            <FolderKanban className="h-4 w-4 text-pantheon-dim" />
            <span>My Productions</span>
          </button>
        </div>

        {/* Tab Content */}
        {currentTab === 'discover' ? (
          <DiscoverProjectsView />
        ) : (
          <DashboardProjectsSection
            showViewAllLink={false}
            headerTitle="Production Portfolio"
            headerSubtitle="All Studio Projects"
          />
        )}
      </div>
    </DashboardLayout>
  );
};