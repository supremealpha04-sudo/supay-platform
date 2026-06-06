// components/tasks/TaskList.tsx
'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { TaskCard } from './TaskCard'

interface Task {
  id: string
  title: string
  description: string
  reward_spy: number
  required_time_seconds: number
  task_type: string
  is_premium?: boolean
}

interface TaskListProps {
  tasks: Task[]
  completedIds: Set<string>
  onComplete: (taskId: string) => void
}

export function TaskList({ tasks, completedIds, onComplete }: TaskListProps) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  const filtered = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || task.task_type === filterType
    return matchesSearch && matchesType
  })

  const typeOptions = ['all', 'link', 'survey', 'video', 'install']

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-navy-800 border border-primary-500/30 rounded-lg text-white text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-lg text-white text-sm"
        >
          {typeOptions.map(opt => (
            <option key={opt} value={opt}>{opt.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(task => (
          <TaskCard
            key={task.id}
            id={task.id}
            title={task.title}
            description={task.description}
            reward={task.reward_spy}
            requiredTime={task.required_time_seconds}
            taskType={task.task_type}
            isCompleted={completedIds.has(task.id)}
            isPremium={task.is_premium}
            onComplete={() => onComplete(task.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found</p>
        </div>
      )}
    </div>
  )
}
