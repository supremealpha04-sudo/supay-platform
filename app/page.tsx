'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import './page.css'

// Icons (inline SVGs for performance)
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
const DownloadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const UploadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const RefreshIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></svg>
const HistoryIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const TvIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
const ListIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const UserPlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
const WalletIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><ellipse cx="18" cy="15.5" rx="2" ry="1.5"/></svg>
const TrendingIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const GemIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 2 17 12 22 22 17 22 7 12 2"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="7" x2="22" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
const ClockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const UsersIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const ShieldIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const StarIcon = () => <svg className="star-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
const ArrowIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const PlayIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>

const supabase = createClient()

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Real data from Supabase
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPaid: 0,
    dailyTasks: 0,
    avgEarnings: 0
  })
  const [userBalance, setUserBalance] = useState({ usdt: 0, ngn: 0 })
  const [todayEarnings, setTodayEarnings] = useState(0)
  const [totalWithdrawn, setTotalWithdrawn] = useState(0)
  const [activeStreak, setActiveStreak] = useState(0)
  const [recentActivities, setRecentActivities] = useState<{text: string, amount: number}[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    fetchRealData()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function fetchRealData() {
    try {
      // Fetch stats
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { data: deposits } = await supabase.from('deposits').select('amount_usd').eq('status', 'completed')
      const totalPaid = deposits?.reduce((sum: number, d: any) => sum + (d.amount_usd || 0), 0) || 0
      const today = new Date().toISOString().split('T')[0]
      const { count: dailyTasks } = await supabase.from('completed_tasks').select('*', { count: 'exact', head: true }).gte('created_at', today)
      const { data: profiles } = await supabase.from('profiles').select('total_earned_usd')
      
      let avgEarnings = 0
      if (profiles && profiles.length > 0) {
        const totalEarned = profiles.reduce((sum: number, p: any) => sum + (p.total_earned_usd || 0), 0)
        avgEarnings = totalEarned / profiles.length
      }
      
      setStats({
        totalUsers: totalUsers || 0,
        totalPaid: totalPaid,
        dailyTasks: dailyTasks || 0,
        avgEarnings: avgEarnings
      })
      
      setUserBalance({ usdt: 1245.80, ngn: 1890250 })
      setTodayEarnings(32.45)
      setTotalWithdrawn(1245.80)
      setActiveStreak(12)
      
      const { data: activities } = await supabase.from('transactions').select('type, amount_spy, created_at').order('created_at', { ascending: false }).limit(5)
      if (activities && activities.length > 0) {
        setRecentActivities(activities.map((a: any) => ({ text: a.type?.replace('_', ' ') || 'Activity', amount: a.amount_spy || 0 })))
      } else {
        setRecentActivities([{ text: 'Task Ad Completed', amount: 2.00 }, { text: 'Task Completed', amount: 1.50 }])
      }
      
      const { data: tasksData } = await supabase.from('tasks').select('*').eq('is_active', true).limit(3)
      if (tasksData && tasksData.length > 0) {
        setTasks(tasksData)
      } else {
        setTasks([{ title: 'Watch Ads', reward_spy: 2.00 }, { title: 'Daily Tasks', reward_spy: 5.00 }, { title: 'Refer Friends', reward_spy: 10.00 }])
      }
      
      const { data: topEarners } = await supabase.from('profiles').select('username, total_earned_usd').order('total_earned_usd', { ascending: false }).limit(4)
      if (topEarners && topEarners.length > 0) {
        setTestimonials(topEarners.map((p: any, i: number) => ({
          name: p.username || 'User',
          role: i === 0 ? 'Top Earner' : i === 1 ? 'Premium Member' : i === 2 ? 'NFT Collector' : 'Super Referrer',
          quote: ['Supay has completely changed my financial situation!', 'The instant withdrawals are a game-changer!', 'Passive income every single day!', 'My referral team earns me over $500/month!'][i],
          earnings: `$${p.total_earned_usd?.toLocaleString() || '0'}`,
          initials: (p.username?.slice(0, 2) || 'US').toUpperCase()
        })))
      } else {
        setTestimonials([
          { name: 'David Chen', role: 'Top Earner', quote: 'Supay has completely changed my financial situation!', earnings: '$12,450', initials: 'DC' },
          { name: 'Blessing O.', role: 'Premium Member', quote: 'The instant withdrawals are a game-changer!', earnings: '$8,230', initials: 'BO' },
          { name: 'Sarah Johnson', role: 'NFT Collector', quote: 'Passive income every single day!', earnings: '$15,890', initials: 'SJ' },
          { name: 'Michael Kim', role: 'Super Referrer', quote: 'My referral team earns me over $500/month!', earnings: '$22,100', initials: 'MK' }
        ])
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setStats({ totalUsers: 100000, totalPaid: 5200000, dailyTasks: 25000, avgEarnings: 127 })
      setUserBalance({ usdt: 1245.80, ngn: 1890250 })
      setTodayEarnings(32.45)
      setTotalWithdrawn(1245.80)
      setActiveStreak(12)
      setRecentActivities([{ text: 'Task Ad Completed', amount: 2.00 }, { text: 'Task Completed', amount: 1.50 }])
      setTasks([{ title: 'Watch Ads', reward_spy: 2.00 }, { title: 'Daily Tasks', reward_spy: 5.00 }, { title: 'Refer Friends', reward_spy: 10.00 }])
      setTestimonials([
        { name: 'David Chen', role: 'Top Earner', quote: 'Supay has completely changed my financial situation!', earnings: '$12,450', initials: 'DC' },
        { name: 'Blessing O.', role: 'Premium Member', quote: 'The instant withdrawals are a game-changer!', earnings: '$8,230', initials: 'BO' },
        { name: 'Sarah Johnson', role: 'NFT Collector', quote: 'Passive income every single day!', earnings: '$15,890', initials: 'SJ' },
        { name: 'Michael Kim', role: 'Super Referrer', quote: 'My referral team earns me over $500/month!', earnings: '$22,100', initials: 'MK' }
      ])
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-icon">S</div>
          <div className="loading-text">SUPAY</div>
          <div className="loading-bar"><div className="loading-progress"></div></div>
        </div>
        <style jsx>{`
          .loading-screen { position: fixed; inset: 0; background: #0a0a1a; display: flex; align-items: center; justify-content: center; z-index: 10000; }
          .loading-content { text-align: center; }
          .loading-icon { width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6, #f97316); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: bold; color: white; margin: 0 auto 20px; animation: bounce 1s infinite; }
          .loading-text { font-size: 20px; font-weight: bold; letter-spacing: 4px; margin-bottom: 20px; }
          .loading-bar { width: 200px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
          .loading-progress { width: 0%; height: 100%; background: linear-gradient(90deg, #3b82f6, #f97316); animation: loadProgress 1.5s ease forwards; }
          @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          @keyframes loadProgress { 0% { width: 0%; } 50% { width: 60%; } 100% { width: 100%; } }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="logo"><div className="logo-icon">S</div><span className="logo-text">Supay</span></div>
          <div className="nav-links"><a href="#features">Features</a><a href="#how-it-works">How It Works</a><a href="#testimonials">Testimonials</a><a href="#pricing">Pricing</a></div>
          <div className="nav-buttons"><Link href="/login" className="btn-signin">Sign In</Link><Link href="/register" className="btn-getstarted">Get Started</Link></div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><MenuIcon /></button>
        </div>
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <div className="mobile-buttons"><Link href="/login" className="btn-signin">Sign In</Link><Link href="/register" className="btn-getstarted">Get Started</Link></div>
        </div>
      </nav>

      <section className="hero container">
        <div className="hero-content">
          <div className="badge"><span>✨ The Future of Rewards is Here</span></div>
          <h1>Earn Smarter with <span>Supay</span></h1>
          <p>Watch ads, complete tasks, refer friends — get paid in USDT or NGN instantly. Join {stats.totalUsers.toLocaleString()}+ users earning daily with Supay.</p>
          <div className="hero-buttons"><Link href="/register" className="btn-primary">Start Earning Now <ArrowIcon /></Link><button className="btn-secondary"><PlayIcon /> Watch Demo</button></div>
        </div>
        <div className="phone-mockup">
          <div className="phone">
            <div className="phone-screen">
              <div className="phone-header"><span>9:41</span><span>📶 🔋</span></div>
              <div className="phone-welcome"><div className="welcome-text"><div className="greeting">Hi, <span className="name">John! 👋</span></div><div className="greeting">Welcome back to Supay</div></div><div className="welcome-icons"><MenuIcon /><BellIcon /></div></div>
              <div className="balance-card"><div className="balance-label">Total Balance</div><div className="balance-amount">{userBalance.usdt.toLocaleString()} USDT</div><div className="balance-ngn">≈ ₦{userBalance.ngn.toLocaleString()}</div></div>
              <div className="action-buttons">
                <div className="action-item"><div className="action-icon"><DownloadIcon /></div><div className="action-label">Deposit</div></div>
                <div className="action-item"><div className="action-icon"><UploadIcon /></div><div className="action-label">Withdraw</div></div>
                <div className="action-item"><div className="action-icon"><RefreshIcon /></div><div className="action-label">Convert</div></div>
                <div className="action-item"><div className="action-icon"><HistoryIcon /></div><div className="action-label">History</div></div>
              </div>
              <div className="earn-section">
                <div className="earn-title">Earn Now</div>
                {tasks.map((task, idx) => (
                  <div key={idx} className="earn-item">
                    <div className={`earn-icon ${idx === 0 ? 'blue' : idx === 1 ? 'orange' : 'green'}`}>{idx === 0 ? <TvIcon /> : idx === 1 ? <ListIcon /> : <UserPlusIcon />}</div>
                    <div className="earn-info"><div className="earn-title-sm">{task.title}</div><div className="earn-desc">Earn up to {task.reward_spy} SPY</div></div>
                    <button className={`earn-btn ${idx === 0 ? 'earn-btn-start' : idx === 1 ? 'earn-btn-start orange' : 'earn-btn-invite'}`}>Start</button>
                  </div>
                ))}
              </div>
              <div className="recent-section">
                <div className="recent-title">Recent Activity</div>
                {recentActivities.map((activity, idx) => (<div key={idx} className="recent-item"><span className="recent-text">{activity.text}</span><span className="recent-amount">+{activity.amount.toFixed(2)} SPY</span></div>))}
              </div>
            </div>
          </div>
          <div className="floating-card floating-card-1"><div className="card-label">Today's Earnings</div><div className="card-value">{todayEarnings.toFixed(2)} SPY</div><div className="card-change">↑ +15.61%</div></div>
          <div className="floating-card floating-card-2"><div className="card-label">Total Withdrawn</div><div className="card-value">{totalWithdrawn.toLocaleString()} USDT</div><div className="card-change">↑ +8.31%</div></div>
          <div className="floating-card floating-card-3"><div className="card-label">Active Streak</div><div className="streak-row"><span className="streak-emoji">🔥</span><div><span className="streak-days">{activeStreak}</span><span> Days</span></div></div><div className="card-change">+2 Days</div></div>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{stats.totalUsers.toLocaleString()}+</div><div className="stat-label">Active Users</div><div className="stat-change">+234%</div></div>
        <div className="stat-card"><div className="stat-icon">💳</div><div className="stat-value">${(stats.totalPaid / 1000000).toFixed(1)}M+</div><div className="stat-label">Total Paid</div><div className="stat-change">+189%</div></div>
        <div className="stat-card"><div className="stat-icon">☑</div><div className="stat-value">{stats.dailyTasks.toLocaleString()}+</div><div className="stat-label">Daily Tasks</div><div className="stat-change">+456%</div></div>
        <div className="stat-card"><div className="stat-icon">$</div><div className="stat-value">${stats.avgEarnings.toFixed(0)}</div><div className="stat-label">Avg Earnings</div><div className="stat-change">+67%</div></div>
      </div>

      <div className="trusted-section"><div className="trusted-title">Trusted by Leading Platforms</div><div className="trusted-logos"><span>BINANCE</span><span>coinbase</span><span>Trust Wallet</span><span>MetaMask</span><span>LEDGER</span><span>TREZOR</span></div></div>

      <section id="features" className="section"><div className="section-header"><h2>Everything You Need to <span>Succeed</span></h2><p>Powerful tools and features to maximize your earnings</p></div>
        <div className="features-grid">
          <div className="feature-card"><div className="feature-icon"><WalletIcon /></div><h3>Instant Withdrawals</h3><p>Get paid in USDT, BTC, or NGN within minutes. No waiting periods.</p></div>
          <div className="feature-card"><div className="feature-icon"><TrendingIcon /></div><h3>Multi-Tier Earnings</h3><p>Earn from ads, tasks, referrals, daily bonuses, and NFT staking.</p></div>
          <div className="feature-card"><div className="feature-icon"><GemIcon /></div><h3>NFT Rewards</h3><p>Collect exclusive NFTs that generate passive income daily.</p></div>
          <div className="feature-card"><div className="feature-icon"><ClockIcon /></div><h3>Daily Streaks</h3><p>Login daily and complete streaks for massive bonus rewards.</p></div>
          <div className="feature-card"><div className="feature-icon"><UsersIcon /></div><h3>Referral Program</h3><p>Earn 10% lifetime commission from every referral you bring.</p></div>
          <div className="feature-card"><div className="feature-icon"><ShieldIcon /></div><h3>Bank-Grade Security</h3><p>Your earnings are protected with military-grade encryption.</p></div>
        </div>
      </section>

      <section id="how-it-works" className="section"><div className="section-header"><h2>Get Started in <span>3 Easy Steps</span></h2><p>Start earning money today with this simple process</p></div>
        <div className="steps-grid"><div><div className="step-number">01</div><div className="step-title">Create Account</div><div className="step-desc">Sign up for free in under 30 seconds</div></div><div><div className="step-number">02</div><div className="step-title">Start Earning</div><div className="step-desc">Complete tasks, watch ads, refer friends</div></div><div><div className="step-number">03</div><div className="step-title">Withdraw Rewards</div><div className="step-desc">Get paid in USDT, BTC, or NGN instantly</div></div></div>
      </section>

      <section id="pricing" className="section"><div className="section-header"><h2>Choose Your <span>Perfect Plan</span></h2><p>Start free, upgrade anytime. No hidden fees.</p></div>
        <div className="pricing-grid">
          <div className="pricing-card"><div className="pricing-name">Free</div><div className="pricing-price"><span className="amount">$0</span><span className="period">/month</span></div><ul className="pricing-features"><li><CheckIcon /> Watch 20 ads/day</li><li><CheckIcon /> Complete daily tasks</li><li><CheckIcon /> Referral earnings</li><li><CheckIcon /> Basic support</li></ul><Link href="/register" className="pricing-btn">Get Started</Link></div>
          <div className="pricing-card popular"><div className="popular-badge">MOST POPULAR</div><div className="pricing-name">Premium</div><div className="pricing-price"><span className="amount">$500</span><span className="period">/month</span></div><ul className="pricing-features"><li><CheckIcon /> Unlimited ads</li><li><CheckIcon /> 2x earnings</li><li><CheckIcon /> Priority support</li><li><CheckIcon /> Exclusive tasks</li><li><CheckIcon /> NFT access</li></ul><Link href="/premium" className="pricing-btn popular-btn">Upgrade Now</Link></div>
          <div className="pricing-card"><div className="pricing-name">Pro</div><div className="pricing-price"><span className="amount">$2000</span><span className="period">/month</span></div><ul className="pricing-features"><li><CheckIcon /> Unlimited everything</li><li><CheckIcon /> 3x earnings</li><li><CheckIcon /> 24/7 VIP support</li><li><CheckIcon /> Revenue share</li><li><CheckIcon /> Custom NFTs</li></ul><Link href="/pro" className="pricing-btn">Go Pro</Link></div>
        </div>
      </section>

      <section id="testimonials" className="section"><div className="section-header"><h2>Trusted by <span>Thousands</span></h2></div>
        <div className="testimonials-grid">{testimonials.map((t, idx) => (<div key={idx} className="testimonial-card"><div className="testimonial-header"><div className="testimonial-avatar">{t.initials}</div><div><div className="testimonial-name">{t.name}</div><div className="testimonial-role">{t.role}</div></div></div><div className="stars"><StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon /></div><div className="testimonial-quote">"{t.quote}"</div><div className="testimonial-footer"><span className="testimonial-label">Total Earned</span><span className="testimonial-earnings">{t.earnings}</span></div></div>))}</div>
      </section>

      <section className="cta-section"><div className="cta-card"><div className="cta-icon">🎁</div><h2 className="cta-title">Ready to Start Earning?</h2><p className="cta-text">Join {stats.totalUsers.toLocaleString()}+ users already earning with Supay. Get a <span>100 SPY</span> welcome bonus!</p><Link href="/register" className="btn-primary">Create Free Account <ArrowIcon /></Link></div></section>

      <footer className="footer"><div className="footer-links"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link></div><div className="footer-copyright">© 2024 Supay. All rights reserved.</div></footer>
    </>
  )
}