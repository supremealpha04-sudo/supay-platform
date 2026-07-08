'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaHome, FaCoins, FaTasks, FaWallet, FaSignOutAlt } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import './lay.css'

export default function DashboardSidebar({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FaHome },
    { href: '/dashboard/earn', label: 'Earn', icon: FaCoins },
    { href: '/dashboard/tasks', label: 'Tasks', icon: FaTasks },
    { href: '/dashboard/wallet', label: 'Wallet', icon: FaWallet },
  ]

  return (
    <aside className="sidebar-aside">
      <div className="sidebar-inner">
        <div className="sidebar-brand">
          <span className="brand-text">Supay</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </Link>
            )
          })}

          <button onClick={signOut} className="nav-link logout">
            <FaSignOutAlt className="nav-icon" />
            <span className="nav-label">Logout</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}
