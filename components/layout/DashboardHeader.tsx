'use client'

import { FaBars, FaBell, FaUserCircle } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import './lay.css'

export default function DashboardHeader({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const { profile } = useAuth()

  return (
    <header className="dash-header">
      <div className="header-inner">
        <button
          onClick={() => setSidebarOpen(true)}
          className="mobile-menu-btn"
        >
          <FaBars className="menu-icon" />
        </button>

        <div className="header-right">
          <button className="icon-btn">
            <FaBell className="bell-icon" />
            <span className="notification-dot" />
          </button>

          <div className="user-pill">
            <div className="user-avatar">
              <FaUserCircle className="avatar-icon" />
            </div>
            <div className="user-info">
              <div className="user-name">{profile?.username || 'User'}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
