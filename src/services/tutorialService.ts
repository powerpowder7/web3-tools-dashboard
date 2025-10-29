/**
 * Tutorial Service
 * Core business logic for the educational & tutorial system
 */

import {
  Tutorial,
  TutorialProgress,
  UserProgress,
  Achievement,
  HelpContent,
  TutorialFeedback,
  TokenTemplate,
  SuccessStory,
  StepProgress,
  DifficultyLevel,
  STORAGE_KEYS,
} from '@/types/tutorial';
import analytics from './analytics';

class TutorialService {
  private tutorials: Map<string, Tutorial> = new Map();
  private helpContent: Map<string, HelpContent> = new Map();
  private achievements: Map<string, Achievement> = new Map();

  constructor() {
    this.initializeContent();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeContent(): void {
    // Content will be loaded from tutorial data files
    // This is a placeholder - actual content loaded in loadTutorials()
  }

  // ============================================================================
  // TUTORIAL MANAGEMENT
  // ============================================================================

  async getTutorial(id: string): Promise<Tutorial | null> {
    return this.tutorials.get(id) || null;
  }

  async getAllTutorials(): Promise<Tutorial[]> {
    return Array.from(this.tutorials.values());
  }

  async getTutorialsByCategory(category: string): Promise<Tutorial[]> {
    return Array.from(this.tutorials.values()).filter(
      (t) => t.category === category
    );
  }

  async getTutorialsByDifficulty(difficulty: DifficultyLevel): Promise<Tutorial[]> {
    return Array.from(this.tutorials.values()).filter(
      (t) => t.difficulty === difficulty
    );
  }

  async searchTutorials(query: string): Promise<Tutorial[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tutorials.values()).filter(
      (t) =>
        t.title.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async startTutorial(tutorialId: string, userId: string): Promise<void> {
    const tutorial = await this.getTutorial(tutorialId);
    if (!tutorial) {
      throw new Error(`Tutorial ${tutorialId} not found`);
    }

    const progress = this.getUserProgress(userId);

    // Initialize tutorial progress
    const tutorialProgress: TutorialProgress = {
      tutorialId,
      status: 'in_progress',
      startedAt: new Date(),
      lastAccessedAt: new Date(),
      currentStepIndex: 0,
      stepsProgress: tutorial.steps.map((step) => ({
        stepId: step.id,
        completed: false,
        attempts: 0,
        timeSpent: 0,
        hintsViewed: 0,
      })),
      totalTimeSpent: 0,
      bookmarked: false,
    };

    progress.tutorialsProgress[tutorialId] = tutorialProgress;
    if (!progress.inProgressTutorials.includes(tutorialId)) {
      progress.inProgressTutorials.push(tutorialId);
    }

    this.saveUserProgress(progress);

    // Track analytics
    analytics.track('tutorial_started', {
      tutorial_id: tutorialId,
      tutorial_title: tutorial.title,
      difficulty: tutorial.difficulty,
      user_id: userId,
    });
  }

  async completeStep(
    tutorialId: string,
    stepId: string,
    userId: string
  ): Promise<void> {
    const progress = this.getUserProgress(userId);
    const tutorialProgress = progress.tutorialsProgress[tutorialId];

    if (!tutorialProgress) {
      throw new Error(`No progress found for tutorial ${tutorialId}`);
    }

    const stepProgress = tutorialProgress.stepsProgress.find(
      (sp) => sp.stepId === stepId
    );

    if (!stepProgress) {
      throw new Error(`Step ${stepId} not found in tutorial ${tutorialId}`);
    }

    stepProgress.completed = true;
    stepProgress.completedAt = new Date();
    tutorialProgress.lastAccessedAt = new Date();

    // Move to next step
    const tutorial = await this.getTutorial(tutorialId);
    if (tutorial) {
      const currentStepIndex = tutorial.steps.findIndex((s) => s.id === stepId);
      if (currentStepIndex < tutorial.steps.length - 1) {
        tutorialProgress.currentStepIndex = currentStepIndex + 1;
      } else {
        // Tutorial completed
        await this.completeTutorial(tutorialId, userId);
      }
    }

    this.saveUserProgress(progress);

    // Track analytics
    analytics.track('tutorial_step_completed', {
      tutorial_id: tutorialId,
      step_id: stepId,
      user_id: userId,
      time_spent: stepProgress.timeSpent,
    });
  }

  async completeTutorial(tutorialId: string, userId: string): Promise<void> {
    const progress = this.getUserProgress(userId);
    const tutorialProgress = progress.tutorialsProgress[tutorialId];

    if (!tutorialProgress) {
      throw new Error(`No progress found for tutorial ${tutorialId}`);
    }

    tutorialProgress.status = 'completed';
    tutorialProgress.completedAt = new Date();

    // Add to completed tutorials
    if (!progress.completedTutorials.includes(tutorialId)) {
      progress.completedTutorials.push(tutorialId);
    }

    // Remove from in-progress
    progress.inProgressTutorials = progress.inProgressTutorials.filter(
      (id) => id !== tutorialId
    );

    // Update statistics
    progress.statistics.tutorialsCompleted++;
    progress.statistics.completionRate =
      (progress.statistics.tutorialsCompleted / progress.statistics.tutorialsStarted) * 100;

    // Award achievements
    const tutorial = await this.getTutorial(tutorialId);
    if (tutorial) {
      for (const achievement of tutorial.rewards) {
        await this.unlockAchievement(achievement.id, userId);
      }
    }

    this.saveUserProgress(progress);

    // Track analytics
    analytics.track('tutorial_completed', {
      tutorial_id: tutorialId,
      user_id: userId,
      total_time: tutorialProgress.totalTimeSpent,
      completion_rate: progress.statistics.completionRate,
    });

    // Check for additional achievements
    await this.checkAchievements(userId);
  }

  async pauseTutorial(tutorialId: string, userId: string): Promise<void> {
    const progress = this.getUserProgress(userId);
    const tutorialProgress = progress.tutorialsProgress[tutorialId];

    if (tutorialProgress) {
      tutorialProgress.status = 'paused';
      tutorialProgress.lastAccessedAt = new Date();
      this.saveUserProgress(progress);
    }
  }

  async resumeTutorial(tutorialId: string, userId: string): Promise<Tutorial | null> {
    const progress = this.getUserProgress(userId);
    const tutorialProgress = progress.tutorialsProgress[tutorialId];

    if (tutorialProgress) {
      tutorialProgress.status = 'in_progress';
      tutorialProgress.lastAccessedAt = new Date();
      this.saveUserProgress(progress);
      return this.getTutorial(tutorialId);
    }

    return null;
  }

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  getUserProgress(userId: string): UserProgress {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);

    if (stored) {
      try {
        const allProgress = JSON.parse(stored);
        if (allProgress[userId]) {
          // Convert date strings back to Date objects
          const progress = allProgress[userId];
          progress.lastActivity = new Date(progress.lastActivity);
          progress.statistics.lastLoginDate = new Date(progress.statistics.lastLoginDate);

          // Convert dates in tutorial progress
          Object.values(progress.tutorialsProgress).forEach((tp: any) => {
            tp.startedAt = new Date(tp.startedAt);
            tp.lastAccessedAt = new Date(tp.lastAccessedAt);
            if (tp.completedAt) tp.completedAt = new Date(tp.completedAt);

            tp.stepsProgress.forEach((sp: any) => {
              if (sp.completedAt) sp.completedAt = new Date(sp.completedAt);
            });
          });

          return progress;
        }
      } catch (error) {
        console.error('Error parsing user progress:', error);
      }
    }

    // Initialize new user progress
    return this.initializeUserProgress(userId);
  }

  private initializeUserProgress(userId: string): UserProgress {
    return {
      userId,
      completedTutorials: [],
      inProgressTutorials: [],
      tutorialsProgress: {},
      achievements: [],
      skillLevel: 'beginner',
      totalTimeSpent: 0,
      lastActivity: new Date(),
      preferences: {
        autoPlayTutorials: false,
        enableTooltips: true,
        skipAnimations: false,
        showHints: true,
        enableNotifications: true,
        preferredDifficulty: 'beginner',
      },
      statistics: {
        tutorialsStarted: 0,
        tutorialsCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        totalAchievements: 0,
        currentStreak: 0,
        longestStreak: 0,
        toolsUsed: [],
        lastLoginDate: new Date(),
      },
    };
  }

  saveUserProgress(progress: UserProgress): void {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
    let allProgress: Record<string, UserProgress> = {};

    if (stored) {
      try {
        allProgress = JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored progress:', error);
      }
    }

    progress.lastActivity = new Date();
    allProgress[progress.userId] = progress;

    localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(allProgress));
  }

  async updateProgress(userId: string, updates: Partial<UserProgress>): Promise<void> {
    const progress = this.getUserProgress(userId);
    Object.assign(progress, updates);
    this.saveUserProgress(progress);
  }

  async updateStepProgress(
    tutorialId: string,
    stepId: string,
    userId: string,
    updates: Partial<StepProgress>
  ): Promise<void> {
    const progress = this.getUserProgress(userId);
    const tutorialProgress = progress.tutorialsProgress[tutorialId];

    if (tutorialProgress) {
      const stepProgress = tutorialProgress.stepsProgress.find(
        (sp) => sp.stepId === stepId
      );

      if (stepProgress) {
        Object.assign(stepProgress, updates);
        this.saveUserProgress(progress);
      }
    }
  }

  // ============================================================================
  // ACHIEVEMENTS
  // ============================================================================

  async unlockAchievement(achievementId: string, userId: string): Promise<void> {
    const progress = this.getUserProgress(userId);
    const achievement = this.achievements.get(achievementId);

    if (!achievement) {
      console.warn(`Achievement ${achievementId} not found`);
      return;
    }

    // Check if already unlocked
    const alreadyUnlocked = progress.achievements.some((a) => a.id === achievementId);
    if (alreadyUnlocked) {
      return;
    }

    const unlockedAchievement = { ...achievement, unlockedAt: new Date() };
    progress.achievements.push(unlockedAchievement);
    progress.statistics.totalAchievements++;

    this.saveUserProgress(progress);

    // Track analytics
    analytics.track('achievement_unlocked', {
      achievement_id: achievementId,
      achievement_title: achievement.title,
      rarity: achievement.rarity,
      user_id: userId,
    });
  }

  async checkAchievements(userId: string): Promise<Achievement[]> {
    const progress = this.getUserProgress(userId);
    const newAchievements: Achievement[] = [];

    for (const [id, achievement] of this.achievements) {
      // Skip if already unlocked
      if (progress.achievements.some((a) => a.id === id)) {
        continue;
      }

      let shouldUnlock = false;

      switch (achievement.requirements.type) {
        case 'complete_tutorial':
          if (achievement.requirements.tutorialIds) {
            shouldUnlock = achievement.requirements.tutorialIds.every((tutId) =>
              progress.completedTutorials.includes(tutId)
            );
          }
          break;

        case 'complete_all_tutorials':
          shouldUnlock = progress.statistics.tutorialsCompleted >= achievement.requirements.value;
          break;

        case 'streak':
          shouldUnlock = progress.statistics.currentStreak >= achievement.requirements.value;
          break;

        case 'use_tool':
          if (achievement.requirements.toolIds) {
            shouldUnlock = achievement.requirements.toolIds.every((toolId) =>
              progress.statistics.toolsUsed.includes(toolId)
            );
          }
          break;
      }

      if (shouldUnlock) {
        await this.unlockAchievement(id, userId);
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  // ============================================================================
  // HELP SYSTEM
  // ============================================================================

  async getContextualHelp(elementId: string): Promise<HelpContent | null> {
    return this.helpContent.get(elementId) || null;
  }

  async searchHelp(query: string): Promise<HelpContent[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.helpContent.values()).filter(
      (help) =>
        help.title.toLowerCase().includes(lowerQuery) ||
        help.basic.toLowerCase().includes(lowerQuery) ||
        help.advanced.toLowerCase().includes(lowerQuery) ||
        help.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async getAllHelpContent(): Promise<HelpContent[]> {
    return Array.from(this.helpContent.values());
  }

  // ============================================================================
  // FEEDBACK
  // ============================================================================

  async submitFeedback(feedback: Omit<TutorialFeedback, 'submittedAt'>): Promise<void> {
    const feedbackWithTimestamp: TutorialFeedback = {
      ...feedback,
      submittedAt: new Date(),
    };

    // Store feedback locally
    const stored = localStorage.getItem('tutorial_feedback');
    const allFeedback: TutorialFeedback[] = stored ? JSON.parse(stored) : [];
    allFeedback.push(feedbackWithTimestamp);
    localStorage.setItem('tutorial_feedback', JSON.stringify(allFeedback));

    // Track analytics
    analytics.track('tutorial_feedback_submitted', {
      tutorial_id: feedback.tutorialId,
      step_id: feedback.stepId,
      rating: feedback.rating,
      type: feedback.feedbackType,
      user_id: feedback.userId,
    });
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async getTemplates(): Promise<TokenTemplate[]> {
    const stored = localStorage.getItem('token_templates');
    return stored ? JSON.parse(stored) : [];
  }

  async getTemplate(id: string): Promise<TokenTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find((t) => t.id === id) || null;
  }

  async saveTemplate(template: TokenTemplate): Promise<void> {
    const templates = await this.getTemplates();
    const existingIndex = templates.findIndex((t) => t.id === template.id);

    if (existingIndex >= 0) {
      templates[existingIndex] = { ...template, updatedAt: new Date() };
    } else {
      templates.push(template);
    }

    localStorage.setItem('token_templates', JSON.stringify(templates));

    // Track analytics
    analytics.track('template_saved', {
      template_id: template.id,
      category: template.category,
      is_public: template.isPublic,
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    localStorage.setItem('token_templates', JSON.stringify(filtered));
  }

  // ============================================================================
  // SUCCESS STORIES
  // ============================================================================

  async getSuccessStories(): Promise<SuccessStory[]> {
    const stored = localStorage.getItem('success_stories');
    return stored ? JSON.parse(stored) : [];
  }

  async submitSuccessStory(story: SuccessStory): Promise<void> {
    const stories = await this.getSuccessStories();
    stories.push(story);
    localStorage.setItem('success_stories', JSON.stringify(stories));

    // Track analytics
    analytics.track('success_story_submitted', {
      story_id: story.id,
      category: story.category,
      tools_used: story.toolsUsed,
    });
  }

  // ============================================================================
  // CONTENT LOADING
  // ============================================================================

  loadTutorials(tutorials: Tutorial[]): void {
    tutorials.forEach((tutorial) => {
      this.tutorials.set(tutorial.id, tutorial);
    });
  }

  loadHelpContent(content: HelpContent[]): void {
    content.forEach((help) => {
      this.helpContent.set(help.elementId, help);
    });
  }

  loadAchievements(achievements: Achievement[]): void {
    achievements.forEach((achievement) => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  calculateSkillLevel(progress: UserProgress): DifficultyLevel {
    const completed = progress.statistics.tutorialsCompleted;
    const completionRate = progress.statistics.completionRate;

    if (completed >= 10 && completionRate >= 80) {
      return 'expert';
    } else if (completed >= 5 && completionRate >= 60) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  getRecommendedTutorials(userId: string): Tutorial[] {
    const progress = this.getUserProgress(userId);
    const skillLevel = this.calculateSkillLevel(progress);
    const completed = new Set(progress.completedTutorials);

    return Array.from(this.tutorials.values())
      .filter((tutorial) => {
        // Filter out completed tutorials
        if (completed.has(tutorial.id)) return false;

        // Check prerequisites
        if (tutorial.prerequisites) {
          const hasPrerequisites = tutorial.prerequisites.every((prereq) =>
            completed.has(prereq)
          );
          if (!hasPrerequisites) return false;
        }

        // Match difficulty level or one level higher
        if (skillLevel === 'beginner') {
          return tutorial.difficulty === 'beginner' || tutorial.difficulty === 'intermediate';
        } else if (skillLevel === 'intermediate') {
          return tutorial.difficulty === 'intermediate' || tutorial.difficulty === 'expert';
        } else {
          return tutorial.difficulty === 'expert';
        }
      })
      .slice(0, 5); // Return top 5 recommendations
  }

  async bookmarkTutorial(tutorialId: string, userId: string): Promise<void> {
    const progress = this.getUserProgress(userId);
    const tutorialProgress = progress.tutorialsProgress[tutorialId];

    if (tutorialProgress) {
      tutorialProgress.bookmarked = !tutorialProgress.bookmarked;
      this.saveUserProgress(progress);
    }
  }

  getBookmarkedTutorials(userId: string): string[] {
    const progress = this.getUserProgress(userId);
    return Object.entries(progress.tutorialsProgress)
      .filter(([_, tp]) => tp.bookmarked)
      .map(([id, _]) => id);
  }
}

// Export singleton instance
export const tutorialService = new TutorialService();
export default tutorialService;
