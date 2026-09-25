import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../features/auth/services/httpClient';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { useAuthStore } from '../features/auth/store/authStore';
import { Gamepad2, ArrowLeft, Terminal } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface PlayableBuild {
  id: string;
  version: string;
  platform: string;
  title: string;
}

export function PlaytestNewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [builds, setBuilds] = useState<PlayableBuild[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBuilds();
  }, [projectId]);

  const loadBuilds = async () => {
    try {
      const res = await apiClient.get(`/projects/${projectId}/playable-builds`);
      setBuilds(res.data);
      if (res.data.length > 0) {
        setSelectedBuildId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load playable builds.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildId) {
      setError('Please select a build to playtest.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await apiClient.post(`/projects/${projectId}/playable-builds/${selectedBuildId}/playtests`, {
        title,
        instructions
      });
      navigate(`/projects/${projectId}?tab=playtests`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create playtest.');
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout user={user}>
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <Link 
          to={`/projects/${projectId}?tab=playtests`} 
          className="inline-flex items-center gap-2 text-sm font-mono text-[#8c887e] hover:text-[#ffffff] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </Link>

        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#48473f] bg-[#201f1e] text-amber-400">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-[#ffffff]">New Playtest Session</h1>
              <p className="text-sm font-mono text-[#8c887e]">Create a testing session to distribute a build.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-900/20 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-bold text-[#cac6bc] mb-2 uppercase tracking-wider">
                Select Playable Build
              </label>
              {builds.length === 0 ? (
                <div className="rounded-xl border border-[#363433] bg-[#141312] p-4 text-sm font-mono text-[#8c887e]">
                  No playable builds found. Please run a build pipeline first to generate a PlayableBuild artifact.
                </div>
              ) : (
                <select
                  value={selectedBuildId}
                  onChange={(e) => setSelectedBuildId(e.target.value)}
                  className="w-full rounded-xl border border-[#48473f] bg-[#141312] px-4 py-3 text-sm text-[#ffffff] focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  required
                >
                  <option value="" disabled>Select a build...</option>
                  {builds.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} (v{b.version}) - {b.platform}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#cac6bc] mb-2 uppercase tracking-wider">
                Playtest Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Internal Alpha 1.0 Testing"
                className="w-full rounded-xl border border-[#48473f] bg-[#141312] px-4 py-3 text-sm text-[#ffffff] placeholder-[#66645c] focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#cac6bc] mb-2 uppercase tracking-wider">
                Testing Instructions (Optional)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="What should testers focus on? Are there known bugs? (Markdown supported)"
                className="w-full rounded-xl border border-[#48473f] bg-[#141312] px-4 py-3 text-sm text-[#ffffff] placeholder-[#66645c] focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 min-h-[120px]"
              />
            </div>

            <div className="pt-4 border-t border-[#363433] flex justify-end gap-3">
              <Link to={`/projects/${projectId}?tab=playtests`}>
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={builds.length === 0}>
                Create Playtest
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
