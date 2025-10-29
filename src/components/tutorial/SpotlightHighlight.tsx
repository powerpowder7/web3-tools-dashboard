/**
 * Spotlight Highlight Component
 * Creates a spotlight effect to highlight specific elements during tutorials
 */

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { TUTORIAL_CONSTANTS } from '@/types/tutorial';

interface SpotlightHighlightProps {
  targetElement: string; // CSS selector
  padding?: number;
  onElementClick?: () => void;
  className?: string;
}

export const SpotlightHighlight: React.FC<SpotlightHighlightProps> = ({
  targetElement,
  padding = TUTORIAL_CONSTANTS.SPOTLIGHT_PADDING,
  onElementClick,
  className,
}) => {
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateElementRect = () => {
      const element = document.querySelector(targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementRect(rect);
        setIsVisible(true);

        // Scroll element into view if not fully visible
        const isInView =
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth;

        if (!isInView) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
          // Wait for scroll to complete
          setTimeout(updateElementRect, 500);
        }
      } else {
        setIsVisible(false);
      }
    };

    // Initial update
    updateElementRect();

    // Update on resize or scroll
    const handleUpdate = () => {
      requestAnimationFrame(updateElementRect);
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    // Observe DOM mutations for dynamic content
    const observer = new MutationObserver(handleUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      observer.disconnect();
    };
  }, [targetElement]);

  useEffect(() => {
    if (elementRect && onElementClick) {
      const element = document.querySelector(targetElement);
      if (element) {
        const handleClick = (e: Event) => {
          onElementClick();
        };
        element.addEventListener('click', handleClick);
        return () => {
          element.removeEventListener('click', handleClick);
        };
      }
    }
  }, [targetElement, elementRect, onElementClick]);

  if (!isVisible || !elementRect) {
    return null;
  }

  // Calculate spotlight dimensions
  const spotlightStyle = {
    top: elementRect.top - padding,
    left: elementRect.left - padding,
    width: elementRect.width + padding * 2,
    height: elementRect.height + padding * 2,
  };

  return (
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 pointer-events-none z-[9998]',
        'transition-opacity duration-300',
        className
      )}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        maskImage: `
          linear-gradient(transparent, transparent),
          radial-gradient(
            ellipse ${spotlightStyle.width}px ${spotlightStyle.height}px at ${
          spotlightStyle.left + spotlightStyle.width / 2
        }px ${spotlightStyle.top + spotlightStyle.height / 2}px,
            transparent 0,
            transparent ${Math.max(spotlightStyle.width, spotlightStyle.height) / 2}px,
            black ${Math.max(spotlightStyle.width, spotlightStyle.height) / 2 + 50}px
          )
        `,
        WebkitMaskImage: `
          linear-gradient(transparent, transparent),
          radial-gradient(
            ellipse ${spotlightStyle.width}px ${spotlightStyle.height}px at ${
          spotlightStyle.left + spotlightStyle.width / 2
        }px ${spotlightStyle.top + spotlightStyle.height / 2}px,
            transparent 0,
            transparent ${Math.max(spotlightStyle.width, spotlightStyle.height) / 2}px,
            black ${Math.max(spotlightStyle.width, spotlightStyle.height) / 2 + 50}px
          )
        `,
        maskComposite: 'exclude',
        WebkitMaskComposite: 'source-out',
      }}
    >
      {/* Spotlight border glow */}
      <div
        className="absolute border-2 border-blue-500 rounded-lg shadow-lg shadow-blue-500/50 animate-pulse pointer-events-auto"
        style={{
          top: spotlightStyle.top,
          left: spotlightStyle.left,
          width: spotlightStyle.width,
          height: spotlightStyle.height,
          transition: 'all 0.3s ease-in-out',
        }}
      />
    </div>
  );
};

export default SpotlightHighlight;
