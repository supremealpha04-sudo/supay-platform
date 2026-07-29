'use client'

import { useEffect } from 'react'

interface GoogleAdProps {
  slotId: string
  format?: string
  onRender?: () => void
}

export function GoogleAd({ slotId, format = 'auto', onRender }: GoogleAdProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      if (window.adsbygoogle) {
        // @ts-ignore
        window.adsbygoogle.push({})
        if (onRender) onRender()
      }
    } catch (error) {
      console.error('Google Ad error:', error)
    }
  }, [slotId, onRender])

  return (
    <div className="google-ad-container">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}