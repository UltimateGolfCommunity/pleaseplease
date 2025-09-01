'use client'

import React, { memo } from 'react'

interface Badge {
  id: string
  name: string
  description: string
  icon_name: string
  category: string
  points: number
  rarity: string
  criteria?: string
}

interface BadgeGridProps {
  badges: Badge[]
  onBadgeClick?: (badge: Badge) => void
}

const BadgeGrid = memo(({ badges, onBadgeClick }: BadgeGridProps) => {
  const getEmojiForIcon = (iconName: string) => {
    const iconMap: Record<string, string> = {
      crown: '👑',
      star: '⭐',
      trophy: '🏆',
      medal: '🥇',
      flag: '🏁',
      golf: '⛳',
      sunrise: '🌅',
      zap: '⚡',
      lightning: '⚡',
      target: '🎯',
      award: '🏅',
      users: '👥',
      shield: '🛡️',
      edit: '✏️',
      map: '🗺️',
      calendar: '📅',
      'cloud-rain': '🌧️',
      sun: '☀️',
    }
    return iconMap[iconName] || '🏆'
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-purple-500 text-white'
      case 'epic': return 'bg-blue-500 text-white'
      case 'rare': return 'bg-green-500 text-white'
      case 'uncommon': return 'bg-yellow-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  if (!Array.isArray(badges)) {
    return (
      <div className="col-span-full text-center py-8">
        <p className="text-gray-400">Loading badges...</p>
      </div>
    )
  }

  if (badges.length === 0) {
    return (
      <div className="col-span-full text-center py-8">
        <p className="text-gray-400">No badges available yet. Start playing to earn badges!</p>
      </div>
    )
  }

  return (
    <>
      {badges.map((badge) => (
        <div
          key={badge.id}
          onClick={() => onBadgeClick?.(badge)}
          className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-emerald-400/50 transition-all duration-300 transform hover:scale-105 cursor-pointer group"
        >
          <div className="relative">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
              {getEmojiForIcon(badge.icon_name)}
            </div>
            
            {/* Rarity indicator */}
            <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${getRarityColor(badge.rarity)}`}>
              {badge.rarity.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300">
            {badge.name}
          </h3>
          
          <p className="text-gray-400 text-sm mb-3 leading-relaxed">
            {badge.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-medium">
              {badge.points} pts
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {badge.category}
            </span>
          </div>
          
          {badge.criteria && (
            <div className="mt-3 pt-3 border-t border-gray-700/50">
              <p className="text-xs text-gray-500">
                <span className="font-medium">How to earn:</span> {badge.criteria}
              </p>
            </div>
          )}
        </div>
      ))}
    </>
  )
})

BadgeGrid.displayName = 'BadgeGrid'

export default BadgeGrid
