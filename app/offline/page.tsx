// app/offline/page.tsx
'use client'

import Link from 'next/link'
import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-primary-900 to-navy-900 flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-10 h-10 text-accent-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">You're Offline</h1>
        <p className="text-gray-400 mb-6">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white"
        >
          Retry
        </button>
        <Link
          href="/dashboard"
          className="block mt-4 text-sm text-accent-500 hover:underline"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
