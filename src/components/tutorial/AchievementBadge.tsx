/**
 * Achievement Badge Component
 * Displays unlocked achievements with animations
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Award, Star, Zap, Shield, Flame, Lock } from 'lucide-react';
import { Achievement } from '@/types/tutorial';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  unlocked?: boolean;
  showProgress?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'md',
  unlocked = false,
  showProgress = false,
  animated = true,
  className,
  onClick,
}) => {
  const getIcon = () => {
    // Use provided icon name or fallback to trophy
    const iconMap: Record<string, React.ReactNode> = {
      Trophy: <Trophy className="w-full h-full" />,
      Award: <Award className="w-full h-full" />,
      Star: <Star className="w-full h-full" />,
      Zap: <Zap className="w-full h-full" />,
      Shield: <Shield className="w-full h-full" />,
      Flame: <Flame className="w-full h-full" />,
    };

    return iconMap[achievement.icon] || <Trophy className="w-full h-full" />;
  };

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return 'from-purple-500 to-pink-500';
      case 'epic':
        return 'from-blue-500 to-purple-500';
      case 'rare':
        return 'from-green-500 to-blue-500';
      case 'common':
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorderColor = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return 'border-purple-500';
      case 'epic':
        return 'border-blue-500';
      case 'rare':
        return 'border-green-500';
      case 'common':
      default:
        return 'border-gray-400';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'w-8 h-8 p-1.5',
          text: 'text-xs',
          badge: 'text-[10px] px-1.5 py-0',
        };
      case 'lg':
        return {
          icon: 'w-16 h-16 p-3',
          text: 'text-base',
          badge: 'text-xs px-2.5 py-0.5',
        };
      case 'md':
      default:
        return {
          icon: 'w-12 h-12 p-2.5',
          text: 'text-sm',
          badge: 'text-xs px-2 py-0.5',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (size === 'sm') {
    // Compact badge view
    return (
      <div
        className={cn(
          'relative inline-flex items-center gap-2',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <div
          className={cn(
            'relative rounded-full',
            sizeClasses.icon,
            unlocked
              ? `bg-gradient-to-br ${getRarityColor()}`
              : 'bg-gray-300 dark:bg-gray-700',
            animated && unlocked && 'animate-pulse'
          )}
        >
          {unlocked ? (
            getIcon()
          ) : (
            <Lock className="w-full h-full text-gray-500" />
          )}
        </div>
        {unlocked && (
          <span className={cn('font-medium', sizeClasses.text)}>
            {achievement.title}
          </span>
        )}
      </div>
    );
  }

  // Full card view
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-2 transition-all duration-300',
        unlocked
          ? `${getRarityBorderColor()} hover:shadow-lg hover:scale-105`
          : 'border-gray-300 dark:border-gray-700 opacity-60',
        onClick && 'cursor-pointer',
        animated && unlocked && 'animate-in zoom-in-95 duration-500',
        className
      )}
      onClick={onClick}
    >
      {/* Background glow effect for unlocked achievements */}
      {unlocked && (
        <div
          className={cn(
            'absolute inset-0 opacity-10 blur-xl',
            `bg-gradient-to-br ${getRarityColor()}`
          )}
        />
      )}

      <CardContent className="relative p-4 flex flex-col items-center text-center space-y-3">
        {/* Icon */}
        <div className="relative">
          {/* Glow effect */}
          {unlocked && (
            <div
              className={cn(
                'absolute inset-0 rounded-full blur-md opacity-50',
                `bg-gradient-to-br ${getRarityColor()}`,
                animated && 'animate-pulse'
              )}
            />
          )}

          {/* Icon container */}
          <div
            className={cn(
              'relative rounded-full',
              sizeClasses.icon,
              unlocked
                ? `bg-gradient-to-br ${getRarityColor()} text-white`
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500',
              'flex items-center justify-center'
            )}
          >
            {unlocked ? getIcon() : <Lock className="w-full h-full" />}
          </div>
        </div>

        {/* Title and rarity */}
        <div className="space-y-1.5">
          <h4 className={cn('font-semibold', sizeClasses.text)}>
            {achievement.title}
          </h4>
          <Badge
            variant="outline"
            className={cn(
              sizeClasses.badge,
              unlocked ? getRarityBorderColor() : 'border-gray-400'
            )}
          >
            {achievement.rarity}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {achievement.description}
        </p>

        {/* Unlock date */}
        {unlocked && achievement.unlockedAt && (
          <p className="text-[10px] text-gray-500 dark:text-gray-500">
            Unlocked {formatDate(achievement.unlockedAt)}
          </p>
        )}

        {/* Progress bar */}
        {!unlocked && showProgress && achievement.progress !== undefined && (
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Progress</span>
              <span>{achievement.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  `bg-gradient-to-r ${getRarityColor()}`
                )}
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Locked overlay */}
        {!unlocked && (
          <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to format date
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default AchievementBadge;
