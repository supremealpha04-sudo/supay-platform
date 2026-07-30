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
  FaVideo, FaMousePointer
} from 'react-icons/fa'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Import CSS Module
import styles from './page.module.css'

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

  // ... rest of your code (same as before) ...

  // ===== EARLY RETURNS =====
  
  // Show auth loading
  if (authLoading) {
    return (
      <div className={styles.loadingCenter}>
        <div className={styles.loadingCenterContent}>
          <div className={styles.loadingCenterSpinner} />
          <p className={styles.loadingCenterText}>Loading...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className={styles.loginPrompt}>
        <div className={styles.loginPromptContent}>
          <p className={styles.loginPromptText}>Please log in to earn rewards</p>
          <Link href="/login" className={styles.loginPromptLink}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.loadingCenter}>
        <div className={styles.loadingCenterContent}>
          <div className={styles.loadingCenterSpinner} />
          <p className={styles.loadingCenterText}>Loading your earnings...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorBox}>
          <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className={styles.errorTitle}>Something went wrong</h3>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className={styles.retryBtn}
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // ===== RENDER =====
  return (
    <div className={styles.container}>
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
        className={styles.header}
      >
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.headerTitle}>Earn SPY</h1>
            <p className={styles.headerSubtitle}>Watch ads from Adsterra & Monetag</p>
            {profile?.is_premium && (
              <div className={styles.premiumBadge}>
                <FaStar /> Premium: 2x Rewards Active
              </div>
            )}
          </div>
          <div className={styles.headerBadges}>
            {AD_PLATFORMS.map(p => {
              const status = platformStatus[p.id]
              return (
                <div 
                  key={p.id} 
                  className={status?.available ? styles.platformBadgeAvailable : styles.platformBadgeUnavailable}
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
      <div className={styles.statsGrid}>
        {[
          { label: 'Today', value: `${stats.todayEarnings.toFixed(2)} SPY`, icon: FaCoins, iconClass: styles.statCardIconAccent },
          { label: 'Remaining', value: `${stats.dailyRemaining} ads`, icon: FaStopwatch, iconClass: styles.statCardIconBlue },
          { label: 'Streak', value: `${stats.streak} days 🔥`, icon: FaFire, iconClass: styles.statCardIconOrange },
          { label: 'Total Views', value: `${stats.totalAds}`, icon: FaChartLine, iconClass: styles.statCardIconGreen },
        ].map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={styles.statCard}
          >
            <s.icon className={s.iconClass} />
            <p className={styles.statCardLabel}>{s.label}</p>
            <p className={styles.statCardValue}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Platform Earnings Breakdown */}
      {Object.keys(stats.platformEarnings).length > 0 && (
        <div className={styles.earningsBreakdown}>
          <h3 className={styles.earningsBreakdownTitle}>Earnings by Platform</h3>
          <div>
            {Object.entries(stats.platformEarnings).map(([platform, amount]) => {
              const platformInfo = AD_PLATFORMS.find(p => p.id === platform)
              return (
                <span key={platform} className={styles.earningsBreakdownItem}>
                  {platformInfo?.icon || '📊'} {platform}: {amount.toFixed(2)} SPY
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {['all', 'display', 'video', 'popunder'].map((tier) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={selectedTier === tier ? styles.filterTabActive : styles.filterTab}
          >
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </button>
        ))}
      </div>

      {/* Ad Options */}
      <h2 className="section-title">Available Ads</h2>
      <div className="grid gap-4 mb-6">
        {filteredAds.map((option, index) => {
          const Icon = option.icon
          const hasAvailablePlatform = option.platforms.some(pid => 
            platformStatus[pid]?.available
          )
          
          const availablePlatforms = option.platforms.filter(pid => 
            platformStatus[pid]?.available
          )

          // Map color to CSS module class
          const iconWrapperClass = {
            'bg-blue-500': styles.iconWrapperBlue,
            'bg-purple-500': styles.iconWrapperPurple,
            'bg-orange-500': styles.iconWrapperOrange,
            'bg-green-500': styles.iconWrapperGreen,
          }[option.color] || styles.iconWrapperBlue

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
              className={hasAvailablePlatform ? styles.adOption : styles.adOptionDisabled}
            >
              <div className={iconWrapperClass}>
                <Icon className="text-white text-2xl" />
              </div>
              <div className={styles.content}>
                <div className={styles.title}>
                  {option.title}
                  {option.tier === 'video' && (
                    <span className={styles.titleBadgeBestValue}>BEST VALUE</span>
                  )}
                </div>
                <p className={styles.description}>{option.description}</p>
                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    <FaClock className="inline" /> {option.duration}s
                  </span>
                  <span className={styles.metaItem}>Limit: {option.dailyLimit}/day</span>
                  <span className={styles.rewardEstimate}>
                    {option.estimatedReward}
                  </span>
                  <span className={styles.platformIcons}>
                    {availablePlatforms.map(pid => {
                      const platform = AD_PLATFORMS.find(p => p.id === pid)
                      return platform?.icon
                    }).join(' ')}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {hasAvailablePlatform ? (
                  <div className={styles.actionButton}>
                    <FaPlay />
                  </div>
                ) : (
                  <span className={styles.noInventory}>No inventory</span>
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
          className={styles.recentActivity}
        >
          <h3 className={styles.recentActivityTitle}>
            <FaHistory /> Today's Activity
          </h3>
          <div className={styles.activityList}>
            {recentActivity.map((watch, i) => (
              <div key={i} className={styles.activityItem}>
                <div className="flex items-center gap-2">
                  <span className={styles.activityTime}>
                    {new Date(watch.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={styles.activityTier}>{watch.ad_tier}</span>
                  {watch.platform_used && (
                    <span className={styles.activityPlatform}>
                      {watch.platform_used === 'adsterra' ? '🎯' : '📊'}
                    </span>
                  )}
                </div>
                <span className={styles.activityReward}>+{watch.reward_spy.toFixed(2)} SPY</span>
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
          className={styles.premiumBanner}
        >
          <div className={styles.premiumBannerContent}>
            <div>
              <h3 className={styles.premiumBannerTitle}>
                <FaStar className={styles.star} /> Go Premium
              </h3>
              <p className={styles.premiumBannerDescription}>2x rewards on everything + exclusive ad types</p>
            </div>
            <Link href="/dashboard/premium">
              <button className={styles.upgradeBtn}>
                Upgrade Now
              </button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Ad Loading Overlay */}
      {isChecking && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Checking ad availability...</p>
          </div>
        </div>
      )}
    </div>
  )
}