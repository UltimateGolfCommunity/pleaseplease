'use client'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center z-50 transition-opacity duration-500">
      <div className="text-center">
        {/* Golf Ball Putting Animation */}
        <div className="relative w-80 h-24 mx-auto mb-8">
          {/* Putting Green Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 transform -translate-y-1/2"></div>
          
          {/* Golf Hole */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="relative">
              {/* Hole Shadow/Depth */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-900 to-black border-2 border-emerald-600 shadow-lg"></div>
              {/* Flag */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                <div className="w-0.5 h-10 bg-gray-300"></div>
                <div className="absolute top-0 left-0.5 w-4 h-3 bg-red-500 rounded-r"></div>
              </div>
            </div>
          </div>
          
          {/* Golf Ball */}
          <div className="golf-ball absolute top-1/2 transform -translate-y-1/2">
            <div className="relative">
              {/* Ball Shadow */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-black/30 rounded-full blur-sm"></div>
              {/* Ball */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-200 shadow-lg relative overflow-hidden">
                {/* Dimples Effect */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-gray-400"></div>
                  <div className="absolute top-2 right-1 w-1 h-1 rounded-full bg-gray-400"></div>
                  <div className="absolute bottom-1 left-2 w-1 h-1 rounded-full bg-gray-400"></div>
                  <div className="absolute top-3 left-3 w-1 h-1 rounded-full bg-gray-400"></div>
                </div>
                {/* Highlight */}
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/60 blur-sm"></div>
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
            left: 0;
            transform: translateY(-50%) scale(1);
          }
          70% {
            left: calc(100% - 120px);
            transform: translateY(-50%) scale(1);
          }
          85% {
            left: calc(100% - 80px);
            transform: translateY(-50%) scale(0.8);
          }
          95% {
            left: calc(100% - 50px);
            transform: translateY(-50%) scale(0.5);
            opacity: 1;
          }
          100% {
            left: calc(100% - 30px);
            transform: translateY(-50%) scale(0.2);
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
