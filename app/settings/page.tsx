// app/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  FaArrowLeft, FaUser, FaLock, FaBell, FaPalette,
  FaTrash, FaEye, FaEyeSlash, FaSave, FaSignOutAlt,
  FaShieldAlt, FaMoon, FaSun
} from 'react-icons/fa'

const supabase = createClient()

// ✅ Extend the Profile type to include your new DB columns
interface ExtendedProfile {
  id?: string
  username?: string
  full_name?: string
  bio?: string
  country?: string
  phone_number?: string
  email?: string
  [key: string]: any
}

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()

  // Cast profile to our extended type
  const p = profile as ExtendedProfile | null

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance' | 'danger'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Profile state
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')

  // Populate state when profile loads
  useEffect(() => {
    if (p) {
      setUsername(p.username || '')
      setFullName(p.full_name || '')
      setBio(p.bio || '')
      setCountry(p.country || '')
      setPhone(p.phone_number || '')
    }
  }, [p])

  // Security state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // Appearance
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const handleSaveProfile = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          full_name: fullName,
          bio,
          country,
          phone_number: phone,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profile updated successfully!')
      await refreshProfile()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      toast.success('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete your account and all data. This cannot be undone. Are you sure?'
    )
    if (!confirmed) return

    const doubleConfirm = window.confirm(
      '🚨 FINAL WARNING: All your SPY balance, NFTs, and history will be lost forever. Delete account?'
    )
    if (!doubleConfirm) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        toast.success('Account deleted')
        await supabase.auth.signOut()
        router.push('/')
      } else {
        toast.error('Failed to delete account')
      }
    } catch (error) {
      toast.error('Failed to delete account')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'security', label: 'Security', icon: FaLock },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'appearance', label: 'Appearance', icon: FaPalette },
    { id: 'danger', label: 'Danger Zone', icon: FaTrash },
  ]

  return (
    <div className="settings-page">
      <Link href="/dashboard" className="settings-back">
        <FaArrowLeft /> Back to Dashboard
      </Link>

      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account preferences</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar Tabs */}
        <div className="settings-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'danger' ? 'danger' : ''}`}
              >
                <Icon /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
              <h2>Profile Information</h2>
              <p className="settings-subtitle">Update your personal details</p>

              <div className="settings-field">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="settings-input"
                />
              </div>

              <div className="settings-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="settings-input"
                />
              </div>

              <div className="settings-field">
                <label>Email (read-only)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="settings-input disabled"
                />
              </div>

              <div className="settings-field">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="settings-input"
                  placeholder="Tell us about yourself..."
                  maxLength={200}
                />
                <span className="settings-hint">{bio.length}/200</span>
              </div>

              <div className="settings-row">
                <div className="settings-field">
                  <label>Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="settings-input"
                  />
                </div>
                <div className="settings-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="settings-input"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="settings-btn primary"
              >
                <FaSave /> {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
              <h2>Security</h2>
              <p className="settings-subtitle">Protect your account</p>

              <div className="settings-field">
                <label>New Password</label>
                <div className="settings-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="settings-input"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="settings-password-toggle"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="settings-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="settings-input"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="settings-btn primary"
              >
                <FaShieldAlt /> {isLoading ? 'Updating...' : 'Update Password'}
              </button>

              <div className="settings-divider" />

              <div className="settings-info-box">
                <h3>Active Sessions</h3>
                <p>You are currently signed in on this device.</p>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/login')
                  }}
                  className="settings-btn secondary"
                >
                  <FaSignOutAlt /> Sign Out
                </button>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
              <h2>Notifications</h2>
              <p className="settings-subtitle">Choose what updates you receive</p>

              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Email Notifications</p>
                  <p className="settings-toggle-desc">Get updates about earnings and withdrawals</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`settings-toggle ${emailNotifications ? 'active' : ''}`}
                >
                  <span className="settings-toggle-thumb" />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Push Notifications</p>
                  <p className="settings-toggle-desc">Browser push alerts for rewards</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`settings-toggle ${pushNotifications ? 'active' : ''}`}
                >
                  <span className="settings-toggle-thumb" />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Marketing Emails</p>
                  <p className="settings-toggle-desc">Promotions, new features, and offers</p>
                </div>
                <button
                  onClick={() => setMarketingEmails(!marketingEmails)}
                  className={`settings-toggle ${marketingEmails ? 'active' : ''}`}
                >
                  <span className="settings-toggle-thumb" />
                </button>
              </div>

              <button
                onClick={() => toast.success('Notification preferences saved!')}
                className="settings-btn primary"
              >
                <FaSave /> Save Preferences
              </button>
            </motion.div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
              <h2>Appearance</h2>
              <p className="settings-subtitle">Customize how Supay looks</p>

              <div className="settings-theme-grid">
                <button
                  onClick={() => {
                    setTheme('dark')
                    document.documentElement.setAttribute('data-theme', 'dark')
                    localStorage.setItem('theme', 'dark')
                  }}
                  className={`settings-theme ${theme === 'dark' ? 'active' : ''}`}
                >
                  <div className="settings-theme-preview dark">
                    <FaMoon />
                  </div>
                  <span>Dark Mode</span>
                </button>

                <button
                  onClick={() => {
                    setTheme('light')
                    document.documentElement.setAttribute('data-theme', 'light')
                    localStorage.setItem('theme', 'light')
                  }}
                  className={`settings-theme ${theme === 'light' ? 'active' : ''}`}
                >
                  <div className="settings-theme-preview light">
                    <FaSun />
                  </div>
                  <span>Light Mode</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
              <h2>Danger Zone</h2>
              <p className="settings-subtitle">Irreversible actions</p>

              <div className="settings-danger-box">
                <div className="settings-danger-icon">
                  <FaTrash />
                </div>
                <div className="settings-danger-content">
                  <h3>Delete Account</h3>
                  <p>
                    Once deleted, your account, SPY balance, NFTs, and transaction history
                    will be permanently removed. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="settings-btn danger"
                  >
                    <FaTrash /> {isLoading ? 'Deleting...' : 'Delete My Account'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
