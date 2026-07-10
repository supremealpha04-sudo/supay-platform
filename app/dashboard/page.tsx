'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Activity, DollarSign, Users, Wallet, Play, 
  CheckCircle, Gift, TrendingUp, ArrowRight,
  Flame, Zap, ArrowUp, ArrowDown, X, Clock
} from 'lucide-react'
import './dashboard.css'

const supabase = createClient()

interface Transaction {
  id: string
  created_at: string
  amount_spy: number
  type: string
}

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todayEarnings: 0, totalEarned: 0, referralCount: 0,
    withdrawable: 0, spyBalance: 0, spyPrice: 0.023,
    streak: 0, dailyGoal: { current: 0, target: 20 }
  })
  const [weeklyEarnings, setWeeklyEarnings] = useState<number[]>([0,0,0,0,0,0,0])
  const [recentActivities, setRecentActivities] = useState<Transaction[]>([])
  const [userName, setUserName] = useState('User')
  const [showActivity, setShowActivity] = useState(false)

  const days = useMemo(() => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], [])

  useEffect(() => {
    if (user?.id) {
      fetchUserName()
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchUserName() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user?.id)
        .single()
      if (data) setUserName(data.full_name || data.username || 'User')
    } catch (e) {
      setUserName(profile?.username || 'User')
    }
  }

  async function fetchDashboardData() {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)

    try {
      const today = new Date(); today.setHours(0,0,0,0)
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + (today.getDay()===0?-6:1))

      let todayEarn = 0, breakdown = { earned_spy:0, referral_spy:0, staking_rewards_spy:0 }
      let weekly = [0,0,0,0,0,0,0], transactions: Transaction[] = []

      try {
        const { data } = await supabase.from('ad_watches').select('reward_spy').eq('user_id', user.id).gte('created_at', today.toISOString())
        if (data) todayEarn = data.reduce((s, a) => s + (Number(a.reward_spy)||0), 0)
      } catch(e){}

      try {
        const { data } = await supabase.from('user_spy_breakdown').select('earned_spy,referral_spy,staking_rewards_spy').eq('user_id', user.id).single()
        if (data) breakdown = data
      } catch(e){}

      try {
        const { data } = await supabase.from('ad_watches').select('reward_spy,created_at').eq('user_id', user.id).gte('created_at', weekStart.toISOString())
        if (data) data.forEach((ad: any) => {
          const d = new Date(ad.created_at), idx = d.getDay()===0?6:d.getDay()-1
          weekly[idx] += Number(ad.reward_spy)||0
        })
      } catch(e){}

      try {
        const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at',{ascending:false}).limit(10)
        if (data) transactions = data
      } catch(e){}

      const withdrawable = (Number(breakdown.earned_spy)||0) + (Number(breakdown.referral_spy)||0) + (Number(breakdown.staking_rewards_spy)||0)

      setStats({
        todayEarnings: todayEarn,
        totalEarned: Number(profile?.total_earned_usd)||0,
        referralCount: Number(profile?.referral_count)||0,
        withdrawable: withdrawable/100,
        spyBalance: Number(profile?.spy_balance)||0,
        spyPrice: 0.023,
        streak: Number(profile?.daily_bonus_streak)||0,
        dailyGoal: { current: todayEarn, target: 20 }
      })
      setWeeklyEarnings(weekly)
      setRecentActivities(transactions.length ? transactions : getDemoActivities())
    } catch(err) {
      setRecentActivities(getDemoActivities())
    } finally {
      setLoading(false)
    }
  }

  const getDemoActivities = (): Transaction[] => [
    { id:'1', created_at: new Date(Date.now()-120000).toISOString(), amount_spy:22, type:'ad_watch' },
    { id:'2', created_at: new Date(Date.now()-86400000).toISOString(), amount_spy:18, type:'task_complete' },
    { id:'3', created_at: new Date(Date.now()-172800000).toISOString(), amount_spy:25, type:'daily_bonus' },
    { id:'4', created_at: new Date(Date.now()-259200000).toISOString(), amount_spy:10, type:'referral' },
    { id:'5', created_at: new Date(Date.now()-345600000).toISOString(), amount_spy:8, type:'task_complete' },
    { id:'6', created_at: new Date(Date.now()-432000000).toISOString(), amount_spy:35, type:'ad_watch' },
    { id:'7', created_at: new Date(Date.now()-518400000).toISOString(), amount_spy:15, type:'daily_bonus' },
  ]

  const quickActions = [
    { title:'Watch Ads', desc:'Earn SPY', extra:'+5 SPY', icon:Play, color:'blue', link:'/dashboard/earn' },
    { title:'Tasks', desc:'Boost earnings', extra:'8 Available', icon:CheckCircle, color:'orange', link:'/dashboard/tasks' },
    { title:'Refer', desc:'10% commission', extra:'Unlimited', icon:Users, color:'green', link:'/dashboard/referrals' },
    { title:'Bonus', desc:'Daily rewards', extra:'Claim Now', icon:Gift, color:'purple', link:'/dashboard/earn' },
  ]

  const getActIcon = (type: string) => {
    const map: Record<string, string> = { ad_watch:'blue', task_complete:'green', daily_bonus:'purple', referral:'orange' }
    return map[type] || 'blue'
  }

  const getActLabel = (type: string) => {
    const map: Record<string,string> = { ad_watch:'Watched Ad', task_complete:'Completed Task', daily_bonus:'Daily Bonus', referral:'Referral Joined' }
    return map[type] || type.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())
  }

  const timeAgo = (d: string) => {
    const diff = Date.now()-new Date(d).getTime(), m = Math.floor(diff/60000), h = Math.floor(diff/3600000)
    if (m<1) return 'Just now'; if (m<60) return `${m}m ago`; if (h<24) return `${h}h ago`; return `${Math.floor(diff/86400000)}d ago`
  }

  const weeklyTotal = weeklyEarnings.reduce((a,b)=>a+b,0)
  const maxW = Math.max(...weeklyEarnings,1)
  const goalPct = Math.min((stats.dailyGoal.current/stats.dailyGoal.target)*100,100)

  if (loading) return <div className="dash-loading"><div className="spinner"/><p>Loading...</p></div>

  return (
    <div className="dashboard">
      {/* SPY BALANCE CARD */}
      <div className="spy-card">
        <div className="spy-header">
          <span>SPY Balance</span>
          <Zap size={16} className="spy-zap"/>
        </div>
        <div className="spy-amount">{stats.spyBalance.toLocaleString()} <span>SPY</span></div>
        <div className="spy-usd">≈ ${(stats.spyBalance*stats.spyPrice).toFixed(2)} USD</div>
        <div className="spy-buttons">
          <Link href="/dashboard/wallet?tab=deposit" className="spy-btn deposit">
            <ArrowDown size={14}/>Deposit
          </Link>
          <Link href="/dashboard/wallet?tab=withdraw" className="spy-btn withdraw">
            <ArrowUp size={14}/>Withdraw
          </Link>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-top"><span>Today&apos;s Earnings</span><div className="s-icon blue"><Activity size={14}/></div></div>
          <div className="stat-num">{stats.todayEarnings} <span>SPY</span></div>
          <div className="stat-trend up">+{stats.todayEarnings} earned</div>
        </div>
        <div className="stat-box">
          <div className="stat-top"><span>Total Earned</span><div className="s-icon purple"><DollarSign size={14}/></div></div>
          <div className="stat-num">${stats.totalEarned.toFixed(1)}</div>
          <div className="stat-trend up">+15.4% all time</div>
        </div>
        <div className="stat-box">
          <div className="stat-top"><span>Referrals</span><div className="s-icon orange"><Users size={14}/></div></div>
          <div className="stat-num">{stats.referralCount}</div>
          <div className="stat-trend up">+15.4% all time</div>
        </div>
        <div className="stat-box">
          <div className="stat-top"><span>Withdrawable</span><div className="s-icon green"><Wallet size={14}/></div></div>
          <div className="stat-num">${stats.withdrawable.toFixed(1)} <span>USD</span></div>
          <div className="stat-trend neutral">Ready to cash out</div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="actions-row">
        {quickActions.map((a,i) => {
          const Icon = a.icon
          return (
            <Link key={i} href={a.link} className="q-action">
              <div className={`qa-icon ${a.color}`}><Icon size={20}/></div>
              <div className="qa-title">{a.title}</div>
              <div className="qa-desc">{a.desc}</div>
              <div className={`qa-badge ${a.color}`}>{a.extra}</div>
            </Link>
          )
        })}
      </div>

      {/* CHART + ACTIVITY ROW */}
      <div className="bottom-row">
        {/* Earnings Chart */}
        <div className="chart-box">
          <div className="chart-head">
            <div>
              <h3>Earnings Overview</h3>
              <div className="chart-total">{weeklyTotal} <span>SPY</span></div>
              <div className="chart-vs"><span className="up">+18.6%</span> vs last week</div>
            </div>
          </div>
          <div className="chart-bars">
            {weeklyEarnings.map((v,i) => (
              <div key={i} className="c-bar-item">
                <div className={`c-bar ${i===6?'today':''}`} style={{height:`${Math.max((v/maxW)*70,3)}px`}}/>
                <span>{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity (clickable) */}
        <div className="activity-box" onClick={() => setShowActivity(true)}>
          <div className="act-head">
            <h3>Recent Activity</h3>
            <span className="view-all">View All <ArrowRight size={12}/></span>
          </div>
          <div className="act-list">
            {recentActivities.slice(0,3).map(a => (
              <div key={a.id} className="act-row">
                <div className={`act-icon ${getActIcon(a.type)}`}>
                  {a.type==='ad_watch' ? <Play size={10} fill="white"/> : 
                   a.type==='task_complete' ? <CheckCircle size={10}/> :
                   a.type==='daily_bonus' ? <Gift size={10}/> : <Users size={10}/>}
                </div>
                <div className="act-info">
                  <span className="act-name">{getActLabel(a.type)}</span>
                  <span className="act-time">{timeAgo(a.created_at)}</span>
                </div>
                <span className="act-amt">+{Math.abs(a.amount_spy)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GOAL + STREAK */}
      <div className="compact-row">
        <div className="goal-mini">
          <div className="goal-head"><span>Daily Goal</span><span>{stats.dailyGoal.current}/{stats.dailyGoal.target} SPY</span></div>
          <div className="goal-bar"><div className="goal-fill" style={{width:`${goalPct}%`}}/></div>
        </div>
        <div className="streak-mini">
          <Flame size={14} className="flame-icon"/>
          <span>{stats.streak} Day Streak</span>
        </div>
      </div>

      {/* ACTIVITY MODAL */}
      {showActivity && (
        <div className="activity-modal">
          <div className="modal-overlay" onClick={() => setShowActivity(false)}/>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Recent Activity</h2>
              <button className="modal-close" onClick={() => setShowActivity(false)}>
                <X size={20}/>
              </button>
            </div>
            <div className="modal-list">
              {recentActivities.map(a => (
                <div key={a.id} className="modal-row">
                  <div className={`act-icon ${getActIcon(a.type)}`}>
                    {a.type==='ad_watch' ? <Play size={14} fill="white"/> : 
                     a.type==='task_complete' ? <CheckCircle size={14}/> :
                     a.type==='daily_bonus' ? <Gift size={14}/> : <Users size={14}/>}
                  </div>
                  <div className="modal-info">
                    <span className="modal-name">{getActLabel(a.type)}</span>
                    <span className="modal-time"><Clock size={12}/> {timeAgo(a.created_at)}</span>
                  </div>
                  <span className="modal-amt">+{Math.abs(a.amount_spy)} SPY</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
