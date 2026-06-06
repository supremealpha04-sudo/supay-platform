// components/ads/AdTimer.tsx
'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface AdTimerProps {
  duration: number
  onComplete: () => void
}

export function AdTimer({ duration, onComplete }: AdTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, onComplete])

  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - timeLeft / duration)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="rgba(255,122,26,0.2)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="#FF7A1A"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-accent-500">{timeLeft}</span>
          <span className="text-xs text-gray-400">seconds</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        <Clock className="w-4 h-4" />
        <span>Watching advertisement...</span>
      </div>
      <p className="text-xs text-gray-500">Please don't close this window</p>
    </div>
  )
}
