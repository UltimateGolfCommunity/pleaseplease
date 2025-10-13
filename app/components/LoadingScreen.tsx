'use client'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Logo Video */}
        <div className="relative w-64 h-64 mx-auto mb-6">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="/0901.mp4" type="video/mp4" />
            {/* Fallback to static logo if video fails */}
            <img
              src="/thereallogo.png"
              alt="Ultimate Golf Community"
              className="w-full h-full object-contain"
            />
          </video>
        </div>
        
        {/* Loading Message */}
        <div className="space-y-4">
          <p className="text-xl font-semibold text-white">{message}</p>
          
          {/* Loading Spinner */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

