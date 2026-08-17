import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Loader2, AlertCircle } from 'lucide-react';

// Subcomponents
import { ProfileHeader } from '../features/profile/components/ProfileHeader';
import { ProfileAbout } from '../features/profile/components/ProfileAbout';
import { ProfessionalIdentitySection } from '../features/profile/components/ProfessionalIdentitySection';
import { ExperienceSection } from '../features/profile/components/ExperienceSection';
import { EducationSection } from '../features/profile/components/EducationSection';
import { PortfolioSection } from '../features/profile/components/PortfolioSection';
import { ResumeSection } from '../features/profile/components/ResumeSection';
import { LinksSection } from '../features/profile/components/LinksSection';
import { ProfileCompletionCard } from '../features/profile/components/ProfileCompletionCard';
import { AdminProfileView } from '../features/profile/components/AdminProfileView';

// Section-Owned Modals
import { AvatarEditModal } from '../features/profile/components/AvatarEditModal';
import { BannerEditModal } from '../features/profile/components/BannerEditModal';
import { EditBasicProfileModal } from '../features/profile/components/EditBasicProfileModal';
import { EditIdentityModal } from '../features/profile/components/EditIdentityModal';
import { ExperienceModal } from '../features/profile/components/ExperienceModal';
import { EducationModal } from '../features/profile/components/EducationModal';
import { PortfolioModal } from '../features/profile/components/PortfolioModal';
import { ResumeModal } from '../features/profile/components/ResumeModal';
import { LinkModal } from '../features/profile/components/LinkModal';

// Services & Types
import {
  fetchPublicProfile,
  fetchOwnProfile,
  followUser,
  unfollowUser,
  deleteResume,
  updateResumeVisibility,
} from '../features/profile/services/profileService';
import type {
  ProfileData,
  ExperienceItem,
  EducationItem,
  PortfolioItem,
  ProfileLink,
  Resume,
  ProfessionalIdentity,
  ProfileUser,
} from '../features/profile/types';

export const ProfilePage: React.FC = () => {
  const { username: routeUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = useAuthStore((state) => state.currentUser);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isRestoringSession = useAuthStore((state) => state.isRestoringSession);

  // Redirect /profile to /u/:username
  useEffect(() => {
    if (location.pathname === '/profile' && currentUser?.username) {
      navigate(`/u/${currentUser.username}`, { replace: true });
    }
  }, [location.pathname, currentUser, navigate]);

  const targetUsername = routeUsername || currentUser?.username || '';

  const isOwner = Boolean(
    currentUser && currentUser.username.toLowerCase() === targetUsername.toLowerCase(),
  );

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  // Section-owned Modal Visibility States
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);

  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [expToEdit, setExpToEdit] = useState<ExperienceItem | null>(null);

  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [eduToEdit, setEduToEdit] = useState<EducationItem | null>(null);

  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [projToEdit, setProjToEdit] = useState<PortfolioItem | null>(null);

  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<ProfileLink | null>(null);

  const fetchedKeyRef = useRef<string | null>(null);

  // Fetch profile from backend database
  const loadProfile = useCallback(async () => {
    if (!targetUsername) return;
    setIsLoading(true);
    setError(null);

    try {
      const data =
        isOwner && accessToken
          ? await fetchOwnProfile(accessToken)
          : await fetchPublicProfile(targetUsername, accessToken);
      setProfileData(data);
      setIsFollowing(Boolean(data.isFollowing));
    } catch (err: any) {
      setError(err.message || `Unable to load profile for user '@${targetUsername}'.`);
    } finally {
      setIsLoading(false);
    }
  }, [targetUsername, accessToken, isOwner]);

  useEffect(() => {
    if (isRestoringSession) return;
    const fetchKey = `${targetUsername}:${isOwner}:${accessToken || ''}`;
    if (fetchedKeyRef.current === fetchKey) return;
    fetchedKeyRef.current = fetchKey;
    loadProfile();
  }, [isRestoringSession, targetUsername, isOwner, accessToken, loadProfile]);

  const handleToggleFollow = async () => {
    if (!accessToken) {
      navigate('/login');
      return;
    }

    try {
      if (isFollowing) {
        await unfollowUser(accessToken, targetUsername);
        setIsFollowing(false);
        if (profileData) {
          setProfileData({
            ...profileData,
            stats: {
              ...profileData.stats,
              followersCount: Math.max(0, profileData.stats.followersCount - 1),
            },
          });
        }
      } else {
        await followUser(accessToken, targetUsername);
        setIsFollowing(true);
        if (profileData) {
          setProfileData({
            ...profileData,
            stats: {
              ...profileData.stats,
              followersCount: profileData.stats.followersCount + 1,
            },
          });
        }
      }
    } catch (err: any) {
      console.error('Follow action error:', err);
    }
  };

  // Section Update Handlers (Local state updating — NO /profile/me refetches)
  const handleAvatarUpdated = (newAvatarUrl: string | undefined) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        user: { ...profileData.user, avatarUrl: newAvatarUrl },
      });
    }
  };

  const handleBannerUpdated = (newBannerUrl: string | undefined) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        user: { ...profileData.user, bannerUrl: newBannerUrl },
      });
    }
  };

  const handleBasicProfileUpdated = (updatedUser: ProfileUser) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        user: { ...profileData.user, ...updatedUser },
      });
    }
  };

  const handleIdentityUpdated = (updatedIdentity: ProfessionalIdentity) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        professional: updatedIdentity,
      });
    }
  };

  // Experience Handlers
  const handleAddExperience = () => {
    setExpToEdit(null);
    setIsExpModalOpen(true);
  };
  const handleEditExperience = (exp: ExperienceItem) => {
    setExpToEdit(exp);
    setIsExpModalOpen(true);
  };
  const handleExperienceSaved = (savedExp: ExperienceItem) => {
    if (!profileData) return;
    const exists = profileData.experiences.some((e) => e.id === savedExp.id);
    const nextExperiences = exists
      ? profileData.experiences.map((e) => (e.id === savedExp.id ? savedExp : e))
      : [savedExp, ...profileData.experiences];
    setProfileData({ ...profileData, experiences: nextExperiences });
  };
  const handleExperienceDeleted = (id: string) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        experiences: profileData.experiences.filter((e) => e.id !== id),
      });
    }
  };

  // Education Handlers
  const handleAddEducation = () => {
    setEduToEdit(null);
    setIsEduModalOpen(true);
  };
  const handleEditEducation = (edu: EducationItem) => {
    setEduToEdit(edu);
    setIsEduModalOpen(true);
  };
  const handleEducationSaved = (savedEdu: EducationItem) => {
    if (!profileData) return;
    const exists = profileData.education.some((e) => e.id === savedEdu.id);
    const nextEducation = exists
      ? profileData.education.map((e) => (e.id === savedEdu.id ? savedEdu : e))
      : [...profileData.education, savedEdu];
    setProfileData({ ...profileData, education: nextEducation });
  };
  const handleEducationDeleted = (id: string) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        education: profileData.education.filter((e) => e.id !== id),
      });
    }
  };

  // Portfolio Handlers
  const handleAddPortfolio = () => {
    setProjToEdit(null);
    setIsProjModalOpen(true);
  };
  const handleEditPortfolio = (item: PortfolioItem) => {
    setProjToEdit(item);
    setIsProjModalOpen(true);
  };
  const handlePortfolioSaved = (savedItem: PortfolioItem) => {
    if (!profileData) return;
    const exists = profileData.portfolio.some((p) => p.id === savedItem.id);
    const nextPortfolio = exists
      ? profileData.portfolio.map((p) => (p.id === savedItem.id ? savedItem : p))
      : [savedItem, ...profileData.portfolio];
    setProfileData({ ...profileData, portfolio: nextPortfolio });
  };
  const handlePortfolioDeleted = (id: string) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        portfolio: profileData.portfolio.filter((p) => p.id !== id),
      });
    }
  };

  // Resume Handlers
  const handleResumeSaved = (savedResume: Resume | null) => {
    if (profileData) {
      setProfileData({ ...profileData, resume: savedResume });
    }
  };
  const handleToggleResumeVisibility = async () => {
    if (profileData?.resume && accessToken) {
      const nextVis = profileData.resume.visibility === 'Public' ? 'Private' : 'Public';
      try {
        const updated = await updateResumeVisibility(accessToken, nextVis);
        setProfileData({ ...profileData, resume: updated });
      } catch (err) {
        console.warn('Resume visibility toggle note:', err);
      }
    }
  };
  const handleDeleteResumeDirect = async () => {
    if (accessToken && profileData?.resume) {
      try {
        await deleteResume(accessToken);
        setProfileData({ ...profileData, resume: null });
      } catch (err) {
        console.warn('Resume delete note:', err);
      }
    }
  };

  // Link Handlers
  const handleAddLink = () => {
    setLinkToEdit(null);
    setIsLinkModalOpen(true);
  };
  const handleEditLink = (link: ProfileLink) => {
    setLinkToEdit(link);
    setIsLinkModalOpen(true);
  };
  const handleLinkSaved = (savedLink: ProfileLink) => {
    if (!profileData) return;
    const exists = profileData.links.some((l) => l.id === savedLink.id);
    const nextLinks = exists
      ? profileData.links.map((l) => (l.id === savedLink.id ? savedLink : l))
      : [...profileData.links, savedLink];
    setProfileData({ ...profileData, links: nextLinks });
  };
  const handleLinkDeleted = (id: string) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        links: profileData.links.filter((l) => l.id !== id),
      });
    }
  };

  if (isLoading && !profileData) {
    return (
      <div className="min-h-screen bg-[#141312] flex items-center justify-center p-6 text-[#e6e2df]">
        <div className="flex items-center gap-3 font-mono text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#cac6bc]" />
          <span>Loading developer profile from Pantheon database...</span>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-[#141312] flex items-center justify-center p-6 text-[#e6e2df]">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center space-y-3 max-w-md">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          <h2 className="font-headline text-lg font-bold">Profile Not Found</h2>
          <p className="text-xs text-[#8c887e]">
            {error || `Unable to load profile for user '@${targetUsername}'.`}
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-4 py-2 text-xs font-mono text-[#e6e2df] hover:border-[#e6e2df]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isAdminProfile = profileData.user.role === 'ADMINISTRATOR';

  const profileContent = isAdminProfile ? (
    <>
      <AdminProfileView
        user={profileData.user}
        isOwner={isOwner}
        onEditBasicProfile={() => setIsBasicModalOpen(true)}
        onEditAvatar={() => setIsAvatarModalOpen(true)}
        onEditBanner={() => setIsBannerModalOpen(true)}
      />

      <AvatarEditModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={profileData.user.avatarUrl}
        onAvatarUpdated={handleAvatarUpdated}
      />

      <BannerEditModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        currentBannerUrl={profileData.user.bannerUrl}
        onBannerUpdated={handleBannerUpdated}
      />

      <EditBasicProfileModal
        isOpen={isBasicModalOpen}
        onClose={() => setIsBasicModalOpen(false)}
        user={profileData.user}
        onUpdated={handleBasicProfileUpdated}
      />
    </>
  ) : (
    <div className="space-y-12 max-w-7xl mx-auto pb-12">
      {/* 1. Profile Header */}
      <ProfileHeader
        user={profileData.user}
        stats={profileData.stats}
        isOwner={isOwner}
        isFollowing={isFollowing}
        onToggleFollow={handleToggleFollow}
        onEditBasicProfile={() => setIsBasicModalOpen(true)}
        onEditAvatar={() => setIsAvatarModalOpen(true)}
        onEditBanner={() => setIsBannerModalOpen(true)}
      />

      {/* Main Grid Layout: Desktop 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Left Column (Main Narrative) */}
        <div className="lg:col-span-2 space-y-10">
          {/* About Section */}
          <ProfileAbout
            user={profileData.user}
            isOwner={isOwner}
            onEditBasicProfile={() => setIsBasicModalOpen(true)}
          />

          {/* Professional Identity Summary */}
          <ProfessionalIdentitySection
            identity={profileData.professional}
            isOwner={isOwner}
            onEditIdentity={() => setIsIdentityModalOpen(true)}
          />

          {/* Portfolio Showcase */}
          <PortfolioSection
            portfolio={profileData.portfolio}
            isOwner={isOwner}
            onAddProject={handleAddPortfolio}
            onEditProject={handleEditPortfolio}
            onDeleteProject={handlePortfolioDeleted}
          />

          {/* Experience Timeline */}
          <ExperienceSection
            experiences={profileData.experiences}
            isOwner={isOwner}
            onAddExperience={handleAddExperience}
            onEditExperience={handleEditExperience}
            onDeleteExperience={handleExperienceDeleted}
          />

          {/* Education */}
          <EducationSection
            education={profileData.education}
            isOwner={isOwner}
            onAddEducation={handleAddEducation}
            onEditEducation={handleEditEducation}
            onDeleteEducation={handleEducationDeleted}
          />
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Profile Completion (OWNER ONLY) */}
          {isOwner && (
            <ProfileCompletionCard
              stats={profileData.stats}
              onOpenEditModal={() => setIsBasicModalOpen(true)}
            />
          )}

          {/* Resume Section */}
          <ResumeSection
            resume={profileData.resume}
            isOwner={isOwner}
            onOpenResumeModal={() => setIsResumeModalOpen(true)}
            onDeleteResume={handleDeleteResumeDirect}
            onToggleVisibility={handleToggleResumeVisibility}
          />

          {/* External Links Section */}
          <LinksSection
            links={profileData.links}
            isOwner={isOwner}
            onAddLink={handleAddLink}
            onEditLink={handleEditLink}
            onDeleteLink={handleLinkDeleted}
          />
        </div>
      </div>

      {/* SECTION-OWNED EDIT MODALS */}
      <AvatarEditModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={profileData.user.avatarUrl}
        onAvatarUpdated={handleAvatarUpdated}
      />

      <BannerEditModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        currentBannerUrl={profileData.user.bannerUrl}
        onBannerUpdated={handleBannerUpdated}
      />

      <EditBasicProfileModal
        isOpen={isBasicModalOpen}
        onClose={() => setIsBasicModalOpen(false)}
        user={profileData.user}
        onUpdated={handleBasicProfileUpdated}
      />

      <EditIdentityModal
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        identity={profileData.professional}
        onUpdated={handleIdentityUpdated}
      />

      <ExperienceModal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        experienceToEdit={expToEdit}
        onSaved={handleExperienceSaved}
        onDeleted={handleExperienceDeleted}
      />

      <EducationModal
        isOpen={isEduModalOpen}
        onClose={() => setIsEduModalOpen(false)}
        educationToEdit={eduToEdit}
        onSaved={handleEducationSaved}
        onDeleted={handleEducationDeleted}
      />

      <PortfolioModal
        isOpen={isProjModalOpen}
        onClose={() => setIsProjModalOpen(false)}
        projectToEdit={projToEdit}
        onSaved={handlePortfolioSaved}
        onDeleted={handlePortfolioDeleted}
      />

      <ResumeModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        resume={profileData.resume}
        onSaved={handleResumeSaved}
      />

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        linkToEdit={linkToEdit}
        onSaved={handleLinkSaved}
        onDeleted={handleLinkDeleted}
      />
    </div>
  );

  // Authenticated Dashboard Wrapper vs Public Layout
  if (currentUser) {
    return <DashboardLayout user={currentUser}>{profileContent}</DashboardLayout>;
  }

  return (
    <div className="min-h-screen bg-[#141312] text-[#e6e2df] flex flex-col font-sans relative selection:bg-[#48473f]">
      <div className="absolute top-0 left-0 right-0 h-[800px] global-ambient-light pointer-events-none z-0" />
      <Navbar />
      <main className="flex-1 relative z-10 py-10 px-4 sm:px-6 lg:px-8 font-sans">
        {profileContent}
      </main>
      <Footer />
    </div>
  );
};