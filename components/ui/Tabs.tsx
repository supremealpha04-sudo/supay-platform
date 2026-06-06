// components/ui/Tabs.tsx
'use client'

import { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-primary-500/20">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-2 px-5 py-3 rounded-t-lg transition-all
            ${activeTab === tab.id
              ? 'bg-primary-500/20 text-accent-500 border-b-2 border-accent-500'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
