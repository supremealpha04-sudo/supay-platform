// app/dashboard/earn/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FaPlay, FaClock, FaCoins, FaStopwatch, FaFire, 
  FaAd, FaHistory, FaStar, FaChartLine,
  FaVideo, FaDatabase, FaSync, FaExclamationCircle
} from 'react-icons/fa'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

import './page.css'

const supabase = createClient()

const AdViewer = dynamic(() => import('@/components/ads/AdViewer'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
    </div>
  )
})

interface AdOption {
  tier: 'display' | 'video'
  title: string
  description: string
  totalDuration: number
  adCount: number
  icon: any
  color: string
  dailyLimit: number
  estimatedReward: string
}

const AD_OPTIONS: AdOption[] = [
  {
    tier: 'display',
    title: 'Display Ads',
    description: 'Watch 3 display ads (25s each)',
    totalDuration: 75,
    adCount: 3,
    icon: FaAd,
    color: 'bg-blue-500',
    dailyLimit: 20,
    estimatedReward: '0.45 SPY'
  },
  {
    tier: 'video',
    title: 'Video Ads',
    description: 'Watch 2 video ads (30s each)',
    totalDuration: 60,
    adCount: 2,
    icon: FaVideo,
    color: 'bg-purple-500',
    dailyLimit: 10,
    estimatedReward: '1.00 SPY'
  }
]

export default function EarnPage() {
  const router = useRouter()
  const { profile, user, refreshProfile, isLoading: authLoading } = useAuth()
  
  const [showAd, setShowAd] = useState(false)
  const [selectedAd, setSelectedAd] = useState<AdOption | null>(null)
  const [stats, setStats] = useState({
    todayEarnings: 0,
    dailyRemaining: 20,
    streak: 0,
    totalAds: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [statsError, setStatsError] = useState<string | null>(null)
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Direct session check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setSessionUser(session.user)
        }
      } catch (err) {
        console.error('Session check error:', err)
      }
    }
    checkSession()
  }, [])

  // Robust stats fetcher - NEVER crashes the page
  const fetchStats = useCallback(async () => {
    const userId = profile?.id || sessionUser?.id
    
    if (!userId) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setStatsError(null)

    try {
      const today = new Date().toISOString().split('T')[0]

      // Try to get today's watches - gracefully handle missing table/RLS
      let todayWatches: any[] = []
      let totalAds = 0
      let earnings = 0

      try {
        const { data, error } = await supabase
          .from('ad_watches')
          .select('reward_spy, ad_tier, created_at')
          .eq('user_id', userId)
          .gte('created_at', today)
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('⚠️ ad_watches query failed (table missing or RLS):', error.message)
          setStatsError('Stats temporarily unavailable')
        } else {
          todayWatches = data || []
          totalAds = todayWatches.length
          earnings = todayWatches.reduce((sum, w) => sum + (w.reward_spy || 0), 0)
        }
      } catch (e) {
        console.warn('⚠️ ad_watches table may not exist yet')
        setStatsError('Stats temporarily unavailable')
      }

      // Try to get streak from profile - gracefully handle missing column
      let streak = 0
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('daily_bonus_streak')
          .eq('id', userId)
          .maybeSingle()

        if (!profileError && profileData) {
          streak = profileData.daily_bonus_streak || 0
        }
      } catch (e) {
        console.warn('⚠️ Could not load streak')
      }

      setStats({
        todayEarnings: earnings,
        dailyRemaining: Math.max(0, 20 - totalAds),
        streak,
        totalAds
      })
      setRecentActivity(todayWatches.slice(0, 5))

    } catch (error) {
      console.error('❌ Unexpected error in fetchStats:', error)
      setStatsError('Failed to load stats')
      // Keep default zero stats so page still works
      setStats({
        todayEarnings: 0,
        dailyRemaining: 20,
        streak: 0,
        totalAds: 0
      })
    } finally {
      setIsLoading(false)
    }
  }, [profile, sessionUser])

  // Load stats when user is available
  useEffect(() => {
    const userId = profile?.id || sessionUser?.id
    if (userId) {
      fetchStats()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [profile, sessionUser, authLoading, fetchStats, retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const startAd = (option: AdOption) => {
    const userId = profile?.id || sessionUser?.id
    if (!userId) {
      toast.error('Please log in to watch ads')
      router.push('/login?redirect=/dashboard/earn')
      return
    }
    setSelectedAd(option)
    setShowAd(true)
  }

  // Resilient ad completion handler
  const handleAdComplete = async (reward: number, tier: string, fraudScore: any) => {
    setShowAd(false)
    setSelectedAd(null)

    try {
      const res = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adTier: tier,
          platform: 'adsterra',
          fraudSignals: fraudScore,
          fraudScore,
        }),
      })

      // Handle non-JSON responses
      const contentType = res.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text)
        toast.error('Server error. Please try again.')
        return
      }

      const data = await res.json()
      
      if (data.success) {
        toast.success(`+${data.reward} SPY! 🎉`)
        await refreshProfile()
        fetchStats()
      } else {
        toast.error(data.message || 'Failed to process')
        if (data.message?.includes('Unauthorized') || data.message?.includes('log in')) {
          router.push('/login?redirect=/dashboard/earn')
        }
      }
    } catch (error) {
      console.error('❌ Error completing ad:', error)
      toast.error('Network error. Reward may still be processed.')
    }
  }

  const handleCancelAd = () => {
    setShowAd(false)
    setSelectedAd(null)
    toast('Ad cancelled', { icon: '⚠️' })
  }

  const isLoggedIn = !!(user || profile || sessionUser)

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400">Please log in to earn rewards</p>
          <Link href="/login?redirect=/dashboard/earn" className="text-accent-500 hover:text-accent-400 mt-2 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // MAIN RENDER - Always show ad options, even if stats fail
  return (
    <div className="earn-container">
      <AnimatePresence>
        {showAd && selectedAd && (
          <AdViewer
            userId={profile?.id || sessionUser?.id || ''}
            platform="adsterra"
            adTier={selectedAd.tier}
            totalDuration={selectedAd.totalDuration}
            adCount={selectedAd.adCount}
            onComplete={handleAdComplete}
            onCancel={handleCancelAd}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="earn-header"
      >
        <div className="earn-header-top">
          <div>
            <h1 className="earn-header-title">Earn SPY</h1>
            <p className="earn-header-subtitle">Watch ads from Adsterra</p>
            {profile?.is_premium && (
              <div className="earn-premium-badge">
                <FaStar /> Premium: 2x Rewards Active
              </div>
            )}
          </div>
          <div className="earn-header-badges">
            <div className="earn-platform-badge available">
              <span className="mr-1">🎯</span>
              Adsterra
              <span className="ml-1 text-green-400">●</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Error Banner (non-blocking) */}
      {statsError && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="stats-error-banner"
        >
          <FaExclamationCircle className="text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-400 text-sm font-medium">{statsError}</p>
            <p className="text-yellow-400/60 text-xs">You can still watch ads and earn rewards</p>
          </div>
          <button 
            onClick={handleRetry}
            className="p-2 hover:bg-yellow-500/20 rounded-lg transition"
          >
            <FaSync className="text-yellow-400 text-sm" />
          </button>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="earn-stats-grid">
        {[
          { label: 'Today', value: `${stats.todayEarnings.toFixed(2)} SPY`, icon: FaCoins, iconClass: 'earn-stat-icon-accent' },
          { label: 'Remaining', value: `${stats.dailyRemaining} ads`, icon: FaStopwatch, iconClass: 'earn-stat-icon-blue' },
          { label: 'Streak', value: `${stats.streak} days 🔥`, icon: FaFire, iconClass: 'earn-stat-icon-orange' },
          { label: 'Total Views', value: `${stats.totalAds}`, icon: FaChartLine, iconClass: 'earn-stat-icon-green' },
        ].map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="earn-stat-card"
          >
            <s.icon className={s.iconClass} />
            <p className="earn-stat-label">{s.label}</p>
            <p className="earn-stat-value">{isLoading ? '...' : s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Ad Options */}
      <h2 className="earn-section-title">Available Ads</h2>
      <div className="grid gap-4 mb-6">
        {AD_OPTIONS.map((option, index) => {
          const Icon = option.icon
          const iconWrapperClass = {
            'bg-blue-500': 'earn-icon-wrapper-blue',
            'bg-purple-500': 'earn-icon-wrapper-purple',
          }[option.color] || 'earn-icon-wrapper-blue'

          return (
            <motion.button
              key={option.tier}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startAd(option)}
              className="earn-ad-option"
            >
              <div className={iconWrapperClass}>
                <Icon className="text-white text-2xl" />
              </div>
              <div className="earn-ad-content">
                <div className="earn-ad-title">
                  {option.title}
                  {option.tier === 'video' && (
                    <span className="earn-ad-badge-best-value">BEST VALUE</span>
                  )}
                </div>
                <p className="earn-ad-description">{option.description}</p>
                <div className="earn-ad-meta">
                  <span className="earn-ad-meta-item">
                    <FaClock className="inline" /> {option.totalDuration}s total
                  </span>
                  <span className="earn-ad-meta-item">{option.adCount} ads</span>
                  <span className="earn-ad-meta-item">Limit: {option.dailyLimit}/day</span>
                  <span className="earn-ad-reward-estimate">
                    {option.estimatedReward}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="earn-ad-action-button">
                  <FaPlay />
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="earn-recent-activity"
        >
          <h3 className="earn-recent-activity-title">
            <FaHistory /> Today's Activity
          </h3>
          <div className="earn-activity-list">
            {recentActivity.map((watch, i) => (
              <div key={i} className="earn-activity-item">
                <div className="flex items-center gap-2">
                  <span className="earn-activity-time">
                    {new Date(watch.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="earn-activity-tier">{watch.ad_tier}</span>
                </div>
                <span className="earn-activity-reward">+{watch.reward_spy.toFixed(2)} SPY</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Premium Upgrade Banner */}
      {!profile?.is_premium && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="earn-premium-banner"
        >
          <div className="earn-premium-banner-content">
            <div>
              <h3 className="earn-premium-banner-title">
                <FaStar className="earn-star" /> Go Premium
              </h3>
              <p className="earn-premium-banner-description">2x rewards on everything + exclusive ad types</p>
            </div>
            <Link href="/dashboard/premium">
              <button className="earn-upgrade-btn">
                Upgrade Now
              </button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
