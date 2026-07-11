'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, Coins, ClipboardList, CreditCard,
  Bell, Menu, X, Settings, HelpCircle, LogOut,
  User, ChevronRight, Sparkles, Trophy,
  Zap, Moon, Sun, ChevronDown
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import './layout-modules.css'

// ============================================
// TYPES
// ============================================
interface Notification {
  id: number
  title: string
  msg: string
  time: string
  read?: boolean
  type?: 'task' | 'referral' | 'system' | 'reward'
}

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

// ============================================
// CONSTANTS
// ============================================
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/earn', label: 'Earn', icon: Coins },
  { href: '/dashboard/tasks', label: 'Tasks', icon: ClipboardList, badge: 3 },
  { href: '/dashboard/wallet', label: 'Wallet', icon: CreditCard },
]

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'Task Completed', msg: 'You earned 25 SPY', time: '2m ago', type: 'task' },
  { id: 2, title: 'New Task Available', msg: 'Watch video for 10 SPY', time: '1h ago', type: 'system' },
  { id: 3, title: 'Referral Joined', msg: 'John joined using your link', time: '3h ago', type: 'referral' },
  { id: 4, title: 'Daily Bonus Claimed', msg: 'Streak bonus +15 SPY', time: '5h ago', type: 'reward' },
]

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, user, signOut } = useAuth()
  
  // ===== STATE =====
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [welcomePopup, setWelcomePopup] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS)
  const [unreadCount, setUnreadCount] = useState(2)
  const [userName, setUserName] = useState('User')
  const [userEmail, setUserEmail] = useState('user@example.com')
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  // ===== REFS =====
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ===== COMPUTED =====
  const isDashboard = useMemo(() => pathname === '/dashboard', [pathname])
  
  const isActiveRoute = useCallback((href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(href + '/') || pathname === href
  }, [pathname])

  // ===== HANDLERS =====
  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen(prev => {
      document.body.style.overflow = !prev ? 'hidden' : ''
      return !prev
    })
  }, [])

  const handleNotificationToggle = useCallback(() => {
    setNotifOpen(prev => !prev)
    setProfileOpen(false)
  }, [])

  const handleProfileToggle = useCallback(() => {
    setProfileOpen(prev => !prev)
    setNotifOpen(false)
  }, [])

  const handleSignOut = useCallback(async () => {
    setProfileOpen(false)
    setDrawerOpen(false)
    await signOut()
    router.push('/auth')
  }, [signOut, router])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const dismissWelcomePopup = useCallback(() => {
    setWelcomePopup(false)
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newTheme = !prev
      document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light')
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
      return newTheme
    })
  }, [])

  // ===== EFFECTS =====
  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  // Close dropdowns on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false)
        setProfileOpen(false)
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      
      if (notifOpen && notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false)
      }
      
      if (profileOpen && profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen, profileOpen])

  // User data and welcome popup
  useEffect(() => {
    const name = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User'
    const email = profile?.email || user?.email || 'user@example.com'
    
    setUserName(name)
    setUserEmail(email)

    if (isDashboard) {
      setWelcomePopup(true)
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
      popupTimerRef.current = setTimeout(() => {
        setWelcomePopup(false)
      }, 4000)
    }

    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
    }
  }, [profile, user, isDashboard])

  // ===== HELPERS =====
  const getNotifIcon = useCallback((type?: string) => {
    switch(type) {
      case 'task': return <Trophy size={14} />
      case 'referral': return <Users size={14} />
      case 'reward': return <Zap size={14} />
      default: return <Bell size={14} />
    }
  }, [])

  // ===== RENDER =====
  return (
    <div className="dash-wrapper" data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Welcome Popup */}
      {welcomePopup && (
        <div 
          className="welcome-popup" 
          role="status" 
          aria-live="polite"
          onClick={dismissWelcomePopup}
        >
          <div className="popup-content">
            <Sparkles size={24} className="popup-icon" />
            <div>
              <h3>Welcome back, {userName}!</h3>
              <p>Ready to earn more SPY today?</p>
            </div>
            <button 
              className="popup-dismiss" 
              onClick={(e) => { e.stopPropagation(); dismissWelcomePopup() }}
              aria-label="Dismiss welcome message"
            >
              <X size={16} />
            </button>
          </div>
          <div className="popup-progress">
            <div className="popup-bar" />
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="dash-topbar" role="banner">
        <div className="topbar-content">
          <button 
            className="topbar-btn" 
            onClick={handleDrawerToggle}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={drawerOpen}
          >
            <Menu size={20} />
          </button>

          <div className="brand-block">
            <span className="topbar-brand">Supay</span>
            <span className="topbar-tagline">The Future of Reward Platforms</span>
          </div>

          <div className="topbar-right">
            {/* Notification */}
            <div className="dropdown-wrap" ref={notifRef}>
              <button 
                className="topbar-btn notif"
                onClick={handleNotificationToggle}
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                aria-expanded={notifOpen}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notif-dot" aria-hidden="true">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="dropdown notif-dropdown" role="menu">
                  <div className="dropdown-header">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        className="text-btn" 
                        onClick={markAllRead}
                        aria-label="Mark all as read"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="empty-state">
                      <Bell size={24} />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                        role="menuitem"
                      >
                        <div className="notif-icon">
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="notif-content">
                          <p className="notif-title">{n.title}</p>
                          <p className="notif-msg">{n.msg}</p>
                          <span className="notif-time">{n.time}</span>
                        </div>
                        {!n.read && <div className="notif-dot-blue" />}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button 
              className="topbar-btn theme-toggle"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Profile */}
            <div className="dropdown-wrap" ref={profileRef}>
              <button 
                className="topbar-btn avatar-btn"
                onClick={handleProfileToggle}
                aria-label="Profile menu"
                aria-expanded={profileOpen}
              >
                <div className="avatar" aria-hidden="true">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <ChevronDown size={14} className={`profile-chevron ${profileOpen ? 'open' : ''}`} />
              </button>
              {profileOpen && (
                <div className="dropdown profile-dropdown" role="menu">
                  <div className="profile-header">
                    <div className="avatar-large">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="profile-name">{userName}</p>
                      <p className="profile-email">{userEmail}</p>
                    </div>
                  </div>
                  
                  <div className="profile-divider" />
                  
                  <Link 
                    href="/dashboard/profile" 
                    className="menu-item"
                    onClick={() => setProfileOpen(false)}
                    role="menuitem"
                  >
                    <User size={14} /> Profile
                  </Link>
                  <Link 
                    href="/dashboard/settings" 
                    className="menu-item"
                    onClick={() => setProfileOpen(false)}
                    role="menuitem"
                  >
                    <Settings size={14} /> Settings
                  </Link>
                  <Link 
                    href="/dashboard/help" 
                    className="menu-item"
                    onClick={() => setProfileOpen(false)}
                    role="menuitem"
                  >
                    <HelpCircle size={14} /> Help
                  </Link>
                  
                  <div className="profile-divider" />
                  
                  <button 
                    className="menu-item logout" 
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div 
          className="drawer-overlay" 
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Side Drawer */}
      <div className={`side-drawer ${drawerOpen ? 'open' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="drawer-header">
          <div>
            <span className="drawer-brand">Supay</span>
            <span className="drawer-tagline">The Future of Reward Platforms</span>
          </div>
          <button 
            className="drawer-close" 
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="drawer-user">
          <div className="drawer-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="drawer-user-info">
            <p className="drawer-username">{userName}</p>
            <p className="drawer-useremail">{userEmail}</p>
          </div>
        </div>
        
        <div className="drawer-divider" />
        
        <nav className="drawer-nav">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = isActiveRoute(item.href)
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`drawer-link ${active ? 'active' : ''}`}
                onClick={() => setDrawerOpen(false)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && <span className="drawer-badge">{item.badge}</span>}
                {active && <ChevronRight size={14} className="drawer-active-indicator" />}
              </Link>
            )
          })}
          
          <div className="drawer-divider" />
          
          <Link 
            href="/dashboard/profile" 
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <User size={18} /> Profile
          </Link>
          <Link 
            href="/dashboard/settings" 
            className="drawer-link"
            onClick={() => setDrawerOpen(false)}
          >
            <Settings size={18} /> Settings
          </Link>
          <button 
            className="drawer-link logout" 
            onClick={handleSignOut}
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>
        
        <div className="drawer-footer">
          <div className="drawer-version">v2.0.1</div>
          <div className="drawer-theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="dash-main" role="main">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav" role="navigation" aria-label="Bottom navigation">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = isActiveRoute(item.href)
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`bottom-btn ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {item.badge && <span className="bottom-badge">{item.badge}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}