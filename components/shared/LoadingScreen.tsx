// components/shared/LoadingScreen.tsx
'use client'

import { Spinner } from '@/components/ui/Spinner'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-navy-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary-500 border-t-accent-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-gray-400 animate-pulse">Loading Supay...</p>
      </div>
    </div>
  )
}
