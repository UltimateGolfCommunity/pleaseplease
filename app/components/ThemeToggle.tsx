'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme()

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        relative rounded-full border border-theme
        bg-theme-card hover:bg-gray-100 dark:hover:bg-gray-700
        transition-all duration-300 ease-in-out
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        shadow-sm hover:shadow-md
        ${className}
      `}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative">
        {/* Sun Icon */}
        <SunIcon 
          className={`
            ${iconSizes[size]}
            text-yellow-500 transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'}
            absolute inset-0
          `}
        />
        
        {/* Moon Icon */}
        <MoonIcon 
          className={`
            ${iconSizes[size]}
            text-blue-400 transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'}
            ${!isDark ? 'absolute inset-0' : ''}
          `}
        />
      </div>
    </button>
  )
}

// Smaller inline version for navigation bars
export function ThemeToggleInline({ className = '' }: { className?: string }) {
  const { toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-colors duration-200
        hover:bg-gray-100 dark:hover:bg-gray-700
        text-gray-600 dark:text-gray-300
        ${className}
      `}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  )
}
