'use client'

import { useState, useEffect, useRef } from 'react'
import { AdsterraAd } from './AdsterraAd'
import { GoogleAd } from './GoogleAd'

interface AdViewerProps {
  userId: string
  adTier: 'banner' | 'interstitial' | 'rewarded'
  minDuration: number
  onComplete: (reward: number) => void
  onError?: (error: string) => void
  onSkip?: () => void
}

interface AdViewerState {
  isPlaying: boolean
  isComplete: boolean
  progress: number
  remainingTime: number
}

export function AdViewer({
  userId,
  adTier,
  minDuration,
  onComplete,
  onError,
  onSkip
}: AdViewerProps) {
  const [state, setState] = useState<AdViewerState>({
    isPlaying: false,
    isComplete: false,
    progress: 0,
    remainingTime: minDuration
  })
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    // Simulate ad loading
    setState(prev => ({ ...prev, isPlaying: true }))
    startTimeRef.current = Date.now()
    
    // Start timer
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const progress = Math.min(elapsed / minDuration, 1)
      const remaining = Math.max(minDuration - elapsed, 0)
      
      setState(prev => ({
        ...prev,
        progress,
        remainingTime: remaining
      }))
      
      if (progress >= 1) {
        handleAdComplete()
      }
    }, 100)
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [minDuration])

  const handleAdComplete = () => {
    if (state.isComplete) return
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    setState(prev => ({
      ...prev,
      isComplete: true,
      isPlaying: false
    }))
    
    // Calculate reward based on duration and tier
    const reward = calculateReward(minDuration, adTier)
    onComplete(reward)
  }

  const calculateReward = (duration: number, tier: string): number => {
    const baseReward = tier === 'rewarded' ? 5 : tier === 'interstitial' ? 3 : 1
    const durationBonus = Math.floor(duration / 5)
    return baseReward + durationBonus
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    }
  }

  const getAdText = () => {
    switch (adTier) {
      case 'rewarded':
        return 'Watch this rewarded ad to earn SPY'
      case 'interstitial':
        return 'Interstitial ad playing...'
      case 'banner':
        return 'Advertisement'
      default:
        return 'Loading ad...'
    }
  }

  const renderAdContent = () => {
    // If using real Adsterra
    // return <AdsterraAd userId={userId} adType={adTier} />
    
    // Simulated ad display
    return (
      <div className="ad-container">
        <div className="ad-content">
          <div className="ad-icon">📺</div>
          <div className="ad-text">{getAdText()}</div>
          <div className="ad-timer">
            <div className="timer-progress">
              <div 
                className="timer-fill"
                style={{ width: `${state.progress * 100}%` }}
              />
            </div>
            <span className="timer-text">
              {Math.ceil(state.remainingTime)}s
            </span>
          </div>
        </div>
        <div className="ad-controls">
          {onSkip && (
            <button 
              className="skip-button"
              onClick={handleSkip}
              disabled={state.progress < 0.5}
            >
              Skip {state.progress >= 0.5 ? '↗' : '🔒'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ad-viewer">
      {renderAdContent()}
      
      <style jsx>{`
        .ad-viewer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.9);
          z-index: 9999;
        }
        
        .ad-container {
          background: #1a1a2e;
          border-radius: 24px;
          padding: 48px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .ad-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }
        
        .ad-text {
          color: white;
          font-size: 18px;
          margin-bottom: 32px;
        }
        
        .timer-progress {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        
        .timer-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #f97316);
          transition: width 0.1s linear;
          border-radius: 3px;
        }
        
        .timer-text {
          color: #8b8ca6;
          font-size: 14px;
        }
        
        .skip-button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 10px 24px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 16px;
        }
        
        .skip-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .skip-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}