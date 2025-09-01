'use client'

import { Club, Sparkles } from 'lucide-react'

export default function GolfGrassFooter() {
  return (
    <div className="relative">
      {/* Golf Grass Section */}
      <div className="relative h-32 bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-800 overflow-hidden">
        {/* Grass Blades */}
        <div className="absolute inset-0">
          {/* First layer of grass */}
          <div className="absolute bottom-0 left-0 w-full h-full">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute bottom-0 bg-emerald-500"
                style={{
                  left: `${Math.random() * 100}%`,
                  width: `${2 + Math.random() * 3}px`,
                  height: `${20 + Math.random() * 30}px`,
                  transform: `rotate(${-15 + Math.random() * 30}deg)`,
                  animation: `sway ${3 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          {/* Second layer of grass */}
          <div className="absolute bottom-0 left-0 w-full h-full">
            {[...Array(40)].map((_, i) => (
              <div
                key={i + 50}
                className="absolute bottom-0 bg-emerald-400"
                style={{
                  left: `${Math.random() * 100}%`,
                  width: `${1.5 + Math.random() * 2}px`,
                  height: `${15 + Math.random() * 25}px`,
                  transform: `rotate(${-10 + Math.random() * 20}deg)`,
                  animation: `sway ${2.5 + Math.random() * 1.5}s ease-in-out infinite ${Math.random() * 1.5}s`
                }}
              />
            ))}
          </div>
          
          {/* Third layer of grass */}
          <div className="absolute bottom-0 left-0 w-full h-full">
            {[...Array(30)].map((_, i) => (
              <div
                key={i + 90}
                className="absolute bottom-0 bg-emerald-300"
                style={{
                  left: `${Math.random() * 100}%`,
                  width: `${1 + Math.random() * 1.5}px`,
                  height: `${10 + Math.random() * 20}px`,
                  transform: `rotate(${-8 + Math.random() * 16}deg)`,
                  animation: `sway ${2 + Math.random() * 1}s ease-in-out infinite ${Math.random() * 1}s`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Golf ball */}
        <div className="absolute bottom-8 right-8 w-6 h-6 bg-white rounded-full shadow-lg animate-bounce">
          <div className="w-6 h-6 bg-white rounded-full border-2 border-gray-300"></div>
        </div>
        
        {/* Golf flag */}
        <div className="absolute bottom-16 left-8">
          <div className="w-1 h-16 bg-white rounded-full"></div>
          <div className="absolute top-0 left-1 w-8 h-6 bg-red-500 rounded-r-lg"></div>
        </div>
      </div>
      
      {/* Footer Content */}
      <div className="bg-gradient-to-b from-emerald-800 via-emerald-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="relative">
                  <Club className="h-8 w-8 text-emerald-400 mr-3" />
                  <Sparkles className="h-4 w-4 text-emerald-300 absolute -top-1 -right-1" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Ultimate Golf Community
                </span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Connect with fellow golfers, book tee times, track your game, and join the most vibrant golf community online.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors duration-300">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors duration-300">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors duration-300">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/dashboard" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Dashboard</a></li>
                <li><a href="/profile" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Profile</a></li>
                <li><a href="/settings" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Settings</a></li>
                <li><a href="/auth/login" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Sign In</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Contact Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Ultimate Golf Community. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors duration-300">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors duration-300">Terms</a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors duration-300">Cookies</a>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes sway {
          0%, 100% { transform: rotate(var(--rotation)) translateX(0px); }
          50% { transform: rotate(calc(var(--rotation) + 5deg)) translateX(2px); }
        }
      `}</style>
    </div>
  )
}
