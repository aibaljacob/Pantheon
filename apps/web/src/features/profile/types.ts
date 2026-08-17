export interface ProfileUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  headline: string;
  location: string;
  timezone: string;
  experienceYears: number;
  bio: string;
  availability: 'Available for collaboration' | 'Open to offers' | 'Not available' | 'Founder active';
  isFounder?: boolean;
  role?: 'USER' | 'ADMINISTRATOR' | string;
  email?: string;
  createdAt?: string;
}

export interface TaxonomyItem {
  id: string;
  name: string;
  description?: string | null;
}

export interface TaxonomyResponse {
  data: TaxonomyItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateIdentityIdsPayload {
  roleIds?: string[];
  specializationIds?: string[];
  skillIds?: string[];
  toolIds?: string[];
  gameEngineIds?: string[];
  genreIds?: string[];
  platformIds?: string[];
}

export interface ProfessionalIdentity {
  roles: (TaxonomyItem | string)[];
  specializations: (TaxonomyItem | string)[];
  skills: (TaxonomyItem | string)[];
  tools: (TaxonomyItem | string)[];
  gameEngines: (TaxonomyItem | string)[];
  genres: (TaxonomyItem | string)[];
  platforms: (TaxonomyItem | string)[];
}

export interface ExperienceItem {
  id: string;
  position: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  technologies: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  coverUrl?: string;
  description: string;
  role: string;
  technologies: string[];
  gameEngine: string;
  genre: string;
  platform: string;
  status: 'In Development' | 'Released' | 'Prototype' | 'Alpha' | 'Beta';
  projectUrl?: string;
  mediaUrls?: string[];
}

export interface Resume {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  updatedAt: string;
  downloadUrl?: string;
  visibility: 'Public' | 'Private';
}

export interface ProfileLink {
  id: string;
  platform: 'github' | 'linkedin' | 'artstation' | 'itchio' | 'steam' | 'website' | 'custom';
  displayName: string;
  url: string;
}

export interface ProfileStats {
  followersCount: number;
  followingCount: number;
  profileCompletion: number;
  portfolioCompletion: number;
}

export interface ProfileData {
  user: ProfileUser;
  professional: ProfessionalIdentity;
  experiences: ExperienceItem[];
  education: EducationItem[];
  portfolio: PortfolioItem[];
  resume: Resume | null;
  links: ProfileLink[];
  stats: ProfileStats;
  isOwner?: boolean;
  isFollowing?: boolean;
}
