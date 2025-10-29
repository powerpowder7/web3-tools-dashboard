/**
 * Tutorial System Type Definitions
 * Comprehensive types for the educational & tutorial system
 */

// ============================================================================
// CORE TUTORIAL TYPES
// ============================================================================

export type DifficultyLevel = 'beginner' | 'intermediate' | 'expert';
export type TutorialStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';
export type StepPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type HighlightStyle = 'spotlight' | 'border' | 'glow' | 'pulse';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // CSS selector for element to highlight
  position: StepPosition;
  validation?: {
    type: 'click' | 'input' | 'custom';
    selector?: string;
    customValidator?: string; // Function name to call
  };
  hints: string[];
  estimatedTime: number; // in seconds
  prerequisites?: string[]; // IDs of required previous steps
  skipAllowed?: boolean;
  imageUrl?: string; // Optional screenshot or diagram
  videoUrl?: string; // Optional video tutorial
  codeExample?: {
    language: string;
    code: string;
    explanation: string;
  };
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'token-tools' | 'wallet-tools' | 'security' | 'advanced' | 'getting-started';
  difficulty: DifficultyLevel;
  estimatedDuration: number; // total seconds
  steps: TutorialStep[];
  rewards: Achievement[];
  nextRecommended?: string[]; // Next tutorial IDs to take
  prerequisites?: string[]; // Required tutorial IDs
  tags: string[];
  icon?: string; // Lucide icon name
  coverImage?: string;
  targetPage?: string; // The page/route where this tutorial should be accessed
}

// ============================================================================
// USER PROGRESS TRACKING
// ============================================================================

export interface StepProgress {
  stepId: string;
  completed: boolean;
  completedAt?: Date;
  attempts: number;
  timeSpent: number; // seconds
  hintsViewed: number;
}

export interface TutorialProgress {
  tutorialId: string;
  status: TutorialStatus;
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  currentStepIndex: number;
  stepsProgress: StepProgress[];
  totalTimeSpent: number; // seconds
  bookmarked: boolean;
}

export interface UserProgress {
  userId: string; // Wallet address or unique identifier
  completedTutorials: string[];
  inProgressTutorials: string[];
  tutorialsProgress: Record<string, TutorialProgress>;
  achievements: Achievement[];
  skillLevel: DifficultyLevel;
  totalTimeSpent: number; // seconds across all tutorials
  lastActivity: Date;
  preferences: UserPreferences;
  statistics: UserStatistics;
}

export interface UserPreferences {
  autoPlayTutorials: boolean;
  enableTooltips: boolean;
  skipAnimations: boolean;
  showHints: boolean;
  enableNotifications: boolean;
  preferredDifficulty: DifficultyLevel;
}

export interface UserStatistics {
  tutorialsStarted: number;
  tutorialsCompleted: number;
  completionRate: number; // percentage
  averageCompletionTime: number; // seconds
  totalAchievements: number;
  currentStreak: number; // days
  longestStreak: number; // days
  toolsUsed: string[];
  lastLoginDate: Date;
}

// ============================================================================
// ACHIEVEMENTS & GAMIFICATION
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'completion' | 'streak' | 'mastery' | 'community' | 'special';
  icon: string; // Lucide icon name or emoji
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: 'complete_tutorial' | 'complete_all_tutorials' | 'use_tool' | 'streak' | 'custom';
    value: number;
    tutorialIds?: string[];
    toolIds?: string[];
  };
  reward?: {
    type: 'badge' | 'certificate' | 'unlock';
    value: string;
  };
  unlockedAt?: Date;
  progress?: number; // 0-100 percentage
}

export interface Certificate {
  id: string;
  userId: string;
  tutorialId: string;
  tutorialTitle: string;
  issuedAt: Date;
  completionTime: number; // seconds
  certificateUrl?: string; // Generated PDF URL
  verificationCode: string;
}

// ============================================================================
// CONTEXTUAL HELP SYSTEM
// ============================================================================

export interface HelpContent {
  id: string;
  elementId: string; // Associated UI element
  title: string;
  basic: string; // Simple explanation for beginners
  advanced: string; // Technical details for experts
  risks?: string[]; // Security considerations
  examples?: string[]; // Real-world use cases
  relatedConcepts?: string[]; // Links to other help topics
  videoUrl?: string;
  articleUrl?: string;
  tags: string[];
  glossaryTerms?: GlossaryTerm[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  relatedTerms?: string[];
  externalLinks?: {
    title: string;
    url: string;
  }[];
}

export interface Tooltip {
  content: string;
  position: StepPosition;
  trigger: 'hover' | 'click' | 'focus';
  maxWidth?: number;
  showArrow?: boolean;
  delay?: number; // ms
}

// ============================================================================
// COMMUNITY FEATURES
// ============================================================================

export interface TokenTemplate {
  id: string;
  name: string;
  description: string;
  category: 'governance' | 'utility' | 'rewards' | 'meme' | 'stable' | 'experimental';
  author: {
    walletAddress: string;
    username?: string;
    verified: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  configuration: {
    tokenType: string;
    totalSupply: string;
    decimals: number;
    features: string[];
    metadata?: Record<string, any>;
  };
  usageCount: number;
  likes: number;
  rating: number; // 1-5 stars
  tags: string[];
  isPublic: boolean;
  isPremium: boolean;
  screenshots?: string[];
  successStory?: string; // Reference to success story ID
}

export interface SuccessStory {
  id: string;
  title: string;
  author: {
    walletAddress: string;
    username?: string;
    avatarUrl?: string;
  };
  submittedAt: Date;
  category: string;
  summary: string;
  fullStory: string;
  metrics?: {
    label: string;
    value: string;
  }[];
  toolsUsed: string[];
  templateUsed?: string; // Template ID
  testimonial?: string;
  verified: boolean;
  featured: boolean;
  likes: number;
  views: number;
  images?: string[];
}

export interface CommunityResource {
  id: string;
  type: 'article' | 'video' | 'template' | 'story' | 'discussion';
  title: string;
  url?: string;
  author: string;
  publishedAt: Date;
  tags: string[];
  difficulty: DifficultyLevel;
  estimatedTime: number; // minutes
  upvotes: number;
  featured: boolean;
}

// ============================================================================
// TUTORIAL FEEDBACK & ANALYTICS
// ============================================================================

export interface TutorialFeedback {
  tutorialId: string;
  stepId?: string;
  userId: string;
  rating: number; // 1-5 stars
  feedbackType: 'helpful' | 'confusing' | 'bug' | 'suggestion';
  comment?: string;
  submittedAt: Date;
}

export interface TutorialAnalytics {
  tutorialId: string;
  views: number;
  starts: number;
  completions: number;
  completionRate: number; // percentage
  averageCompletionTime: number; // seconds
  averageRating: number;
  dropOffPoints: {
    stepId: string;
    dropOffRate: number;
  }[];
  feedbackCount: number;
  popularityScore: number;
}

// ============================================================================
// TUTORIAL STATE MANAGEMENT
// ============================================================================

export interface TutorialState {
  // Current active tutorial
  activeTutorial: Tutorial | null;
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;

  // User progress
  userProgress: UserProgress | null;

  // UI state
  showOverlay: boolean;
  showHelp: boolean;
  highlightedElement: string | null;
  helpTopic: HelpContent | null;

  // Search & discovery
  searchQuery: string;
  filteredTutorials: Tutorial[];

  // Community
  templates: TokenTemplate[];
  successStories: SuccessStory[];
}

export interface TutorialContextValue extends TutorialState {
  // Tutorial control actions
  startTutorial: (tutorialId: string) => Promise<void>;
  pauseTutorial: () => void;
  resumeTutorial: () => void;
  stopTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  completeStep: (stepId: string) => Promise<void>;
  skipTutorial: () => void;

  // Progress management
  loadUserProgress: (userId: string) => Promise<void>;
  updateProgress: (progress: Partial<UserProgress>) => Promise<void>;
  bookmarkTutorial: (tutorialId: string) => void;

  // Help system
  showContextualHelp: (elementId: string) => void;
  hideContextualHelp: () => void;
  searchHelp: (query: string) => Promise<HelpContent[]>;

  // Achievements
  unlockAchievement: (achievementId: string) => Promise<void>;
  checkAchievements: () => Promise<void>;

  // Community
  loadTemplates: () => Promise<void>;
  saveTemplate: (template: Omit<TokenTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  loadSuccessStories: () => Promise<void>;
  submitSuccessStory: (story: Omit<SuccessStory, 'id' | 'submittedAt'>) => Promise<void>;

  // Feedback
  submitFeedback: (feedback: Omit<TutorialFeedback, 'submittedAt'>) => Promise<void>;
}

// ============================================================================
// LEARNING PATH
// ============================================================================

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // total minutes
  tutorials: string[]; // Ordered tutorial IDs
  completionRate?: number;
  icon?: string;
  color?: string;
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Web3Tools',
    description: 'Learn the basics of wallet creation, token management, and blockchain interactions',
    difficulty: 'beginner',
    estimatedDuration: 30,
    tutorials: ['wallet-basics', 'token-creator-intro', 'multi-sender-basics'],
    icon: 'Rocket',
    color: 'blue',
  },
  {
    id: 'token-mastery',
    title: 'Token Creation Mastery',
    description: 'Master advanced token creation with custom features and security best practices',
    difficulty: 'intermediate',
    estimatedDuration: 60,
    tutorials: ['token-creator-basics', 'token-creator-advanced', 'token-security', 'token-metadata'],
    icon: 'Coins',
    color: 'purple',
  },
  {
    id: 'security-expert',
    title: 'Security Expert Path',
    description: 'Learn to protect your assets and implement security best practices',
    difficulty: 'expert',
    estimatedDuration: 90,
    tutorials: ['wallet-security', 'token-security', 'anti-snipe', 'authority-management'],
    icon: 'Shield',
    color: 'green',
  },
  {
    id: 'bulk-operations',
    title: 'Bulk Operations & Automation',
    description: 'Efficiently manage multiple wallets and batch transactions',
    difficulty: 'intermediate',
    estimatedDuration: 45,
    tutorials: ['wallet-creator-advanced', 'multi-sender-advanced', 'csv-operations', 'automation-tips'],
    icon: 'Zap',
    color: 'yellow',
  },
];

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  USER_PROGRESS: 'web3tools_user_progress',
  TUTORIAL_STATE: 'web3tools_tutorial_state',
  ACHIEVEMENTS: 'web3tools_achievements',
  PREFERENCES: 'web3tools_tutorial_preferences',
  BOOKMARKS: 'web3tools_tutorial_bookmarks',
  DISMISSED_TUTORIALS: 'web3tools_dismissed_tutorials',
  LAST_SYNC: 'web3tools_last_sync',
} as const;

// ============================================================================
// CONSTANTS
// ============================================================================

export const TUTORIAL_CONSTANTS = {
  MAX_HINTS_PER_STEP: 3,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  SPOTLIGHT_PADDING: 20, // pixels
  TOOLTIP_DELAY: 300, // milliseconds
  ANIMATION_DURATION: 300, // milliseconds
  MIN_COMPLETION_TIME: 5, // seconds - to prevent accidental skips
  ACHIEVEMENT_ANIMATION_DURATION: 2000, // milliseconds
  CERTIFICATE_GENERATION_DELAY: 1000, // milliseconds
} as const;
