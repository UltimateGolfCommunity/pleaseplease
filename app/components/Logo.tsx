'use client'

import { useTheme } from '@/contexts/ThemeContext'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'xl', showText = true, className = '' }: LogoProps) {
  const { isDark } = useTheme()
  
  const sizeClasses = {
    xs: 'h-10 w-10',
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40'
  }

  // Choose logo based on theme
  const logoSrc = isDark ? '/thereallogo.png' : '/logoforlitemode.png'

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image */}
      <div className={`relative ${sizeClasses[size]}`}>
        <img
          src={logoSrc}
          alt="Ultimate Golf Community Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}
