import heroImage from '../../assets/hero.png';
import type {
  ActivityItem,
  DashboardProject,
  InsightItem,
  NotificationItem,
  TaskItem,
} from './types';

export const featuredProject: DashboardProject = {
  id: 'ethereal-odyssey',
  title: 'Ethereal Odyssey',
  genre: 'Action RPG',
  engine: 'Unreal 5.5',
  stage: 'Vertical Slice',
  progress: 68,
  teamSize: 12,
  openTasks: 7,
  coverImage: heroImage,
  milestone: 'Combat Polish',
  assignedTasks: 3,
  onlineMembers: ['ER', 'MV', 'ST', 'YL'],
};

export const projects: DashboardProject[] = [
  featuredProject,
  {
    id: 'starforge',
    title: 'Starforge',
    genre: 'Sci-Fi Strategy',
    engine: 'Unity 6',
    stage: 'Pre-Production',
    progress: 34,
    teamSize: 7,
    openTasks: 11,
    coverImage: heroImage,
    milestone: 'System Design',
    assignedTasks: 2,
    onlineMembers: ['KD', 'NJ', 'MS'],
  },
  {
    id: 'emberline',
    title: 'Emberline',
    genre: 'Narrative Adventure',
    engine: 'Godot 4',
    stage: 'Prototype',
    progress: 51,
    teamSize: 5,
    openTasks: 4,
    coverImage: heroImage,
    milestone: 'Narrative Pass',
    assignedTasks: 1,
    onlineMembers: ['AR', 'TC'],
  },
  {
    id: 'morrowgate',
    title: 'Morrowgate',
    genre: 'Tactical Shooter',
    engine: 'Unreal 5.4',
    stage: 'Alpha',
    progress: 79,
    teamSize: 9,
    openTasks: 6,
    coverImage: heroImage,
    milestone: 'AI Behavior',
    assignedTasks: 4,
    onlineMembers: ['SK', 'DK', 'LT'],
  },
];

export const tasks: TaskItem[] = [
  { id: 'task-1', title: 'Refine combat animation blending', projectName: 'Ethereal Odyssey', priority: 'High', dueDate: 'Today, 5:00 PM', status: 'In Progress', bucket: 'Due Today' },
  { id: 'task-2', title: 'Review shader optimization notes', projectName: 'Starforge', priority: 'Medium', dueDate: 'Today, 7:30 PM', status: 'Pending Review', bucket: 'Due Today' },
  { id: 'task-3', title: 'Prepare UI layout feedback', projectName: 'Emberline', priority: 'Low', dueDate: 'Tomorrow', status: 'Queued', bucket: 'Upcoming' },
  { id: 'task-4', title: 'Confirm playtest build notes', projectName: 'Morrowgate', priority: 'High', dueDate: 'Friday', status: 'Waiting', bucket: 'Upcoming' },
  { id: 'task-5', title: 'Submit environment lighting pass', projectName: 'Ethereal Odyssey', priority: 'High', dueDate: 'Yesterday', status: 'Overdue', bucket: 'Overdue' },
];

export const notifications: NotificationItem[] = [
  { id: 'notif-1', title: 'Project Invitation', description: 'Nova Forge invited you to join their Unreal 5 production team.', timestamp: '4 min ago', unread: true, category: 'Invitation' },
  { id: 'notif-2', title: 'Task Assignment', description: 'You were assigned a combat polish task on Ethereal Odyssey.', timestamp: '18 min ago', unread: true, category: 'Task' },
  { id: 'notif-3', title: 'Portfolio View Update', description: 'Your featured reel was viewed 24 times this week.', timestamp: '1 hour ago', unread: false, category: 'Portfolio' },
  { id: 'notif-4', title: 'Mentioned in comment', description: 'Sarah tagged you in a design review thread.', timestamp: '2 hours ago', unread: false, category: 'Comment' },
  { id: 'notif-5', title: 'AI Match Update', description: 'Three studios matched your recruitment profile this morning.', timestamp: 'Today', unread: true, category: 'AI' },
];

export const insights: InsightItem[] = [
  { id: 'insight-1', title: 'You match 8 new projects', description: 'Your engine stack and portfolio now align with eight active productions.', icon: 'spark', actionLabel: 'Review matches' },
  { id: 'insight-2', title: 'Portfolio is 90% complete', description: 'Add one featured case study to unlock stronger studio recommendations.', icon: 'portfolio', actionLabel: 'Manage portfolio' },
  { id: 'insight-3', title: 'Add Unreal Engine to improve discovery', description: 'Profiles with explicit engine tags receive more founder inquiries.', icon: 'engine' },
  { id: 'insight-4', title: 'Your project is missing a UI Designer', description: 'Pantheon found high-fit designers available for your current milestone.', icon: 'role', actionLabel: 'Find designers' },
  { id: 'insight-5', title: 'Three developers match your recruitment needs', description: 'Shortlist candidates with gameplay, tools, and performance backgrounds.', icon: 'team', actionLabel: 'View candidates' },
];

export const activity: ActivityItem[] = [
  { id: 'activity-1', title: 'John completed Combat System', description: 'Milestone progress was pushed to 68% for Ethereal Odyssey.', timestamp: '12 min ago' },
  { id: 'activity-2', title: 'Sarah uploaded new concept art', description: 'Two new art boards were attached to the visual direction thread.', timestamp: '37 min ago' },
  { id: 'activity-3', title: 'Vertical Slice milestone reached', description: 'The team moved the project into review for founder approval.', timestamp: '1 hour ago' },
  { id: 'activity-4', title: 'New applicant joined your project', description: 'A gameplay programmer applied through your public project page.', timestamp: 'Today' },
];

export const recommendedProjects = [
  { title: 'Sky Harbor', tag: 'Action Adventure', engine: 'Unreal 5.5', match: '96% match' },
  { title: 'Iron Bloom', tag: 'Tactical RPG', engine: 'Unity 6', match: '91% match' },
  { title: 'Northline', tag: 'Narrative Sim', engine: 'Godot 4', match: '88% match' },
  { title: 'Glass Circuit', tag: 'Cyberpunk ARPG', engine: 'Unreal 5.4', match: '84% match' },
];

export const recommendedDevelopers = [
  { name: 'Elena Rostova', role: 'Technical Artist', specialty: 'Unreal / VFX', fit: '94% fit' },
  { name: 'Marcus Vance', role: 'Graphics Programmer', specialty: 'Rendering / Shader', fit: '92% fit' },
  { name: 'Sora Takahashi', role: 'UI Designer', specialty: 'Game UX / Motion', fit: '89% fit' },
];

export const trendingStudios = [
  { name: 'Aetheria Interactive', focus: 'AA Action RPG', openings: 12 },
  { name: 'Obsidian Realm', focus: 'Premium Indie', openings: 5 },
  { name: 'VoxelForge', focus: 'Procedural Worlds', openings: 8 },
];