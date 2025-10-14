'use client'

import { useEffect } from 'react'

interface WelcomeAnimationProps {
  onComplete: () => void
}

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  useEffect(() => {
    // Complete animation after 3.5 seconds
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 3500)

    return () => {
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/30 to-slate-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-500 rounded-full blur-3xl animate-pulse-slow-delayed"></div>
      </div>

      <div className="text-center w-full px-4 relative z-10">
        {/* Site Logo with Enhanced Animation */}
        <div className="mb-20 animate-logo-entrance">
          <img
            src="/thereallogo.png"
            alt="Ultimate Golf Community"
            className="w-72 h-72 mx-auto object-contain filter drop-shadow-2xl"
          />
        </div>
        
        {/* Golf Ball Putting Animation - Enhanced Realism */}
        <div className="relative w-full max-w-5xl h-72 mx-auto">
          {/* Grass Texture Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-700/20 to-emerald-800/30 rounded-3xl overflow-hidden">
            {/* Grass pattern effect */}
            <div className="grass-pattern absolute inset-0"></div>
          </div>
          
          {/* Putting Green Line with 3D Effect */}
          <div className="absolute top-1/2 left-0 right-0 h-3 transform -translate-y-1/2">
            {/* Shadow below line */}
            <div className="absolute inset-0 bg-black/30 transform translate-y-1 blur-sm"></div>
            {/* Main line */}
            <div className="relative h-full bg-gradient-to-r from-emerald-600/50 via-emerald-400 to-emerald-600/50 shadow-lg">
              {/* Top highlight */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>
            </div>
          </div>
          
          {/* Golf Hole with Realistic Details */}
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2 golf-hole-container">
            <div className="relative">
              {/* Hole Outer Ring (Cup) */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-gray-400 via-gray-300 to-gray-400 shadow-2xl"></div>
              {/* Hole Depth Shadow */}
              <div className="w-16 h-16 rounded-full bg-gradient-radial from-black via-gray-900 to-black border-2 border-gray-600 shadow-inner relative overflow-hidden">
                {/* Inner shadow detail */}
                <div className="absolute inset-2 rounded-full bg-black opacity-80"></div>
              </div>
              
              {/* Flag Pole with Shadow */}
              <div className="absolute -top-28 left-1/2 transform -translate-x-1/2 flag-pole">
                {/* Pole Shadow */}
                <div className="absolute top-0 left-3 w-0.5 h-28 bg-black/40 blur-sm transform skew-x-12"></div>
                {/* Pole */}
                <div className="relative w-2 h-28 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-300 shadow-xl rounded-full">
                  <div className="absolute inset-y-0 left-0 w-px bg-white/50"></div>
                </div>
                {/* Flag with Wave Effect */}
                <div className="absolute top-1 left-2 w-12 h-8 flag-wave">
                  <svg viewBox="0 0 48 32" className="w-full h-full">
                    <defs>
                      <linearGradient id="flagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#991b1b', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 0 Q 12 -2 24 0 T 48 0 L 48 32 Q 36 34 24 32 T 0 32 Z"
                      fill="url(#flagGradient)"
                      className="drop-shadow-lg"
                    />
                    {/* Flag highlight */}
                    <path
                      d="M 0 0 Q 12 -2 24 0 T 48 0 L 48 8 Q 36 10 24 8 T 0 8 Z"
                      fill="white"
                      opacity="0.2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Golf Ball with Ultra-Realistic Details */}
          <div className="golf-ball-welcome">
            <div className="relative">
              {/* Dynamic Ball Shadow with Animation */}
              <div className="ball-shadow absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-black/60 rounded-full blur-md"></div>
              
              {/* Ball */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white via-gray-50 to-gray-200 shadow-2xl relative overflow-hidden ball-3d">
                {/* Realistic Dimples Pattern */}
                <div className="absolute inset-0 opacity-40">
                  {/* Top Row */}
                  <div className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute top-1 left-5 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute top-1 left-8 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  {/* Middle Rows */}
                  <div className="absolute top-3 left-1 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute top-3 left-4 w-2 h-2 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute top-3 left-7 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute top-3 right-1 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  {/* Center */}
                  <div className="absolute top-5 left-2 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute top-5 left-5 w-2 h-2 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute top-5 right-2 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  {/* Bottom Rows */}
                  <div className="absolute top-7 left-3 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute top-7 left-6 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute top-7 right-2 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute bottom-1 left-4 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                  <div className="absolute bottom-1 right-3 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-inner"></div>
                </div>
                
                {/* Realistic Highlight (Sun Reflection) */}
                <div className="absolute top-1.5 right-2 w-5 h-5 rounded-full bg-gradient-radial from-white via-white/80 to-transparent blur-[2px]"></div>
                <div className="absolute top-2 right-2.5 w-3 h-3 rounded-full bg-white"></div>
                
                {/* Secondary Light Reflection */}
                <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-white/40 blur-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes putt-welcome {
          0% {
            left: -2%;
            transform: translateY(-50%) scale(1) rotate(0deg);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          /* Smooth acceleration */
          20% {
            left: 20%;
            transform: translateY(-50%) scale(1.05) rotate(240deg);
          }
          /* Cruising speed */
          60% {
            left: 70%;
            transform: translateY(-50%) scale(1) rotate(900deg);
          }
          /* Deceleration as it approaches hole */
          82% {
            left: calc(100% - 80px);
            transform: translateY(-50%) scale(0.98) rotate(1180deg);
          }
          /* Stop at hole */
          87% {
            left: calc(100% - 80px);
            transform: translateY(-50%) scale(1) rotate(1240deg);
          }
          /* Drop into hole */
          93% {
            left: calc(100% - 80px);
            transform: translateY(20px) scale(0.7) rotate(1300deg);
            opacity: 1;
          }
          /* Disappear */
          100% {
            left: calc(100% - 80px);
            transform: translateY(30px) scale(0.3) rotate(1440deg);
            opacity: 0;
          }
        }

        @keyframes shadow-follow {
          0% {
            width: 48px;
            opacity: 0.3;
          }
          20% {
            width: 52px;
            opacity: 0.6;
          }
          60% {
            width: 48px;
            opacity: 0.6;
          }
          82% {
            width: 44px;
            opacity: 0.5;
          }
          87% {
            width: 40px;
            opacity: 0.4;
          }
          100% {
            width: 20px;
            opacity: 0;
          }
        }

        .golf-ball-welcome {
          will-change: transform, opacity;
          position: absolute;
          top: 50%;
          animation: putt-welcome 3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }

        .ball-shadow {
          animation: shadow-follow 3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }

        @keyframes logo-entrance {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(30px);
            filter: blur(10px);
          }
          50% {
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }

        .animate-logo-entrance {
          animation: logo-entrance 1s ease-out;
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
        }

        @keyframes pulse-slow-delayed {
          0%, 100% {
            transform: scale(1.1);
            opacity: 0.15;
          }
          50% {
            transform: scale(1);
            opacity: 0.25;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-slow-delayed {
          animation: pulse-slow-delayed 4s ease-in-out infinite 2s;
        }

        @keyframes flag-wave {
          0%, 100% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(15deg);
          }
        }

        .flag-wave {
          animation: flag-wave 2s ease-in-out infinite;
          transform-origin: left center;
        }

        @keyframes flag-pole-sway {
          0%, 100% {
            transform: translateX(-50%) rotate(0deg);
          }
          50% {
            transform: translateX(-50%) rotate(1deg);
          }
        }

        .flag-pole {
          animation: flag-pole-sway 3s ease-in-out infinite;
        }

        @keyframes hole-pulse {
          0%, 100% {
            transform: translateY(-50%) scale(1);
          }
          87% {
            transform: translateY(-50%) scale(1);
          }
          90% {
            transform: translateY(-50%) scale(1.1);
          }
          93% {
            transform: translateY(-50%) scale(1);
          }
        }

        .golf-hole-container {
          animation: hole-pulse 3s ease-out forwards;
        }

        /* Grass pattern */
        .grass-pattern {
          background-image: 
            linear-gradient(45deg, transparent 48%, rgba(16, 185, 129, 0.1) 49%, rgba(16, 185, 129, 0.1) 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(5, 150, 105, 0.1) 49%, rgba(5, 150, 105, 0.1) 51%, transparent 52%);
          background-size: 8px 8px;
          opacity: 0.5;
        }

        /* 3D Ball Effect */
        .ball-3d {
          box-shadow: 
            inset -2px -2px 4px rgba(0, 0, 0, 0.2),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            0 8px 16px rgba(0, 0, 0, 0.3),
            0 4px 8px rgba(0, 0, 0, 0.2);
        }

        /* Gradient utilities */
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  )
}

