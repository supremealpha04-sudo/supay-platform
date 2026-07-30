// components/ads/AdViewer.tsx
'use client'

import { useState } from 'react'
import AdsterraAd from './AdsterraAd'

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
    const fraudScore = {
      avgViewTime: minDuration,
      tabSwitches: 0,
      isHeadlessBrowser: false,
      isProxy: false,
      fraudScore: 0.1
    }
    onComplete(reward, adTier, fraudScore)
  }

  const handleAdError = (errorMsg: string) => {
    setError(errorMsg)
    setTimeout(() => onCancel(), 3000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="border-b border-gray-800 p-3">
          <h3 className="text-white font-medium text-center">Watch Ad to Earn SPY</h3>
        </div>

        {/* Ad Content */}
        <div className="min-h-[300px]">
          {error ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-red-400 p-4">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-center">{error}</p>
              <p className="text-gray-500 text-sm mt-2">Closing in 3 seconds...</p>
            </div>
          ) : (
            <AdsterraAd
              userId={userId}
              adType={adTier}
              minDuration={minDuration}
              onComplete={handleAdComplete}
              onError={handleAdError}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-2 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Powered by Adsterra
          </span>
          <span className="text-xs text-gray-500">
            Watch full ad to earn rewards
          </span>
        </div>
      </div>
    </div>
  )
}