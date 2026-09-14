'use client'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'xl', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    xs: 'h-10 w-10',
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40'
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image */}
      <div className={`relative ${sizeClasses[size]}`}>
        <img
          src="/ugc-app-icon.png"
          alt="Ultimate Golf Community clubhouse logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}
