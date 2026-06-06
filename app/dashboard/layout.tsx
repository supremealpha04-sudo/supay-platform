// app/dashboard/layout.tsx
 'use client'

import styles from './layout.module.css'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className={`${styles.loading} min-h-screen flex items-center justify-center`}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className={`${styles.dashboard} flex h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900`}>
      <DashboardSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader setSidebarOpen={setSidebarOpen} />
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 ${styles['main-wrap']}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
