'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FaPlay, FaClock, FaCoins, FaStopwatch, FaFire, 
  FaAd, FaHistory, FaStar, FaGift, FaChartLine,
  FaVideo, FaMousePointer, FaTrophy
} from 'react-icons/fa'
import dynamic from 'next/dynamic'

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
    color: 'from-blue-500/20 to-purple-500/20',
    borderColor: 'border-blue-500/30'
  },
  {
    id: 'monetag',
    name: 'Monetag',
    icon: '📊',
    description: 'Popunder & display ads',
    hasApi: false,
    color: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/30'
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
  const { profile, user, refreshProfile } = useAuth()
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
    } catch {
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
      } catch {
        return { available: true, ecpm: 0.50 }
      }
    }
    return { available: false, ecpm: 0 }
  }, [])

  const fetchStats = useCallback(async () => {
    if (!profile?.id) return
    setIsLoading(true)

    try {
      const today = new Date().toISOString().split('T')[0]

      // Get today's watches
      const { data: todayWatches } = await supabase
        .from('ad_watches')
        .select('reward_spy, ad_tier, platform_used, created_at')
        .eq('user_id', profile.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })

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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('daily_bonus_streak')
        .eq('id', profile.id)
        .single()

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
      toast.error('Failed to load stats')
    } finally {
      setIsLoading(false)
    }
  }, [profile, checkAdsterraAvailability, checkMonetagAvailability])

  useEffect(() => {
    if (profile) fetchStats()
  }, [profile, fetchStats])

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
          platformData: {
            adsterra: {
              // Any Adsterra-specific data
            },
            monetag: {
              // Monetag doesn't need extra data
            }
          }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
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
        className="bg-gradient-to-r from-accent-500/20 to-purple-500/20 rounded-2xl p-6 mb-6 border border-accent-500/30"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Earn SPY</h1>
            <p className="text-gray-400">Watch ads from Adsterra & Monetag</p>
            {profile?.is_premium && (
              <div className="mt-3 inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                <FaStar /> Premium: 2x Rewards Active
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {AD_PLATFORMS.map(p => {
              const status = platformStatus[p.id]
              return (
                <div 
                  key={p.id} 
                  className={`text-xs bg-gray-800/50 px-3 py-1 rounded-full border ${
                    status?.available ? 'border-green-500/30' : 'border-red-500/30'
                  }`}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Today', value: `${stats.todayEarnings} SPY`, icon: FaCoins, color: 'text-accent-500' },
          { label: 'Remaining', value: `${stats.dailyRemaining} ads`, icon: FaStopwatch, color: 'text-blue-400' },
          { label: 'Streak', value: `${stats.streak} days 🔥`, icon: FaFire, color: 'text-orange-400' },
          { label: 'Total Views', value: `${stats.totalAds}`, icon: FaChartLine, color: 'text-green-400' },
        ].map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition"
          >
            <s.icon className={`${s.color} mb-2`} />
            <p className="text-gray-400 text-xs">{s.label}</p>
            <p className="text-white font-bold text-lg">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Platform Earnings Breakdown */}
      {Object.keys(stats.platformEarnings).length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Earnings by Platform</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.platformEarnings).map(([platform, amount]) => {
              const platformInfo = AD_PLATFORMS.find(p => p.id === platform)
              return (
                <span key={platform} className="text-xs bg-gray-700 px-3 py-1 rounded-full">
                  {platformInfo?.icon || '📊'} {platform}: {amount} SPY
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'display', 'video', 'popunder'].map((tier) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedTier === tier
                ? 'bg-accent-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </button>
        ))}
      </div>

      {/* Ad Options */}
      <h2 className="text-lg font-bold text-white mb-4">Available Ads</h2>
      <div className="grid gap-4 mb-6">
        {filteredAds.map((option, index) => {
          const Icon = option.icon
          // Check if any platform supports this ad type and has inventory
          const hasAvailablePlatform = option.platforms.some(pid => 
            platformStatus[pid]?.available
          )
          
          const availablePlatforms = option.platforms.filter(pid => 
            platformStatus[pid]?.available
          )

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
              className={`flex items-center gap-4 bg-gray-800 rounded-xl p-4 border transition text-left ${
                hasAvailablePlatform 
                  ? 'border-gray-700 hover:border-accent-500/50 cursor-pointer hover:shadow-lg hover:shadow-accent-500/10' 
                  : 'border-gray-700/50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-14 h-14 ${option.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="text-white text-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white">{option.title}</h3>
                  {option.tier === 'video' && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">BEST VALUE</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{option.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <FaClock className="inline" /> {option.duration}s
                  </span>
                  <span className="text-gray-500">Limit: {option.dailyLimit}/day</span>
                  <span className="text-green-400 font-medium">
                    {option.estimatedReward}
                  </span>
                  <span className="text-blue-400">
                    {availablePlatforms.map(pid => {
                      const platform = AD_PLATFORMS.find(p => p.id === pid)
                      return platform?.icon
                    }).join(' ')}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {hasAvailablePlatform ? (
                  <div className="w-10 h-10 bg-accent-500/20 rounded-full flex items-center justify-center">
                    <FaPlay className="text-accent-500" />
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs px-2 py-1 bg-gray-700 rounded-full">
                    No inventory
                  </span>
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
          className="bg-gray-800 rounded-xl p-4 border border-gray-700"
        >
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <FaHistory /> Today's Activity
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentActivity.map((watch, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">
                    {new Date(watch.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{watch.ad_tier}</span>
                  {watch.platform_used && (
                    <span className="text-xs">
                      {watch.platform_used === 'adsterra' ? '🎯' : '📊'}
                    </span>
                  )}
                </div>
                <span className="text-green-400 font-medium">+{watch.reward_spy} SPY</span>
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
          className="mt-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <FaStar className="text-yellow-400" /> Go Premium
              </h3>
              <p className="text-gray-400 text-sm">2x rewards on everything + exclusive ad types</p>
            </div>
            <Link href="/dashboard/premium">
              <button className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-bold text-sm transition">
                Upgrade Now
              </button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Ad Loading Overlay */}
      {isChecking && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Checking ad availability...</p>
          </div>
        </div>
      )}
    </div>
  )
}