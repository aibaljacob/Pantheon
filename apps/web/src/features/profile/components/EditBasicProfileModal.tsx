import React, { useState, useEffect } from 'react';
import { X, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { ProfileUser } from '../types';
import { updateBasicProfile } from '../services/profileService';
import { useAuthStore } from '../../auth/store/authStore';

interface EditBasicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser;
  onUpdated: (updatedUser: ProfileUser) => void;
}

export const EditBasicProfileModal: React.FC<EditBasicProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdated,
}) => {
  const [formData, setFormData] = useState<ProfileUser>(user);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ProfileUser, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await updateBasicProfile(accessToken, {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        displayName: formData.displayName || '',
        headline: formData.headline || '',
        bio: formData.bio || '',
        location: formData.location || '',
        timezone: formData.timezone || '',
        experienceYears: formData.experienceYears || 0,
        availability: formData.availability || 'Available for collaboration',
      });

      // Update parent state with modified user fields
      onUpdated({
        ...user,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        displayName: response.user.displayName,
        headline: response.user.headline,
        bio: response.user.bio,
        location: response.user.location,
        timezone: response.user.timezone,
        experienceYears: response.user.experienceYears,
        availability: response.user.availability,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update basic profile info.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#e6e2df]" />
            <div>
              <h2 className="font-headline text-lg font-bold text-[#ffffff]">Edit Profile / About</h2>
              <p className="text-xs text-[#8c887e]">Update basic identity, bio, and availability</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName || ''}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName || ''}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Display Name (Optional)</label>
            <input
              type="text"
              value={formData.displayName || ''}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="Full name or studio alias"
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Headline</label>
            <input
              type="text"
              value={formData.headline || ''}
              onChange={(e) => handleChange('headline', e.target.value)}
              placeholder="e.g. Lead Gameplay Programmer · Shader Developer"
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Bio</label>
            <textarea
              rows={4}
              value={formData.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell other game developers about your experience and focus..."
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. Kerala, India"
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">Timezone</label>
              <input
                type="text"
                value={formData.timezone || ''}
                onChange={(e) => handleChange('timezone', e.target.value)}
                placeholder="e.g. UTC+05:30 (IST)"
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">Experience (Years)</label>
              <input
                type="number"
                min={0}
                max={80}
                value={formData.experienceYears ?? 0}
                onChange={(e) => handleChange('experienceYears', parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Availability Status</label>
            <select
              value={formData.availability || 'Available for collaboration'}
              onChange={(e) => handleChange('availability', e.target.value as any)}
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            >
              <option value="Available for collaboration">Available for collaboration</option>
              <option value="Open to offers">Open to offers</option>
              <option value="Not available">Not available</option>
              <option value="Founder active">Founder active</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#2b2a29] pt-4">
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isLoading}
              icon={isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
