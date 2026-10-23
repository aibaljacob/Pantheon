import React, { useState } from 'react';
import {
  Search,
  Upload,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
  Loader2,
  X,
  Edit3,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';
import { AppImage } from '../../../../../components/ui/AppImage';
import { useAuthStore } from '../../../../auth/store/authStore';
import { formatApiAssetUrl } from '../../../../profile/services/profileService';
import type {
  DesignAssetCategory,
  DesignAssetItem,
  DesignAssetStatus,
  ProjectDetail,
} from '../../../types';
import {
  createDesignAsset,
  updateDesignAsset,
  deleteDesignAsset,
  uploadArtDesignReference,
} from '../../../services/artDesignService';

interface DesignLibrariesViewProps {
  project: ProjectDetail;
  assets: DesignAssetItem[];
  token?: string;
  onRefresh: () => void;
  onOpenConvertTask: (asset: DesignAssetItem) => void;
}

const CATEGORY_TABS: Array<{ label: string; value: string }> = [
  { label: 'All References', value: 'ALL' },
  { label: 'Characters & Costumes', value: 'CHARACTERS_COSTUMES' },
  { label: 'Environments & Architecture', value: 'ENVIRONMENTS_ARCHITECTURE' },
  { label: 'Props & Weapons', value: 'PROPS_WEAPONS' },
  { label: 'UI & Icons', value: 'UI_ICONS' },
  { label: 'Lighting & Colors', value: 'LIGHTING_COLOR' },
];

export const DesignLibrariesView: React.FC<DesignLibrariesViewProps> = ({
  project,
  assets,
  token,
  onRefresh,
  onOpenConvertTask,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox preview state
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] =
    useState<DesignAssetCategory>('ENVIRONMENTS_ARCHITECTURE');
  const [newDesc, setNewDesc] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const currentUser = useAuthStore((state) => state.currentUser);
  const accessToken = useAuthStore((state) => state.accessToken);
  const effectiveToken = token || accessToken || undefined;

  // Filtered assets
  const filteredAssets = assets.filter((asset) => {
    if (selectedCategory !== 'ALL' && asset.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && asset.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = asset.title.toLowerCase().includes(q);
      const matchDesc = asset.description?.toLowerCase().includes(q) || false;
      const matchCreator = asset.creatorDetails?.toLowerCase().includes(q) || false;
      const matchTags = asset.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchCreator && !matchTags) return false;
    }
    return true;
  });

  // Edit asset state
  const [editingAsset, setEditingAsset] = useState<DesignAssetItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<DesignAssetCategory>('ENVIRONMENTS_ARCHITECTURE');
  const [editDesc, setEditDesc] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete asset state
  const [deletingAsset, setDeletingAsset] = useState<DesignAssetItem | null>(null);
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleEditClick = (asset: DesignAssetItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingAsset(asset);
    setEditTitle(asset.title);
    setEditCategory(asset.category);
    setEditDesc(asset.description || '');
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !effectiveToken) return;
    if (!editTitle.trim()) {
      setEditError('Title is required.');
      return;
    }
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await updateDesignAsset(
        project.id,
        editingAsset.id,
        {
          title: editTitle.trim(),
          category: editCategory,
          description: editDesc.trim() || undefined,
        },
        effectiveToken,
      );
      setEditingAsset(null);
      onRefresh();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update asset.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return;
    if (!effectiveToken) {
      setDeleteError('Authentication token not found. Please log in.');
      return;
    }
    setIsDeletingAsset(true);
    setDeleteError(null);
    try {
      await deleteDesignAsset(project.id, deletingAsset.id, effectiveToken);
      setDeletingAsset(null);
      onRefresh();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete asset.');
    } finally {
      setIsDeletingAsset(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveToken) return;

    setIsUploadingFile(true);
    setUploadError(null);
    try {
      const res = await uploadArtDesignReference(project.id, file, effectiveToken);
      setUploadedUrl(res.fileUrl);
      setUploadedFileName(res.fileName);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload file.',
      );
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveToken) {
      setUploadError('Must be signed in to add reference asset.');
      return;
    }
    if (!newTitle.trim() || !uploadedUrl.trim()) {
      setUploadError('Title and uploaded file are required.');
      return;
    }

    setIsSavingAsset(true);
    setUploadError(null);
    try {
      await createDesignAsset(
        project.id,
        {
          title: newTitle.trim(),
          category: newCategory,
          description: newDesc.trim() || undefined,
          fileUrl: uploadedUrl,
        },
        effectiveToken,
      );

      setIsUploadModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setUploadedUrl('');
      setUploadedFileName('');
      onRefresh();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to save asset.');
    } finally {
      setIsSavingAsset(false);
    }
  };

  const handleStatusChange = async (asset: DesignAssetItem, newStatus: DesignAssetStatus) => {
    if (!token) return;
    try {
      await updateDesignAsset(project.id, asset.id, { status: newStatus }, token);
      onRefresh();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Pills & Action Header */}
      <div className="space-y-4 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedCategory(tab.value)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold whitespace-nowrap transition-all ${
                selectedCategory === tab.value
                  ? 'bg-amber-400 text-[#141312] shadow-sm'
                  : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, Status Filter & Upload Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#2b2a29]">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8c887e]" />
              <input
                type="text"
                placeholder="Search reference library, tags, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] pl-8 pr-3 py-1.5 text-xs font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs font-mono text-[#cac6bc] focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PROPOSED">Proposed</option>
              <option value="APPROVED">Approved</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Upload className="h-3.5 w-3.5 text-[#141312]" />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Add Reference Asset
          </Button>
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="rounded-3xl border border-[#2b2a29] bg-[#141312] p-12 text-center space-y-3">
          <Layers className="mx-auto h-8 w-8 text-amber-400/60" />
          <h4 className="font-headline text-base font-bold text-[#ffffff]">
            No Reference Assets Found
          </h4>
          <p className="max-w-md mx-auto text-xs font-mono text-[#8c887e]">
            Organize production mood boards, character silhouettes, architectural studies, UI wireframes, and lighting keys.
          </p>
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
              Upload First Asset
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => {
            const isApproved = asset.status === 'APPROVED';
            const isArchived = asset.status === 'ARCHIVED';
            const canManage = Boolean(
              currentUser && (currentUser.id === asset.authorId || project.isFounder),
            );

            return (
              <div
                key={asset.id}
                className={`group flex flex-col justify-between overflow-hidden rounded-2xl border bg-[#1c1b1a] transition-all hover:border-amber-500/50 ${
                  isApproved
                    ? 'border-emerald-500/30'
                    : isArchived
                    ? 'border-[#2b2a29] opacity-70'
                    : 'border-[#363433]'
                }`}
              >
                {/* Media Image Thumbnail */}
                <div
                  className="relative h-44 w-full bg-black/60 overflow-hidden cursor-pointer"
                  onClick={() => setPreviewImage({ url: formatApiAssetUrl(asset.fileUrl), title: asset.title })}
                >
                  <AppImage
                    src={asset.thumbnailUrl || asset.fileUrl}
                    alt={asset.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap pointer-events-none">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md ${
                        isApproved
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : isArchived
                          ? 'bg-stone-900/80 text-[#8c887e] border border-stone-700'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {canManage && (
                      <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleEditClick(asset, e)}
                          className="rounded p-1 text-[#cac6bc] hover:text-amber-400 hover:bg-[#201f1e] transition-colors"
                          title="Edit submission"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingAsset(asset);
                          }}
                          className="rounded p-1 text-[#cac6bc] hover:text-red-400 hover:bg-[#201f1e] transition-colors"
                          title="Delete reference"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div
                      className="rounded-lg bg-black/70 p-1.5 text-[#cac6bc] hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="View enlarged"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider truncate">
                      {asset.category.replace('_', ' ')}
                    </div>
                    <h5 className="font-headline text-sm font-bold text-[#ffffff] line-clamp-1 group-hover:text-amber-300 transition-colors">
                      {asset.title}
                    </h5>
                    {asset.description && (
                      <p className="text-xs font-sans text-[#cac6bc] line-clamp-2 leading-relaxed">
                        {asset.description}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {asset.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-[#141312] px-1.5 py-0.5 text-[9px] font-mono text-[#8c887e] border border-[#2b2a29]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata: Creator / License */}
                  <div className="border-t border-[#2b2a29] pt-2 text-[10px] font-mono text-[#8c887e] space-y-0.5">
                    {asset.creatorDetails && (
                      <div className="truncate">Creator: {asset.creatorDetails}</div>
                    )}
                    {asset.licenseDetails && (
                      <div className="truncate">License: {asset.licenseDetails}</div>
                    )}
                  </div>

                  {/* Actions: Task conversion or founder approval */}
                  <div className="pt-2 border-t border-[#2b2a29] flex items-center justify-between gap-2">
                    {isApproved ? (
                      asset.createdTaskId ? (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {asset.createdTask?.taskCode || 'Task Created'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenConvertTask(asset)}
                          className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <span>Convert to Task</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )
                    ) : (
                      project.isFounder && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(asset, 'APPROVED')}
                            className="text-[10px] font-mono text-emerald-400 hover:underline"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(asset, 'ARCHIVED')}
                            className="text-[10px] font-mono text-[#8c887e] hover:underline"
                          >
                            Archive
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Asset Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
          <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl border border-[#363433] bg-[#141312] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-400">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-[#ffffff]">
                    Add Reference Asset
                  </h3>
                  <p className="text-xs font-mono text-[#8c887e]">
                    Save an art reference to the project library
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#e6e2df]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {uploadError && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs font-mono text-red-300">
                  {uploadError}
                </div>
              )}

              <form id="new-library-asset-form" onSubmit={handleSaveAsset} className="space-y-4">
                {/* File upload drag/input */}
                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">
                    Reference Image <span className="text-amber-400">*</span>
                  </label>
                  <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-[#363433] bg-[#1c1b1a] hover:border-amber-400 cursor-pointer p-4 transition-colors">
                    {uploadedUrl ? (
                      <div className="text-center space-y-1">
                        <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
                        <span className="text-xs font-mono text-[#ffffff] font-semibold block truncate max-w-xs">
                          {uploadedFileName || 'Image uploaded'}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400">
                          Click to replace
                        </span>
                      </div>
                    ) : isUploadingFile ? (
                      <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading image...
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <Upload className="mx-auto h-6 w-6 text-[#8c887e]" />
                        <span className="text-xs font-mono text-[#e6e2df] block">
                          Click to choose image (PNG, JPG, WEBP)
                        </span>
                        <span className="text-[10px] font-mono text-[#8c887e]">
                          Stored in project library
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploadingFile}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">
                    Title <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weapon Concept Silhouette"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">
                    Category <span className="text-amber-400">*</span>
                  </label>
                  <select
                    required
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as DesignAssetCategory)
                    }
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none"
                  >
                    <option value="ENVIRONMENTS_ARCHITECTURE">Environments & Architecture</option>
                    <option value="CHARACTERS_COSTUMES">Characters & Costumes</option>
                    <option value="PROPS_WEAPONS">Props & Weapons</option>
                    <option value="UI_ICONS">UI & Icons</option>
                    <option value="LIGHTING_COLOR">Lighting & Colors</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Optional notes, materials, or visual context..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] p-3 text-xs font-sans text-[#cac6bc] focus:border-amber-400 focus:outline-none leading-relaxed"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isSavingAsset}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                form="new-library-asset-form"
                disabled={isSavingAsset || isUploadingFile || !uploadedUrl || !newTitle.trim()}
              >
                {isSavingAsset ? 'Saving...' : 'Save Reference'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden"
          onClick={() => setEditingAsset(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl border border-[#363433] bg-[#141312] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4 shrink-0">
              <div>
                <h3 className="font-headline text-base font-bold text-[#ffffff]">
                  Edit Reference Asset
                </h3>
                <p className="text-xs font-mono text-[#8c887e]">
                  Update asset title, category, and notes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#e6e2df]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {editError && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs font-mono text-red-300">
                  {editError}
                </div>
              )}

              <form id="edit-library-asset-form" onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">
                    Title <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">
                    Category <span className="text-amber-400">*</span>
                  </label>
                  <select
                    required
                    value={editCategory}
                    onChange={(e) =>
                      setEditCategory(e.target.value as DesignAssetCategory)
                    }
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none"
                  >
                    <option value="ENVIRONMENTS_ARCHITECTURE">Environments & Architecture</option>
                    <option value="CHARACTERS_COSTUMES">Characters & Costumes</option>
                    <option value="PROPS_WEAPONS">Props & Weapons</option>
                    <option value="UI_ICONS">UI & Icons</option>
                    <option value="LIGHTING_COLOR">Lighting & Colors</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] p-3 text-xs font-sans text-[#cac6bc] focus:border-amber-400 focus:outline-none leading-relaxed"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingAsset(null)}
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                form="edit-library-asset-form"
                disabled={isSavingEdit || !editTitle.trim()}
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Asset Confirmation Warning Modal */}
      {deletingAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setDeletingAsset(null)}
        >
          <div
            className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl border border-red-500/30 bg-[#1c1b1a] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-semibold text-[#ffffff] font-sans">Delete Reference Asset</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingAsset(null)}
                className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#e6e2df]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs font-sans text-[#cac6bc] leading-relaxed">
                Are you sure you want to delete <strong className="text-white font-medium">"{deletingAsset.title}"</strong>?
              </p>
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-mono text-red-200">
                Warning: This action is permanent. The asset reference will be deleted from this project library immediately.
              </div>
              {deleteError && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-2 text-xs font-mono text-red-300">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeletingAsset(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="!bg-red-700 hover:!bg-red-600 !text-white !border-red-600"
                onClick={handleDeleteAsset}
                disabled={isDeletingAsset}
              >
                {isDeletingAsset ? 'Deleting...' : 'Yes, Delete Asset'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 lg:p-6 xl:pl-[18.5rem] xl:pt-[6rem] bg-black/90 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-7rem)] flex flex-col rounded-2xl border border-[#363433] bg-[#141312] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2b2a29] px-4 py-3 shrink-0 bg-[#171615]">
              <span className="text-xs font-mono font-semibold text-[#ffffff] truncate max-w-md">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#e6e2df]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40 min-h-[220px]">
              <AppImage
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[calc(100vh-13rem)] sm:max-h-[calc(100vh-14rem)] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
