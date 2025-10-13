'use client'

import { useEffect, useState } from 'react'

interface WelcomeAnimationProps {
  onComplete: () => void
}

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    // Show welcome message immediately
    setShowMessage(true)

    // Complete animation after 3.5 seconds (slightly longer than animation)
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 3500)

    return () => {
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center w-full px-4">
        {/* Site Logo */}
        <div className="mb-12 animate-fade-in-scale">
          <img
            src="/thereallogo.png"
            alt="Ultimate Golf Community"
            className="w-48 h-48 mx-auto object-contain"
          />
        </div>

        {/* Welcome Message - Epic Kingdom Entry */}
        {showMessage && (
          <div className="mb-16 animate-fade-in-scale">
            {/* Decorative Top Border */}
            <div className="flex items-center justify-center mb-8">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
              <div className="mx-4">
                <div className="w-3 h-3 rotate-45 bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-500/50"></div>
              </div>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
            </div>
            
            {/* Main Welcome Text */}
            <div className="relative">
              {/* Glow Effect Behind Text */}
              <div className="absolute inset-0 blur-3xl opacity-30">
                <div className="w-full h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"></div>
              </div>
              
              {/* Text Content */}
              <div className="relative">
                <h1 className="text-3xl md:text-5xl font-bold text-gray-200 mb-3 tracking-wide uppercase">
                  Welcome to the
                </h1>
                <h2 className="text-5xl md:text-8xl font-black mb-4 leading-tight">
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl animate-shimmer bg-[length:200%_100%]">
                    Ultimate Golf
                  </span>
                </h2>
                <h2 className="text-5xl md:text-8xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl animate-shimmer-reverse bg-[length:200%_100%]">
                    Community
                  </span>
                </h2>
                
                {/* Subtitle */}
                <p className="text-lg md:text-2xl text-emerald-300 mt-6 font-light tracking-widest uppercase">
                  Where Legends Tee Off
                </p>
              </div>
            </div>
            
            {/* Decorative Bottom Border */}
            <div className="flex items-center justify-center mt-8">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
              <div className="mx-4">
                <div className="w-3 h-3 rotate-45 bg-gradient-to-br from-cyan-400 to-blue-400 shadow-lg shadow-cyan-500/50"></div>
              </div>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
            </div>
          </div>
        )}
        
        {/* Golf Ball Putting Animation */}
        <div className="relative w-full max-w-4xl h-64 mx-auto">
          {/* Putting Green Line */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 transform -translate-y-1/2 shadow-2xl"></div>
          
          {/* Golf Hole */}
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="relative">
              {/* Hole Shadow/Depth */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-900 to-black border-4 border-emerald-600 shadow-2xl"></div>
              {/* Flag */}
              <div className="absolute -top-24 left-1/2 transform -translate-x-1/2">
                <div className="w-1.5 h-20 bg-gray-300 shadow-xl"></div>
                <div className="absolute top-0 left-1.5 w-10 h-7 bg-red-500 rounded-r shadow-xl"></div>
              </div>
            </div>
          </div>
          
          {/* Golf Ball */}
          <div className="golf-ball-welcome">
            <div className="relative">
              {/* Ball Shadow */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-5 bg-black/50 rounded-full blur-xl"></div>
              {/* Ball */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-200 shadow-2xl relative overflow-hidden">
                {/* Dimples Effect */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                  <div className="absolute top-6 right-3 w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                  <div className="absolute bottom-3 left-6 w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                  <div className="absolute top-9 left-9 w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                  <div className="absolute top-5 right-6 w-2 h-2 rounded-full bg-gray-400"></div>
                  <div className="absolute bottom-6 right-5 w-2 h-2 rounded-full bg-gray-400"></div>
                </div>
                {/* Highlight */}
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/80 blur-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes putt-welcome {
          0% {
            left: 0;
            transform: translateY(-50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          75% {
            left: calc(100% - 100px);
            transform: translateY(-50%) scale(1) rotate(1080deg);
            opacity: 1;
          }
          85% {
            left: calc(100% - 60px);
            transform: translateY(-50%) scale(0.8) rotate(1260deg);
            opacity: 1;
          }
          93% {
            left: calc(100% - 48px);
            transform: translateY(-50%) scale(0.5) rotate(1400deg);
            opacity: 1;
          }
          100% {
            left: calc(100% - 48px);
            transform: translateY(-50%) scale(0) rotate(1440deg);
            opacity: 0;
          }
        }

        .golf-ball-welcome {
          will-change: transform, opacity;
          position: absolute;
          top: 50%;
          animation: putt-welcome 3s ease-out forwards;
        }

        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}

