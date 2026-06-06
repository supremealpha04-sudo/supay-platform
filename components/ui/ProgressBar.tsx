// components/ui/ProgressBar.tsx
'use client'

interface ProgressBarProps {
  value: number
  max: number
  showLabel?: boolean
  color?: 'primary' | 'accent' | 'green'
}

export function ProgressBar({ value, max, showLabel = false, color = 'primary' }: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100)
  
  const colors = {
    primary: 'bg-primary-500',
    accent: 'bg-accent-500',
    green: 'bg-green-500'
  }

  return (
    <div className="w-full">
      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
