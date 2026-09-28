import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { apiClient } from '../../auth/services/httpClient';

export interface TokenItem {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export const PersonalAccessTokensSection: React.FC = () => {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [expirationDays, setExpirationDays] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Newly created token reveal
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let ignore = false;

    apiClient
      .get<TokenItem[]>('/auth/personal-access-tokens')
      .then((res) => {
        if (!ignore) {
          setTokens(res.data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const message = err instanceof Error ? err.message : 'Failed to load access tokens.';
          setError(message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const refreshTokens = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<TokenItem[]>('/auth/personal-access-tokens');
      setTokens(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load access tokens.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenName.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      let expiresAt: string | undefined = undefined;
      if (expirationDays !== 'never') {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(expirationDays, 10));
        expiresAt = d.toISOString();
      }

      const res = await apiClient.post<{ id: string; name: string; token: string }>('/auth/personal-access-tokens', {
        name: tokenName.trim(),
        scopes: ['repo:read', 'repo:write'],
        expiresAt,
      });

      setNewlyCreatedToken(res.data.token);
      setTokenName('');
      setIsCreating(false);
      void refreshTokens();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create token.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this personal access token? Git operations using this token will immediately fail.')) {
      return;
    }

    try {
      await apiClient.delete(`/auth/personal-access-tokens/${id}`);
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke token.';
      alert(message);
    }
  };

  const handleCopyToken = () => {
    if (!newlyCreatedToken) return;
    navigator.clipboard.writeText(newlyCreatedToken);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Card className="p-0">
      <div className="rounded-3xl border border-pantheon-border bg-pantheon-low p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pantheon-border-dark pb-4">
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="font-headline text-2xl font-bold text-pantheon-ivory">Personal Access Tokens</h2>
              <p className="text-xs text-pantheon-muted mt-0.5">
                Authenticate Git Smart HTTP operations (clone, push, pull) using tokens instead of passwords.
              </p>
            </div>
          </div>

          {!isCreating && !newlyCreatedToken && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreating(true)}
            >
              Generate Token
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Newly Created Token Alert (Shown only once) */}
        {newlyCreatedToken && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-5 space-y-3 font-mono">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Personal Access Token Generated</span>
            </div>
            <p className="text-xs text-pantheon-muted">
              Copy your personal access token now. For security reasons, it will never be displayed again!
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-pantheon-border bg-pantheon-bg p-2.5">
              <input
                type="text"
                readOnly
                value={newlyCreatedToken}
                className="w-full bg-transparent text-xs text-amber-300 font-mono focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                onClick={handleCopyToken}
              >
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="pt-1 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setNewlyCreatedToken(null)}
              >
                I have saved my token
              </Button>
            </div>
          </div>
        )}

        {/* Create Token Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="rounded-2xl border border-pantheon-border-dark bg-pantheon-bg p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-pantheon-border-dark pb-2">
              <span className="font-bold text-pantheon-ivory">New Personal Access Token</span>
              <span className="text-[10px] text-pantheon-dim">Scopes: repo:read, repo:write</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-pantheon-dim mb-1 font-semibold">Token Description / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro Git, Workstation"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="w-full rounded-xl border border-pantheon-border bg-pantheon-low px-3 py-2 text-pantheon-ivory focus:border-pantheon-ivory focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-pantheon-dim mb-1 font-semibold">Expiration</label>
                <select
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(e.target.value)}
                  className="w-full rounded-xl border border-pantheon-border bg-pantheon-low px-3 py-2 text-pantheon-ivory focus:outline-none"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                  <option value="never">No expiration</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting || !tokenName.trim()}
              >
                {isSubmitting ? 'Generating...' : 'Generate Token'}
              </Button>
            </div>
          </form>
        )}

        {/* Tokens List */}
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-pantheon-dim" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="rounded-2xl border border-pantheon-border-dark bg-pantheon-bg p-8 text-center text-xs text-pantheon-dim font-mono">
            No personal access tokens generated yet. Generate a token to authenticate Git operations from your local terminal.
          </div>
        ) : (
          <div className="space-y-3 font-mono">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-pantheon-border-dark bg-pantheon-bg p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-pantheon-ivory">{token.name}</span>
                    <Badge variant="bronze" className="text-[10px] py-0">
                      {token.prefix}••••••••
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-pantheon-dim flex-wrap">
                    <span>Created: {new Date(token.createdAt).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>
                      {token.expiresAt
                        ? `Expires: ${new Date(token.expiresAt).toLocaleDateString()}`
                        : 'Never expires'}
                    </span>
                    <span>·</span>
                    <span>Scopes: {token.scopes.join(', ')}</span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
                  onClick={() => handleRevoke(token.id)}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
