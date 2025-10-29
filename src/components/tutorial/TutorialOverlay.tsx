/**
 * Tutorial Overlay Component
 * Main component that orchestrates the tutorial experience
 */

import React, { useEffect } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { SpotlightHighlight } from './SpotlightHighlight';
import { TutorialModal } from './TutorialModal';
import { TutorialCompletionModal } from './TutorialCompletionModal';
import { cn } from '@/lib/utils';

interface TutorialOverlayProps {
  className?: string;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ className }) => {
  const {
    activeTutorial,
    currentStepIndex,
    showOverlay,
    highlightedElement,
    stopTutorial,
    isPlaying,
  } = useTutorial();

  // Handle escape key to close tutorial
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOverlay) {
        const confirmed = window.confirm(
          'Are you sure you want to exit this tutorial? Your progress will be saved.'
        );
        if (confirmed) {
          stopTutorial();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showOverlay, stopTutorial]);

  // Prevent body scroll when tutorial is active
  useEffect(() => {
    if (showOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showOverlay]);

  if (!showOverlay || !activeTutorial) {
    return null;
  }

  const currentStep = activeTutorial.steps[currentStepIndex];
  const totalSteps = activeTutorial.steps.length;

  // Check if tutorial is completed (on last step and not playing)
  const isCompleted = currentStepIndex >= totalSteps - 1 && !isPlaying;

  return (
    <>
      {/* Spotlight highlight for current step element */}
      {highlightedElement && currentStep.targetElement && (
        <SpotlightHighlight
          targetElement={currentStep.targetElement}
          className={className}
        />
      )}

      {/* Tutorial step modal */}
      {!isCompleted && (
        <TutorialModal
          tutorial={activeTutorial}
          currentStep={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          position={currentStep.position}
          onClose={stopTutorial}
          className={className}
        />
      )}

      {/* Tutorial completion modal */}
      {isCompleted && (
        <TutorialCompletionModal
          tutorial={activeTutorial}
          onClose={stopTutorial}
          className={className}
        />
      )}
    </>
  );
};

export default TutorialOverlay;
