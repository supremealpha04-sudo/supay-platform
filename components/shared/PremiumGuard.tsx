// components/shared/PremiumGuard.tsx
'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PremiumGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function PremiumGuard({ children, fallback }: PremiumGuardProps) {
  const { profile } = useAuth()

  if (profile?.is_premium) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="glass rounded-xl p-8 text-center">
      <Crown className="w-12 h-12 text-accent-500 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Premium Required</h3>
      <p className="text-gray-400 mb-4">This feature is only available for premium users</p>
      <Link href="/dashboard/premium">
        <Button>Upgrade to Premium</Button>
      </Link>
    </div>
  )
}
