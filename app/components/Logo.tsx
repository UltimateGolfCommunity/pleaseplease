import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`relative ${sizeClasses[size]} mr-2 sm:mr-3`}>
        <Image
          src="/logoreal.png"
          alt="Ultimate Golf Community Logo"
          width={48}
          height={48}
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent ${textSizes[size]}`}>
          <span className="hidden sm:inline">Ultimate Golf Community</span>
          <span className="sm:hidden">UGC</span>
        </span>
      )}
    </div>
  )
}
