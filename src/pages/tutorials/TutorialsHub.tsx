/**
 * Tutorials Hub Page
 * Main landing page for the educational system with learning paths
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Search,
  Clock,
  Award,
  TrendingUp,
  Star,
  Play,
  CheckCircle2,
  Bookmark,
  Filter,
  ChevronRight,
  Rocket,
  Shield,
  Zap,
  Coins,
} from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { Tutorial, LearningPath, DifficultyLevel } from '@/types/tutorial';
import { TUTORIALS, LEARNING_PATHS } from '@/data/tutorials';
import tutorialService from '@/services/tutorialService';
import { AchievementBadge } from '@/components/tutorial/AchievementBadge';

export const TutorialsHub: React.FC = () => {
  const navigate = useNavigate();
  const { userProgress, startTutorial } = useTutorial();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>(TUTORIALS);

  // Load tutorials into service
  useEffect(() => {
    tutorialService.loadTutorials(TUTORIALS);
  }, []);

  // Filter tutorials based on search and difficulty
  useEffect(() => {
    let filtered = TUTORIALS;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((t) => t.difficulty === selectedDifficulty);
    }

    setFilteredTutorials(filtered);
  }, [searchQuery, selectedDifficulty]);

  const handleStartTutorial = async (tutorialId: string) => {
    try {
      // Find the tutorial to get its target page
      const tutorial = TUTORIALS.find(t => t.id === tutorialId);
      await startTutorial(tutorialId);

      // Navigate to the tutorial's target page or dashboard if not specified
      const targetPath = tutorial?.targetPage || '/';
      navigate(targetPath);
    } catch (error) {
      console.error('Failed to start tutorial:', error);
    }
  };

  const getTutorialStatus = (tutorialId: string): 'not-started' | 'in-progress' | 'completed' => {
    if (!userProgress) return 'not-started';
    if (userProgress.completedTutorials.includes(tutorialId)) return 'completed';
    if (userProgress.inProgressTutorials.includes(tutorialId)) return 'in-progress';
    return 'not-started';
  };

  const getRecommendedTutorials = (): Tutorial[] => {
    if (!userProgress) return TUTORIALS.slice(0, 3);
    return tutorialService.getRecommendedTutorials(userProgress.userId);
  };

  const bookmarkedTutorialIds = userProgress
    ? tutorialService.getBookmarkedTutorials(userProgress.userId)
    : [];

  const recentAchievements = userProgress?.achievements.slice(-3).reverse() || [];

  const completionRate =
    userProgress && TUTORIALS.length > 0
      ? Math.round((userProgress.completedTutorials.length / TUTORIALS.length) * 100)
      : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Hub</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Master Web3 tools with step-by-step tutorials and interactive guides
        </p>
      </div>

      {/* Stats Overview */}
      {userProgress && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{userProgress.completedTutorials.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completionRate}%</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Completion Rate</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{userProgress.achievements.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Achievements</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold capitalize">{userProgress.skillLevel}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Skill Level</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  size="md"
                  unlocked={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Paths */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Learning Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEARNING_PATHS.map((path) => (
            <LearningPathCard key={path.id} path={path} userProgress={userProgress} />
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tutorials..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('all')}
          >
            All
          </Button>
          <Button
            variant={selectedDifficulty === 'beginner' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('beginner')}
          >
            Beginner
          </Button>
          <Button
            variant={selectedDifficulty === 'intermediate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('intermediate')}
          >
            Intermediate
          </Button>
          <Button
            variant={selectedDifficulty === 'expert' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('expert')}
          >
            Expert
          </Button>
        </div>
      </div>

      {/* Recommended Tutorials */}
      {userProgress && getRecommendedTutorials().length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recommended For You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getRecommendedTutorials().map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                status={getTutorialStatus(tutorial.id)}
                isBookmarked={bookmarkedTutorialIds.includes(tutorial.id)}
                onStart={() => handleStartTutorial(tutorial.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Tutorials */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          All Tutorials
          {searchQuery && ` - ${filteredTutorials.length} results`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              status={getTutorialStatus(tutorial.id)}
              isBookmarked={bookmarkedTutorialIds.includes(tutorial.id)}
              onStart={() => handleStartTutorial(tutorial.id)}
            />
          ))}
        </div>

        {filteredTutorials.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No tutorials found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface LearningPathCardProps {
  path: LearningPath;
  userProgress: any;
}

const LearningPathCard: React.FC<LearningPathCardProps> = ({ path, userProgress }) => {
  const completedCount = path.tutorials.filter((id) =>
    userProgress?.completedTutorials.includes(id)
  ).length;
  const progress = (completedCount / path.tutorials.length) * 100;

  const getPathIcon = () => {
    const iconMap: Record<string, React.ReactNode> = {
      Rocket: <Rocket className="h-6 w-6" />,
      Coins: <Coins className="h-6 w-6" />,
      Shield: <Shield className="h-6 w-6" />,
      Zap: <Zap className="h-6 w-6" />,
    };
    return iconMap[path.icon || 'Rocket'] || <Rocket className="h-6 w-6" />;
  };

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-orange-600',
  };

  const bgGradient = colorMap[path.color || 'blue'];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={cn('p-3 rounded-lg bg-gradient-to-br text-white', bgGradient)}>
            {getPathIcon()}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{path.title}</CardTitle>
            <Badge variant="outline" className="mt-1 text-xs">
              {path.difficulty}
            </Badge>
          </div>
        </div>
        <CardDescription className="mt-2">{path.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium">
                {completedCount}/{path.tutorials.length}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn('h-full transition-all duration-500 bg-gradient-to-r', bgGradient)}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{path.estimatedDuration} minutes</span>
          </div>

          {/* Action button */}
          <Button className="w-full" variant="outline">
            {progress === 100 ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Completed
              </>
            ) : progress > 0 ? (
              <>
                Continue Learning
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Start Path
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface TutorialCardProps {
  tutorial: Tutorial;
  status: 'not-started' | 'in-progress' | 'completed';
  isBookmarked: boolean;
  onStart: () => void;
}

const TutorialCard: React.FC<TutorialCardProps> = ({
  tutorial,
  status,
  isBookmarked,
  onStart,
}) => {
  const getDifficultyColor = () => {
    switch (tutorial.difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'expert':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all hover:scale-[1.02]">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {tutorial.title}
              {status === 'completed' && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn('text-xs', getDifficultyColor())}>
                {tutorial.difficulty}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                {Math.ceil(tutorial.estimatedDuration / 60)}m
              </div>
            </div>
          </div>
          {isBookmarked && <Bookmark className="h-4 w-4 text-blue-600 fill-current" />}
        </div>
        <CardDescription className="mt-2 text-sm line-clamp-2">
          {tutorial.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {tutorial.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Action button */}
          <Button
            className="w-full"
            variant={status === 'completed' ? 'outline' : 'default'}
            onClick={onStart}
          >
            {status === 'completed' ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Review
              </>
            ) : status === 'in-progress' ? (
              <>
                Continue
                <Play className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Start Tutorial
                <Play className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorialsHub;
