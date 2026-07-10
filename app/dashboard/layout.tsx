'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, Coins, ClipboardList, CreditCard,
  Bell, Menu, X, User, Settings, HelpCircle, LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import './layout-modules.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/earn', label: 'Earn', icon: Coins },
    { href: '/dashboard/tasks', label: 'Tasks', icon: ClipboardList },
    { href: '/dashboard/wallet', label: 'Wallet', icon: CreditCard },
  ]

  const notifications = [
    { id: 1, title: 'Task Completed', msg: 'You earned 25 SPY', time: '2m ago' },
    { id: 2, title: 'New Task', msg: 'Watch video for 10 SPY', time: '1h ago' },
  ]

  const userName = profile?.username || profile?.full_name || 'User'

  return (
    <div className="dash-wrapper">
      {/* Top Header */}
      <header className="dash-topbar">
        <div className="topbar-content">
          <button className="topbar-btn" onClick={() => setDrawerOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="topbar-brand">Supay</span>

          <div className="topbar-right">
            {/* Notification */}
            <div className="dropdown-wrap">
              <button 
                className="topbar-btn notif"
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              >
                <Bell size={18} />
                <span className="notif-dot" />
              </button>
              {notifOpen && (
                <div className="dropdown notif-dropdown">
                  <div className="dropdown-header">
                    <span>Notifications</span>
                    <button className="text-btn">Mark all read</button>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} className="notif-item">
                      <div className="notif-dot-blue" />
                      <div>
                        <p className="notif-title">{n.title}</p>
                        <p className="notif-msg">{n.msg}</p>
                        <span className="notif-time">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="dropdown-wrap">
              <button 
                className="topbar-btn avatar-btn"
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              >
                <div className="avatar">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </button>
              {profileOpen && (
                <div className="dropdown profile-dropdown">
                  <div className="profile-header">
                    <div className="avatar-large">{userName.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="profile-name">{userName}</p>
                      <p className="profile-email">{profile?.email || 'user@example.com'}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" className="menu-item" onClick={() => setProfileOpen(false)}>
                    <Home size={14} /> Dashboard
                  </Link>
                  <Link href="/dashboard/settings" className="menu-item" onClick={() => setProfileOpen(false)}>
                    <Settings size={14} /> Settings
                  </Link>
                  <Link href="/dashboard/help" className="menu-item" onClick={() => setProfileOpen(false)}>
                    <HelpCircle size={14} /> Help
                  </Link>
                  <button className="menu-item logout" onClick={() => { setProfileOpen(false); signOut(); }}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Drawer Overlay */}
      {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />}

      {/* Side Drawer */}
      <div className={`side-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-brand">Supay</span>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="drawer-nav">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`drawer-link ${active ? 'active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <button className="drawer-link logout" onClick={() => { setDrawerOpen(false); signOut(); }}>
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="dash-main">{children}</main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`bottom-btn ${active ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, Coins, ClipboardList, CreditCard,
  Bell, Menu, X, User, Settings, HelpCircle, LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import './dashboard-layout.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/earn', label: 'Earn', icon: Coins },
    { href: '/dashboard/tasks', label: 'Tasks', icon: ClipboardList },
    { href: '/dashboard/wallet', label: 'Wallet', icon: CreditCard },
  ]

  const notifications = [
    { id: 1, title: 'Task Completed', msg: 'You earned 25 SPY', time: '2m ago' },
    { id: 2, title: 'New Task', msg: 'Watch video for 10 SPY', time: '1h ago' },
  ]

  const userName = profile?.username || profile?.full_name || 'User'

  return (
    <div className="dash-wrapper">
      {/* Top Header */}
      <header className="dash-topbar">
        <div className="topbar-content">
          <button className="topbar-btn" onClick={() => setDrawerOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="topbar-brand">Supay</span>

          <div className="topbar-right">
            {/* Notification */}
            <div className="dropdown-wrap">
              <button 
                className="topbar-btn notif"
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              >
                <Bell size={18} />
                <span className="notif-dot" />
              </button>
              {notifOpen && (
                <div className="dropdown notif-dropdown">
                  <div className="dropdown-header">
                    <span>Notifications</span>
                    <button className="text-btn">Mark all read</button>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} className="notif-item">
                      <div className="notif-dot-blue" />
                      <div>
                        <p className="notif-title">{n.title}</p>
                        <p className="notif-msg">{n.msg}</p>
                        <span className="notif-time">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="dropdown-wrap">
              <button 
                className="topbar-btn avatar-btn"
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              >
                <div className="avatar">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </button>
              {profileOpen && (
                <div className="dropdown profile-dropdown">
                  <div className="profile-header">
                    <div className="avatar-large">{userName.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="profile-name">{userName}</p>
                      <p className="profile-email">{profile?.email || 'user@example.com'}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" className="menu-item" onClick={() => setProfileOpen(false)}>
                    <Home size={14} /> Dashboard
                  </Link>
                  <Link href="/dashboard/settings" className="menu-item" onClick={() => setProfileOpen(false)}>
                    <Settings size={14} /> Settings
                  </Link>
                  <Link href="/dashboard/help" className="menu-item" onClick={() => setProfileOpen(false)}>
                    <HelpCircle size={14} /> Help
                  </Link>
                  <button className="menu-item logout" onClick={() => { setProfileOpen(false); signOut(); }}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Drawer Overlay */}
      {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />}

      {/* Side Drawer */}
      <div className={`side-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-brand">Supay</span>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="drawer-nav">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`drawer-link ${active ? 'active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <button className="drawer-link logout" onClick={() => { setDrawerOpen(false); signOut(); }}>
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="dash-main">{children}</main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`bottom-btn ${active ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
