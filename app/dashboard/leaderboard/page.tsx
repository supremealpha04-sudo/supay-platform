
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { FaTrophy, FaCoins, FaUsers, FaMedal } from 'react-icons/fa'
import styles from './page.module.css'

const supabase = createClient()

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [period, setPeriod] = useState<'all' | 'monthly' | 'weekly'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [period])

  async function fetchLeaderboard() {
    let query = supabase
      .from('profiles')
      .select('username, total_earned_usd, referral_count, spy_balance')
      .order('total_earned_usd', { ascending: false })
      .limit(100)
    
    const { data } = await query
    setLeaderboard(data || [])
    setIsLoading(false)
  }

  const getMedalColor = (index: number) => {
    if (index === 0) return styles.medalGold
    if (index === 1) return styles.medalSilver
    if (index === 2) return styles.medalBronze
    return styles.medalDefault
  }

  if (isLoading) {
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.leaderboardPage}>
      <div className={styles.heroCard}>
        <div>
          <h1 className={styles.heroTitle}>Leaderboard</h1>
          <p className={styles.heroSubtitle}>Top earners on Supay</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className={styles.periodButtons}>
        {['all', 'monthly', 'weekly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p as any)}
            className={`${styles.periodButton} ${period === p ? styles.periodButtonActive : ''}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      <div className={styles.podiumGrid}>
        {leaderboard.slice(0, 3).map((user, index) => (
          <motion.div
            key={user.username}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={styles.podiumCard}
          >
            <FaTrophy className={`${styles.leaderIcon} ${getMedalColor(index)}`} />
            <div className={styles.podiumNumber}>#{index + 1}</div>
            <h3 className={styles.podiumTitle}>{user.username}</h3>
            <div className={styles.podiumStats}>
              <p className={styles.leaderText}>${user.total_earned_usd}</p>
              <div className={styles.leaderInfo}>
                <span className={styles.leaderMetric}>{user.referral_count} referrals</span>
                <span className={styles.leaderMetric}>{user.spy_balance} SPY</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full Leaderboard */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.leaderboardTable}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableCell}>#</th>
                <th className={styles.tableCell}>User</th>
                <th className={`${styles.tableCell} ${styles.leaderInfo}`}>Total Earned</th>
                <th className={`${styles.tableCell} ${styles.leaderInfo}`}>Referrals</th>
                <th className={`${styles.tableCell} ${styles.leaderInfo}`}>SPY Balance</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(3, 100).map((user, index) => (
                <tr key={user.username} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className="flex items-center gap-2">
                      <FaMedal className={getMedalColor(index + 3)} />
                      #{index + 4}
                    </div>
                  </td>
                  <td className={`${styles.tableCell} ${styles.leaderName}`}>{user.username}</td>
                  <td className={`${styles.tableCell} ${styles.leaderInfo}`}>
                    ${user.total_earned_usd}
                  </td>
                  <td className={`${styles.tableCell} ${styles.leaderInfo}`}>{user.referral_count}</td>
                  <td className={`${styles.tableCell} ${styles.leaderInfo}`}>{user.spy_balance} SPY</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
