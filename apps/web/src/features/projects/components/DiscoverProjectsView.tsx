import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  X,
  RotateCcw,
  Sparkles,
  FolderKanban,
  Briefcase,
  AlertCircle,
  Compass,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { DiscoverProjectCard } from './DiscoverProjectCard';
import type { DashboardProjectItem } from '../types';
import { fetchPublicProjects } from '../services/projectService';
import { fetchTaxonomyCategory } from '../../profile/services/taxonomyService';

const DEFAULT_GENRES = [
  'Action',
  'RPG',
  'Adventure',
  'Strategy',
  'Simulation',
  'Shooter',
  'Puzzle',
  'Horror',
  'Platformer',
  'Sci-Fi',
  'Fantasy',
];

const DEFAULT_PLATFORMS = [
  'PC / Windows',
  'PlayStation 5',
  'Xbox Series X/S',
  'Nintendo Switch',
  'macOS',
  'Linux',
  'iOS',
  'Android',
  'VR / AR',
  'Web',
];

export const DiscoverProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<DashboardProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [onlyRecruiting, setOnlyRecruiting] = useState<boolean>(false);

  const [availableGenres, setAvailableGenres] = useState<string[]>(DEFAULT_GENRES);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>(DEFAULT_PLATFORMS);

  // Fetch taxonomy categories for genres & platforms
  useEffect(() => {
    let ignore = false;
    Promise.allSettled([
      fetchTaxonomyCategory('genres', undefined, 1, 50),
      fetchTaxonomyCategory('platforms', undefined, 1, 50),
    ]).then(([genreRes, platformRes]) => {
      if (ignore) return;
      if (genreRes.status === 'fulfilled' && genreRes.value?.data?.length) {
        const names = genreRes.value.data.map((i) => i.name);
        setAvailableGenres(Array.from(new Set([...names, ...DEFAULT_GENRES])));
      }
      if (platformRes.status === 'fulfilled' && platformRes.value?.data?.length) {
        const names = platformRes.value.data.map((i) => i.name);
        setAvailablePlatforms(Array.from(new Set([...names, ...DEFAULT_PLATFORMS])));
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchPublicProjects(
        searchInput.trim() || undefined,
        selectedGenre !== 'ALL' ? selectedGenre : undefined,
        selectedPlatform !== 'ALL' ? selectedPlatform : undefined,
      );
      setProjects(res.projects || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load discover projects.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [searchInput, selectedGenre, selectedPlatform]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    if (!onlyRecruiting) return projects;
    return projects.filter(
      (p) => (p.openRoleCount ?? (p.openRoles?.length ?? 0)) > 0,
    );
  }, [projects, onlyRecruiting]);

  const hasActiveFilters =
    searchInput.trim().length > 0 ||
    selectedGenre !== 'ALL' ||
    selectedPlatform !== 'ALL' ||
    onlyRecruiting;

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedGenre('ALL');
    setSelectedPlatform('ALL');
    setOnlyRecruiting(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-pantheon-border bg-pantheon-low px-3 py-1 text-xs font-mono text-pantheon-ivory">
            <Compass className="h-3.5 w-3.5 text-pantheon-dim" />
            Studio Productions
          </span>
          <span className="text-xs font-mono text-pantheon-dim">
            LIVE CATALOGUE
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-pantheon-ivory tracking-tight">
              Discover Projects
            </h1>
            <p className="mt-1 text-sm text-pantheon-muted max-w-2xl leading-relaxed">
              Explore active game studio productions, playable prototypes, and open roles seeking talent across the community.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-pantheon-border bg-pantheon-low p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Query Input */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-pantheon-dim" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, genre, game engine, or keywords..."
              className="w-full rounded-xl border border-pantheon-border bg-pantheon-bg pl-10 pr-9 py-2.5 text-xs text-pantheon-ivory placeholder-pantheon-dim focus:border-pantheon-border-light focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-pantheon-dim hover:text-pantheon-ivory transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Genre Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full rounded-xl border border-pantheon-border bg-pantheon-bg px-3 py-2.5 text-xs text-pantheon-ivory focus:border-pantheon-border-light focus:outline-none"
            >
              <option value="ALL">All Genres</option>
              {availableGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Platform Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full rounded-xl border border-pantheon-border bg-pantheon-bg px-3 py-2.5 text-xs text-pantheon-ivory focus:border-pantheon-border-light focus:outline-none"
            >
              <option value="ALL">All Platforms</option>
              {availablePlatforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-Filters / Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-pantheon-border/60">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyRecruiting(!onlyRecruiting)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono transition-colors ${
                onlyRecruiting
                  ? 'border-amber-500/60 bg-amber-950/40 text-amber-200 font-bold'
                  : 'border-pantheon-border bg-pantheon-bg text-pantheon-muted hover:border-pantheon-border-light hover:text-pantheon-ivory'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5 text-amber-400" />
              <span>Hiring / Open Roles Only</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-xs font-mono text-pantheon-dim hover:text-pantheon-ivory transition-colors px-2 py-1"
              >
                <X className="h-3 w-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="text-xs font-mono text-pantheon-dim">
            {!isLoading && (
              <span>
                {filteredProjects.length}{' '}
                {filteredProjects.length === 1 ? 'project found' : 'projects found'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-pantheon-border bg-pantheon-low overflow-hidden animate-pulse h-96 flex flex-col justify-between"
            >
              <div className="aspect-video w-full bg-pantheon-high" />
              <div className="p-5 space-y-3 flex-1">
                <div className="h-5 w-3/4 bg-pantheon-high rounded-md" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-full bg-pantheon-high rounded-md" />
                  <div className="h-3.5 w-5/6 bg-pantheon-high rounded-md" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-4 w-16 bg-pantheon-high rounded" />
                  <div className="h-4 w-20 bg-pantheon-high rounded" />
                </div>
              </div>
              <div className="border-t border-pantheon-border px-5 py-3 h-12 bg-pantheon-bg/40" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/40 bg-red-900/30">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-pantheon-ivory">
              Failed to load discovery projects
            </h3>
            <p className="max-w-md mx-auto mt-1 text-xs text-pantheon-muted leading-relaxed">
              {error}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadProjects}
            icon={<RotateCcw className="h-4 w-4" />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredProjects.length === 0 && (
        <div className="rounded-3xl border border-pantheon-border bg-pantheon-low p-10 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-pantheon-border bg-pantheon-bg">
            <FolderKanban className="h-6 w-6 text-pantheon-dim" />
          </div>
          <div className="space-y-1">
            <h3 className="font-headline text-lg font-bold text-pantheon-ivory">
              No matching projects found
            </h3>
            <p className="max-w-md mx-auto text-xs text-pantheon-muted leading-relaxed">
              {hasActiveFilters
                ? 'We could not find any published game projects matching your search criteria. Try clearing or relaxing your filters.'
                : 'There are currently no published game projects on Pantheon. Be the first to publish a game studio project!'}
            </p>
          </div>

          {hasActiveFilters ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
              icon={<RotateCcw className="h-4 w-4" />}
            >
              Clear Filters
            </Button>
          ) : (
            <a href="/dashboard">
              <Button
                variant="primary"
                size="sm"
                icon={<Sparkles className="h-4 w-4" />}
              >
                Go to Workspace
              </Button>
            </a>
          )}
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <DiscoverProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};
