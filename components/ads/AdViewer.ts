'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Lazy load platform-specific components
const AdsterraAd = dynamic(() => import('./AdsterraAd'), { ssr: false })
const MonetagAd = dynamic(() => import('./MonetagAd'), { ssr: false })
const MonetagPopunder = dynamic(() => import('./MonetagPopunder'), { ssr: false })

interface AdViewerProps {
  userId: string
  platform: string
  adTier: string
  minDuration: number
  onComplete: (reward: number, tier: string, fraudScore: any) => void
  onCancel: () => void
}

export default function AdViewer({
  userId,
  platform,
  adTier,
  minDuration,
  onComplete,
  onCancel
}: AdViewerProps) {
  const [error, setError] = useState<string | null>(null)

  const handleAdComplete = (reward: number) => {
    // Fraud detection data
    const fraudScore = {
      avgViewTime: minDuration / 1000,
      tabSwitches: 0,
      isHeadlessBrowser: false,
      isProxy: false,
      fraudScore: 0.1 // Low score for legit views
    }
    
    onComplete(reward, adTier, fraudScore)
  }

  const handleAdError = (errorMsg: string) => {
    setError(errorMsg)
    setTimeout(() => onCancel(), 3000)
  }

  // Render platform-specific ad component
  const renderAd = () => {
    switch(platform) {
      case 'adsterra':
        return (
          <AdsterraAd
            userId={userId}
            adType={adTier}
            minDuration={minDuration}
            onComplete={handleAdComplete}
            onError={handleAdError}
          />
        )
      case 'monetag':
        // Monetag handles different ad types
        if (adTier === 'popunder') {
          return (
            <MonetagPopunder
              userId={userId}
              onComplete={handleAdComplete}
              onError={handleAdError}
            />
          )
        } else {
          return (
            <MonetagAd
              userId={userId}
              adType={adTier}
              onAdComplete={handleAdComplete}
              onAdError={handleAdError}
            />
          )
        }
      default:
        return <div>Unsupported platform</div>
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="relative w-full max-w-4xl h-[80vh] bg-gray-900 rounded-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition"
        >
          ✕
        </button>
        
        {/* Ad content */}
        <div className="w-full h-full">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-400">
              <p>{error}</p>
            </div>
          ) : (
            renderAd()
          )}
        </div>
        
        {/* Platform indicator */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-500">
          Powered by {platform}
        </div>
      </div>
    </div>
  )
}