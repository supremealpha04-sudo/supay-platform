'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FaPlay, FaClock, FaCoins, FaStopwatch, FaTrophy, 
  FaFire, FaAd, FaHistory, FaShieldAlt, FaStar,
  FaGift, FaChartLine
} from 'react-icons/fa'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const supabase = createClient()

const AdViewer = dynamic(() => import('@/components/ads/AdViewer'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
    </div>
  )
})

interface AdOption {
  tier: 'cpm' | 'cpc' | 'cpa' | 'premium_video' | 'offerwall'
  title: string
  description: string
  duration: number
  rewardRange: string
  icon: any
  color: string
  dailyLimit: number
}

const AD_OPTIONS: AdOption[] = [
  {
    tier: 'cpm',
    title: 'Quick Ad',
    description: 'Watch a banner ad',
    duration: 15,
    rewardRange: '0.1 - 0.5 SPY',
    icon: FaAd,
    color: 'bg-blue-500',
    dailyLimit: 20,
  },
  {
    tier: 'premium_video',
    title: 'Video Ad',
    description: 'Watch a full video',
    duration: 30,
    rewardRange: '1 - 5 SPY',
    icon: FaPlay,
    color: 'bg-purple-500',
    dailyLimit: 10,
  },
  {
    tier: 'cpc',
    title: 'Click & Earn',
    description: 'Click on ad content',
    duration: 20,
    rewardRange: '0.5 - 2 SPY',
    icon: FaStar,
    color: 'bg-yellow-500',
    dailyLimit: 10,
  },
  {
    tier: 'offerwall',
    title: 'Complete Offer',
    description: 'Surveys, installs, signups',
    duration: 60,
    rewardRange: '5 - 200 SPY',
    icon: FaGift,
    color: 'bg-green-500',
    dailyLimit: 3,
  },
]

export default function EarnPage() {
  const { profile, user, refreshProfile } = useAuth()
  const [showAd, setShowAd] = useState(false)
  const [selectedAd, setSelectedAd] = useState<AdOption | null>(null)
  const [stats, setStats] = useState({
    todayEarnings: 0,
    dailyRemaining: 20,
    streak: 0,
    totalAds: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  const fetchStats = useCallback(async () => {
    if (!profile?.id) return
    setIsLoading(true)

    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: todayWatches } = await supabase
        .from('ad_watches')
        .select('reward_spy, ad_tier, created_at')
        .eq('user_id', profile.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })

      const earnings = todayWatches?.reduce((sum, w) => sum + (w.reward_spy || 0), 0) || 0
      const totalAds = todayWatches?.length || 0

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
      })
      setRecentActivity(todayWatches?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [profile])

  useEffect(() => {
    if (profile) fetchStats()
  }, [profile, fetchStats])

  const startAd = (option: AdOption) => {
    setSelectedAd(option)
    setShowAd(true)
  }

  const handleAdComplete = async (reward: number, tier: string, fraudScore: any) => {
    setShowAd(false)
    setSelectedAd(null)

    try {
      const res = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adTier: tier,
          fraudSignals: fraudScore,
          fraudScore,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`+${data.reward} SPY! (${data.userTier} user)`)
        await refreshProfile()
        fetchStats()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to process')
    }
  }

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
        {showAd && selectedAd && (
          <AdViewer
            userId={user?.id || ''}
            adUrl={process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || 'about:blank'}
            adTier={selectedAd.tier}
            minDuration={selectedAd.duration}
            onComplete={handleAdComplete}
            onCancel={() => { setShowAd(false); setSelectedAd(null) }}
          />
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-r from-accent-500/20 to-purple-500/20 rounded-2xl p-6 mb-6 border border-accent-500/30">
        <h1 className="text-2xl font-bold text-white mb-2">Earn SPY</h1>
        <p className="text-gray-400">Watch ads, complete offers, earn rewards</p>
        {profile?.is_premium && (
          <div className="mt-3 inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
            <FaStar /> Premium: 2x Rewards Active
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Today', value: `${stats.todayEarnings} SPY`, icon: FaCoins },
          { label: 'Remaining', value: `${stats.dailyRemaining} ads`, icon: FaStopwatch },
          { label: 'Streak', value: `${stats.streak} days`, icon: FaFire },
          { label: 'Total', value: `${stats.totalAds} views`, icon: FaChartLine },
        ].map((s, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <s.icon className="text-accent-500 mb-2" />
            <p className="text-gray-400 text-xs">{s.label}</p>
            <p className="text-white font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-white mb-4">Choose Activity</h2>
      <div className="grid gap-4 mb-6">
        {AD_OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <motion.button
              key={option.tier}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startAd(option)}
              className="flex items-center gap-4 bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-accent-500/50 transition text-left"
            >
              <div className={`w-12 h-12 ${option.color} rounded-xl flex items-center justify-center`}>
                <Icon className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{option.title}</h3>
                <p className="text-gray-400 text-sm">{option.description}</p>
                <div className="flex items-center gap-4 mt-1 text-xs">
                  <span className="text-accent-500">{option.rewardRange}</span>
                  <span className="text-gray-500"><FaClock className="inline mr-1" />{option.duration}s</span>
                  <span className="text-gray-500">Limit: {option.dailyLimit}/day</span>
                </div>
              </div>
              <FaPlay className="text-gray-600" />
            </motion.button>
          )
        })}
      </div>

      {recentActivity.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <FaHistory /> Today's Activity
          </h3>
          <div className="space-y-2">
            {recentActivity.map((watch, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {new Date(watch.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded">{watch.ad_tier}</span>
                </span>
                <span className="text-green-400 font-medium">+{watch.reward_spy} SPY</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!profile?.is_premium && (
        <div className="mt-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <FaStar className="text-yellow-400" /> Go Premium
              </h3>
              <p className="text-gray-400 text-sm">2x rewards on everything + no ads</p>
            </div>
            <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-bold text-sm">
              $5/mo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
