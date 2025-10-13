'use client'

import { useEffect, useState } from 'react'

interface WelcomeAnimationProps {
  onComplete: () => void
}

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    // Show welcome message after 1 second
    const messageTimer = setTimeout(() => {
      setShowMessage(true)
    }, 1000)

    // Complete animation after 4 seconds (enough time for ball to roll in and message to show)
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 4000)

    return () => {
      clearTimeout(messageTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Welcome Message */}
        {showMessage && (
          <div className="mb-16 animate-fade-in-scale">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Welcome to the
            </h1>
            <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Ultimate Golf Community
            </h2>
          </div>
        )}
        
        {/* Golf Ball Putting Animation */}
        <div className="relative w-96 h-32 mx-auto">
          {/* Putting Green Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 transform -translate-y-1/2 shadow-lg"></div>
          
          {/* Golf Hole */}
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="relative">
              {/* Hole Shadow/Depth */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-900 to-black border-4 border-emerald-600 shadow-2xl"></div>
              {/* Flag */}
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                <div className="w-1 h-14 bg-gray-300 shadow-lg"></div>
                <div className="absolute top-0 left-1 w-6 h-4 bg-red-500 rounded-r shadow-lg"></div>
              </div>
            </div>
          </div>
          
          {/* Golf Ball */}
          <div className="golf-ball-welcome absolute top-1/2 transform -translate-y-1/2">
            <div className="relative">
              {/* Ball Shadow */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-black/40 rounded-full blur-md"></div>
              {/* Ball */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-200 shadow-2xl relative overflow-hidden">
                {/* Dimples Effect */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  <div className="absolute top-2 right-1 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                </div>
                {/* Highlight */}
                <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white/70 blur-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes putt-welcome {
          0% {
            left: -40px;
            transform: translateY(-50%) scale(1);
            opacity: 1;
          }
          60% {
            left: calc(100% - 160px);
            transform: translateY(-50%) scale(1);
            opacity: 1;
          }
          75% {
            left: calc(100% - 100px);
            transform: translateY(-50%) scale(0.8);
            opacity: 1;
          }
          90% {
            left: calc(100% - 60px);
            transform: translateY(-50%) scale(0.5);
            opacity: 1;
          }
          100% {
            left: calc(100% - 40px);
            transform: translateY(-50%) scale(0.2);
            opacity: 0;
          }
        }

        .golf-ball-welcome {
          animation: putt-welcome 3s ease-in-out forwards;
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

