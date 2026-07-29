'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy load platform-specific components
const AdsterraAd = dynamic(() => import('./AdsterraAd'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
    </div>
  )
})

const MonetagAd = dynamic(() => import('./MonetagAd'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
    </div>
  )
})

const MonetagPopunder = dynamic(() => import('./MonetagPopunder'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
    </div>
  )
})

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
      avgViewTime: minDuration,
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
        return <div className="text-gray-400">Unsupported platform</div>
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl h-[80vh] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Ad content */}
        <div className="w-full h-full">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 p-4">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-center">{error}</p>
              <p className="text-gray-500 text-sm mt-2">Closing in 3 seconds...</p>
            </div>
          ) : (
            renderAd()
          )}
        </div>
        
        {/* Platform indicator */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-gray-800/80 px-3 py-1 rounded-full">
          Powered by {platform}
        </div>
      </div>
    </div>
  )
}'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy load platform-specific components
const AdsterraAd = dynamic(() => import('./AdsterraAd'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
    </div>
  )
})

const MonetagAd = dynamic(() => import('./MonetagAd'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
    </div>
  )
})

const MonetagPopunder = dynamic(() => import('./MonetagPopunder'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
    </div>
  )
})

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
      avgViewTime: minDuration,
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
        return <div className="text-gray-400">Unsupported platform</div>
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl h-[80vh] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Ad content */}
        <div className="w-full h-full">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 p-4">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-center">{error}</p>
              <p className="text-gray-500 text-sm mt-2">Closing in 3 seconds...</p>
            </div>
          ) : (
            renderAd()
          )}
        </div>
        
        {/* Platform indicator */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-gray-800/80 px-3 py-1 rounded-full">
          Powered by {platform}
        </div>
      </div>
    </div>
  )
}