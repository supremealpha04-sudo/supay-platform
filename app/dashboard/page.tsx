'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Activity, DollarSign, Users, Wallet, Play, 
  CheckCircle, Gift, TrendingUp, Calendar, 
  Flame, ArrowUpRight, MessageCircle, Zap,
  Plus, ArrowUp, ArrowDown, Bell, ChevronDown, ArrowRight,
  LayoutDashboard, DollarSign as EarnIcon, ClipboardList, CreditCard, LogOut
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
  description?: string
}

export default function DashboardPage() {
  const { profile, user } = useAuth()
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
  const [weeklyEarnings, setWeeklyEarnings] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [recentActivities, setRecentActivities] = useState<Transaction[]>([])

  const days = useMemo(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [])
  const streakDays = useMemo(() => ['M', 'T', 'W', 'T', 'F', 'S', 'S'], [])

  useEffect(() => {
    if (profile && user) {
      fetchDashboardData()
    } else if (!user) {
      setLoading(false)
    }
  }, [profile, user])

  async function fetchDashboardData() {
    if (!profile?.id) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()

      const weekStart = new Date(today)
      const dayOfWeek = today.getDay()
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)
      const weekStartStr = weekStart.toISOString()

      // Fetch all data - each wrapped in try/catch so failures don't block others
      let todayEarnings = 0
      let breakdown = { earned_spy: 0, referral_spy: 0, staking_rewards_spy: 0 }
      let weeklyData = [0, 0, 0, 0, 0, 0, 0]
      let transactions: Transaction[] = []

      // 1. Today's ad earnings
      try {
        const { data } = await supabase
          .from('ad_watches')
          .select('reward_spy')
          .eq('user_id', profile.id)
          .gte('created_at', todayStr)
        if (data) {
          todayEarnings = data.reduce((sum, ad) => sum + (Number(ad.reward_spy) || 0), 0)
        }
      } catch (e) { console.log('ad_watches table not ready yet') }

      // 2. User breakdown
      try {
        const { data } = await supabase
          .from('user_spy_breakdown')
          .select('earned_spy, referral_spy, staking_rewards_spy')
          .eq('user_id', profile.id)
          .single()
        if (data) breakdown = data
      } catch (e) { console.log('user_spy_breakdown table not ready yet') }

      // 3. Weekly earnings
      try {
        const { data } = await supabase
          .from('ad_watches')
          .select('reward_spy, created_at')
          .eq('user_id', profile.id)
          .gte('created_at', weekStartStr)
          .order('created_at', { ascending: true })
        if (data) {
          data.forEach((ad: any) => {
            const adDate = new Date(ad.created_at)
            const adDay = adDate.getDay()
            const dayIndex = adDay === 0 ? 6 : adDay - 1
            weeklyData[dayIndex] += Number(ad.reward_spy) || 0
          })
        }
      } catch (e) { console.log('weekly fetch failed, using zeros') }

      // 4. Recent transactions
      try {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(7)
        if (data) transactions = data
      } catch (e) { console.log('transactions table not ready yet') }

      const withdrawable = (Number(breakdown.earned_spy) || 0) + 
                          (Number(breakdown.referral_spy) || 0) + 
                          (Number(breakdown.staking_rewards_spy) || 0)

      setStats({
        todayEarnings,
        totalEarned: Number(profile.total_earned_usd) || 0,
        referralCount: Number(profile.referral_count) || 0,
        withdrawable: withdrawable / 100,
        spyBalance: Number(profile.spy_balance) || 0,
        spyPrice: 0.023,
        streak: Number(profile.daily_bonus_streak) || 0,
        dailyGoal: { current: todayEarnings, target: 20 }
      })

      setWeeklyEarnings(weeklyData)
      setRecentActivities(transactions)

    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { title: 'Watch Ads', desc: 'Earn SPY daily', extra: '+5 SPY Available', icon: Play, color: 'blue', link: '/dashboard/earn' },
    { title: 'Complete Tasks', desc: 'Boost earnings', extra: '8 Tasks Available', icon: CheckCircle, color: 'orange', link: '/dashboard/earn' },
    { title: 'Refer Friends', desc: '10% commission', extra: 'Unlimited', icon: Users, color: 'green', link: '/dashboard/referrals' },
    { title: 'Claim Bonus', desc: 'Daily rewards', extra: 'Available Now', icon: Gift, color: 'purple', link: '/dashboard/earn' },
  ]

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', active: true },
    { label: 'Earn', icon: EarnIcon, href: '/dashboard/earn' },
    { label: 'Tasks', icon: ClipboardList, href: '/dashboard/tasks' },
    { label: 'Wallet', icon: CreditCard, href: '/dashboard/wallet' },
  ]

  const getActivityDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      'ad_watch': 'Watched Ad',
      'task_complete': 'Completed Task',
      'daily_bonus': 'Daily Bonus',
      'referral': 'Referral Joined',
      'withdrawal': 'Withdrawal',
      'deposit': 'Deposit',
      'staking_reward': 'Staking Reward'
    }
    return descriptions[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'ad_watch': return <div className="activity-icon-bg blue"><Play size={14} fill="white" /></div>
      case 'task_complete': return <div className="activity-icon-bg green"><CheckCircle size={14} /></div>
      case 'daily_bonus': return <div className="activity-icon-bg purple"><Gift size={14} /></div>
      case 'referral': return <div className="activity-icon-bg orange"><Users size={14} /></div>
      case 'withdrawal': return <div className="activity-icon-bg red"><ArrowUp size={14} /></div>
      case 'deposit': return <div className="activity-icon-bg blue"><ArrowDown size={14} /></div>
      default: return <div className="activity-icon-bg blue"><Zap size={14} /></div>
    }
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

  const demoActivities: Transaction[] = [
    { id: '1', created_at: new Date(Date.now() - 2 * 60000).toISOString(), amount_spy: 22, type: 'ad_watch' },
    { id: '2', created_at: new Date(Date.now() - 86400000).toISOString(), amount_spy: 18, type: 'task_complete' },
    { id: '3', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), amount_spy: 25, type: 'daily_bonus' },
    { id: '4', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), amount_spy: 10, type: 'referral' },
    { id: '5', created_at: new Date(Date.now() - 4 * 86400000).toISOString(), amount_spy: 8, type: 'task_complete' },
  ]

  const displayActivities = recentActivities.length > 0 ? recentActivities : demoActivities

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Zap size={24} className="brand-icon" />
          </div>
          <span className="brand-text">Supay</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className={`nav-item ${item.active ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout">
            <LogOut size={20} />
            <span>Logout</span>
          </button>

          <div className="user-card">
            <div className="user-avatar">
              {profile?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{profile?.username || 'User'}</span>
              <span className="user-email">{profile?.email || 'user@example.com'}</span>
            </div>
            <ChevronDown size={16} className="user-chevron" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <h1 className="page-title">Dashboard</h1>
          </div>
          <div className="top-bar-right">
            <button className="icon-btn">
              <Bell size={20} />
              <span className="notification-dot" />
            </button>
            <div className="user-pill">
              <div className="user-pill-avatar">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-pill-name">{profile?.username || 'User'}</span>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <div className="dashboard">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome back, {profile?.username || 'User'}! 👋</h1>
            <div className="welcome-text">
              Great to see you again. Keep earning and grow your SPY balance.
              <span className="welcome-badge">
                <TrendingUp size={14} />
                +{stats.todayEarnings} SPY earned today
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-top">
                <span className="stat-label">Today&apos;s Earnings</span>
                <div className="stat-icon blue"><Activity size={16} /></div>
              </div>
              <div className="stat-number">{stats.todayEarnings} <span className="stat-unit">SPY</span></div>
              <div className="stat-trend up">+{stats.todayEarnings} SPY earned today</div>
            </div>

            <div className="stat-box">
              <div className="stat-top">
                <span className="stat-label">Total Earned</span>
                <div className="stat-icon purple"><DollarSign size={16} /></div>
              </div>
              <div className="stat-number">${stats.totalEarned.toFixed(1)}</div>
              <div className="stat-trend up">+15.4% all time</div>
            </div>

            <div className="stat-box">
              <div className="stat-top">
                <span className="stat-label">Referrals</span>
                <div className="stat-icon orange"><Users size={16} /></div>
              </div>
              <div className="stat-number">{stats.referralCount}</div>
              <div className="stat-trend up">+15.4% all time</div>
            </div>

            <div className="stat-box">
              <div className="stat-top">
                <span className="stat-label">Withdrawable</span>
                <div className="stat-icon green"><Wallet size={16} /></div>
              </div>
              <div className="stat-number">${stats.withdrawable.toFixed(1)} <span className="stat-unit">USD</span></div>
              <div className="stat-trend neutral">Ready to cash out</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <div className="section-head">
              <h2>Quick Actions</h2>
              <Link href="/dashboard/earn" className="view-all-link">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="actions-grid">
              {quickActions.map((action, i) => {
                const Icon = action.icon
                return (
                  <Link key={i} href={action.link} className="action-link">
                    <div className="action-item">
                      <div className={`action-icon-wrap ${action.color}`}>
                        <Icon size={24} />
                      </div>
                      <div className="action-title">{action.title}</div>
                      <div className="action-desc">{action.desc}</div>
                      <div className={`action-badge ${action.color}`}>{action.extra}</div>
                      <div className="action-arrow">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Main Layout */}
          <div className="dashboard-layout">
            <div className="left-panel">
              {/* Earnings Overview Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <div className="chart-left">
                    <h3>Earnings Overview</h3>
                    <div className="chart-big-number">{weeklyTotal} <span>SPY</span></div>
                    <div className="chart-small-text">
                      <span className="up">+18.6%</span> vs last week
                    </div>
                  </div>
                  <div className="chart-right">
                    <button className="chart-filter">
                      This Week <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
                <div className="chart-bars">
                  {weeklyEarnings.map((value, i) => {
                    const height = (value / maxWeeklyEarning) * 140
                    const isToday = i === 6
                    return (
                      <div key={i} className="chart-bar-item">
                        <div 
                          className={`chart-bar ${isToday ? 'today' : ''}`}
                          style={{ height: `${Math.max(height, 4)}px` }} 
                        />
                        <span className="chart-bar-label">{days[i]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="activity-container">
                <div className="section-head">
                  <h2>Recent Activity</h2>
                  <Link href="/dashboard/transactions" className="view-all-link">
                    View All <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="activity-list">
                  {displayActivities.map((activity) => (
                    <div key={activity.id} className="activity-row">
                      <div className="activity-icon">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="activity-info">
                        <span className="activity-day">
                          {getActivityDescription(activity.type)}
                        </span>
                        <span className="activity-type">
                          {timeAgo(activity.created_at)}
                        </span>
                      </div>
                      <span className="activity-amount">+{Math.abs(activity.amount_spy)} SPY</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="right-panel">
              {/* SPY Balance Card */}
              <div className="spy-card">
                <div className="spy-card-header">
                  <span className="spy-card-label">SPY Balance</span>
                </div>
                <div className="spy-balance">{stats.spyBalance.toLocaleString()} <span>SPY</span></div>
                <div className="spy-sub">
                  ≈ ${(stats.spyBalance * stats.spyPrice).toFixed(2)} USD
                </div>

                <div className="action-buttons">
                  <button className="action-btn deposit">
                    <ArrowDown size={18} />
                    Deposit
                  </button>
                  <button className="action-btn withdraw">
                    <ArrowUp size={18} />
                    Withdraw
                  </button>
                </div>

                <div className="goal-section">
                  <div className="goal-header">
                    <span>Daily Goal</span>
                    <span>{stats.dailyGoal.current} / {stats.dailyGoal.target} SPY</span>
                  </div>
                  <div className="goal-bar">
                    <div className="goal-fill" style={{ width: `${goalPercentage}%` }} />
                  </div>
                  <div className="goal-percentage">{Math.round(goalPercentage)}% completed</div>
                </div>

                <div className="price-row">
                  <div className="price-left">
                    <span className="price-label">SPY Price</span>
                    <div className="price-value-row">
                      <span className="price-value">${stats.spyPrice}</span>
                      <span className="price-change">+4.32%</span>
                    </div>
                  </div>
                  <div className="price-chart">
                    <svg viewBox="0 0 100 30" className="sparkline">
                      <polyline 
                        fill="none" 
                        stroke="#22c55e" 
                        strokeWidth="2"
                        points="0,25 15,22 30,18 45,20 60,12 75,15 90,8 100,5"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Daily Streak Card */}
              <div className="streak-card">
                <div className="streak-header">
                  <Flame size={24} className="streak-flame" />
                  <div>
                    <div className="streak-number">{stats.streak} Days</div>
                    <div className="streak-text">Keep it going!</div>
                  </div>
                </div>
                <div className="streak-days-row">
                  {streakDays.map((day, i) => (
                    <div 
                      key={i} 
                      className={`streak-day-box ${i < stats.streak ? 'active' : ''}`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Card */}
              <div className="community-card">
                <h3 className="community-title">Join the Supay Community</h3>
                <p className="community-desc">Follow us and stay updated with the latest news & rewards.</p>
                <div className="community-links">
                  <a href="https://t.me/supay" target="_blank" rel="noopener noreferrer" className="community-btn telegram">
                    <MessageCircle size={18} />
                    Telegram
                  </a>
                  <a href="https://twitter.com/supay" target="_blank" rel="noopener noreferrer" className="community-btn twitter">
                    <TrendingUp size={18} />
                    Twitter
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
