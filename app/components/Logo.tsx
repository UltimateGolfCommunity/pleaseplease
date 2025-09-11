interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'xl', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-40 w-40',
    md: 'h-56 w-56',
    lg: 'h-72 w-72',
    xl: 'h-96 w-96'
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image */}
      <div className={`relative ${sizeClasses[size]}`}>
        <img
          src="/NEWLOGOREAL.png"
          alt="Ultimate Golf Community Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}
