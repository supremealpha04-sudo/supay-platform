'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Users, Wallet, ArrowUpDown, Gem, TrendingUp, Clock, AlertTriangle, ChevronRight, ClipboardList, Activity, UserCheck } from 'lucide-react'

const supabase = createClient()

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  premiumUsers: number
  totalDeposits: number
  totalWithdrawals: number
  pendingWithdrawals: number
  totalNFTsMinted: number
  totalTasksCompleted: number
  fraudAlerts: number
  dailyRevenue: number
  monthlyRevenue: number
  totalSPYDISTRIBUTED: number
}

interface RecentActivity {
  id: string
  type: string
  user: string
  amount: number
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    totalNFTsMinted: 0,
    totalTasksCompleted: 0,
    fraudAlerts: 0,
    dailyRevenue: 0,
    monthlyRevenue: 0,
    totalSPYDISTRIBUTED: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()
  }, [])

  async function fetchStats() {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Active users (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: activeUsers } = await supabase
        .from('user_activity_logs')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())
        .limit(1)

      // Premium users
      const { count: premiumUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_premium', true)

      // Deposits
      const { data: deposits } = await supabase
        .from('deposits')
        .select('amount_usd, status')
      const totalDeposits = deposits?.reduce((sum, d) => sum + (d.status === 'completed' ? d.amount_usd : 0), 0) || 0

      // Withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount_usd, status')
      const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + (w.status === 'completed' ? w.amount_usd : 0), 0) || 0
      const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending').length || 0

      // NFTs
      const { count: totalNFTsMinted } = await supabase
        .from('user_nfts')
        .select('*', { count: 'exact', head: true })

      // Tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('total_completions')
      const totalTasksCompleted = tasks?.reduce((sum, t) => sum + (t.total_completions || 0), 0) || 0

      // Fraud alerts
      const { count: fraudAlerts } = await supabase
        .from('fraud_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false)

      // Daily revenue (today)
      const today = new Date().toISOString().split('T')[0]
      const { data: todayDeposits } = await supabase
        .from('deposits')
        .select('amount_usd')
        .eq('status', 'completed')
        .gte('created_at', today)
      const dailyRevenue = todayDeposits?.reduce((sum, d) => sum + d.amount_usd, 0) || 0

      // Monthly revenue
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const { data: monthDeposits } = await supabase
        .from('deposits')
        .select('amount_usd')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString())
      const monthlyRevenue = monthDeposits?.reduce((sum, d) => sum + d.amount_usd, 0) || 0

      // Total SPY distributed
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount_spy')
        .in('type', ['task_reward', 'ad_reward', 'referral_bonus', 'staking_reward'])
      const totalSPYDISTRIBUTED = transactions?.reduce((sum, t) => sum + Math.abs(t.amount_spy), 0) || 0

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        premiumUsers: premiumUsers || 0,
        totalDeposits,
        totalWithdrawals,
        pendingWithdrawals,
        totalNFTsMinted: totalNFTsMinted || 0,
        totalTasksCompleted,
        fraudAlerts: fraudAlerts || 0,
        dailyRevenue,
        monthlyRevenue,
        totalSPYDISTRIBUTED
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function fetchRecentActivity() {
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('id, amount_usd, status, created_at, profiles(username)')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: deposits } = await supabase
      .from('deposits')
      .select('id, amount_usd, status, created_at, profiles(username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    const activities: RecentActivity[] = [
      ...(withdrawals?.map(w => ({
        id: w.id,
        type: 'withdrawal',
       user: w.profiles?.[0]?.username || 'Unknown',
        amount: w.amount_usd,
        status: w.status,
        created_at: w.created_at
      })) || []),
      ...(deposits?.map(d => ({
        id: d.id,
        type: 'deposit',
        user: d.profiles?.[0]?.username || 'Unknown',
        amount: d.amount_usd,
        status: d.status,
        created_at: d.created_at
      })) || [])
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

    setRecentActivity(activities)
    setIsLoading(false)
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'from-blue-500 to-cyan-500', change: '+12%' },
    { label: 'Active Users (7d)', value: stats.activeUsers.toLocaleString(), icon: Activity, color: 'from-green-500 to-emerald-500', change: '+5%' },
    { label: 'Premium Users', value: stats.premiumUsers.toLocaleString(), icon: UserCheck, color: 'from-purple-500 to-pink-500', change: `${((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}%` },
    { label: 'Total Deposits', value: `$${stats.totalDeposits.toLocaleString()}`, icon: Wallet, color: 'from-accent-500 to-orange-600', change: '+18%' },
    { label: 'Total Withdrawn', value: `$${stats.totalWithdrawals.toLocaleString()}`, icon: ArrowUpDown, color: 'from-red-500 to-rose-600', change: '+7%' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals.toString(), icon: Clock, color: 'from-yellow-500 to-amber-600', change: 'Needs Review' },
    { label: 'NFTs Minted', value: stats.totalNFTsMinted.toLocaleString(), icon: Gem, color: 'from-indigo-500 to-purple-600', change: '+23%' },
    { label: 'Tasks Completed', value: stats.totalTasksCompleted.toLocaleString(), icon: ClipboardList, color: 'from-teal-500 to-green-600', change: '+31%' },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-accent-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Overview of platform performance</p>
        </div>
        <div className="flex gap-3">
          <div className="glass rounded-xl px-4 py-2">
            <p className="text-xs text-gray-400">Daily Revenue</p>
            <p className="text-xl font-bold text-green-400">${stats.dailyRevenue.toLocaleString()}</p>
          </div>
          <div className="glass rounded-xl px-4 py-2">
            <p className="text-xs text-gray-400">Monthly Revenue</p>
            <p className="text-xl font-bold text-accent-500">${stats.monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="glass rounded-xl p-4 border border-primary-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-green-400">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Alert Banner */}
      {stats.fraudAlerts > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-white font-medium">{stats.fraudAlerts} Fraud Alerts</p>
              <p className="text-sm text-gray-400">Suspicious activity detected</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition">
            Review Alerts
          </button>
        </div>
      )}

      {/* Recent Activity */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-primary-500/20">
              <tr>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="border-b border-primary-500/10 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <span className={`capitalize ${activity.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'}`}>
                      {activity.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">{activity.user}</td>
                  <td className="py-3 px-4 text-white">${activity.amount.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activity.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {activity.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{new Date(activity.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <button className="text-accent-500 hover:text-accent-400">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
