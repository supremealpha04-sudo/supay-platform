'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FaPlay, FaClock, FaCoins, FaStopwatch, FaFire, 
  FaAd, FaHistory, FaStar, FaChartLine,
  FaVideo, FaMousePointer
} from 'react-icons/fa'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Import CSS
import './page.css'

const supabase = createClient()

// AdViewer component (handles both platforms)
const AdViewer = dynamic(() => import('@/components/ads/AdViewer'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
    </div>
  )
})

// Ad platform configurations
const AD_PLATFORMS = [
  {
    id: 'adsterra',
    name: 'Adsterra',
    icon: '🎯',
    description: 'High CPM video & banner ads',
    hasApi: true,
  },
  {
    id: 'monetag',
    name: 'Monetag',
    icon: '📊',
    description: 'Popunder & display ads',
    hasApi: false,
  }
]

interface AdOption {
  tier: 'display' | 'video' | 'popunder' | 'interstitial'
  title: string
  description: string
  duration: number
  icon: any
  color: string
  dailyLimit: number
  platforms: string[]
  estimatedReward: string
}

const AD_OPTIONS: AdOption[] = [
  {
    tier: 'display',
    title: 'Display Ad',
    description: 'View banner/image ads',
    duration: 10,
    icon: FaAd,
    color: 'bg-blue-500',
    dailyLimit: 20,
    platforms: ['adsterra', 'monetag'],
    estimatedReward: '0.1 - 0.3 SPY'
  },
  {
    tier: 'video',
    title: 'Video Ad',
    description: 'Watch video ads (higher payout)',
    duration: 30,
    icon: FaVideo,
    color: 'bg-purple-500',
    dailyLimit: 10,
    platforms: ['adsterra'],
    estimatedReward: '0.5 - 2 SPY'
  },
  {
    tier: 'popunder',
    title: 'Popunder Ad',
    description: 'View popunder ads (quick earn)',
    duration: 5,
    icon: FaMousePointer,
    color: 'bg-orange-500',
    dailyLimit: 15,
    platforms: ['monetag'],
    estimatedReward: '0.05 - 0.15 SPY'
  },
]

export default function EarnPage() {
  const { profile, user, refreshProfile, isLoading: authLoading } = useAuth()
  
  // ===== STATE =====
  const [showAd, setShowAd] = useState(false)
  const [selectedAd, setSelectedAd] = useState<AdOption | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [stats, setStats] = useState({
    todayEarnings: 0,
    dailyRemaining: 20,
    streak: 0,
    totalAds: 0,
    platformEarnings: {} as Record<string, number>
  })
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [platformStatus, setPlatformStatus] = useState<Record<string, { 
    available: boolean, 
    ecpm?: number,
    loading: boolean 
  }>>({})
  const [isChecking, setIsChecking] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  // ===== FUNCTIONS =====
  
  // Check Adsterra availability via API
  const checkAdsterraAvailability = useCallback(async (adTier: string) => {
    try {
      const response = await fetch('/api/ads/adsterra/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adTier })
      })
      const data = await response.json()
      return { available: data.available, ecpm: data.ecpm || 1.50 }
    } catch (error) {
      console.error('Adsterra check error:', error)
      return { available: true, ecpm: 1.50 } // Fallback
    }
  }, [])

  // Check Monetag availability (no API)
  const checkMonetagAvailability = useCallback(async (adTier: string) => {
    // Monetag is always available for display/popunder
    if (adTier === 'display' || adTier === 'popunder') {
      try {
        // Check if we had recent impressions
        const { data: recentImpressions } = await supabase
          .from('ad_watches')
          .select('created_at')
          .eq('platform_used', 'monetag')
          .gte('created_at', new Date(Date.now() - 3600000).toISOString())
          .limit(1)

        return { 
          available: true, 
          ecpm: recentImpressions && recentImpressions.length > 0 ? 0.80 : 0.50 
        }
      } catch (error) {
        console.error('Monetag check error:', error)
        return { available: true, ecpm: 0.50 }
      }
    }
    return { available: false, ecpm: 0 }
  }, [])

  const fetchStats = useCallback(async () => {
    if (!profile?.id) {
      console.log('⚠️ No profile.id, skipping fetchStats')
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const today = new Date().toISOString().split('T')[0]

      // Get today's watches
      const { data: todayWatches, error: watchError } = await supabase
        .from('ad_watches')
        .select('reward_spy, ad_tier, platform_used, created_at')
        .eq('user_id', profile.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })

      if (watchError) {
        console.error('Watch error:', watchError)
        throw watchError
      }

      // Calculate earnings by platform
      const platformEarnings: Record<string, number> = {}
      todayWatches?.forEach(w => {
        if (w.platform_used) {
          platformEarnings[w.platform_used] = (platformEarnings[w.platform_used] || 0) + (w.reward_spy || 0)
        }
      })

      const earnings = todayWatches?.reduce((sum, w) => sum + (w.reward_spy || 0), 0) || 0
      const totalAds = todayWatches?.length || 0

      // Check platform statuses
      const statuses: Record<string, { available: boolean, ecpm?: number, loading: boolean }> = {}
      
      // Check Adsterra for display ads
      const adsterraStatus = await checkAdsterraAvailability('display')
      statuses['adsterra'] = { ...adsterraStatus, loading: false }
      
      // Check Monetag for display ads
      const monetagStatus = await checkMonetagAvailability('display')
      statuses['monetag'] = { ...monetagStatus, loading: false }
      
      setPlatformStatus(statuses)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('daily_bonus_streak')
        .eq('id', profile.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      setStats({
        todayEarnings: earnings,
        dailyRemaining: Math.max(0, 20 - totalAds),
        streak: profileData?.daily_bonus_streak || 0,
        totalAds,
        platformEarnings
      })
      setRecentActivity(todayWatches?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to load stats')
      toast.error('Failed to load stats')
    } finally {
      setIsLoading(false)
    }
  }, [profile, checkAdsterraAvailability, checkMonetagAvailability])

  // Load stats when profile is available
  useEffect(() => {
    if (profile) {
      fetchStats()
    } else if (!authLoading) {
      // If auth is done and no profile, stop loading
      setIsLoading(false)
    }
  }, [profile, authLoading, fetchStats])

  // START AD FUNCTION
  const startAd = async (option: AdOption) => {
    setIsChecking(true)
    try {
      // Check which platforms have ads available for this type
      const availablePlatforms = await Promise.all(
        option.platforms.map(async (platformId) => {
          let available = false
          let ecpm = 0
          
          if (platformId === 'adsterra') {
            const result = await checkAdsterraAvailability(option.tier)
            available = result.available
            ecpm = result.ecpm || 0
          } else if (platformId === 'monetag') {
            // Monetag is always available for display/popunder
            if (option.tier === 'display' || option.tier === 'popunder') {
              available = true
              ecpm = 0.50
            }
          }
          
          return { platformId, available, ecpm }
        })
      )

      const available = availablePlatforms.filter(p => p.available)
      
      if (available.length === 0) {
        toast.error('No ads available right now. Try again in a few minutes!')
        setIsChecking(false)
        return
      }

      // Choose platform with highest eCPM (or fallback to first)
      const bestPlatform = available.sort((a, b) => (b.ecpm || 0) - (a.ecpm || 0))[0]
      setSelectedPlatform(bestPlatform.platformId)
      setSelectedAd(option)
      setShowAd(true)
    } catch (error) {
      console.error('Error starting ad:', error)
      toast.error('Failed to check ad availability')
    } finally {
      setIsChecking(false)
    }
  }

  // HANDLE AD COMPLETE
  const handleAdComplete = async (reward: number, tier: string, fraudScore: any) => {
    setShowAd(false)
    setSelectedAd(null)
    setSelectedPlatform(null)

    try {
      const res = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adTier: tier,
          platform: selectedPlatform,
          fraudSignals: fraudScore,
          fraudScore,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`+${data.reward} SPY! (${data.platform})`)
        await refreshProfile()
        fetchStats()
      } else {
        toast.error(data.message || 'Failed to process')
      }
    } catch (error) {
      console.error('Error completing ad:', error)
      toast.error('Failed to process ad completion')
    }
  }

  // HANDLE CANCEL AD
  const handleCancelAd = () => {
    setShowAd(false)
    setSelectedAd(null)
    setSelectedPlatform(null)
    toast('Ad cancelled', { icon: '⚠️' })
  }

  // Filter ads by tier
  const filteredAds = selectedTier === 'all' 
    ? AD_OPTIONS 
    : AD_OPTIONS.filter(ad => ad.tier === selectedTier)

  // ===== EARLY RETURNS =====
  
  // Show auth loading
  if (authLoading) {
    return (
      <div className="earn-loading-center">
        <div className="earn-loading-content">
          <div className="earn-loading-spinner" />
          <p className="earn-loading-text">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="earn-login-prompt">
        <div className="earn-login-content">
          <p className="earn-login-text">Please log in to earn rewards</p>
          <Link href="/login" className="earn-login-link">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="earn-loading-center">
        <div className="earn-loading-content">
          <div className="earn-loading-spinner" />
          <p className="earn-loading-text">Loading your earnings...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="earn-error-container">
        <div className="earn-error-box">
          <svg className="earn-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="earn-error-title">Something went wrong</h3>
          <p className="earn-error-message">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="earn-retry-btn"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // ===== RENDER =====
  return (
    <div className="earn-container">
      <AnimatePresence>
        {showAd && selectedAd && selectedPlatform && (
          <AdViewer
            userId={user?.id || ''}
            platform={selectedPlatform}
            adTier={selectedAd.tier}
            minDuration={selectedAd.duration}
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
            <p className="earn-header-subtitle">Watch ads from Adsterra & Monetag</p>
            {profile?.is_premium && (
              <div className="earn-premium-badge">
                <FaStar /> Premium: 2x Rewards Active
              </div>
            )}
          </div>
          <div className="earn-header-badges">
            {AD_PLATFORMS.map(p => {
              const status = platformStatus[p.id]
              return (
                <div 
                  key={p.id} 
                  className={status?.available ? 'earn-platform-badge available' : 'earn-platform-badge unavailable'}
                >
                  <span className="mr-1">{p.icon}</span>
                  {p.name}
                  <span className={`ml-1 ${status?.available ? 'text-green-400' : 'text-red-400'}`}>
                    {status?.available ? '●' : '○'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

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
            <p className="earn-stat-value">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Platform Earnings Breakdown */}
      {Object.keys(stats.platformEarnings).length > 0 && (
        <div className="earn-earnings-breakdown">
          <h3 className="earn-earnings-breakdown-title">Earnings by Platform</h3>
          <div>
            {Object.entries(stats.platformEarnings).map(([platform, amount]) => {
              const platformInfo = AD_PLATFORMS.find(p => p.id === platform)
              return (
                <span key={platform} className="earn-earnings-breakdown-item">
                  {platformInfo?.icon || '📊'} {platform}: {amount.toFixed(2)} SPY
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="earn-filter-tabs">
        {['all', 'display', 'video', 'popunder'].map((tier) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={selectedTier === tier ? 'earn-filter-tab active' : 'earn-filter-tab'}
          >
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </button>
        ))}
      </div>

      {/* Ad Options */}
      <h2 className="earn-section-title">Available Ads</h2>
      <div className="grid gap-4 mb-6">
        {filteredAds.map((option, index) => {
          const Icon = option.icon
          const hasAvailablePlatform = option.platforms.some(pid => 
            platformStatus[pid]?.available
          )
          
          const availablePlatforms = option.platforms.filter(pid => 
            platformStatus[pid]?.available
          )

          // Map color to class
          const iconWrapperClass = {
            'bg-blue-500': 'earn-icon-wrapper-blue',
            'bg-purple-500': 'earn-icon-wrapper-purple',
            'bg-orange-500': 'earn-icon-wrapper-orange',
            'bg-green-500': 'earn-icon-wrapper-green',
          }[option.color] || 'earn-icon-wrapper-blue'

          return (
            <motion.button
              key={option.tier}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: hasAvailablePlatform ? 1.02 : 1 }}
              whileTap={{ scale: hasAvailablePlatform ? 0.98 : 1 }}
              onClick={() => hasAvailablePlatform && startAd(option)}
              disabled={!hasAvailablePlatform || isChecking}
              className={hasAvailablePlatform ? 'earn-ad-option' : 'earn-ad-option disabled'}
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
                    <FaClock className="inline" /> {option.duration}s
                  </span>
                  <span className="earn-ad-meta-item">Limit: {option.dailyLimit}/day</span>
                  <span className="earn-ad-reward-estimate">
                    {option.estimatedReward}
                  </span>
                  <span className="earn-ad-platform-icons">
                    {availablePlatforms.map(pid => {
                      const platform = AD_PLATFORMS.find(p => p.id === pid)
                      return platform?.icon
                    }).join(' ')}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {hasAvailablePlatform ? (
                  <div className="earn-ad-action-button">
                    <FaPlay />
                  </div>
                ) : (
                  <span className="earn-ad-no-inventory">No inventory</span>
                )}
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
                  {watch.platform_used && (
                    <span className="earn-activity-platform">
                      {watch.platform_used === 'adsterra' ? '🎯' : '📊'}
                    </span>
                  )}
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

      {/* Ad Loading Overlay */}
      {isChecking && (
        <div className="earn-loading-overlay">
          <div className="earn-loading-content">
            <div className="earn-loading-spinner" />
            <p className="earn-loading-text">Checking ad availability...</p>
          </div>
        </div>
      )}
    </div>
  )
}