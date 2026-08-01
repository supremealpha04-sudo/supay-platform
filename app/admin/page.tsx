'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
import { useAuth } from '@/contexts/AuthContext'

  FaUsers, FaEye, FaCoins, FaWallet, FaSearch,
  FaUserShield, FaCheck, FaTimes, FaArrowUp, FaArrowDown,
  FaClock, FaSync, FaChartLine, FaBullhorn, FaShieldAlt,
  FaCog, FaClipboardList, FaHome
} from 'react-icons/fa'
import Link from 'next/link'
import './admin.css'

const supabase = createClient()

interface DashboardStats {
  totalUsers: number
  totalAdsWatched: number
  totalSpyDistributed: number
  pendingWithdrawals: number
  todayNewUsers: number
  todayAdsWatched: number
}

interface RecentUser {
  id: string
  username: string
  email: string
  spy_balance: number
  is_premium: boolean
  is_banned: boolean
  created_at: string
}

interface RecentActivity {
  id: string
  user_id: string
  type: string
  amount_spy: number
  created_at: string
  profiles?: { username: string }[]
}

const ADMIN_NAV = [
  { id: '', label: 'Dashboard', icon: FaHome, href: '/admin' },
  { id: 'analytics', label: 'Analytics', icon: FaChartLine, href: '/admin/analytics' },
  { id: 'users', label: 'Users', icon: FaUsers, href: '/admin/users' },
  { id: 'deposits', label: 'Deposits', icon: FaArrowDown, href: '/admin/deposits' },
  { id: 'withdrawals', label: 'Withdrawals', icon: FaArrowUp, href: '/admin/withdrawals' },
  { id: 'tasks', label: 'Tasks', icon: FaClipboardList, href: '/admin/tasks' },
  { id: 'broadcast', label: 'Broadcast', icon: FaBullhorn, href: '/admin/broadcast' },
  { id: 'fraud', label: 'Fraud', icon: FaShieldAlt, href: '/admin/fraud' },
  { id: 'settings', label: 'Settings', icon: FaCog, href: '/admin/settings' },
]

export default function AdminPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, user, refreshProfile, isLoading: authLoading } = useAuth()
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalAdsWatched: 0,
    totalSpyDistributed: 0, pendingWithdrawals: 0,
    todayNewUsers: 0, todayAdsWatched: 0
  })
  const [users, setUsers] = useState<RecentUser[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview')

  // Admin guard
  useEffect(() => {
    if (!authLoading && (!user || !profile?.is_admin)) {
      router.push('/dashboard')
    }
  }, [authLoading, user, profile, router])

  useEffect(() => {
    if (profile?.is_admin) fetchDashboardData()
  }, [profile])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      const { count: totalUsers } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true })

      const { count: totalAds } = await supabase
        .from('ad_watches').select('*', { count: 'exact', head: true })

      const { data: spyData } = await supabase
        .from('ad_watches').select('reward_spy')

      const totalSpy = spyData?.reduce((s, r) => s + (r.reward_spy || 0), 0) || 0

      const { count: pendingWithdrawals } = await supabase
        .from('withdrawals').select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: todayUsers } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      const { count: todayAds } = await supabase
        .from('ad_watches').select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      setStats({
        totalUsers: totalUsers || 0,
        totalAdsWatched: totalAds || 0,
        totalSpyDistributed: totalSpy,
        pendingWithdrawals: pendingWithdrawals || 0,
        todayNewUsers: todayUsers || 0,
        todayAdsWatched: todayAds || 0
      })

      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, username, email, spy_balance, is_premium, is_banned, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      setUsers(recentUsers || [])

      const { data: recentActivity } = await supabase
        .from('transactions')
        .select('id, user_id, type, amount_spy, created_at, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(15)

      setActivities(recentActivity || [])

    } catch (err) {
      console.error(err)
      toast.error('Failed to load admin data')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentStatus })
        .eq('id', userId)

      if (error) throw error
      toast.success(`User ${currentStatus ? 'unbanned' : 'banned'}`)
      fetchDashboardData()
    } catch {
      toast.error('Action failed')
    }
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getUsername = (act: RecentActivity) => {
    return act.profiles?.[0]?.username || 'Unknown'
  }

  if (authLoading || isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  if (!profile?.is_admin) return null

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-header-title">Admin Dashboard</h1>
          <p className="admin-header-subtitle">Manage your platform</p>
        </div>
        <div className="admin-header-actions">
          <button onClick={fetchDashboardData} className="admin-btn-refresh">
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: FaUsers, color: 'blue', change: `+${stats.todayNewUsers} today` },
          { label: 'Ads Watched', value: stats.totalAdsWatched, icon: FaEye, color: 'purple', change: `+${stats.todayAdsWatched} today` },
          { label: 'SPY Distributed', value: `${stats.totalSpyDistributed.toFixed(2)}`, icon: FaCoins, color: 'green', change: 'All time' },
          { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: FaWallet, color: 'orange', change: 'Needs action' },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="admin-stat-card"
          >
            <div className={`admin-stat-icon admin-stat-icon-${s.color}`}>
              <s.icon />
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">{s.label}</p>
              <p className="admin-stat-value">{s.value}</p>
              <p className="admin-stat-change">{s.change}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: FaUserShield },
          { id: 'users', label: 'Users', icon: FaUsers },
          { id: 'activity', label: 'Activity', icon: FaClock },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="admin-sections">
          <div className="admin-section">
            <h3 className="admin-section-title">Quick Actions</h3>
            <div className="admin-actions-grid">
              {ADMIN_NAV.slice(1).map((nav) => (
                <Link key={nav.id} href={nav.href} className="admin-action-btn">
                  <nav.icon /> {nav.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h3 className="admin-section-title">Recent Users</h3>
              <button onClick={() => setActiveTab('users')} className="admin-link">View All</button>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr><th>User</th><th>Balance</th><th>Status</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {users.slice(0, 5).map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">{user.username?.[0]?.toUpperCase() || 'U'}</div>
                          <div>
                            <p className="admin-user-name">{user.username}</p>
                            <p className="admin-user-email">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="admin-balance">{user.spy_balance?.toFixed(2)} SPY</td>
                      <td>
                        <span className={`admin-badge ${user.is_banned ? 'banned' : user.is_premium ? 'premium' : 'active'}`}>
                          {user.is_banned ? 'Banned' : user.is_premium ? 'Premium' : 'Active'}
                        </span>
                      </td>
                      <td className="admin-date">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h3 className="admin-section-title">All Users</h3>
            <div className="admin-search">
              <FaSearch className="admin-search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
            </div>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>User</th><th>Balance</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">{user.username?.[0]?.toUpperCase() || 'U'}</div>
                        <div>
                          <p className="admin-user-name">{user.username}</p>
                          <p className="admin-user-email">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="admin-balance">{user.spy_balance?.toFixed(2)} SPY</td>
                    <td>
                      <span className={`admin-badge ${user.is_banned ? 'banned' : user.is_premium ? 'premium' : 'active'}`}>
                        {user.is_banned ? 'Banned' : user.is_premium ? 'Premium' : 'Active'}
                      </span>
                    </td>
                    <td className="admin-date">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => toggleBan(user.id, user.is_banned)}
                        className={`admin-action-icon ${user.is_banned ? 'unban' : 'ban'}`}
                        title={user.is_banned ? 'Unban user' : 'Ban user'}
                      >
                        {user.is_banned ? <FaCheck /> : <FaTimes />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="admin-section">
          <h3 className="admin-section-title">Recent Activity</h3>
          <div className="admin-activity-list">
            {activities.map(act => (
              <div key={act.id} className="admin-activity-item">
                <div className="admin-activity-icon">
                  {act.type === 'ad_watch' ? <FaEye /> :
                   act.type === 'withdrawal' ? <FaArrowUp /> :
                   act.type === 'deposit' ? <FaArrowDown /> :
                   <FaCoins />}
                </div>
                <div className="admin-activity-content">
                  <p className="admin-activity-title">
                    <span className="admin-activity-user">{getUsername(act)}</span>
                    {' '}{act.type.replace(/_/g, ' ')}
                  </p>
                  <p className="admin-activity-time">{new Date(act.created_at).toLocaleString()}</p>
                </div>
                <span className={`admin-activity-amount ${act.amount_spy >= 0 ? 'positive' : 'negative'}`}>
                  {act.amount_spy >= 0 ? '+' : ''}{act.amount_spy} SPY
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <div className="admin-bottom-nav">
        <div className="admin-bottom-nav-scroll">
          {ADMIN_NAV.map((nav) => {
            const isActive = pathname === nav.href
            return (
              <Link
                key={nav.id}
                href={nav.href}
                className={`admin-bottom-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="admin-bottom-nav-icon">
                  <nav.icon />
                </div>
                <span className="admin-bottom-nav-label">{nav.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
