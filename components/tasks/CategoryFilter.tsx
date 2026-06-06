// components/tasks/CategoryFilter.tsx
'use client'

import { LayoutGrid, List, TrendingUp, Clock, Award } from 'lucide-react'

interface CategoryFilterProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
}

const categories = [
  { id: 'all', label: 'All Tasks', icon: LayoutGrid },
  { id: 'high-reward', label: 'High Reward', icon: TrendingUp },
  { id: 'quick', label: 'Quick Tasks', icon: Clock },
  { id: 'completed', label: 'Completed', icon: Award }
]

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((cat) => {
        const Icon = cat.icon
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition
              ${activeCategory === cat.id
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                : 'glass text-gray-400 hover:text-white'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
