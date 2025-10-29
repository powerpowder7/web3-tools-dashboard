/**
 * Tutorial Context
 * React Context for managing tutorial state across the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Tutorial,
  TutorialContextValue,
  UserProgress,
  HelpContent,
  TokenTemplate,
  SuccessStory,
  TutorialFeedback,
} from '@/types/tutorial';
import tutorialService from '@/services/tutorialService';
import { useSolanaWallet } from './SolanaWalletContext';

// ============================================================================
// CONTEXT DEFINITION
// ============================================================================

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const { publicKey } = useSolanaWallet();
  const userId = publicKey?.toString() || 'guest';

  // State management
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);
  const [helpTopic, setHelpTopic] = useState<HelpContent | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredTutorials] = useState<Tutorial[]>([]);
  const [templates, setTemplates] = useState<TokenTemplate[]>([]);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);

  // Auto-save progress interval
  useEffect(() => {
    if (activeTutorial && userProgress) {
      const interval = setInterval(() => {
        tutorialService.saveUserProgress(userProgress);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTutorial, userProgress]);

  // Load user progress on mount or wallet change
  useEffect(() => {
    loadUserProgress(userId);
  }, [userId]);

  // Track time spent on current step
  useEffect(() => {
    if (isPlaying && activeTutorial && userProgress) {
      const tutorialId = activeTutorial.id;
      const currentStep = activeTutorial.steps[currentStepIndex];

      const interval = setInterval(() => {
        const tutorialProgress = userProgress.tutorialsProgress[tutorialId];
        if (tutorialProgress) {
          const stepProgress = tutorialProgress.stepsProgress.find(
            (sp) => sp.stepId === currentStep.id
          );
          if (stepProgress) {
            stepProgress.timeSpent += 1;
            tutorialProgress.totalTimeSpent += 1;
            userProgress.totalTimeSpent += 1;
            setUserProgress({ ...userProgress });
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, activeTutorial, currentStepIndex, userProgress]);

  // ============================================================================
  // TUTORIAL CONTROL ACTIONS
  // ============================================================================

  const startTutorial = useCallback(
    async (tutorialId: string): Promise<void> => {
      try {
        const tutorial = await tutorialService.getTutorial(tutorialId);
        if (!tutorial) {
          throw new Error(`Tutorial ${tutorialId} not found`);
        }

        await tutorialService.startTutorial(tutorialId, userId);
        const progress = tutorialService.getUserProgress(userId);

        setActiveTutorial(tutorial);
        setCurrentStepIndex(progress.tutorialsProgress[tutorialId]?.currentStepIndex || 0);
        setIsPlaying(true);
        setIsPaused(false);
        setShowOverlay(true);
        setUserProgress(progress);

        // Highlight first step element if available
        const firstStep = tutorial.steps[0];
        if (firstStep.targetElement) {
          setHighlightedElement(firstStep.targetElement);
        }
      } catch (error) {
        console.error('Error starting tutorial:', error);
        throw error;
      }
    },
    [userId]
  );

  const pauseTutorial = useCallback((): void => {
    if (activeTutorial) {
      setIsPaused(true);
      setIsPlaying(false);
      tutorialService.pauseTutorial(activeTutorial.id, userId);
    }
  }, [activeTutorial, userId]);

  const resumeTutorial = useCallback((): void => {
    if (activeTutorial) {
      setIsPaused(false);
      setIsPlaying(true);
      tutorialService.resumeTutorial(activeTutorial.id, userId);
    }
  }, [activeTutorial, userId]);

  const stopTutorial = useCallback((): void => {
    if (activeTutorial) {
      tutorialService.pauseTutorial(activeTutorial.id, userId);
    }
    setActiveTutorial(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setIsPaused(false);
    setShowOverlay(false);
    setHighlightedElement(null);
  }, [activeTutorial, userId]);

  const nextStep = useCallback((): void => {
    if (!activeTutorial) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < activeTutorial.steps.length) {
      setCurrentStepIndex(nextIndex);

      // Highlight next step element
      const nextStep = activeTutorial.steps[nextIndex];
      if (nextStep.targetElement) {
        setHighlightedElement(nextStep.targetElement);

        // Scroll to element
        setTimeout(() => {
          const element = document.querySelector(nextStep.targetElement!);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } else {
      // Tutorial completed
      completeTutorialHandler();
    }
  }, [activeTutorial, currentStepIndex, userId]);

  const previousStep = useCallback((): void => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);

      if (activeTutorial) {
        const prevStep = activeTutorial.steps[prevIndex];
        if (prevStep.targetElement) {
          setHighlightedElement(prevStep.targetElement);

          // Scroll to element
          setTimeout(() => {
            const element = document.querySelector(prevStep.targetElement!);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    }
  }, [activeTutorial, currentStepIndex]);

  const goToStep = useCallback(
    (stepIndex: number): void => {
      if (!activeTutorial) return;

      if (stepIndex >= 0 && stepIndex < activeTutorial.steps.length) {
        setCurrentStepIndex(stepIndex);

        const step = activeTutorial.steps[stepIndex];
        if (step.targetElement) {
          setHighlightedElement(step.targetElement);

          setTimeout(() => {
            const element = document.querySelector(step.targetElement!);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    },
    [activeTutorial]
  );

  const completeStep = useCallback(
    async (stepId: string): Promise<void> => {
      if (!activeTutorial) return;

      try {
        await tutorialService.completeStep(activeTutorial.id, stepId, userId);
        const progress = tutorialService.getUserProgress(userId);
        setUserProgress(progress);

        // Move to next step automatically
        nextStep();
      } catch (error) {
        console.error('Error completing step:', error);
      }
    },
    [activeTutorial, userId, nextStep]
  );

  const completeTutorialHandler = useCallback(async (): Promise<void> => {
    if (!activeTutorial) return;

    try {
      await tutorialService.completeTutorial(activeTutorial.id, userId);
      const progress = tutorialService.getUserProgress(userId);
      setUserProgress(progress);

      // Check for new achievements
      await tutorialService.checkAchievements(userId);

      // Show completion overlay (to be implemented in UI)
      setTimeout(() => {
        stopTutorial();
      }, 3000);
    } catch (error) {
      console.error('Error completing tutorial:', error);
    }
  }, [activeTutorial, userId, stopTutorial]);

  const skipTutorial = useCallback((): void => {
    if (activeTutorial) {
      // Save current progress before skipping
      tutorialService.pauseTutorial(activeTutorial.id, userId);
    }
    stopTutorial();
  }, [activeTutorial, userId, stopTutorial]);

  // ============================================================================
  // PROGRESS MANAGEMENT
  // ============================================================================

  const loadUserProgress = useCallback(async (userId: string): Promise<void> => {
    try {
      const progress = tutorialService.getUserProgress(userId);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  }, []);

  const updateProgress = useCallback(
    async (updates: Partial<UserProgress>): Promise<void> => {
      if (!userProgress) return;

      try {
        await tutorialService.updateProgress(userId, updates);
        const progress = tutorialService.getUserProgress(userId);
        setUserProgress(progress);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    },
    [userId, userProgress]
  );

  const bookmarkTutorial = useCallback(
    async (tutorialId: string): Promise<void> => {
      try {
        await tutorialService.bookmarkTutorial(tutorialId, userId);
        const progress = tutorialService.getUserProgress(userId);
        setUserProgress(progress);
      } catch (error) {
        console.error('Error bookmarking tutorial:', error);
      }
    },
    [userId]
  );

  // ============================================================================
  // HELP SYSTEM
  // ============================================================================

  const showContextualHelp = useCallback(async (elementId: string): Promise<void> => {
    try {
      const help = await tutorialService.getContextualHelp(elementId);
      if (help) {
        setHelpTopic(help);
        setShowHelp(true);
      }
    } catch (error) {
      console.error('Error showing contextual help:', error);
    }
  }, []);

  const hideContextualHelp = useCallback((): void => {
    setShowHelp(false);
    setHelpTopic(null);
  }, []);

  const searchHelp = useCallback(async (query: string): Promise<HelpContent[]> => {
    try {
      setSearchQuery(query);
      const results = await tutorialService.searchHelp(query);
      return results;
    } catch (error) {
      console.error('Error searching help:', error);
      return [];
    }
  }, []);

  // ============================================================================
  // ACHIEVEMENTS
  // ============================================================================

  const unlockAchievement = useCallback(
    async (achievementId: string): Promise<void> => {
      try {
        await tutorialService.unlockAchievement(achievementId, userId);
        const progress = tutorialService.getUserProgress(userId);
        setUserProgress(progress);
      } catch (error) {
        console.error('Error unlocking achievement:', error);
      }
    },
    [userId]
  );

  const checkAchievements = useCallback(async (): Promise<void> => {
    try {
      await tutorialService.checkAchievements(userId);
      const progress = tutorialService.getUserProgress(userId);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [userId]);

  // ============================================================================
  // COMMUNITY
  // ============================================================================

  const loadTemplates = useCallback(async (): Promise<void> => {
    try {
      const templates = await tutorialService.getTemplates();
      setTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  const saveTemplate = useCallback(
    async (template: Omit<TokenTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
      try {
        const newTemplate: TokenTemplate = {
          ...template,
          id: `template_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
          likes: 0,
          rating: 0,
        };
        await tutorialService.saveTemplate(newTemplate);
        await loadTemplates();
      } catch (error) {
        console.error('Error saving template:', error);
      }
    },
    [loadTemplates]
  );

  const loadSuccessStories = useCallback(async (): Promise<void> => {
    try {
      const stories = await tutorialService.getSuccessStories();
      setSuccessStories(stories);
    } catch (error) {
      console.error('Error loading success stories:', error);
    }
  }, []);

  const submitSuccessStory = useCallback(
    async (story: Omit<SuccessStory, 'id' | 'submittedAt'>): Promise<void> => {
      try {
        const newStory: SuccessStory = {
          ...story,
          id: `story_${Date.now()}`,
          submittedAt: new Date(),
          verified: false,
          featured: false,
          likes: 0,
          views: 0,
        };
        await tutorialService.submitSuccessStory(newStory);
        await loadSuccessStories();
      } catch (error) {
        console.error('Error submitting success story:', error);
      }
    },
    [loadSuccessStories]
  );

  // ============================================================================
  // FEEDBACK
  // ============================================================================

  const submitFeedback = useCallback(
    async (feedback: Omit<TutorialFeedback, 'submittedAt'>): Promise<void> => {
      try {
        await tutorialService.submitFeedback(feedback);
      } catch (error) {
        console.error('Error submitting feedback:', error);
      }
    },
    []
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: TutorialContextValue = {
    // State
    activeTutorial,
    currentStepIndex,
    isPlaying,
    isPaused,
    userProgress,
    showOverlay,
    showHelp,
    highlightedElement,
    helpTopic,
    searchQuery,
    filteredTutorials,
    templates,
    successStories,

    // Tutorial control
    startTutorial,
    pauseTutorial,
    resumeTutorial,
    stopTutorial,
    nextStep,
    previousStep,
    goToStep,
    completeStep,
    skipTutorial,

    // Progress management
    loadUserProgress,
    updateProgress,
    bookmarkTutorial,

    // Help system
    showContextualHelp,
    hideContextualHelp,
    searchHelp,

    // Achievements
    unlockAchievement,
    checkAchievements,

    // Community
    loadTemplates,
    saveTemplate,
    loadSuccessStories,
    submitSuccessStory,

    // Feedback
    submitFeedback,
  };

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useTutorial = (): TutorialContextValue => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export default TutorialContext;
