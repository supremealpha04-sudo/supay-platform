
// app/dashboard/earn/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { FaPlay, FaClock, FaShieldAlt, FaCoins, FaStopwatch, FaInfinity, FaTrophy, FaFire } from 'react-icons/fa'
import Link from 'next/link'
import styles from './page.module.css'

const supabase = createClient()

export default function EarnPage() {
  const { profile, refreshProfile } = useAuth()
  const [isWatching, setIsWatching] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [canWatch, setCanWatch] = useState(true)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [dailyRemaining, setDailyRemaining] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [todayEarnings, setTodayEarnings] = useState(0)
  const [streak, setStreak] = useState(0)

  const DAILY_LIMIT = 20
  const AD_REWARD_MIN = 1
  const AD_REWARD_MAX = 5
  const AD_DURATION = 15
  const COOLDOWN_SECONDS = 30

  const checkCanWatch = useCallback(async () => {
    if (!profile) return

    const today = new Date().toISOString().split('T')[0]
    const { data: todayWatches } = await supabase
      .from('ad_watches')
      .select('reward_spy')
      .eq('user_id', profile.id)
      .gte('created_at', today)

    const watchedToday = todayWatches?.length || 0
    const earnings = todayWatches?.reduce((sum, w) => sum + (w.reward_spy || 0), 0) || 0
    const remaining = DAILY_LIMIT - watchedToday
    setDailyRemaining(remaining)
    setTodayEarnings(earnings)

    // Get streak
    const { data: profileData } = await supabase
      .from('profiles')
      .select('daily_bonus_streak')
      .eq('id', profile.id)
      .single()
    setStreak(profileData?.daily_bonus_streak || 0)

    if (remaining <= 0) {
      setCanWatch(false)
      setIsLoading(false)
      return
    }

    const { data: lastWatch } = await supabase
      .from('ad_watches')
      .select('created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastWatch) {
      const lastTime = new Date(lastWatch.created_at).getTime()
      const now = Date.now()
      const diffSeconds = (now - lastTime) / 1000
      if (diffSeconds < COOLDOWN_SECONDS) {
        setCanWatch(false)
        setCooldownRemaining(Math.ceil(COOLDOWN_SECONDS - diffSeconds))
        
        const timer = setInterval(() => {
          setCooldownRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              setCanWatch(true)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        return () => clearInterval(timer)
      } else {
        setCanWatch(true)
        setCooldownRemaining(0)
      }
    } else {
      setCanWatch(true)
    }

    setIsLoading(false)
  }, [profile])

  useEffect(() => {
    if (profile) {
      checkCanWatch()
    }
  }, [profile, checkCanWatch])

  async function startAdWatch() {
    if (!canWatch) {
      toast.error(cooldownRemaining > 0 ? `Please wait ${cooldownRemaining}s before next ad` : 'Daily limit reached')
      return
    }

    setIsWatching(true)
    setCountdown(AD_DURATION)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          completeAdWatch()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function completeAdWatch() {
    const reward = Math.floor(Math.random() * (AD_REWARD_MAX - AD_REWARD_MIN + 1)) + AD_REWARD_MIN
    
    try {
      const response = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward, duration: AD_DURATION }),
      })

      const data = await response.json()

      if (data.success) {
        await refreshProfile()
        toast.success(`🎉 You earned ${reward} SPY!`)
        await checkCanWatch()
      } else {
        toast.error(data.message || 'Verification failed')
      }
    } catch (error) {
      toast.error('Failed to process ad reward')
    } finally {
      setIsWatching(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
      </div>
    )
  }

  return (
    <div className={styles.earnPage}>
      <div className={styles.heroCard}>
        <h1>Watch & Earn</h1>
        <p>Watch short ads and earn {AD_REWARD_MIN}-{AD_REWARD_MAX} SPY per ad</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaCoins /></div>
          <div className={styles.statText}>
            <p className={styles.statLabel}>Reward per Ad</p>
            <p className={styles.statValue}>{AD_REWARD_MIN}-{AD_REWARD_MAX} SPY</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaStopwatch /></div>
          <div className={styles.statText}>
            <p className={styles.statLabel}>Today's Earnings</p>
            <p className={styles.statValue}>{todayEarnings} SPY</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaClock /></div>
          <div className={styles.statText}>
            <p className={styles.statLabel}>Daily Remaining</p>
            <p className={styles.statValue}>{dailyRemaining} / {DAILY_LIMIT}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaFire /></div>
          <div className={styles.statText}>
            <p className={styles.statLabel}>Daily Streak</p>
            <p className={styles.statValue}>{streak} days</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isWatching ? (
          <motion.div
            key="button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={styles.actionCard}
          >
            <button
              onClick={startAdWatch}
              disabled={!canWatch}
              className={`${styles.button} ${!canWatch ? styles.buttonDisabled : ''}`}
            >
              <FaPlay />
              Watch Ad & Earn
            </button>
            {cooldownRemaining > 0 && (
              <p className="text-sm text-accent-500 mt-4 flex items-center justify-center gap-2">
                <FaInfinity className="w-3 h-3" />
                Cooldown: {cooldownRemaining}s remaining
              </p>
            )}
            {dailyRemaining === 0 && (
              <p className="text-sm text-gray-400 mt-4">You've reached your daily limit. Come back tomorrow!</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="timer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={styles.timerCard}
          >
            <div className="space-y-4">
              <div className={styles.timerRing}>
                <svg className={styles.timerSvg}>
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="rgba(255,122,26,0.2)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#FF7A1A"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - countdown / AD_DURATION)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className={styles.timerValue}>
                  <div className={styles.timerNumber}>{countdown}</div>
                  <p className={styles.timerLabel}>seconds left</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">Watching advertisement...</p>
              <p className="text-xs text-gray-500">Please don't close this window until timer finishes</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Bonus Section */}
      <div className={styles.bonusCard}>
        <h3 className={styles.bonusHeader}>
          <FaTrophy className="text-accent-500" /> Daily Bonus Streak
        </h3>
        <div className={styles.bonusDetail}>
          <p className={styles.bonusText}>Current Streak: <span className={styles.highlight}>{streak} days</span></p>
          <p className={styles.bonusHint}>Complete all daily tasks to claim {profile?.is_premium ? 6 : 3} SPY bonus!</p>
        </div>
        <Link href="/dashboard/tasks" className={styles.linkButton}>
          View Tasks
        </Link>
      </div>
    </div>
  )
}
