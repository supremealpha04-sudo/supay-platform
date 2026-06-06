'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Download } from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

export default function AdminAnalyticsPage() {
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [userGrowthData, setUserGrowthData] = useState<any[]>([])
  const [taskData, setTaskData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    
    const response = await fetch(`/api/admin/analytics?days=${days}`)
    const data = await response.json()

    const revenueByDay = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayRevenue = data.deposits?.filter((d: any) => d.created_at.startsWith(dateStr)).reduce((sum: number, d: any) => sum + d.amount_usd, 0) || 0
      return { date: dateStr, revenue: dayRevenue }
    }).reverse()
    setRevenueData(revenueByDay)

    const usersByDay = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayUsers = data.users?.filter((u: any) => u.created_at.startsWith(dateStr)).length || 0
      return { date: dateStr, users: dayUsers }
    }).reverse()

    let cumulative = 0
    const cumulativeUsers = usersByDay.map((day: any) => {
      cumulative += day.users
      return { date: day.date, users: cumulative }
    })
    setUserGrowthData(cumulativeUsers)

    const taskTypeData = data.tasks?.reduce((acc: any, task: any) => {
      acc[task.task_type] = (acc[task.task_type] || 0) + (task.total_completions || 0)
      return acc
    }, {}) || {}
    setTaskData(Object.entries(taskTypeData).map(([name, value]) => ({ name, value })))

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-accent-500 rounded-full animate-spin" />
      </div>
    )
  }

  const COLORS = ['#2342B5', '#FF7A1A', '#10B981', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Platform performance metrics</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Daily Revenue</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2D66" />
            <XAxis dataKey="date" stroke="#A7B0C5" />
            <YAxis stroke="#A7B0C5" />
            <Tooltip contentStyle={{ backgroundColor: '#0A1229', borderColor: '#2342B5' }} />
            <Area type="monotone" dataKey="revenue" stroke="#FF7A1A" fill="#FF7A1A" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">User Growth</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2D66" />
            <XAxis dataKey="date" stroke="#A7B0C5" />
            <YAxis stroke="#A7B0C5" />
            <Tooltip contentStyle={{ backgroundColor: '#0A1229', borderColor: '#2342B5' }} />
            <Line type="monotone" dataKey="users" stroke="#2342B5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Task Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={taskData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {taskData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#0A1229', borderColor: '#2342B5' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}