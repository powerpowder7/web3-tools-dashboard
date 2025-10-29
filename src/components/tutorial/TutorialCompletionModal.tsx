/**
 * Tutorial Completion Modal
 * Displays congratulations and achievements when tutorial is completed
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Star,
  Award,
  ChevronRight,
  Download,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Tutorial } from '@/types/tutorial';
import { useTutorial } from '@/contexts/TutorialContext';

interface TutorialCompletionModalProps {
  tutorial: Tutorial;
  onClose: () => void;
  className?: string;
}

export const TutorialCompletionModal: React.FC<TutorialCompletionModalProps> = ({
  tutorial,
  onClose,
  className,
}) => {
  const { userProgress, checkAchievements } = useTutorial();
  const [showConfetti, setShowConfetti] = useState(true);
  const [newAchievements, _setNewAchievements] = useState(tutorial.rewards || []);

  const tutorialProgress = userProgress?.tutorialsProgress[tutorial.id];
  const timeSpent = tutorialProgress?.totalTimeSpent || 0;
  const formattedTime = formatTime(timeSpent);

  useEffect(() => {
    // Check for any additional achievements
    checkAchievements();

    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [checkAchievements]);

  const handleDownloadCertificate = () => {
    // TODO: Generate and download PDF certificate
    console.log('Download certificate for:', tutorial.id);
  };

  const handleShare = () => {
    // TODO: Share completion on social media
    console.log('Share completion for:', tutorial.id);
  };

  const handleContinue = () => {
    onClose();
    // TODO: Navigate to next recommended tutorial if available
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm',
        'animate-in fade-in duration-300',
        className
      )}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <Card className="max-w-2xl w-full shadow-2xl border-2 border-purple-500/50 animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center pb-6">
          {/* Success icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-6">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tutorial Complete!
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Congratulations! You've completed{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{tutorial.title}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {tutorial.steps.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Steps Completed</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formattedTime}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
            </div>
          </div>

          {/* Achievements earned */}
          {newAchievements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-lg">Achievements Earned</h3>
              </div>
              <div className="space-y-2">
                {newAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800 animate-in slide-in-from-left duration-500"
                  >
                    <div className="flex-shrink-0">
                      <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {achievement.title}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        achievement.rarity === 'legendary' && 'border-purple-500 text-purple-700',
                        achievement.rarity === 'epic' && 'border-blue-500 text-blue-700',
                        achievement.rarity === 'rare' && 'border-green-500 text-green-700'
                      )}
                    >
                      {achievement.rarity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next recommendations */}
          {tutorial.nextRecommended && tutorial.nextRecommended.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">What's Next?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Continue your learning journey with these recommended tutorials:
              </p>
              <div className="space-y-2">
                {tutorial.nextRecommended.slice(0, 2).map((tutorialId) => (
                  <div
                    key={tutorialId}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <Star className="h-4 w-4 text-blue-600" />
                    <span className="text-sm flex-1">{tutorialId}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCertificate}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share Achievement
            </Button>
          </div>

          <Button
            variant="default"
            size="lg"
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Continue Learning
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
};

// Helper function to format time
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

export default TutorialCompletionModal;
