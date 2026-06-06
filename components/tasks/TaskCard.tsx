// components/tasks/TaskCard.tsx
'use client'

import { Clock, ExternalLink, Coins, CheckCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface TaskCardProps {
  id: string
  title: string
  description: string
  reward: number
  requiredTime: number
  taskType: string
  isCompleted: boolean
  isPremium?: boolean
  onComplete: () => void
}

export function TaskCard({
  id,
  title,
  description,
  reward,
  requiredTime,
  taskType,
  isCompleted,
  isPremium = false,
  onComplete
}: TaskCardProps) {
  const getTypeColor = () => {
    switch (taskType) {
      case 'survey': return 'bg-blue-500/20 text-blue-400'
      case 'video': return 'bg-red-500/20 text-red-400'
      case 'install': return 'bg-green-500/20 text-green-400'
      default: return 'bg-purple-500/20 text-purple-400'
    }
  }

  return (
    <div className={`glass rounded-xl p-5 transition-all ${!isCompleted ? 'hover:border-accent-500/50' : 'opacity-60'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="info" size="sm" className={getTypeColor()}>
            {taskType.toUpperCase()}
          </Badge>
          {isPremium && <Badge variant="premium" size="sm">Premium</Badge>}
          {isCompleted && <CheckCircle className="w-4 h-4 text-green-400" />}
        </div>
        <div className="flex items-center gap-1 text-accent-500 font-bold">
          <Coins className="w-4 h-4" />
          {reward} SPY
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {requiredTime}s
          <ExternalLink className="w-3 h-3 ml-2" />
        </div>
        <Button
          onClick={onComplete}
          disabled={isCompleted}
          size="sm"
          variant={isCompleted ? 'outline' : 'primary'}
        >
          {isCompleted ? 'Completed' : 'Start Task'}
        </Button>
      </div>
    </div>
  )
}
