import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../auth/services/httpClient';

interface SearchProject {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface SearchTask {
  id: string;
  title: string;
  taskNumber: number;
  status: string;
  projectId: string;
  project: { slug: string };
}

interface SearchUser {
  id: string;
  username: string;
  profile?: {
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

interface SearchResults {
  projects: SearchProject[];
  tasks: SearchTask[];
  users: SearchUser[];
}

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const response = await apiClient.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`);
          setResults(response.data);
        } catch (err) {
          console.error('Search failed', err);
        } finally {
          setLoading(false);
        }
      })();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="relative hidden flex-1 items-center lg:flex" ref={containerRef}>
      <Search className="pointer-events-none absolute left-4 h-4 w-4 text-pantheon-dim" />
      <input
        type="search"
        value={query}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          if (!val.trim()) {
            setResults(null);
          }
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        aria-label="Global search"
        placeholder="Search projects, tasks, people, assets..."
        className="h-12 w-full rounded-2xl border border-pantheon-border bg-pantheon-low pl-11 pr-28 text-sm text-pantheon-ivory placeholder:text-pantheon-dim focus:border-pantheon-border-light focus:outline-none focus:ring-2 focus:ring-pantheon-border/40"
      />
      <span className="pointer-events-none absolute right-4 rounded-full border border-pantheon-border bg-pantheon-bg px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-pantheon-dim">
        Cmd+K
      </span>

      {isOpen && query.trim() && (
        <div className="absolute top-14 left-0 w-full rounded-2xl border border-pantheon-border bg-pantheon-low shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-pantheon-dim" />
            </div>
          )}

          {!loading && results && (
            <div className="flex flex-col py-2">
              {results.projects?.length > 0 && (
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-pantheon-dim uppercase mb-1">Projects</h3>
                  {results.projects.map((project) => (
                    <div
                      key={project.id}
                      className="cursor-pointer rounded-lg px-2 py-1 hover:bg-pantheon-mid text-sm text-pantheon-ivory"
                      onClick={() => handleSelect(`/projects/${project.slug}`)}
                    >
                      {project.name}
                    </div>
                  ))}
                </div>
              )}

              {results.tasks?.length > 0 && (
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-pantheon-dim uppercase mb-1">Tasks</h3>
                  {results.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="cursor-pointer rounded-lg px-2 py-1 hover:bg-pantheon-mid text-sm text-pantheon-ivory"
                      onClick={() => handleSelect(`/projects/${task.project.slug}?tab=tasks`)}
                    >
                      <span className="text-pantheon-dim mr-2">TASK-{task.taskNumber}</span>
                      {task.title}
                    </div>
                  ))}
                </div>
              )}

              {results.users?.length > 0 && (
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-pantheon-dim uppercase mb-1">Users</h3>
                  {results.users.map((u) => (
                    <div
                      key={u.id}
                      className="cursor-pointer rounded-lg px-2 py-1 hover:bg-pantheon-mid text-sm text-pantheon-ivory"
                      onClick={() => handleSelect(`/u/${u.username}`)}
                    >
                      {u.profile?.displayName || u.username} <span className="text-xs text-pantheon-dim">@{u.username}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.projects?.length === 0 && results.tasks?.length === 0 && results.users?.length === 0 && (
                <div className="px-4 py-4 text-center text-sm text-pantheon-dim">
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
