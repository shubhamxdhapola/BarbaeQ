import React from 'react';
import { Scissors } from 'lucide-react';

/**
 * BarbaeQ Brand Logo Component
 */
export const LogoIcon = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-7 h-7 rounded-xl',
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-14 h-14 rounded-3xl'
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  return (
    <div className={`bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-2xs border border-zinc-800 ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      <Scissors className={`text-indigo-400 ${iconSizes[size] || iconSizes.md}`} />
    </div>
  );
};

export const Logo = ({ 
  size = 'md', 
  showIcon = false, 
  showText = true, 
  subtitle = 'Your Queue, Simplified.', 
  variant = 'dark',
  className = '' 
}) => {
  const isWhite = variant === 'white';
  
  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && <LogoIcon size={size} />}
      
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className={`font-black tracking-tight leading-none ${textSizes[size] || textSizes.md} ${isWhite ? 'text-white' : 'text-zinc-900'}`}>
            <span>Barbae</span>
            <span className="text-indigo-600">Q</span>
          </div>
          {subtitle && (
            <span className={`text-[10px] font-medium tracking-tight mt-1 truncate ${isWhite ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;

