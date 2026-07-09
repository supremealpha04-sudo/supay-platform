'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  FaHome, FaCoins, FaTasks, FaWallet, FaBars, 
  FaBell, FaUserCircle, FaTimes, FaSignOutAlt,
  FaChartLine, FaCog, FaQuestionCircle
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import './layout-modules.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FaHome },
    { href: '/dashboard/earn', label: 'Earn', icon: FaCoins },
    { href: '/dashboard/tasks', label: 'Tasks', icon: FaTasks },
    { href: '/dashboard/wallet', label: 'Wallet', icon: FaWallet },
  ]

  const notifications = [
    { id: 1, title: 'Task Completed', msg: 'You earned 25 SPY', time: '2m ago', unread: true },
    { id: 2, title: 'New Task Available', msg: 'Watch video for 10 SPY', time: '1h ago', unread: true },
    { id: 3, title: 'Daily Bonus', msg: 'Claim your daily reward', time: '3h ago', unread: false },
  ]

  return (
    <div className="dash-wrapper">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-content">
          {/* Left: Hamburger + Brand */}
          <div className="header-left">
            <button 
              className="icon-btn hamburger"
              onClick={() => setDrawerOpen(true)}
            >
              <FaBars size={20} />
            </button>
            <span className="header-brand">Supay</span>
          </div>

          {/* Right: Notification + Profile */}
          <div className="header-right">
            {/* Notification */}
            <div className="notif-wrapper">
              <button 
                className="icon-btn notif-btn"
                onClick={() => {
                  setNotifOpen(!notifOpen)
                  setProfileOpen(false)
                }}
              >
                <FaBell size={20} />
                <span className="notif-badge">2</span>
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    <button className="mark-read">Mark all read</button>
                  </div>
                  <div className="notif-list">
                    {notifications.map(n => (
                      <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                        <div className="notif-dot" />
                        <div className="notif-content">
                          <p className="notif-title">{n.title}</p>
                          <p className="notif-msg">{n.msg}</p>
                          <span className="notif-time">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="profile-wrapper">
              <button 
                className="icon-btn profile-btn"
                onClick={() => {
                  setProfileOpen(!profileOpen)
                  setNotifOpen(false)
                }}
              >
                <div className="profile-avatar">
                  {profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <div className="profile-avatar-large">
                      {profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="profile-name">{profile?.username || 'User'}</p>
                      <p className="profile-email">{profile?.email || 'user@example.com'}</p>
                    </div>
                  </div>
                  <div className="profile-menu">
                    <Link href="/dashboard" className="profile-item">
                      <FaChartLine size={16} />
                      <span>Dashboard</span>
                    </Link>
                    <Link href="/dashboard/settings" className="profile-item">
                      <FaCog size={16} />
                      <span>Settings</span>
                    </Link>
                    <Link href="/dashboard/help" className="profile-item">
                      <FaQuestionCircle size={16} />
                      <span>Help</span>
                    </Link>
                    <button onClick={signOut} className="profile-item logout">
                      <FaSignOutAlt size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Side Drawer */}
      <div className={`side-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-brand">Supay</span>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
            <FaTimes size={20} />
          </button>
        </div>
        <nav className="drawer-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`drawer-link ${isActive ? 'active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={signOut} className="drawer-link logout">
            <FaSignOutAlt size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`bottom-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
