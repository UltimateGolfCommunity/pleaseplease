'use client'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center z-50 transition-opacity duration-500">
      <div className="text-center">
        {/* Golf Ball Putting Animation - Made Much Bigger */}
        <div className="relative w-full max-w-3xl h-48 mx-auto mb-12 px-8">
          {/* Putting Green Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 transform -translate-y-1/2 shadow-xl"></div>
          
          {/* Golf Hole */}
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="relative">
              {/* Hole Shadow/Depth */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 to-black border-4 border-emerald-600 shadow-2xl"></div>
              {/* Flag */}
              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
                <div className="w-1 h-16 bg-gray-300 shadow-lg"></div>
                <div className="absolute top-0 left-1 w-8 h-6 bg-red-500 rounded-r shadow-lg"></div>
              </div>
            </div>
          </div>
          
          {/* Golf Ball */}
          <div className="golf-ball absolute top-1/2 transform -translate-y-1/2">
            <div className="relative">
              {/* Ball Shadow */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-black/40 rounded-full blur-lg"></div>
              {/* Ball */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-200 shadow-2xl relative overflow-hidden">
                {/* Dimples Effect */}
                <div className="absolute inset-0 opacity-25">
                  <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gray-400"></div>
                  <div className="absolute top-4 right-2 w-2 h-2 rounded-full bg-gray-400"></div>
                  <div className="absolute bottom-2 left-4 w-2 h-2 rounded-full bg-gray-400"></div>
                  <div className="absolute top-6 left-6 w-2 h-2 rounded-full bg-gray-400"></div>
                  <div className="absolute top-3 right-4 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  <div className="absolute bottom-4 right-3 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                </div>
                {/* Highlight */}
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/70 blur-sm"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Loading Message */}
        <div className="space-y-2 animate-fade-in">
          <p className="text-xl font-semibold text-white">{message}</p>
          <p className="text-sm text-gray-400">Preparing your tee time...</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes putt {
          0% {
            left: -50px;
            transform: translateY(-50%) scale(1);
          }
          65% {
            left: calc(100% - 200px);
            transform: translateY(-50%) scale(1);
          }
          80% {
            left: calc(100% - 140px);
            transform: translateY(-50%) scale(0.85);
          }
          92% {
            left: calc(100% - 90px);
            transform: translateY(-50%) scale(0.6);
            opacity: 1;
          }
          100% {
            left: calc(100% - 60px);
            transform: translateY(-50%) scale(0.3);
            opacity: 0;
          }
        }

        .golf-ball {
          animation: putt 3s ease-in-out infinite;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  )
}
