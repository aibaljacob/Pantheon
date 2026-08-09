import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

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
import { EditProfileModal } from '../features/profile/components/EditProfileModal';

// Types
import type { ProfileData } from '../features/profile/types';

export const ProfilePage: React.FC = () => {
  const { username: routeUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.currentUser);

  // If user visits /profile without username param, redirect to canonical /u/:username
  useEffect(() => {
    if (location.pathname === '/profile') {
      const targetUsername = currentUser?.username || 'aibal';
      navigate(`/u/${targetUsername}`, { replace: true });
    }
  }, [location.pathname, currentUser, navigate]);

  // Route username parameter
  const targetUsername = routeUsername || currentUser?.username || 'aibal';

  // Ownership calculation
  const isOwner = Boolean(
    currentUser && currentUser.username.toLowerCase() === targetUsername.toLowerCase()
  );

  // Follow State for Visitors
  const [isFollowing, setIsFollowing] = useState(false);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // INLINE LOCAL PLACEHOLDER DATA (No separate mock-data file created per Rule 17)
  const [profileData, setProfileData] = useState<ProfileData>(() => ({
    user: {
      id: 'usr-aibal-001',
      username: targetUsername,
      firstName: targetUsername === 'aibal' ? 'Aibal' : 'Ava',
      lastName: targetUsername === 'aibal' ? 'Jacob' : 'Sol',
      displayName: targetUsername === 'aibal' ? 'Aibal Jacob' : 'Ava Sol',
      headline:
        targetUsername === 'aibal'
          ? 'Gameplay Programmer · Game Developer'
          : 'Lead Technical Artist & Shader Developer',
      location: 'Kerala, India',
      timezone: 'UTC+05:30 (IST)',
      experienceYears: 4,
      bio: 'Gameplay-focused developer interested in systemic mechanics, multiplayer experiences and technical game development. Passionate about architecture, engine optimization, and combat interaction design.',
      availability: 'Available for collaboration',
      isFounder: targetUsername === 'aibal',
      avatarUrl: '',
      bannerUrl: '',
    },
    professional: {
      roles: ['Gameplay Programmer', 'Systems Programmer', 'Game Developer'],
      specializations: ['Gameplay Systems', 'Multiplayer Mechanics', 'UI Systems', 'Combat Architecture', 'AI Behaviors'],
      skills: ['C++', 'C#', 'Python', 'Networking', 'Gameplay Ability System', 'Data Structures', 'Git'],
      tools: ['Unreal Engine 5', 'Visual Studio', 'Rider', 'Blender', 'Perforce', 'RenderDoc'],
      gameEngines: ['Unreal Engine 5', 'Unity', 'Godot'],
      genres: ['Action RPG', 'Systemic Horror', 'Tactical Multiplayer', 'Strategy'],
      platforms: ['PC (Steam/Epic)', 'PlayStation 5', 'Xbox Series X/S'],
    },
    experiences: [
      {
        id: 'exp-1',
        position: 'Senior Gameplay Programmer',
        company: 'Nexus Interactive',
        location: 'Remote',
        startDate: '2024',
        isCurrent: true,
        description: 'Built core gameplay systems, player interaction mechanics, and enemy AI behavior trees in Unreal Engine 5 using C++.',
        technologies: ['C++', 'Unreal Engine 5', 'Gameplay Ability System', 'Perforce'],
      },
      {
        id: 'exp-2',
        position: 'Game Developer & Systems Architect',
        company: 'Pantheon Studios',
        location: 'Kerala, India',
        startDate: '2022',
        endDate: '2024',
        isCurrent: false,
        description: 'Designed networked multiplayer movement synchronization, inventory pipelines, and custom physics interactions.',
        technologies: ['C++', 'C#', 'Unity', 'Git', 'PhysX'],
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'APJ Abdul Kalam Technological University',
        degree: 'Bachelor of Technology in Computer Science & Engineering',
        startDate: '2020',
        endDate: '2024',
        description: 'Specialized in computer graphics, real-time rendering algorithms, parallel computing, and game engine mechanics.',
      },
    ],
    portfolio: [
      {
        id: 'proj-helios',
        title: 'PROJECT HELIOS',
        description: 'Third-person action RPG prototype focused on dynamic combat hit-reaction systems, melee combos, and directional enemy AI behavior.',
        role: 'Lead Gameplay Programmer',
        gameEngine: 'Unreal Engine 5',
        genre: 'Action RPG',
        platform: 'PC',
        status: 'In Development',
        technologies: ['C++', 'GAS', 'Unreal Engine 5', 'Motion Matching'],
        projectUrl: 'https://github.com/aibaljacob/Pantheon',
      },
      {
        id: 'proj-aether',
        title: 'AETHER NETWORKING FRAMEWORK',
        description: 'Custom lightweight C++ multiplayer state serialization library designed for high-frequency physics replication across game clients.',
        role: 'Systems Engineer',
        gameEngine: 'Custom C++ Engine',
        genre: 'Multiplayer Tech',
        platform: 'PC / Cross-platform',
        status: 'Released',
        technologies: ['C++20', 'Sockets', 'FlatBuffers', 'CMake'],
        projectUrl: 'https://github.com/aibaljacob',
      },
    ],
    resume: {
      id: 'res-001',
      fileName: 'Aibal_Jacob_Gameplay_Developer_Resume.pdf',
      fileType: 'PDF Document',
      fileSize: '2.4 MB',
      updatedAt: '2 days ago',
      visibility: 'Public',
      downloadUrl: '#',
    },
    links: [
      { id: 'link-1', platform: 'github', displayName: 'GitHub Profile', url: 'https://github.com/aibaljacob' },
      { id: 'link-2', platform: 'linkedin', displayName: 'LinkedIn Professional', url: 'https://linkedin.com/in/aibaljacob' },
      { id: 'link-3', platform: 'artstation', displayName: 'ArtStation Showcase', url: 'https://artstation.com' },
      { id: 'link-4', platform: 'itchio', displayName: 'itch.io Game Demos', url: 'https://itch.io' },
    ],
    stats: {
      followersCount: 1248,
      followingCount: 184,
      profileCompletion: 85,
      portfolioCompletion: 75,
    },
    isOwner,
    isFollowing: false,
  }));

  // Toggle follow status
  const handleToggleFollow = () => {
    setIsFollowing((prev) => !prev);
    setProfileData((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        followersCount: !isFollowing ? prev.stats.followersCount + 1 : prev.stats.followersCount - 1,
      },
    }));
  };

  // Add / Edit / Delete Handlers for local state persistence during session
  const handleAddExperience = () => setIsEditModalOpen(true);
  const handleEditExperience = () => setIsEditModalOpen(true);
  const handleDeleteExperience = (id: string) => {
    setProfileData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  const handleAddEducation = () => setIsEditModalOpen(true);
  const handleEditEducation = () => setIsEditModalOpen(true);
  const handleDeleteEducation = (id: string) => {
    setProfileData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  };

  const handleAddProject = () => setIsEditModalOpen(true);
  const handleEditProject = () => setIsEditModalOpen(true);
  const handleDeleteProject = (id: string) => {
    setProfileData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((p) => p.id !== id),
    }));
  };

  const handleAddLink = () => setIsEditModalOpen(true);
  const handleEditLink = () => setIsEditModalOpen(true);
  const handleDeleteLink = (id: string) => {
    setProfileData((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== id),
    }));
  };

  const handleToggleResumeVisibility = () => {
    setProfileData((prev) => ({
      ...prev,
      resume: prev.resume
        ? {
            ...prev.resume,
            visibility: prev.resume.visibility === 'Public' ? 'Private' : 'Public',
          }
        : null,
    }));
  };

  const handleSaveModal = (updated: ProfileData) => {
    setProfileData(updated);
  };

  // Profile Content Render Engine
  const profileContent = (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Component */}
      <ProfileHeader
        user={profileData.user}
        stats={profileData.stats}
        isOwner={isOwner}
        isFollowing={isFollowing}
        onToggleFollow={handleToggleFollow}
        onOpenEditModal={() => setIsEditModalOpen(true)}
      />

      {/* Main Grid Layout: Desktop 2-column (Content Left, Sidebar Right), Mobile single-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left / Main Column (2 Spans on Desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <ProfileAbout user={profileData.user} />

          {/* Portfolio Showcase */}
          <PortfolioSection
            portfolio={profileData.portfolio}
            isOwner={isOwner}
            onAddProject={handleAddProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
          />

          {/* Professional Identity & Skills */}
          <ProfessionalIdentitySection identity={profileData.professional} />

          {/* Experience Timeline */}
          <ExperienceSection
            experiences={profileData.experiences}
            isOwner={isOwner}
            onAddExperience={handleAddExperience}
            onEditExperience={handleEditExperience}
            onDeleteExperience={handleDeleteExperience}
          />

          {/* Education */}
          <EducationSection
            education={profileData.education}
            isOwner={isOwner}
            onAddEducation={handleAddEducation}
            onEditEducation={handleEditEducation}
            onDeleteEducation={handleDeleteEducation}
          />
        </div>

        {/* Right Sidebar Column (1 Span on Desktop) */}
        <div className="space-y-8 sticky top-24">
          {/* Profile Completion (OWNER ONLY) */}
          {isOwner && (
            <ProfileCompletionCard
              stats={profileData.stats}
              onOpenEditModal={() => setIsEditModalOpen(true)}
            />
          )}

          {/* Official Resume */}
          <ResumeSection
            resume={profileData.resume}
            isOwner={isOwner}
            onReplaceResume={() => setIsEditModalOpen(true)}
            onDeleteResume={() => setProfileData((prev) => ({ ...prev, resume: null }))}
            onToggleVisibility={handleToggleResumeVisibility}
          />

          {/* External Links */}
          <LinksSection
            links={profileData.links}
            isOwner={isOwner}
            onAddLink={handleAddLink}
            onEditLink={handleEditLink}
            onDeleteLink={handleDeleteLink}
          />
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profileData={profileData}
        onSave={handleSaveModal}
      />
    </div>
  );

  // If viewer is logged in, wrap in DashboardLayout
  if (currentUser) {
    return <DashboardLayout user={currentUser}>{profileContent}</DashboardLayout>;
  }

  // If viewer is unauthenticated visitor, wrap in Public Layout (Navbar + Footer)
  return (
    <div className="min-h-screen bg-[#141312] text-[#e6e2df] flex flex-col font-sans relative selection:bg-[#48473f]">
      <div className="absolute top-0 left-0 right-0 h-[800px] global-ambient-light pointer-events-none z-0" />
      <Navbar />
      <main className="flex-1 relative z-10 py-10 px-4 sm:px-6 lg:px-8">
        {profileContent}
      </main>
      <Footer />
    </div>
  );
};