/**
 * Tutorial Modal Component
 * Displays tutorial step content with navigation controls
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  SkipForward,
  Lightbulb,
  Check,
  Clock,
  BookmarkPlus,
  Bookmark,
} from 'lucide-react';
import { Tutorial, TutorialStep, StepPosition } from '@/types/tutorial';
import { useTutorial } from '@/contexts/TutorialContext';

interface TutorialModalProps {
  tutorial: Tutorial;
  currentStep: TutorialStep;
  currentStepIndex: number;
  totalSteps: number;
  position?: StepPosition;
  onClose: () => void;
  className?: string;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  tutorial,
  currentStep,
  currentStepIndex,
  totalSteps,
  position = 'center',
  onClose,
  className,
}) => {
  const {
    isPaused,
    pauseTutorial,
    resumeTutorial,
    previousStep,
    completeStep,
    skipTutorial,
    userProgress,
    bookmarkTutorial,
  } = useTutorial();

  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const tutorialProgress = userProgress?.tutorialsProgress[tutorial.id];
  const isBookmarked = tutorialProgress?.bookmarked || false;

  useEffect(() => {
    setShowHints(false);
    setCurrentHintIndex(0);
  }, [currentStepIndex]);

  const handleNext = () => {
    // Mark current step as completed
    completeStep(currentStep.id);
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleToggleHint = () => {
    setShowHints(!showHints);
    // Track hint usage if needed in the future
  };

  const handleNextHint = () => {
    if (currentHintIndex < currentStep.hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    }
  };

  const handlePreviousHint = () => {
    if (currentHintIndex > 0) {
      setCurrentHintIndex(currentHintIndex - 1);
    }
  };

  const handleBookmark = () => {
    bookmarkTutorial(tutorial.id);
  };

  // Position-based styling
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'left':
        return 'left-4 top-1/2 -translate-y-1/2';
      case 'right':
        return 'right-4 top-1/2 -translate-y-1/2';
      case 'center':
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  return (
    <div
      className={cn(
        'fixed z-[9999] max-w-lg w-full mx-4',
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
        getPositionClasses(),
        className
      )}
    >
      <Card className="shadow-2xl border-2 border-blue-500/50">
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  Step {currentStepIndex + 1} of {totalSteps}
                </Badge>
                <Badge
                  variant={tutorial.difficulty === 'beginner' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {tutorial.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-lg">{currentStep.title}</CardTitle>
              <CardDescription className="text-sm mt-1">{tutorial.title}</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleBookmark}
              >
                {isBookmarked ? (
                  <Bookmark className="h-4 w-4 text-blue-600 fill-current" />
                ) : (
                  <BookmarkPlus className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="space-y-4">
          {/* Step description */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {currentStep.description}
            </p>
          </div>

          {/* Estimated time */}
          {currentStep.estimatedTime && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Estimated time: {Math.ceil(currentStep.estimatedTime / 60)} min</span>
            </div>
          )}

          {/* Code example */}
          {currentStep.codeExample && (
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-100">
                <code>{currentStep.codeExample.code}</code>
              </pre>
              {currentStep.codeExample.explanation && (
                <p className="text-xs text-gray-400 mt-2">
                  {currentStep.codeExample.explanation}
                </p>
              )}
            </div>
          )}

          {/* Hints section */}
          {currentStep.hints && currentStep.hints.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleToggleHint}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {showHints ? 'Hide' : 'Show'} Hints
              </Button>

              {showHints && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        {currentStep.hints[currentHintIndex]}
                      </p>

                      {/* Hint navigation */}
                      {currentStep.hints.length > 1 && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-yellow-700 dark:text-yellow-400">
                            Hint {currentHintIndex + 1} of {currentStep.hints.length}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={handlePreviousHint}
                              disabled={currentHintIndex === 0}
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={handleNextHint}
                              disabled={currentHintIndex === currentStep.hints.length - 1}
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-2 pt-2">
            {/* Pause/Resume */}
            <Button
              variant="outline"
              size="sm"
              onClick={isPaused ? resumeTutorial : pauseTutorial}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>

            {/* Previous */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {/* Next/Complete */}
            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>

            {/* Skip tutorial */}
            {currentStep.skipAllowed !== false && (
              <Button variant="ghost" size="sm" onClick={skipTutorial}>
                <SkipForward className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Skip warning for non-skippable steps */}
          {currentStep.skipAllowed === false && (
            <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
              This step must be completed to continue
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialModal;
