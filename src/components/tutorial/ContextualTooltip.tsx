/**
 * Contextual Tooltip Component
 * Smart tooltips with rich help content that adapts to user skill level
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HelpCircle,
  Info,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { HelpContent, StepPosition } from '@/types/tutorial';
import { useTutorial } from '@/contexts/TutorialContext';

interface ContextualTooltipProps {
  elementId: string;
  content?: string; // Simple content for quick tooltips
  helpContent?: HelpContent; // Rich help content
  position?: StepPosition;
  trigger?: 'hover' | 'click' | 'focus';
  showIcon?: boolean;
  icon?: 'help' | 'info' | 'warning';
  className?: string;
  children?: React.ReactNode;
}

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  elementId,
  content,
  helpContent: propHelpContent,
  position = 'top',
  trigger = 'hover',
  showIcon = true,
  icon = 'help',
  className,
  children,
}) => {
  const { showContextualHelp, userProgress } = useTutorial();
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadedHelp, _setLoadedHelp] = useState<HelpContent | null>(propHelpContent || null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const skillLevel = userProgress?.skillLevel || 'beginner';

  useEffect(() => {
    // Load help content if not provided
    if (!propHelpContent && elementId) {
      showContextualHelp(elementId);
      // This will be loaded from context when implemented
    }
  }, [elementId, propHelpContent, showContextualHelp]);

  useEffect(() => {
    if (trigger === 'click') {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          tooltipRef.current &&
          triggerRef.current &&
          !tooltipRef.current.contains(event.target as Node) &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, trigger]);

  const handleTrigger = () => {
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsOpen(false);
      setShowAdvanced(false);
    }
  };

  const getIconComponent = () => {
    switch (icon) {
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'help':
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const displayContent = loadedHelp || propHelpContent;

  return (
    <div className={cn('relative inline-flex', className)}>
      {/* Trigger element */}
      <div
        ref={triggerRef}
        className={cn('inline-flex items-center cursor-help', trigger === 'click' && 'cursor-pointer')}
        onClick={handleTrigger}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => trigger === 'focus' && setIsOpen(true)}
        onBlur={() => trigger === 'focus' && setIsOpen(false)}
      >
        {children || (showIcon && (
          <div
            className={cn(
              'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors',
              icon === 'warning' && 'text-orange-500 hover:text-orange-600'
            )}
          >
            {getIconComponent()}
          </div>
        ))}
      </div>

      {/* Tooltip content */}
      {isOpen && (content || displayContent) && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 w-80',
            'animate-in fade-in slide-in-from-bottom-2 duration-200',
            getPositionClasses()
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Card className="shadow-lg border-2">
            <CardContent className="p-4 space-y-3">
              {/* Simple content */}
              {content && !displayContent && (
                <p className="text-sm text-gray-700 dark:text-gray-300">{content}</p>
              )}

              {/* Rich help content */}
              {displayContent && (
                <>
                  {/* Title and skill level badge */}
                  {displayContent.title && (
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{displayContent.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {skillLevel}
                      </Badge>
                    </div>
                  )}

                  {/* Basic explanation (always shown) */}
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {displayContent.basic}
                  </div>

                  {/* Advanced content (toggleable) */}
                  {displayContent.advanced && (skillLevel === 'intermediate' || skillLevel === 'expert') && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                      >
                        {showAdvanced ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show Technical Details
                          </>
                        )}
                      </Button>

                      {showAdvanced && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg animate-in slide-in-from-top-2 duration-200">
                          {displayContent.advanced}
                        </div>
                      )}
                    </>
                  )}

                  {/* Risk warnings */}
                  {displayContent.risks && displayContent.risks.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-orange-900 dark:text-orange-100 mb-1">
                            Security Considerations:
                          </p>
                          <ul className="text-xs text-orange-800 dark:text-orange-200 space-y-1">
                            {displayContent.risks.map((risk, index) => (
                              <li key={index}>• {risk}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Examples */}
                  {displayContent.examples && displayContent.examples.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        Examples:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {displayContent.examples.map((example, index) => (
                          <li key={index}>• {example}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Glossary terms */}
                  {displayContent.glossaryTerms && displayContent.glossaryTerms.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        Key Terms:
                      </p>
                      {displayContent.glossaryTerms.map((term, index) => (
                        <div key={index} className="text-xs">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {term.term}:
                          </span>{' '}
                          <span className="text-gray-600 dark:text-gray-400">
                            {term.definition}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* External links */}
                  {(displayContent.articleUrl || displayContent.videoUrl) && (
                    <div className="flex gap-2 pt-2">
                      {displayContent.articleUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          asChild
                        >
                          <a
                            href={displayContent.articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            Read More
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {displayContent.videoUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          asChild
                        >
                          <a
                            href={displayContent.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Watch Tutorial
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Related concepts */}
                  {displayContent.relatedConcepts && displayContent.relatedConcepts.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Related:{' '}
                        {displayContent.relatedConcepts.map((concept, index) => (
                          <span key={index}>
                            {index > 0 && ', '}
                            <button className="text-blue-600 dark:text-blue-400 hover:underline">
                              {concept}
                            </button>
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Arrow pointer */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-white dark:bg-gray-800 border-l-2 border-t-2 border-gray-200 dark:border-gray-700 rotate-45',
              position === 'top' && 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
              position === 'bottom' && 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[225deg]',
              position === 'left' && 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-[135deg]',
              position === 'right' && 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-[315deg]'
            )}
          />
        </div>
      )}
    </div>
  );
};

export default ContextualTooltip;
