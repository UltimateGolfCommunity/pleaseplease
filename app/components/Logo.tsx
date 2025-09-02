import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'lg', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
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
