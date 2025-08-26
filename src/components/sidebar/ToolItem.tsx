// src/components/sidebar/ToolItem.tsx - FIXED
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface ToolItemProps {
  name: string;
  path: string;
  icon: LucideIcon; // Changed from string to LucideIcon
  description: string;
  badge: string | null;
  onNavigate: (path: string, toolName: string) => void;
}

const ToolItem: React.FC<ToolItemProps> = ({
  name,
  path,
  icon: Icon, // Rename to Icon (capitalized) to use as React component
  description,
  badge,
  onNavigate
}) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  const isDisabled = path === '#';

  if (isDisabled) {
    return (
      <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 opacity-60">
        <div className="flex items-center space-x-3">
          <Icon className="w-4 h-4 text-gray-400" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium truncate">
                {name}
              </span>
              {badge && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">{description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={path}
      onClick={() => onNavigate(path, name)}
      className={`block px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{name}</span>
            {badge && (
              <Badge 
                variant={isActive ? "default" : "secondary"} 
                className="ml-2 text-xs"
              >
                {badge}
              </Badge>
            )}
          </div>
          <p className={`text-xs truncate ${
            isActive ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ToolItem;