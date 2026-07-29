'use client'

import { useEffect, useState } from 'react'

interface MonetagPopunderProps {
  userId?: string
  onComplete?: (reward: number) => void
  onError?: (error: string) => void
}

export default function MonetagPopunder({ 
  userId, 
  onComplete, 
  onError 
}: MonetagPopunderProps) {
  const [startTime] = useState<number>(Date.now())

  useEffect(() => {
    const openPopunder = () => {
      const popunder = window.open(
        'https://3nbf4.com/click?zoneId=11365022',
        '_blank',
        'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no'
      )
      
      if (popunder) {
        const checkInterval = setInterval(() => {
          if (popunder.closed) {
            clearInterval(checkInterval)
            const timeViewed = Date.now() - startTime
            const reward = Math.round(Math.min(0.05 * Math.min(timeViewed / 5000, 2), 0.30) * 100) / 100
            onComplete?.(reward)
          }
        }, 1000)
        
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!popunder.closed) {
            const timeViewed = Date.now() - startTime
            const reward = Math.round(Math.min(0.05 * Math.min(Math.min(timeViewed, 30000) / 5000, 2), 0.30) * 100) / 100
            onComplete?.(reward)
          }
        }, 30000)
      } else {
        onError?.('Popunder blocked - please allow popups')
      }
    }

    const timer = setTimeout(openPopunder, 1000)
    return () => clearTimeout(timer)
  }, [onComplete, onError, startTime])

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-800/50 p-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Opening Popunder Ad</h3>
        <p className="text-gray-400 text-sm">A new window will open in a moment</p>
        <p className="text-gray-500 text-xs mt-2">Please allow popups for this site</p>
      </div>
    </div>
  )
}