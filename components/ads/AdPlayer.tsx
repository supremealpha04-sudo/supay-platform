// components/ads/AdPlayer.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Volume2, VolumeX, Maximize } from 'lucide-react'

interface AdPlayerProps {
  duration: number
  onComplete: () => void
  onClose: () => void
}

export function AdPlayer({ duration, onComplete, onClose }: AdPlayerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete()
    }
  }, [timeLeft, onComplete])

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying && timeLeft > 0) {
        setTimeLeft(prev => prev - 1)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [isPlaying, timeLeft])

  const progress = ((duration - timeLeft) / duration) * 100

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="relative w-full max-w-4xl mx-4">
        {/* Ad Container */}
        <div className="aspect-video bg-navy-900 rounded-xl overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-primary-900 to-navy-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <Play className="w-16 h-16 text-accent-500" />
              </div>
              <p className="text-white text-xl">Advertisement</p>
              <p className="text-gray-400 text-sm mt-2">Watch for {timeLeft} more seconds</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1 bg-navy-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mt-3">
          <div className="flex gap-2">
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/10 rounded-lg">
              {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg">
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-white">
            Skip Ad
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Ad will complete in {timeLeft} seconds
        </p>
      </div>
    </div>
  )
}
