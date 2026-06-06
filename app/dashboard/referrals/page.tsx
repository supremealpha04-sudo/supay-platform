'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { FaUsers, FaLink, FaCopy, FaCheck, FaTrophy, FaChartLine, FaCoins } from 'react-icons/fa'
import toast from 'react-hot-toast'
import styles from './page.module.css'

const supabase = createClient()

export default function ReferralsPage() {
  const { profile } = useAuth()
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarned: 0,
    pendingEarnings: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0
  })
  const [referralHistory, setReferralHistory] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    if (profile) {
      setReferralLink(`${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${profile.referral_code}`)
      fetchReferralStats()
      fetchReferralHistory()
      fetchLeaderboard()
    }
  }, [profile])

  async function fetchReferralStats() {
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', profile?.id)
    
    const level1 = referrals?.filter(r => r.level === 1) || []
    const level2 = referrals?.filter(r => r.level === 2) || []
    const level3 = referrals?.filter(r => r.level === 3) || []
    
    const totalEarned = referrals?.reduce((sum, r) => sum + (r.bonus_spy || 0), 0) || 0
    
    setReferralStats({
      totalReferrals: referrals?.length || 0,
      totalEarned,
      pendingEarnings: 0,
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length
    })
  }

  async function fetchReferralHistory() {
    const { data } = await supabase
      .from('referrals')
      .select('*, referred:referred_id(username, created_at)')
      .eq('referrer_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setReferralHistory(data || [])
  }

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('profiles')
      .select('username, referral_count, referral_earnings')
      .order('referral_count', { ascending: false })
      .limit(10)
    
    setLeaderboard(data || [])
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Referral link copied!')
  }

  return (
    <div className={styles.referralsPage}>
      <div className={styles.heroCard}>
        <h1 className={styles.heroTitle}>Refer & Earn</h1>
        <p className={styles.heroDescription}>Invite friends to join Supay and earn 10% of their earnings forever!</p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statsCard}>
          <div className={styles.statsCardHeader}>
            <FaUsers className={styles.statIcon} />
            <div className={styles.statText}>
              <p className={styles.statLabel}>Total Referrals</p>
              <p className={styles.statValue}>{referralStats.totalReferrals}</p>
            </div>
          </div>
        </div>
        <div className={styles.statsCard}>
          <div className={styles.statsCardHeader}>
            <FaCoins className={styles.statIcon} />
            <div className={styles.statText}>
              <p className={styles.statLabel}>Total Earned</p>
              <p className={styles.statValue}>{referralStats.totalEarned} SPY</p>
            </div>
          </div>
        </div>
        <div className={styles.statsCard}>
          <div className={styles.statsCardHeader}>
            <FaChartLine className={styles.statIcon} />
            <div className={styles.statText}>
              <p className={styles.statLabel}>Level 1</p>
              <p className={styles.statValue}>{referralStats.level1Count}</p>
            </div>
          </div>
        </div>
        <div className={styles.statsCard}>
          <div className={styles.statsCardHeader}>
            <FaTrophy className={styles.statIcon} />
            <div className={styles.statText}>
              <p className={styles.statLabel}>Level 2+3</p>
              <p className={styles.statValue}>{referralStats.level2Count + referralStats.level3Count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className={styles.linkCard}>
        <h3 className={styles.sectionTitle}>Your Referral Link</h3>
        <div className={styles.linkFieldRow}>
          <input
            type="text"
            value={referralLink}
            readOnly
            aria-label="Referral link"
            className={styles.textInput}
          />
          <button
            onClick={copyToClipboard}
            className={styles.copyButton}
          >
            {copied ? <FaCheck className="w-5 h-5" /> : <FaCopy className="w-5 h-5" />}
          </button>
        </div>
        <div className={styles.tipBox}>
          <p className={styles.tipTitle}>💡 How it works:</p>
          <ul className={styles.tipList}>
            <li>• Share your unique link with friends</li>
            <li>• You earn 10% of everything they earn (lifetime)</li>
            <li>• Level 2: 5% of their referrals' earnings</li>
            <li>• Level 3: 2.5% of third-level referrals</li>
          </ul>
        </div>
      </div>

      {/* Referral History */}
      <div className={styles.historyCard}>
        <h3 className={styles.sectionTitle}>Referral History</h3>
        {referralHistory.length > 0 ? (
          <div className={styles.historyCard}>
            {referralHistory.map((ref) => (
              <div key={ref.id} className={styles.historyItem}>
                <div className={styles.historyContent}>
                  <p className={styles.sectionTitle}>{ref.referred?.username || 'Anonymous'}</p>
                  <p className={styles.historyMeta}>Level {ref.level} • {new Date(ref.created_at).toLocaleDateString()}</p>
                </div>
                <div className={styles.historyContent}>
                  <p className={styles.historyEarnings}>+{ref.bonus_spy} SPY</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.historyMeta}>No referrals yet. Share your link to start earning!</p>
        )}
      </div>

      {/* Leaderboard */}
      <div className={styles.leaderboardCard}>
        <div className={styles.heroHeader}>
          <h3 className={styles.sectionTitle}><FaTrophy className={styles.statIcon} /> Top Referrers</h3>
        </div>
        <div className={styles.leaderboardCard}>
          {leaderboard.map((user, index) => (
            <div key={user.username} className={styles.leaderboardRow}>
              <div className="flex items-center gap-3">
                <div className={`${styles.rankTag} ${index === 0 ? styles.rankGold : index === 1 ? styles.rankSilver : index === 2 ? styles.rankBronze : styles.rankDefault}`}>
                  {index + 1}
                </div>
                <span className="text-white">{user.username}</span>
              </div>
              <div className={styles.leaderboardInfo}>
                <p className={styles.historyEarnings}>{user.referral_count} referrals</p>
                <p className={styles.leaderDate}>{user.referral_earnings} SPY earned</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
