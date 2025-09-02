'use client'

import React, { memo } from 'react'
import { Home, Users, Trophy, Target, User } from 'lucide-react'

interface DashboardTabsProps {
  activeTab: 'overview' | 'find-someone' | 'courses' | 'groups' | 'profile'
  onTabChange: (tab: 'overview' | 'find-someone' | 'courses' | 'groups' | 'profile') => void
}

const DashboardTabs = memo(({ activeTab, onTabChange }: DashboardTabsProps) => {
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Home },
    { id: 'find-someone' as const, label: 'Find Someone', icon: Users },
    { id: 'courses' as const, label: 'Courses', icon: Trophy },
    { id: 'groups' as const, label: 'Groups', icon: Users },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ]

  return (
    <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-1 mb-8">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 flex-1 ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            <span className="font-medium">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
})

DashboardTabs.displayName = 'DashboardTabs'

export default DashboardTabs
