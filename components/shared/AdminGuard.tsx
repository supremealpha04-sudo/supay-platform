// components/shared/AdminGuard.tsx
'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'

interface AdminGuardProps {
  children: ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!profile || !profile.is_admin)) {
      router.push('/dashboard')
    }
  }, [profile, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile?.is_admin) return null

  return <>{children}</>
}
