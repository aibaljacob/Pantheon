import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FolderKanban,
  Tags,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RotateCcw,
  UserCheck,
  X,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import type { AuthUser } from '../../auth/types';
import { useAuthStore } from '../../auth/store/authStore';
import { DashboardLayout } from '../../dashboard/components/DashboardLayout';
import {
  fetchAdminDashboardMetrics,
  fetchAdminUsers,
  fetchAdminProjects,
  approveAdminProject,
  rejectAdminProject,
  fetchAdminTaxonomy,
  fetchAdminActivity,
  createAdminTaxonomyEntry,
  updateAdminTaxonomyEntry,
  toggleAdminTaxonomyActive,
  type AdminDashboardMetrics,
  type AdminUserItem,
  type AdminProjectItem,
  type AdminTaxonomyItem,
  type AdminActivityItem,
} from '../services/adminService';

interface AdminDashboardPageProps {
  user: AuthUser;
}

type TabType = 'overview' | 'users' | 'projects' | 'taxonomy';

const TAXONOMY_TYPES = [
  { id: 'roles', label: 'Professional Roles' },
  { id: 'specializations', label: 'Specializations' },
  { id: 'skills', label: 'Skills' },
  { id: 'tools', label: 'Tools' },
  { id: 'game-engines', label: 'Game Engines' },
  { id: 'genres', label: 'Genres' },
  { id: 'platforms', label: 'Platforms' },
];

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ user }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Metrics State
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Users Tab State
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserItem | null>(null);

  // Projects Tab State
  const [projects, setProjects] = useState<AdminProjectItem[]>([]);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsSearch, setProjectsSearch] = useState('');
  const [projectsStatusFilter, setProjectsStatusFilter] = useState('');
  const [projectsModerationFilter, setProjectsModerationFilter] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<AdminProjectItem | null>(null);

  // Taxonomy Tab State
  const [activeTaxonomyType, setActiveTaxonomyType] = useState('roles');
  const [taxonomyItems, setTaxonomyItems] = useState<AdminTaxonomyItem[]>([]);
  const [taxonomyTotal, setTaxonomyTotal] = useState(0);
  const [taxonomyPage, setTaxonomyPage] = useState(1);
  const [taxonomySearch, setTaxonomySearch] = useState('');
  const [taxonomyLoading, setTaxonomyLoading] = useState(false);

  // Taxonomy Modal State
  const [isAddTaxonomyOpen, setIsAddTaxonomyOpen] = useState(false);
  const [newTaxonomyName, setNewTaxonomyName] = useState('');
  const [newTaxonomyDesc, setNewTaxonomyDesc] = useState('');
  const [editingTaxonomyItem, setEditingTaxonomyItem] = useState<AdminTaxonomyItem | null>(null);
  const [editTaxonomyName, setEditTaxonomyName] = useState('');
  const [editTaxonomyDesc, setEditTaxonomyDesc] = useState('');
  const [taxonomyActionLoading, setTaxonomyActionLoading] = useState(false);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);

  // Activity Stream State
  const [activity, setActivity] = useState<AdminActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Load Overview Metrics
  const loadMetrics = async () => {
    if (!accessToken) return;
    setMetricsLoading(true);
    try {
      const res = await fetchAdminDashboardMetrics(accessToken);
      setMetrics(res);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Load Users List
  const loadUsers = async () => {
    if (!accessToken) return;
    setUsersLoading(true);
    try {
      const res = await fetchAdminUsers(accessToken, {
        page: usersPage,
        limit: 10,
        search: usersSearch,
        role: usersRoleFilter,
      });
      setUsers(res.users);
      setUsersTotal(res.total);
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load Projects List
  const loadProjects = async () => {
    if (!accessToken) return;
    setProjectsLoading(true);
    try {
      const res = await fetchAdminProjects(accessToken, {
        page: projectsPage,
        limit: 10,
        search: projectsSearch,
        status: projectsStatusFilter,
        moderationStatus: projectsModerationFilter,
      });
      setProjects(res.projects);
      setProjectsTotal(res.total);
    } catch (err) {
      console.error('Failed to load admin projects:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleApproveProject = async (projectId: string) => {
    if (!accessToken) return;
    try {
      await approveAdminProject(accessToken, projectId);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, moderationStatus: 'PUBLISHED' } : p)),
      );
      if (selectedProjectDetail?.id === projectId) {
        setSelectedProjectDetail((prev) => (prev ? { ...prev, moderationStatus: 'PUBLISHED' } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve project.');
    }
  };

  const handleRejectProject = async (projectId: string) => {
    if (!accessToken) return;
    try {
      await rejectAdminProject(accessToken, projectId);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, moderationStatus: 'REJECTED' } : p)),
      );
      if (selectedProjectDetail?.id === projectId) {
        setSelectedProjectDetail((prev) => (prev ? { ...prev, moderationStatus: 'REJECTED' } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject project.');
    }
  };

  // Load Taxonomy List
  const loadTaxonomy = async () => {
    if (!accessToken) return;
    setTaxonomyLoading(true);
    try {
      const res = await fetchAdminTaxonomy(accessToken, activeTaxonomyType, {
        page: taxonomyPage,
        limit: 15,
        search: taxonomySearch,
      });
      setTaxonomyItems(res.items);
      setTaxonomyTotal(res.total);
    } catch (err) {
      console.error('Failed to load taxonomy items:', err);
    } finally {
      setTaxonomyLoading(false);
    }
  };

  // Load Recent Activity Stream
  const loadActivity = async () => {
    if (!accessToken) return;
    setActivityLoading(true);
    try {
      const res = await fetchAdminActivity(accessToken);
      setActivity(res);
    } catch (err) {
      console.error('Failed to load activity stream:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    loadActivity();
  }, [accessToken]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [accessToken, activeTab, usersPage, usersSearch, usersRoleFilter]);

  useEffect(() => {
    if (activeTab === 'projects') loadProjects();
  }, [accessToken, activeTab, projectsPage, projectsSearch, projectsStatusFilter]);

  useEffect(() => {
    if (activeTab === 'taxonomy') loadTaxonomy();
  }, [accessToken, activeTab, activeTaxonomyType, taxonomyPage, taxonomySearch]);

  // Taxonomy Handlers
  const handleAddTaxonomy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newTaxonomyName.trim()) return;
    setTaxonomyActionLoading(true);
    setTaxonomyError(null);
    try {
      await createAdminTaxonomyEntry(accessToken, activeTaxonomyType, {
        name: newTaxonomyName,
        description: newTaxonomyDesc,
      });
      setNewTaxonomyName('');
      setNewTaxonomyDesc('');
      setIsAddTaxonomyOpen(false);
      loadTaxonomy();
      loadMetrics();
    } catch (err: any) {
      setTaxonomyError(err.message || 'Failed to create entry.');
    } finally {
      setTaxonomyActionLoading(false);
    }
  };

  const handleUpdateTaxonomy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !editingTaxonomyItem) return;
    setTaxonomyActionLoading(true);
    setTaxonomyError(null);
    try {
      await updateAdminTaxonomyEntry(accessToken, activeTaxonomyType, editingTaxonomyItem.id, {
        name: editTaxonomyName,
        description: editTaxonomyDesc,
      });
      setEditingTaxonomyItem(null);
      loadTaxonomy();
    } catch (err: any) {
      setTaxonomyError(err.message || 'Failed to update entry.');
    } finally {
      setTaxonomyActionLoading(false);
    }
  };

  const handleToggleTaxonomyActive = async (item: AdminTaxonomyItem) => {
    if (!accessToken) return;
    try {
      await toggleAdminTaxonomyActive(accessToken, activeTaxonomyType, item.id, !item.isActive);
      loadTaxonomy();
    } catch (err) {
      console.error('Failed to toggle taxonomy item:', err);
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Admin Operational Header */}
        <div className="rounded-3xl border border-[#48473f] bg-[#1c1b1a] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="accent" className="bg-amber-950/40 text-amber-300 border-amber-500/40">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Platform Administrator Control Surface
                </Badge>
              </div>
              <h1 className="font-headline text-3xl font-bold text-[#ffffff]">
                Pantheon Operational Control
              </h1>
              <p className="text-xs text-[#cac6bc] font-mono">
                Authenticated Admin: <span className="text-[#ffffff] font-semibold">@{user.username}</span> ({user.email})
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                loadMetrics();
                loadActivity();
                if (activeTab === 'users') loadUsers();
                if (activeTab === 'projects') loadProjects();
                if (activeTab === 'taxonomy') loadTaxonomy();
              }}
              icon={<RotateCcw className="h-3.5 w-3.5" />}
            >
              Refresh Data
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-t border-[#2b2a29] mt-6 pt-4 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#e6e2df] text-[#141312] font-semibold'
                  : 'text-[#8c887e] hover:bg-[#141312] hover:text-[#e6e2df]'
              }`}
            >
              <Activity className="h-4 w-4" />
              Overview & Metrics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-colors ${
                activeTab === 'users'
                  ? 'bg-[#e6e2df] text-[#141312] font-semibold'
                  : 'text-[#8c887e] hover:bg-[#141312] hover:text-[#e6e2df]'
              }`}
            >
              <Users className="h-4 w-4" />
              Users ({metrics ? metrics.totalUsers : '...'})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-colors ${
                activeTab === 'projects'
                  ? 'bg-[#e6e2df] text-[#141312] font-semibold'
                  : 'text-[#8c887e] hover:bg-[#141312] hover:text-[#e6e2df]'
              }`}
            >
              <FolderKanban className="h-4 w-4" />
              Projects ({metrics ? metrics.totalProjects : '...'})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('taxonomy')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-colors ${
                activeTab === 'taxonomy'
                  ? 'bg-[#e6e2df] text-[#141312] font-semibold'
                  : 'text-[#8c887e] hover:bg-[#141312] hover:text-[#e6e2df]'
              }`}
            >
              <Tags className="h-4 w-4" />
              Taxonomy Manager
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 border-[#363433] bg-[#1c1b1a]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#8c887e] uppercase">Total Users</span>
                  <Users className="h-4 w-4 text-[#e6e2df]" />
                </div>
                <div className="mt-2 text-2xl font-bold text-[#ffffff]">
                  {metricsLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#8c887e]" /> : metrics?.totalUsers}
                </div>
                <p className="text-[11px] font-mono text-[#8c887e] mt-1">
                  Registered account records
                </p>
              </Card>

              <Card className="p-5 border-[#363433] bg-[#1c1b1a]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#8c887e] uppercase">Verified Accounts</span>
                  <UserCheck className="h-4 w-4 text-[#e6e2df]" />
                </div>
                <div className="mt-2 text-2xl font-bold text-[#ffffff]">
                  {metricsLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#8c887e]" /> : metrics?.activeVerifiedUsers}
                </div>
                <p className="text-[11px] font-mono text-[#8c887e] mt-1">
                  Email-verified platform members
                </p>
              </Card>

              <Card className="p-5 border-[#363433] bg-[#1c1b1a]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#8c887e] uppercase">Platform Projects</span>
                  <FolderKanban className="h-4 w-4 text-[#e6e2df]" />
                </div>
                <div className="mt-2 text-2xl font-bold text-[#ffffff]">
                  {metricsLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#8c887e]" /> : metrics?.totalProjects}
                </div>
                <p className="text-[11px] font-mono text-[#8c887e] mt-1">
                  {metrics?.activeProjects} in active development
                </p>
              </Card>

              <Card className="p-5 border-[#363433] bg-[#1c1b1a]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#8c887e] uppercase">Taxonomy Items</span>
                  <Tags className="h-4 w-4 text-[#e6e2df]" />
                </div>
                <div className="mt-2 text-2xl font-bold text-[#ffffff]">
                  {metricsLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#8c887e]" /> : metrics?.totalTaxonomyEntries}
                </div>
                <p className="text-[11px] font-mono text-[#8c887e] mt-1">
                  Across 7 controlled categories
                </p>
              </Card>
            </div>

            {/* Live Real-Database Activity Stream */}
            <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#e6e2df]" />
                  <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                    Recent Platform Activity
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#8c887e]">Live Database Log</span>
              </div>

              {activityLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#8c887e]" />
                </div>
              ) : activity.length > 0 ? (
                <div className="space-y-3">
                  {activity.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 text-xs font-mono"
                    >
                      <div>
                        <p className="font-semibold text-[#ffffff]">{item.title}</p>
                        <p className="text-[#8c887e]">{item.description}</p>
                      </div>
                      <span className="text-[10px] text-[#8c887e] shrink-0">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-[#8c887e] text-center p-4">
                  No recent activity logged.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#363433] bg-[#1c1b1a] p-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#8c887e]" />
                <input
                  type="search"
                  placeholder="Search username, email, name..."
                  value={usersSearch}
                  onChange={(e) => {
                    setUsersSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] pl-9 pr-4 py-2 text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={usersRoleFilter}
                  onChange={(e) => {
                    setUsersRoleFilter(e.target.value);
                    setUsersPage(1);
                  }}
                  className="rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="USER">USER</option>
                  <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-3xl border border-[#363433] bg-[#1c1b1a]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-[#2b2a29] bg-[#141312] text-[#8c887e]">
                  <tr>
                    <th className="p-4 font-normal">User</th>
                    <th className="p-4 font-normal">Email</th>
                    <th className="p-4 font-normal">Global Role</th>
                    <th className="p-4 font-normal">Verified</th>
                    <th className="p-4 font-normal">Projects</th>
                    <th className="p-4 font-normal">Joined</th>
                    <th className="p-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b2a29]">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8c887e]">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : users.length > 0 ? (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#141312]/60 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.username} className="h-8 w-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-[#201f1e] border border-[#363433] flex items-center justify-center font-bold text-[#e6e2df]">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#ffffff]">@{u.username}</p>
                              {u.displayName && <p className="text-[10px] text-[#8c887e]">{u.displayName}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[#e6e2df]">{u.email}</td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${
                              u.role === 'ADMINISTRATOR'
                                ? 'bg-amber-950/50 border border-amber-500/40 text-amber-300'
                                : 'bg-[#201f1e] border border-[#363433] text-[#e6e2df]'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          {u.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#8c887e]">
                              <XCircle className="h-3.5 w-3.5" /> Unverified
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-[#cac6bc]">
                          {u.foundedProjectsCount} founded · {u.joinedProjectsCount} joined
                        </td>
                        <td className="p-4 text-[#8c887e]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedUserDetail(u)}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8c887e]">
                        No user accounts found matching query criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Server-Side Pagination Controls */}
              <div className="flex items-center justify-between border-t border-[#2b2a29] px-4 py-3 text-xs font-mono text-[#8c887e]">
                <span>
                  Showing {users.length} of {usersTotal} users
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={usersPage <= 1}
                    onClick={() => setUsersPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span>
                    Page {usersPage} of {Math.ceil(usersTotal / 10) || 1}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={usersPage >= Math.ceil(usersTotal / 10)}
                    onClick={() => setUsersPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROJECTS MANAGEMENT */}
        {activeTab === 'projects' && (
          <div className="space-y-5">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#363433] bg-[#1c1b1a] p-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#8c887e]" />
                <input
                  type="search"
                  placeholder="Search project name, genre, engine..."
                  value={projectsSearch}
                  onChange={(e) => {
                    setProjectsSearch(e.target.value);
                    setProjectsPage(1);
                  }}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] pl-9 pr-4 py-2 text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={projectsModerationFilter}
                  onChange={(e) => {
                    setProjectsModerationFilter(e.target.value);
                    setProjectsPage(1);
                  }}
                  className="rounded-xl border border-amber-500/40 bg-[#141312] px-3 py-2 text-xs text-amber-200 focus:border-amber-400 focus:outline-none"
                >
                  <option value="">All Moderation States</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <select
                  value={projectsStatusFilter}
                  onChange={(e) => {
                    setProjectsStatusFilter(e.target.value);
                    setProjectsPage(1);
                  }}
                  className="rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                >
                  <option value="">All Dev Statuses</option>
                  <option value="PLANNING">Planning</option>
                  <option value="PRE_PRODUCTION">Pre-Production</option>
                  <option value="PROTOTYPE">Prototype</option>
                  <option value="IN_DEVELOPMENT">In Development</option>
                  <option value="ALPHA">Alpha</option>
                  <option value="BETA">Beta</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>
            </div>

            {/* Projects Table */}
            <div className="overflow-x-auto rounded-3xl border border-[#363433] bg-[#1c1b1a]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-[#2b2a29] bg-[#141312] text-[#8c887e]">
                  <tr>
                    <th className="p-4 font-normal">Project</th>
                    <th className="p-4 font-normal">Founder</th>
                    <th className="p-4 font-normal">Moderation</th>
                    <th className="p-4 font-normal">Dev Status</th>
                    <th className="p-4 font-normal">Genre / Engine / Platform</th>
                    <th className="p-4 font-normal">Team</th>
                    <th className="p-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b2a29]">
                  {projectsLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8c887e]">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : projects.length > 0 ? (
                    projects.map((p) => (
                      <tr key={p.id} className="hover:bg-[#141312]/60 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {p.coverUrl ? (
                              <img src={p.coverUrl} alt={p.name} className="h-9 w-14 rounded-lg object-cover border border-[#2b2a29]" />
                            ) : (
                              <div className="h-9 w-14 rounded-lg bg-[#201f1e] border border-[#363433] flex items-center justify-center text-[10px] text-[#8c887e]">
                                No Cover
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#ffffff]">{p.name}</p>
                              <p className="text-[10px] text-[#8c887e]">/{p.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[#e6e2df]">
                          <span className="font-semibold">@{p.founderUsername}</span>
                          <span className="block text-[10px] text-[#8c887e]">{p.founderDisplayName}</span>
                        </td>
                        <td className="p-4">
                          {p.moderationStatus === 'PENDING_REVIEW' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] border border-amber-500/40 bg-amber-950/40 text-amber-300">
                              ● Pending Review
                            </span>
                          )}
                          {p.moderationStatus === 'PUBLISHED' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-500/40 bg-emerald-950/40 text-emerald-300">
                              ● Published
                            </span>
                          )}
                          {p.moderationStatus === 'REJECTED' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] border border-red-500/40 bg-red-950/40 text-red-300">
                              ● Rejected
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] border border-[#48473f] bg-[#201f1e] text-[#e6e2df]">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-[#cac6bc]">
                          {p.genre || 'N/A'} · {p.gameEngine || 'N/A'} · {p.platform || 'N/A'}
                        </td>
                        <td className="p-4 text-[#e6e2df]">{p.memberCount} members</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.moderationStatus === 'PENDING_REVIEW' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveProject(p.id)}
                                  className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectProject(p.id)}
                                  className="rounded-lg border border-red-500/40 bg-red-950/40 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-900/60 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedProjectDetail(p)}
                            >
                              Inspect
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8c887e]">
                        No platform projects found matching query criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-[#2b2a29] px-4 py-3 text-xs font-mono text-[#8c887e]">
                <span>
                  Showing {projects.length} of {projectsTotal} projects
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={projectsPage <= 1}
                    onClick={() => setProjectsPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span>
                    Page {projectsPage} of {Math.ceil(projectsTotal / 10) || 1}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={projectsPage >= Math.ceil(projectsTotal / 10)}
                    onClick={() => setProjectsPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TAXONOMY MANAGER */}
        {activeTab === 'taxonomy' && (
          <div className="space-y-6">
            {/* Category Sub-Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-[#2b2a29] pb-3">
              {TAXONOMY_TYPES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveTaxonomyType(cat.id);
                    setTaxonomyPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors shrink-0 ${
                    activeTaxonomyType === cat.id
                      ? 'bg-[#e6e2df] text-[#141312] font-semibold'
                      : 'border border-[#363433] bg-[#141312] text-[#8c887e] hover:text-[#e6e2df]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#8c887e]" />
                <input
                  type="search"
                  placeholder="Search entries..."
                  value={taxonomySearch}
                  onChange={(e) => {
                    setTaxonomySearch(e.target.value);
                    setTaxonomyPage(1);
                  }}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] pl-9 pr-4 py-2 text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddTaxonomyOpen(true)}
                icon={<Plus className="h-3.5 w-3.5" />}
              >
                Add Controlled Entry
              </Button>
            </div>

            {/* Taxonomy List */}
            <div className="overflow-x-auto rounded-3xl border border-[#363433] bg-[#1c1b1a]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-[#2b2a29] bg-[#141312] text-[#8c887e]">
                  <tr>
                    <th className="p-4 font-normal">Name</th>
                    <th className="p-4 font-normal">Description</th>
                    <th className="p-4 font-normal">Status</th>
                    <th className="p-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b2a29]">
                  {taxonomyLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[#8c887e]">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : taxonomyItems.length > 0 ? (
                    taxonomyItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#141312]/60 transition-colors">
                        <td className="p-4 font-semibold text-[#ffffff]">{item.name}</td>
                        <td className="p-4 text-[#8c887e]">{item.description || '—'}</td>
                        <td className="p-4">
                          {item.isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#8c887e]">
                              <XCircle className="h-3.5 w-3.5" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingTaxonomyItem(item);
                              setEditTaxonomyName(item.name);
                              setEditTaxonomyDesc(item.description || '');
                            }}
                            icon={<Edit3 className="h-3 w-3" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleToggleTaxonomyActive(item)}
                          >
                            {item.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[#8c887e]">
                        No taxonomy items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-[#2b2a29] px-4 py-3 text-xs font-mono text-[#8c887e]">
                <span>
                  Showing {taxonomyItems.length} of {taxonomyTotal} entries
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={taxonomyPage <= 1}
                    onClick={() => setTaxonomyPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span>
                    Page {taxonomyPage} of {Math.ceil(taxonomyTotal / 15) || 1}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={taxonomyPage >= Math.ceil(taxonomyTotal / 15)}
                    onClick={() => setTaxonomyPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Slide-over Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
              <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                User Account Overview
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                {selectedUserDetail.avatarUrl && (
                  <img src={selectedUserDetail.avatarUrl} alt="Avatar" className="h-12 w-12 rounded-full object-cover" />
                )}
                <div>
                  <p className="text-base font-bold text-[#ffffff]">@{selectedUserDetail.username}</p>
                  <p className="text-[#8c887e]">{selectedUserDetail.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3">
                  <span className="text-[10px] text-[#8c887e] block">Global Role</span>
                  <span className="font-bold text-[#ffffff]">{selectedUserDetail.role}</span>
                </div>
                <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3">
                  <span className="text-[10px] text-[#8c887e] block">Email Verification</span>
                  <span className="font-bold text-[#ffffff]">{selectedUserDetail.emailVerified ? 'Verified' : 'Pending'}</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
                <span className="text-[10px] text-[#8c887e] block">Projects Summary</span>
                <p className="text-[#e6e2df]">
                  Founded Projects: <strong className="text-[#ffffff]">{selectedUserDetail.foundedProjectsCount}</strong>
                </p>
                <p className="text-[#e6e2df]">
                  Joined Memberships: <strong className="text-[#ffffff]">{selectedUserDetail.joinedProjectsCount}</strong>
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setSelectedUserDetail(null)}>
                  Close Overview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Slide-over Modal */}
      {selectedProjectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
              <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                Project Overview (Admin Inspection)
              </h3>
              <button
                type="button"
                onClick={() => setSelectedProjectDetail(null)}
                className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#ffffff]">{selectedProjectDetail.name}</h4>
                <p className="text-[#8c887e]">/{selectedProjectDetail.slug}</p>
                <p className="text-[#cac6bc] mt-1">{selectedProjectDetail.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3">
                  <span className="text-[10px] text-[#8c887e] block">Founder</span>
                  <span className="font-bold text-[#ffffff]">@{selectedProjectDetail.founderUsername}</span>
                  <span className="block text-[10px] text-[#8c887e]">{selectedProjectDetail.founderEmail}</span>
                </div>
                <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3">
                  <span className="text-[10px] text-[#8c887e] block">Dev Status / Moderation</span>
                  <span className="font-bold text-[#ffffff]">{selectedProjectDetail.status}</span>
                  <span className="block text-[10px] font-semibold text-amber-300 mt-0.5">
                    ● {selectedProjectDetail.moderationStatus}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-[#2b2a29]">
                <div className="flex items-center gap-2">
                  {selectedProjectDetail.moderationStatus !== 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => handleApproveProject(selectedProjectDetail.id)}
                      className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
                    >
                      Approve & Publish
                    </button>
                  )}
                  {selectedProjectDetail.moderationStatus !== 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => handleRejectProject(selectedProjectDetail.id)}
                      className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition-colors"
                    >
                      Reject
                    </button>
                  )}
                </div>

                <Button variant="secondary" size="sm" onClick={() => setSelectedProjectDetail(null)}>
                  Close Overview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Taxonomy Modal */}
      {isAddTaxonomyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
              <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                Add Controlled Entry ({activeTaxonomyType})
              </h3>
              <button
                type="button"
                onClick={() => setIsAddTaxonomyOpen(false)}
                className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {taxonomyError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{taxonomyError}</span>
              </div>
            )}

            <form onSubmit={handleAddTaxonomy} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">Entry Name *</label>
                <input
                  type="text"
                  required
                  value={newTaxonomyName}
                  onChange={(e) => setNewTaxonomyName(e.target.value)}
                  placeholder="e.g. Unreal Engine 5.5, Gameplay Ability System"
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newTaxonomyDesc}
                  onChange={(e) => setNewTaxonomyDesc(e.target.value)}
                  placeholder="Optional description of this controlled entry..."
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[#2b2a29] pt-4">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddTaxonomyOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={taxonomyActionLoading}>
                  {taxonomyActionLoading ? 'Creating...' : 'Create Entry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Taxonomy Modal */}
      {editingTaxonomyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
              <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                Edit Controlled Entry
              </h3>
              <button
                type="button"
                onClick={() => setEditingTaxonomyItem(null)}
                className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {taxonomyError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{taxonomyError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTaxonomy} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">Entry Name *</label>
                <input
                  type="text"
                  required
                  value={editTaxonomyName}
                  onChange={(e) => setEditTaxonomyName(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editTaxonomyDesc}
                  onChange={(e) => setEditTaxonomyDesc(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[#2b2a29] pt-4">
                <Button variant="secondary" size="sm" type="button" onClick={() => setEditingTaxonomyItem(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={taxonomyActionLoading}>
                  {taxonomyActionLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
