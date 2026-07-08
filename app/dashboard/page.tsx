'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Activity, DollarSign, Users, Wallet, Play, 
  CheckCircle, Gift, TrendingUp, Calendar, 
  Flame, MessageCircle, Plus, ArrowUp,
  BarChart3, History, Home, User, Settings,
  Menu, X, LogOut, Award, Star, Crown
} from 'lucide-react'
import './dashboard.css'

const supabase = createClient()

interface DashboardStats {
  todayEarnings: number
  totalEarned: number
  referralCount: number
  withdrawable: number
  spyBalance: number
  spyPrice: number
  streak: number
  dailyGoal: { current: number; target: number }
}

interface Transaction {
  id: string
  created_at: string
  amount_spy: number
  type: string
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    todayEarnings: 0,
    totalEarned: 0,
    referralCount: 0,
    withdrawable: 0,
    spyBalance: 0,
    spyPrice: 0.023,
    streak: 0,
    dailyGoal: { current: 0, target: 20 }
  })
  const [weeklyEarnings, setWeeklyEarnings] = useState<number[]>(Array(7).fill(0))
  const [recentActivities, setRecentActivities] = useState<Transaction[]>([])

  const days = useMemo(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [])
  const streakDays = useMemo(() => ['M', 'T', 'W', 'T', 'F', 'S', 'S'], [])

  useEffect(() => {
    if (profile) {
      fetchRealData()
    }
  }, [profile])

  async function fetchRealData() {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()

      const [
        todayAdsResult,
        breakdownResult,
        weeklyResult,
        transactionsResult
      ] = await Promise.all([
        supabase
          .from('ad_watches')
          .select('reward_spy')
          .eq('user_id', profile.id)
          .gte('created_at', todayStr),
        
        supabase
          .from('user_spy_breakdown')
          .select('earned_spy, referral_spy, staking_rewards_spy')
          .eq('user_id', profile.id)
          .single(),
        
        supabase
          .rpc('get_weekly_earnings', { user_id: profile.id }),
        
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(7)
      ])

      if (todayAdsResult.error) throw todayAdsResult.error
      if (breakdownResult.error) throw breakdownResult.error
      if (weeklyResult.error) throw weeklyResult.error
      if (transactionsResult.error) throw transactionsResult.error

      const todayEarnings = todayAdsResult.data?.reduce(
        (sum, ad) => sum + (ad.reward_spy || 0), 0
      ) || 0

      const breakdown = breakdownResult.data
      const withdrawable = (breakdown?.earned_spy || 0) + 
                          (breakdown?.referral_spy || 0) + 
                          (breakdown?.staking_rewards_spy || 0)

      const weeklyData = weeklyResult.data || Array(7).fill(0)
      const transactions = transactionsResult.data || []

      setStats({
        todayEarnings,
        totalEarned: profile.total_earned_usd || 0,
        referralCount: profile.referral_count || 0,
        withdrawable: withdrawable / 100,
        spyBalance: profile.spy_balance || 0,
        spyPrice: 0.023,
        streak: profile.daily_bonus_streak || 0,
        dailyGoal: { 
          current: todayEarnings, 
          target: 20
        }
      })

      setWeeklyEarnings(weeklyData)
      setRecentActivities(transactions)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { 
      title: 'Watch Ads', 
      desc: 'Earn SPY daily', 
      extra: '+5 SPY Available', 
      icon: Play, 
      color: 'blue', 
      link: '/dashboard/earn' 
    },
    { 
      title: 'Complete Tasks', 
      desc: 'Boost earnings', 
      extra: '8 Tasks Available', 
      icon: CheckCircle, 
      color: 'orange', 
      link: '/dashboard/earn' 
    },
    { 
      title: 'Refer Friends', 
      desc: '10% commission', 
      extra: 'Unlimited', 
      icon: Users, 
      color: 'green', 
      link: '/dashboard/referrals' 
    },
    { 
      title: 'Claim Bonus', 
      desc: 'Daily rewards', 
      extra: 'Available Now', 
      icon: Gift, 
      color: 'purple', 
      link: '/dashboard/earn' 
    },
  ]

  const getActivityDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      'ad_watch': 'Watched Ad',
      'task_complete': 'Completed Task',
      'daily_bonus': 'Daily Bonus',
      'referral': 'Referral Joined',
      'task': 'Task Completed',
      'bonus': 'Bonus Claimed',
      'ad_watched': 'Watched Ad',
      'task_completed': 'Completed Task'
    }
    return descriptions[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  const weeklyTotal = weeklyEarnings.reduce((a, b) => a + b, 0)
  const maxWeeklyEarning = Math.max(...weeklyEarnings, 1)
  const goalPercentage = Math.min((stats.dailyGoal.current / stats.dailyGoal.target) * 100, 100)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header with Navigation */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">S</span>
            <span className="logo-text">Supay</span>
          </div>
        </div>
        <div className="header-nav">
          <Link href="/dashboard" className="nav-link active">Dashboard</Link>
          <Link href="/dashboard/earn" className="nav-link">Earn</Link>
          <Link href="/dashboard/tasks" className="nav-link">Tasks</Link>
          <Link href="/dashboard/wallet" className="nav-link">Wallet</Link>
        </div>
        <div className="header-right">
          <button className="header-btn">
            <Bell size={20} />
          </button>
          <div className="user-avatar">
            {profile?.username?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome back, {profile?.username || 'User'}!</h1>
        <p className="welcome-text">
          Great to see you again. Keep earning and grow your SPY balance.
          <span className="welcome-badge">+{stats.todayEarnings} SPY earned today</span>
        </p>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-top">
            <span className="stat-label">Today's Earnings</span>
            <Activity size={16} className="stat-icon" />
          </div>
          <div className="stat-number">{stats.todayEarnings} SPY</div>
          <div className="stat-trend">+{stats.todayEarnings} SPY earned today</div>
        </div>

        <div className="stat-box">
          <div className="stat-top">
            <span className="stat-label">Total Earned</span>
            <DollarSign size={16} className="stat-icon" />
          </div>
          <div className="stat-number">${stats.totalEarned.toFixed(2)}</div>
          <div className="stat-trend">+15.4% all time</div>
        </div>

        <div className="stat-box">
          <div className="stat-top">
            <span className="stat-label">Referrals</span>
            <Users size={16} className="stat-icon" />
          </div>
          <div className="stat-number">{stats.referralCount}</div>
          <div className="stat-trend">+15.4% all time</div>
        </div>

        <div className="stat-box">
          <div className="stat-top">
            <span className="stat-label">Withdrawable</span>
            <Wallet size={16} className="stat-icon" />
          </div>
          <div className="stat-number">${stats.withdrawable.toFixed(2)} USD</div>
          <div className="stat-trend">Ready to cash out</div>
        </div>
      </div>

      {/* Deposit/Withdraw Buttons */}
      <div className="action-buttons">
        <button className="action-btn deposit">
          <Plus size={18} />
          Deposit
        </button>
        <button className="action-btn withdraw">
          <ArrowUp size={18} />
          Withdraw
        </button>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
          <Link href="/dashboard/earn">View All →</Link>
        </div>
        <div className="actions-grid">
          {quickActions.map((action, i) => {
            const Icon = action.icon
            return (
              <Link key={i} href={action.link} className="action-card">
                <div className={`action-icon ${action.color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="action-title">{action.title}</h3>
                <p className="action-desc">{action.desc}</p>
                <span className="action-badge">{action.extra}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="left-column">
          {/* Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3>Earnings Overview</h3>
                <div className="chart-total">{weeklyTotal} SPY</div>
                <p className="chart-sub">Total this week +18.6% vs last week</p>
              </div>
              <Calendar size={20} className="chart-icon" />
            </div>
            <div className="chart-bars">
              {weeklyEarnings.map((value, i) => {
                const height = (value / maxWeeklyEarning) * 140
                return (
                  <div key={i} className="bar-item">
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${Math.max(height, 4)}px`,
                        background: `linear-gradient(180deg, ${i === 6 ? '#3b82f6' : '#06b6d4'} 0%, ${i === 6 ? '#3b82f6cc' : '#06b6d4cc'} 100%)`
                      }} 
                    />
                    <span className="bar-label">{days[i]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-card">
            <div className="section-header">
              <h2>Recent Activity</h2>
              <Link href="/dashboard/transactions">View All →</Link>
            </div>
            <div className="activity-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-info">
                      <span className="activity-name">{getActivityDescription(activity.type)}</span>
                      <span className="activity-time">{timeAgo(activity.created_at)}</span>
                    </div>
                    <span className="activity-amount">+{Math.abs(activity.amount_spy)} SPY</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* SPY Balance Card */}
          <div className="balance-card">
            <div className="balance-amount">{stats.spyBalance.toLocaleString()} SPY</div>
            <div className="balance-usd">≈ ${(stats.spyBalance * stats.spyPrice).toFixed(2)} USD</div>
            
            <div className="goal-container">
              <div className="goal-header">
                <span>Daily Goal</span>
                <span>{stats.dailyGoal.current} / {stats.dailyGoal.target} SPY</span>
              </div>
              <div className="goal-bar">
                <div className="goal-fill" style={{ width: `${goalPercentage}%` }} />
              </div>
            </div>

            <div className="price-container">
              <span className="price-label">SPY Price</span>
              <span className="price-value">${stats.spyPrice}</span>
              <span className="price-change">+4.32%</span>
            </div>

            <button className="join-btn">Join Now →</button>
          </div>

          {/* Streak Card */}
          <div className="streak-card">
            <div className="streak-number">{stats.streak} Days</div>
            <p className="streak-text">Keep it going!</p>
            <div className="streak-days">
              {streakDays.map((day, i) => (
                <div key={i} className={`streak-day ${i < stats.streak ? 'active' : ''}`}>
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Community Card */}
          <div className="community-card">
            <h3>Join the Supay Community</h3>
            <p>Follow us and stay updated with the latest news & rewards.</p>
            <div className="community-buttons">
              <a href="https://t.me/supay" target="_blank" rel="noopener noreferrer" className="telegram-btn">
                <MessageCircle size={18} />
                Telegram
              </a>
              <a href="https://twitter.com/supay" target="_blank" rel="noopener noreferrer" className="twitter-btn">
                <TrendingUp size={18} />
                Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}