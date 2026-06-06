// components/ads/AdsterraScript.tsx
'use client'

import { useEffect } from 'react'

interface AdsterraScriptProps {
  zoneId: string
  onAdComplete?: () => void
}

export function AdsterraScript({ zoneId, onAdComplete }: AdsterraScriptProps) {
  useEffect(() => {
    // Load Adsterra script
    const script = document.createElement('script')
    script.src = `//plrcd.com/static/${zoneId}.js`
    script.async = true
    document.body.appendChild(script)

    // Listen for ad completion events
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'adCompleted' && onAdComplete) {
        onAdComplete()
      }
    }
    window.addEventListener('message', handleMessage)

    return () => {
      document.body.removeChild(script)
      window.removeEventListener('message', handleMessage)
    }
  }, [zoneId, onAdComplete])

  return (
    <div id="adsterra-container" className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-4">
        <div className="aspect-video bg-navy-900 rounded-xl overflow-hidden">
          {/* Adsterra ad will load here */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white">Loading advertisement...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
