'use client'

import { useEffect, useState } from 'react'

interface MonetagPopunderProps {
  onComplete?: (reward: number) => void
  onError?: (error: string) => void
  userId?: string
}

export default function MonetagPopunder({ 
  onComplete, 
  onError, 
  userId 
}: MonetagPopunderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    // Open popunder
    const openPopunder = () => {
      const popunder = window.open(
        'https://3nbf4.com/click?zoneId=11365022',
        '_blank',
        'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no'
      )
      
      if (popunder) {
        setIsOpen(true)
        setStartTime(Date.now())
        
        // Monitor popunder
        const checkInterval = setInterval(() => {
          if (popunder.closed) {
            // Popunder was closed
            clearInterval(checkInterval)
            setIsOpen(false)
            
            const timeViewed = Date.now() - (startTime || Date.now())
            const reward = calculateReward(timeViewed)
            onComplete?.(reward)
          }
        }, 1000)
        
        // Safety timeout
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!popunder.closed) {
            // Give reward anyway after 30 seconds
            const timeViewed = Date.now() - (startTime || Date.now())
            const reward = calculateReward(Math.min(timeViewed, 30000))
            onComplete?.(reward)
          }
        }, 30000)
      } else {
        onError?.('Popunder blocked - please allow popups')
      }
    }

    // Open popunder on user click (to avoid blocking)
    const handleClick = () => {
      openPopunder()
    }

    document.addEventListener('click', handleClick)
    
    // If no click, open after 1 second (for auto-open)
    const timer = setTimeout(openPopunder, 1000)

    return () => {
      document.removeEventListener('click', handleClick)
      clearTimeout(timer)
    }
  }, [onComplete, onError, userId, startTime])

  const calculateReward = (timeViewed: number): number => {
    // Popunder reward calculation
    const baseRate = 0.05
    const timeMultiplier = Math.min(timeViewed / 5000, 2) // Up to 2x for 10+ seconds
    const reward = baseRate * timeMultiplier
    return Math.round(Math.min(reward, 0.30) * 100) / 100
  }

  return null // Popunder doesn't render anything visible
}