'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Activity, DollarSign, Users, Wallet, Play, 
  CheckCircle, Gift, TrendingUp, Calendar, 
  Flame, Eye, ArrowUpRight, MessageCircle, Zap
} from 'lucide-react'
import './dashboard.css'

const supabase = createClient()

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    todayEarnings: 12,
    totalEarned: 84.30,
    referralCount: 24,
    withdrawable: 24.70,
    spyBalance: 1250,
    spyPrice: 0.023,
    streak: 7,
    dailyGoal: { current: 12, target: 20 }
  })
  
  const [weeklyEarnings, setWeeklyEarnings] = useState([15, 22, 18, 25, 30, 28, 35])
  const [recentActivities, setRecentActivities] = useState([
    { day: 'Sun', amount: 22 },
    { day: 'Mon', amount: 18 },
    { day: 'Tue', amount: 25 },
  ])

  useEffect(() => {
    if (profile) {
      fetchRealData()
    }
  }, [profile])

  async function fetchRealData() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's ad earnings
      const { data: todayAds } = await supabase
        .from('ad_watches')
        .select('reward_spy')
        .eq('user_id', profile?.id)
        .gte('created_at', today)
      
      const todayEarnings = todayAds?.reduce((sum, ad) => sum + (ad.reward_spy || 0), 0) || 0
      
      // Get withdrawable balance
      const { data: breakdown } = await supabase
        .from('user_spy_breakdown')
        .select('*')
        .eq('user_id', profile?.id)
        .single()
      
      const withdrawable = (breakdown?.earned_spy || 0) + (breakdown?.referral_spy || 0) + (breakdown?.staking_rewards_spy || 0)
      
      setStats({
        todayEarnings: todayEarnings,
        totalEarned: profile?.total_earned_usd || 0,
        referralCount: profile?.referral_count || 0,
        withdrawable: withdrawable / 100,
        spyBalance: profile?.spy_balance || 0,
        spyPrice: 0.023,
        streak: profile?.daily_bonus_streak || 0,
        dailyGoal: { current: todayEarnings, target: 20 }
      })
      
      // Fetch weekly earnings
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()
      
      const weeklyData = []
      for (const date of last7Days) {
        const { data: dayAds } = await supabase
          .from('ad_watches')
          .select('reward_spy')
          .eq('user_id', profile?.id)
          .gte('created_at', date)
          .lt('created_at', new Date(new Date(date).getTime() + 86400000).toISOString())
        
        const total = dayAds?.reduce((sum, ad) => sum + (ad.reward_spy || 0), 0) || 0
        weeklyData.push(total)
      }
      setWeeklyEarnings(weeklyData)
      
      // Fetch recent activities
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(7)
      
      if (transactions) {
        const activities = transactions.map(tx => ({
          day: new Date(tx.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
          amount: Math.abs(tx.amount_spy)
        }))
        setRecentActivities(activities.slice(0, 5))
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const quickActions = [
    { title: 'Watch Ads', desc: 'Earn SPY daily', extra: '+5 SPY Available', icon: Play, color: 'blue', link: '/dashboard/earn' },
    { title: 'Complete Tasks', desc: 'Boost earnings', extra: '8 Tasks Available', icon: CheckCircle, color: 'orange', link: '/dashboard/earn' },
    { title: 'Refer Friends', desc: '10% commission', extra: 'Unlimited', icon: Users, color: 'green', link: '/dashboard/referrals' },
    { title: 'Claim Bonus', desc: 'Daily rewards', extra: 'Available Now', icon: Gift, color: 'purple', link: '/dashboard/earn' },
  ]

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const streakDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="dashboard">
      {/* Top Stats Row */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-top">
            <span className="stat-label">Today's Earnings</span>
            <div className="stat-icon"><Activity size={16} /></div>
          </div>
          <div className="stat-number">{stats.todayEarnings} SPY</div>
          <div className="stat-trend">+12 SPY earned today</div>
        </div>
        
        <div className="stat-box">
          <div className="stat-top">
            <span className="stat-label">Total Earned</span>
            <div className="stat-icon"><DollarSign size={16} /></div>
          </div>
          <div className="stat-number">${stats.totalEarned}</div>
          <div className="stat-trend">+15.4% all time</div>
        </div>
        
        <div className="stat-box">
          <div className="stat-top">
            <span className="stat-label">Referrals</span>
            <div className="stat-icon"><Users size={16} /></div>
          </div>
          <div className="stat-number">{stats.referralCount}</div>
          <div className="stat-trend">+15.4% all time</div>
        </div>
        
        <div className="stat-box">
          <div className="stat-top">
            <span className="stat-label">Withdrawable</span>
            <div className="stat-icon"><Wallet size={16} /></div>
          </div>
          <div className="stat-number">${stats.withdrawable} USD</div>
          <div className="stat-trend">Ready to cash out</div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome back, {profile?.username || 'User'}!</h1>
        <div className="welcome-text">
          Great to see you again. Keep earning and grow your SPY balance.
          <span className="welcome-badge">+12 SPY earned today</span>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="dashboard-layout">
        {/* Left Column */}
        <div className="left-panel">
          {/* Quick Actions */}
          <div>
            <div className="section-head">
              <h2>Quick Actions</h2>
              <Link href="/dashboard/earn">View All →</Link>
            </div>
            <div className="actions-grid">
              {quickActions.map((action, i) => {
                const Icon = action.icon
                return (
                  <Link key={i} href={action.link}>
                    <div className="action-item">
                      <div className={`action-icon-wrap ${action.color}`}>
                        <Icon size={24} color="white" />
                      </div>
                      <div className="action-title">{action.title}</div>
                      <div className="action-desc">{action.desc}</div>
                      <div className="action-badge">{action.extra}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Earnings Overview Chart */}
          <div className="chart-container">
            <div className="chart-header">
              <div className="chart-left">
                <h3>Earnings Overview</h3>
                <div className="chart-big-number">86 SPY</div>
                <div className="chart-small-text">Total this week +18.6% vs last week</div>
              </div>
              <div className="chart-right">
                <Calendar size={20} />
              </div>
            </div>
            <div className="chart-bars">
              {weeklyEarnings.map((value, i) => (
                <div key={i} className="chart-bar-item">
                  <div className="chart-bar" style={{ height: `${(value / 40) * 140}px` }} />
                  <span className="chart-bar-label">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-container">
            <div className="section-head">
              <h2>Recent Activity</h2>
              <Link href="/dashboard/transactions">View All →</Link>
            </div>
            <div className="activity-list">
              {recentActivities.map((activity, i) => (
                <div key={i} className="activity-row">
                  <span className="activity-day">{activity.day}</span>
                  <span className="activity-amount">{activity.amount} SPY</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-panel">
          {/* SPY Balance Card */}
          <div className="spy-card">
            <div className="spy-balance">{stats.spyBalance} SPY</div>
            <div className="spy-sub">≈ ${(stats.spyBalance / 100).toFixed(2)} USD</div>
            <div className="goal-section">
              <div className="goal-header">
                <span>Daily Goal</span>
                <span>{stats.dailyGoal.current} / {stats.dailyGoal.target} SPY</span>
              </div>
              <div className="goal-bar">
                <div className="goal-fill" style={{ width: `${(stats.dailyGoal.current / stats.dailyGoal.target) * 100}%` }} />
              </div>
            </div>
            <div className="price-row">
              <span className="price-label">SPY Price</span>
              <span className="price-value">${stats.spyPrice}</span>
              <span className="price-change">+4.32%</span>
            </div>
          </div>

          {/* Daily Streak Card */}
          <div className="streak-card">
            <div className="streak-number">{stats.streak} Days</div>
            <div className="streak-text">Keep it going!</div>
            <div className="streak-days-row">
              {streakDays.map((day, i) => (
                <div key={i} className={`streak-day-box ${i < stats.streak ? 'active' : ''}`}>
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Community Card */}
          <div className="community-card">
            <h3 className="community-title">Join the Supay Community</h3>
            <p className="community-desc">Follow us and stay updated with the latest news & rewards.</p>
            <button className="community-button">Join Now →</button>
          </div>
        </div>
      </div>
    </div>
  )
}