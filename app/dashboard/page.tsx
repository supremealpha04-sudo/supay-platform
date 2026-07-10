'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Activity, DollarSign, Users, Wallet, Play, 
  CheckCircle, Gift, TrendingUp, ArrowRight,
  Flame, Zap, ArrowUp, ArrowDown, X, Clock,
  RefreshCw
} from 'lucide-react'
import './dashboard.css'

const supabase = createClient()

// ===== TYPES =====
interface Transaction {
  id: string
  created_at: string
  amount_spy: number
  type: string
}

interface DashboardStats {
  todayEarnings: number
  totalEarned: number
  referralCount: number
  withdrawable: number
  spyBalance: number
  spyPrice: number
  streak: number
  dailyGoal: {
    current: number
    target: number
  }
}

// ===== CONSTANTS =====
const DAILY_GOAL_TARGET = 20
const SPY_PRICE = 0.023
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ACTIVITY_ICON_MAP = {
  ad_watch: 'blue',
  task_complete: 'green',
  daily_bonus: 'purple',
  referral: 'orange'
} as const

const ACTIVITY_LABEL_MAP = {
  ad_watch: 'Watched Ad',
  task_complete: 'Completed Task',
  daily_bonus: 'Daily Bonus',
  referral: 'Referral Joined'
} as const

// ===== DEMO DATA =====
const getDemoActivities = (): Transaction[] => [
  { id: '1', created_at: new Date(Date.now() - 120000).toISOString(), amount_spy: 22, type: 'ad_watch' },
  { id: '2', created_at: new Date(Date.now() - 86400000).toISOString(), amount_spy: 18, type: 'task_complete' },
  { id: '3', created_at: new Date(Date.now() - 172800000).toISOString(), amount_spy: 25, type: 'daily_bonus' },
  { id: '4', created_at: new Date(Date.now() - 259200000).toISOString(), amount_spy: 10, type: 'referral' },
  { id: '5', created_at: new Date(Date.now() - 345600000).toISOString(), amount_spy: 8, type: 'task_complete' },
  { id: '6', created_at: new Date(Date.now() - 432000000).toISOString(), amount_spy: 35, type: 'ad_watch' },
  { id: '7', created_at: new Date(Date.now() - 518400000).toISOString(), amount_spy: 15, type: 'daily_bonus' },
]

// ===== MAIN COMPONENT =====
export default function DashboardPage() {
  const { profile, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [userName, setUserName] = useState('User')
  const [stats, setStats] = useState<DashboardStats>({
    todayEarnings: 0,
    totalEarned: 0,
    referralCount: 0,
    withdrawable: 0,
    spyBalance: 0,
    spyPrice: SPY_PRICE,
    streak: 0,
    dailyGoal: { current: 0, target: DAILY_GOAL_TARGET }
  })
  const [weeklyEarnings, setWeeklyEarnings] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [recentActivities, setRecentActivities] = useState<Transaction[]>([])
  
  // Refs for cleanup
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ===== MEMOIZED VALUES =====
  const weeklyTotal = useMemo(() => 
    weeklyEarnings.reduce((a, b) => a + b, 0), 
    [weeklyEarnings]
  )
  
  const maxWeeklyEarning = useMemo(() => 
    Math.max(...weeklyEarnings, 1), 
    [weeklyEarnings]
  )
  
  const goalPercentage = useMemo(() => 
    Math.min((stats.dailyGoal.current / stats.dailyGoal.target) * 100, 100),
    [stats.dailyGoal.current, stats.dailyGoal.target]
  )
  
  const usdValue = useMemo(() => 
    stats.spyBalance * stats.spyPrice,
    [stats.spyBalance, stats.spyPrice]
  )

  // ===== HELPER FUNCTIONS =====
  const getActivityIcon = useCallback((type: string): string => {
    return ACTIVITY_ICON_MAP[type as keyof typeof ACTIVITY_ICON_MAP] || 'blue'
  }, [])

  const getActivityLabel = useCallback((type: string): string => {
    return ACTIVITY_LABEL_MAP[type as keyof typeof ACTIVITY_LABEL_MAP] || 
      type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }, [])

  const getActivityIconComponent = useCallback((type: string) => {
    const iconProps = { size: 10 }
    switch(type) {
      case 'ad_watch': return <Play {...iconProps} fill="white" />
      case 'task_complete': return <CheckCircle {...iconProps} />
      case 'daily_bonus': return <Gift {...iconProps} />
      case 'referral': return <Users {...iconProps} />
      default: return <Activity {...iconProps} />
    }
  }, [])

  const getModalIcon = useCallback((type: string) => {
    const iconProps = { size: 14 }
    switch(type) {
      case 'ad_watch': return <Play {...iconProps} fill="white" />
      case 'task_complete': return <CheckCircle {...iconProps} />
      case 'daily_bonus': return <Gift {...iconProps} />
      case 'referral': return <Users {...iconProps} />
      default: return <Activity {...iconProps} />
    }
  }, [])

  const timeAgo = useCallback((dateString: string): string => {
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return `${Math.floor(days / 7)}w ago`
  }, [])

  // ===== DATA FETCHING =====
  async function fetchUserName() {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      if (data) {
        setUserName(data.full_name || data.username || 'User')
      }
    } catch (err) {
      console.error('Failed to fetch username:', err)
      setUserName(profile?.username || 'User')
    }
  }

  async function fetchDashboardData() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setError(null)
    
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const weekStart = new Date(today)
      const dayOfWeek = today.getDay()
      weekStart.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
      weekStart.setHours(0, 0, 0, 0)

      // Fetch all data in parallel for better performance
      const [
        adWatchesToday,
        userBreakdown,
        weeklyAdWatches,
        transactions
      ] = await Promise.all([
        // Today's ad watches
        supabase
          .from('ad_watches')
          .select('reward_spy')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString()),
        
        // User breakdown
        supabase
          .from('user_spy_breakdown')
          .select('earned_spy, referral_spy, staking_rewards_spy')
          .eq('user_id', user.id)
          .single(),
        
        // Weekly ad watches
        supabase
          .from('ad_watches')
          .select('reward_spy, created_at')
          .eq('user_id', user.id)
          .gte('created_at', weekStart.toISOString()),
        
        // Recent transactions
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      // Process today's earnings
      let todayEarn = 0
      if (adWatchesToday.data) {
        todayEarn = adWatchesToday.data.reduce(
          (sum, ad) => sum + (Number(ad.reward_spy) || 0), 
          0
        )
      }

      // Process breakdown
      const breakdown = userBreakdown.data || { 
        earned_spy: 0, 
        referral_spy: 0, 
        staking_rewards_spy: 0 
      }
      const withdrawable = (
        (Number(breakdown.earned_spy) || 0) + 
        (Number(breakdown.referral_spy) || 0) + 
        (Number(breakdown.staking_rewards_spy) || 0)
      ) / 100

      // Process weekly earnings
      const weekly = [0, 0, 0, 0, 0, 0, 0]
      if (weeklyAdWatches.data) {
        weeklyAdWatches.data.forEach((ad: any) => {
          const date = new Date(ad.created_at)
          const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
          weekly[dayIndex] += Number(ad.reward_spy) || 0
        })
      }

      // Set state
      setStats({
        todayEarnings: todayEarn,
        totalEarned: Number(profile?.total_earned_usd) || 0,
        referralCount: Number(profile?.referral_count) || 0,
        withdrawable: withdrawable,
        spyBalance: Number(profile?.spy_balance) || 0,
        spyPrice: SPY_PRICE,
        streak: Number(profile?.daily_bonus_streak) || 0,
        dailyGoal: {
          current: todayEarn,
          target: DAILY_GOAL_TARGET
        }
      })
      
      setWeeklyEarnings(weekly)
      
      if (transactions.data && transactions.data.length > 0) {
        setRecentActivities(transactions.data)
      } else {
        setRecentActivities(getDemoActivities())
      }
      
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError('Failed to load dashboard data. Showing demo data.')
      setRecentActivities(getDemoActivities())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // ===== REFRESH FUNCTION =====
  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    await fetchDashboardData()
  }, [refreshing])

  // ===== EFFECTS =====
  useEffect(() => {
    if (user?.id) {
      fetchUserName()
      fetchDashboardData()
    } else {
      setLoading(false)
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [user])

  // ===== QUICK ACTIONS =====
  const quickActions = [
    { 
      title: 'Watch Ads', 
      desc: 'Earn SPY', 
      extra: '+5 SPY', 
      icon: Play, 
      color: 'blue', 
      link: '/dashboard/earn' 
    },
    { 
      title: 'Tasks', 
      desc: 'Boost earnings', 
      extra: '8 Available', 
      icon: CheckCircle, 
      color: 'orange', 
      link: '/dashboard/tasks' 
    },
    { 
      title: 'Refer', 
      desc: '10% commission', 
      extra: 'Unlimited', 
      icon: Users, 
      color: 'green', 
      link: '/dashboard/referrals' 
    },
    { 
      title: 'Bonus', 
      desc: 'Daily rewards', 
      extra: 'Claim Now', 
      icon: Gift, 
      color: 'purple', 
      link: '/dashboard/earn' 
    },
  ]

  // ===== EARLY RETURNS =====
  if (loading) {
    return (
      <div className="dash-loading" role="status" aria-live="polite">
        <div className="spinner" />
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="dash-empty" role="alert">
        <p>Please sign in to view your dashboard</p>
        <Link href="/auth" className="btn-primary">
          Sign In
        </Link>
      </div>
    )
  }

  // ===== RENDER =====
  return (
    <div className="dashboard">
      {/* Error Banner */}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {/* SPY BALANCE CARD */}
      <div className="spy-card">
        <div className="spy-header">
          <span>SPY Balance</span>
          <div className="spy-header-actions">
            <button 
              onClick={handleRefresh} 
              className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
              disabled={refreshing}
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={14} />
            </button>
            <Zap size={16} className="spy-zap" aria-hidden="true" />
          </div>
        </div>
        <div className="spy-amount">
          {stats.spyBalance.toLocaleString()} <span>SPY</span>
        </div>
        <div className="spy-usd">≈ ${usdValue.toFixed(2)} USD</div>
        <div className="spy-buttons">
          <Link href="/dashboard/wallet?tab=deposit" className="spy-btn deposit">
            <ArrowDown size={14} aria-hidden="true" /> Deposit
          </Link>
          <Link href="/dashboard/wallet?tab=withdraw" className="spy-btn withdraw">
            <ArrowUp size={14} aria-hidden="true" /> Withdraw
          </Link>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="stats-row" role="group" aria-label="Statistics">
        <div className="stat-box">
          <div className="stat-top">
            <span>Today&apos;s Earnings</span>
            <div className="s-icon blue" aria-hidden="true">
              <Activity size={14} />
            </div>
          </div>
          <div className="stat-num">
            {stats.todayEarnings} <span>SPY</span>
          </div>
          <div className="stat-trend up">+{stats.todayEarnings} earned</div>
        </div>
        <div className="stat-box">
          <div className="stat-top">
            <span>Total Earned</span>
            <div className="s-icon purple" aria-hidden="true">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="stat-num">
            ${stats.totalEarned.toFixed(1)}
          </div>
          <div className="stat-trend up">+15.4% all time</div>
        </div>
        <div className="stat-box">
          <div className="stat-top">
            <span>Referrals</span>
            <div className="s-icon orange" aria-hidden="true">
              <Users size={14} />
            </div>
          </div>
          <div className="stat-num">{stats.referralCount}</div>
          <div className="stat-trend up">+15.4% all time</div>
        </div>
        <div className="stat-box">
          <div className="stat-top">
            <span>Withdrawable</span>
            <div className="s-icon green" aria-hidden="true">
              <Wallet size={14} />
            </div>
          </div>
          <div className="stat-num">
            ${stats.withdrawable.toFixed(1)} <span>USD</span>
          </div>
          <div className="stat-trend neutral">Ready to cash out</div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="actions-row" role="group" aria-label="Quick actions">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <Link
              key={index}
              href={action.link}
              className="q-action"
              aria-label={`${action.title}: ${action.desc}`}
            >
              <div className={`qa-icon ${action.color}`} aria-hidden="true">
                <Icon size={20} />
              </div>
              <div className="qa-title">{action.title}</div>
              <div className="qa-desc">{action.desc}</div>
              <div className={`qa-badge ${action.color}`}>{action.extra}</div>
            </Link>
          )
        })}
      </div>

      {/* BOTTOM ROW: Chart + Activity */}
      <div className="bottom-row">
        {/* Earnings Chart */}
        <div className="chart-box">
          <div className="chart-head">
            <div>
              <h3>Earnings Overview</h3>
              <div className="chart-total">
                {weeklyTotal} <span>SPY</span>
              </div>
              <div className="chart-vs">
                <span className="up">+18.6%</span> vs last week
              </div>
            </div>
          </div>
          <div className="chart-bars" role="img" aria-label="Weekly earnings chart">
            {weeklyEarnings.map((value, index) => (
              <div key={index} className="c-bar-item">
                <div 
                  className={`c-bar ${index === 6 ? 'today' : ''}`}
                  style={{ height: `${Math.max((value / maxWeeklyEarning) * 70, 4)}px` }}
                  aria-label={`${DAYS[index]}: ${value} SPY`}
                />
                <span>{DAYS[index]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity (clickable) */}
        <div 
          className="activity-box"
          onClick={() => setShowActivity(true)}
          onKeyDown={(e) => e.key === 'Enter' && setShowActivity(true)}
          role="button"
          tabIndex={0}
          aria-label="View all recent activity"
        >
          <div className="act-head">
            <h3>Recent Activity</h3>
            <span className="view-all">
              View All <ArrowRight size={12} aria-hidden="true" />
            </span>
          </div>
          <div className="act-list">
            {recentActivities.slice(0, 3).map((activity) => {
              const iconType = getActivityIcon(activity.type)
              const icon = getActivityIconComponent(activity.type)
              return (
                <div key={activity.id} className="act-row">
                  <div className={`act-icon ${iconType}`} aria-hidden="true">
                    {icon}
                  </div>
                  <div className="act-info">
                    <span className="act-name">{getActivityLabel(activity.type)}</span>
                    <span className="act-time">{timeAgo(activity.created_at)}</span>
                  </div>
                  <span className="act-amt">+{Math.abs(activity.amount_spy)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* GOAL + STREAK */}
      <div className="compact-row">
        <div className="goal-mini">
          <div className="goal-head">
            <span>Daily Goal</span>
            <span>{stats.dailyGoal.current}/{stats.dailyGoal.target} SPY</span>
          </div>
          <div className="goal-bar">
            <div 
              className="goal-fill" 
              style={{ width: `${goalPercentage}%` }}
              role="progressbar"
              aria-valuenow={goalPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Daily goal progress: ${goalPercentage.toFixed(0)}%`}
            />
          </div>
        </div>
        <div className="streak-mini">
          <Flame size={14} className="flame-icon" aria-hidden="true" />
          <span>{stats.streak} Day Streak</span>
        </div>
      </div>

      {/* ACTIVITY MODAL */}
      {showActivity && (
        <div 
          className="activity-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="modal-overlay" 
            onClick={() => setShowActivity(false)}
            aria-hidden="true"
          />
          <div className="modal-content">
            <div className="modal-header">
              <h2 id="modal-title">Recent Activity</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowActivity(false)}
                aria-label="Close activity modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-list">
              {recentActivities.map((activity) => {
                const iconType = getActivityIcon(activity.type)
                const icon = getModalIcon(activity.type)
                return (
                  <div key={activity.id} className="modal-row">
                    <div className={`act-icon ${iconType}`} aria-hidden="true">
                      {icon}
                    </div>
                    <div className="modal-info">
                      <span className="modal-name">{getActivityLabel(activity.type)}</span>
                      <span className="modal-time">
                        <Clock size={12} aria-hidden="true" /> {timeAgo(activity.created_at)}
                      </span>
                    </div>
                    <span className="modal-amt">+{Math.abs(activity.amount_spy)} SPY</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}