// app/dashboard/layout.tsx
'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, Coins, ClipboardList, CreditCard,
  Bell, Menu, X, Settings, HelpCircle, LogOut,
  User, Users, ChevronRight, Sparkles, Trophy,
  Zap, Moon, Sun, ChevronDown, Trash2, Check
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import toast from 'react-hot-toast'
import './layout-modules.css'

const supabase = createClient()

// ============================================
// TYPES
// ============================================
interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
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
  
  // Real Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(true)

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

  // ===== NOTIFICATION LOGIC =====
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      
      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setNotifLoading(false)
    }
  }, [user?.id])

  // Real-time listener for new notifications
  useEffect(() => {
    if (!user?.id) return
    fetchNotifications()

    const channel = supabase
      .channel('layout-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
          setUnreadCount((prev) => prev + 1)
          toast(payload.new.title, { icon: '🔔' })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchNotifications])

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return
    const previousNotifs = [...notifications]
    
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id)
      .eq('is_read', false)

    if (error) {
      setNotifications(previousNotifs) // Revert
      toast.error('Failed to mark as read')
    }
  }, [user?.id, unreadCount, notifications])

  const clearNotifications = useCallback(async () => {
    const previousNotifs = [...notifications]
    
    // Optimistic update
    setNotifications([])
    setUnreadCount(0)
    setNotifOpen(false)

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user?.id)

    if (error) {
      setNotifications(previousNotifs) // Revert
      toast.error('Failed to clear notifications')
    } else {
      toast.success('Notifications cleared')
    }
  }, [user?.id, notifications])

  const markOneRead = useCallback(async (id: string, isRead: boolean) => {
    if (isRead) return; // Already read
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }, [])

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
    router.push('/login')
  }, [signOut, router])

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

  // Format time for notifications
  const timeAgo = useCallback((dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }, [])

  // ===== EFFECTS =====
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (notifOpen && notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false)
      if (profileOpen && profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen, profileOpen])

  useEffect(() => {
    const name = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User'
    const email = profile?.email || user?.email || 'user@example.com'
    
    setUserName(name)
    setUserEmail(email)

    if (isDashboard) {
      setWelcomePopup(true)
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
      popupTimerRef.current = setTimeout(() => setWelcomePopup(false), 4000)
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
        <div className="welcome-popup" role="status" onClick={dismissWelcomePopup}>
          <div className="popup-content">
            <Sparkles size={24} className="popup-icon" />
            <div>
              <h3>Welcome back, {userName}!</h3>
              <p>Ready to earn more SPY today?</p>
            </div>
            <button className="popup-dismiss" onClick={(e) => { e.stopPropagation(); dismissWelcomePopup() }}>
              <X size={16} />
            </button>
          </div>
          <div className="popup-progress"><div className="popup-bar" /></div>
        </div>
      )}

      {/* Top Header */}
      <header className="dash-topbar" role="banner">
        <div className="topbar-content">
          <button className="topbar-btn" onClick={handleDrawerToggle}>
            <Menu size={20} />
          </button>

          <div className="brand-block">
            <span className="topbar-brand">Supay</span>
            <span className="topbar-tagline">The Future of Reward Platforms</span>
          </div>

          <div className="topbar-right">
            {/* Notification Dropdown */}
            <div className="dropdown-wrap" ref={notifRef}>
              <button className="topbar-btn notif" onClick={handleNotificationToggle}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              
              {notifOpen && (
                <div className="dropdown notif-dropdown" role="menu">
                  <div className="dropdown-header">
                    <span>Notifications</span>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button className="text-btn text-primary-400" onClick={markAllRead} title="Mark all read">
                          <Check size={14} />
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button className="text-btn text-red-400" onClick={clearNotifications} title="Clear all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {notifLoading ? (
                    <div className="empty-state"><p>Loading...</p></div>
                  ) : notifications.length === 0 ? (
                    <div className="empty-state">
                      <Bell size={24} />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => markOneRead(n.id, n.is_read)}
                      >
                        <div className="notif-icon">{getNotifIcon(n.type)}</div>
                        <div className="notif-content">
                          <p className="notif-title">{n.title}</p>
                          <p className="notif-msg">{n.message}</p>
                          <span className="notif-time">{timeAgo(n.created_at)}</span>
                        </div>
                        {!n.is_read && <div className="notif-dot-blue" />}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button className="topbar-btn theme-toggle" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Profile Dropdown */}
            <div className="dropdown-wrap" ref={profileRef}>
              <button className="topbar-btn avatar-btn" onClick={handleProfileToggle}>
                <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
                <ChevronDown size={14} className={`profile-chevron ${profileOpen ? 'open' : ''}`} />
              </button>
              {profileOpen && (
                <div className="dropdown profile-dropdown" role="menu">
                  <div className="profile-header">
                    <div className="avatar-large">{userName.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="profile-name">{userName}</p>
                      <p className="profile-email">{userEmail}</p>
                    </div>
                  </div>
                  <div className="profile-divider" />
                  <Link href="/dashboard/profile" className="menu-item" onClick={() => setProfileOpen(false)}>
                    <User size={14} /> Profile
                  </Link>
                  <Link href="/dashboard/settings" className="menu-item" onClick={() => setProfileOpen(false)}>
                    <Settings size={14} /> Settings
                  </Link>
                  <Link href="/dashboard/help" className="menu-item" onClick={() => setProfileOpen(false)}>
                    <HelpCircle size={14} /> Help
                  </Link>
                  <div className="profile-divider" />
                  <button className="menu-item logout" onClick={handleSignOut}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Side Drawer */}
      {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />}
      <div className={`side-drawer ${drawerOpen ? 'open' : ''}`} role="navigation">
        <div className="drawer-header">
          <div>
            <span className="drawer-brand">Supay</span>
            <span className="drawer-tagline">The Future of Reward Platforms</span>
          </div>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}><X size={20} /></button>
        </div>
        
        <div className="drawer-user">
          <div className="drawer-avatar">{userName.charAt(0).toUpperCase()}</div>
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
              <Link key={item.href} href={item.href} className={`drawer-link ${active ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && <span className="drawer-badge">{item.badge}</span>}
                {active && <ChevronRight size={14} className="drawer-active-indicator" />}
              </Link>
            )
          })}
          <div className="drawer-divider" />
          <Link href="/dashboard/profile" className="drawer-link" onClick={() => setDrawerOpen(false)}><User size={18} /> Profile</Link>
          <Link href="/dashboard/settings" className="drawer-link" onClick={() => setDrawerOpen(false)}><Settings size={18} /> Settings</Link>
          <button className="drawer-link logout" onClick={handleSignOut}><LogOut size={18} /> Logout</button>
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
      <main className="dash-main" role="main">{children}</main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav" role="navigation">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = isActiveRoute(item.href)
          return (
            <Link key={item.href} href={item.href} className={`bottom-btn ${active ? 'active' : ''}`}>
              <Icon size={20} />
              <span>{item.label}</span>
              {item.badge && <span className="bottom-badge">{item.badge}</span>}
            </Link>
          )
        })}
      </nav>

      <PWAInstallPrompt />
    </div>
  )
}
