'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar,
  Edit3, Camera, Shield, CheckCircle, Save
} from 'lucide-react'
import './profile.css'

const supabase = createClient()

export default function ProfilePage() {
  const { profile, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    country: '',
    bio: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        country: profile.country || '',
        bio: profile.bio || ''
      })
      setLoading(false)
    }
  }, [profile])

  async function handleSave() {
    if (!user?.id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name,
          phone: formData.phone,
          country: formData.country,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (!error) {
        setEditMode(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const userName = profile?.full_name || profile?.username || 'User'
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (loading) return <div className="profile-loading"><div className="spinner"/><p>Loading profile...</p></div>

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header-bar">
        <Link href="/dashboard" className="back-btn">
          <ArrowLeft size={18} />
          Back
        </Link>
        <h1>My Profile</h1>
        <button 
          className="edit-btn"
          onClick={() => editMode ? handleSave() : setEditMode(true)}
        >
          {editMode ? <Save size={16} /> : <Edit3 size={16} />}
          {editMode ? (saving ? 'Saving...' : 'Save') : 'Edit'}
        </button>
      </div>

      {/* Avatar Section */}
      <div className="avatar-section">
        <div className="avatar-large">
          {initials}
          <button className="camera-btn">
            <Camera size={14} />
          </button>
        </div>
        <h2>{userName}</h2>
        <p className="user-role">
          <Shield size={12} />
          Verified Member
        </p>
      </div>

      {/* Profile Form */}
      <div className="profile-form">
        <div className="form-group">
          <label><User size={14} /> Username</label>
          {editMode ? (
            <input 
              type="text" 
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              placeholder="Enter username"
            />
          ) : (
            <div className="form-value">{formData.username || 'Not set'}</div>
          )}
        </div>

        <div className="form-group">
          <label><User size={14} /> Full Name</label>
          {editMode ? (
            <input 
              type="text" 
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              placeholder="Enter full name"
            />
          ) : (
            <div className="form-value">{formData.full_name || 'Not set'}</div>
          )}
        </div>

        <div className="form-group">
          <label><Mail size={14} /> Email</label>
          <div className="form-value email">
            {formData.email}
            <CheckCircle size={14} className="verified" />
          </div>
        </div>

        <div className="form-group">
          <label><Phone size={14} /> Phone</label>
          {editMode ? (
            <input 
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          ) : (
            <div className="form-value">{formData.phone || 'Not set'}</div>
          )}
        </div>

        <div className="form-group">
          <label><MapPin size={14} /> Country</label>
          {editMode ? (
            <input 
              type="text" 
              value={formData.country}
              onChange={e => setFormData({...formData, country: e.target.value})}
              placeholder="Enter country"
            />
          ) : (
            <div className="form-value">{formData.country || 'Not set'}</div>
          )}
        </div>

        <div className="form-group">
          <label><Calendar size={14} /> Bio</label>
          {editMode ? (
            <textarea 
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell us about yourself"
              rows={3}
            />
          ) : (
            <div className="form-value bio">{formData.bio || 'No bio yet'}</div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="profile-stats">
        <div className="p-stat">
          <span className="p-stat-num">{profile?.total_earned_usd?.toFixed(2) || '0.00'}</span>
          <span className="p-stat-label">Total Earned ($)</span>
        </div>
        <div className="p-stat">
          <span className="p-stat-num">{profile?.referral_count || 0}</span>
          <span className="p-stat-label">Referrals</span>
        </div>
        <div className="p-stat">
          <span className="p-stat-num">{profile?.spy_balance || 0}</span>
          <span className="p-stat-label">SPY Balance</span>
        </div>
        <div className="p-stat">
          <span className="p-stat-num">{profile?.daily_bonus_streak || 0}</span>
          <span className="p-stat-label">Day Streak</span>
        </div>
      </div>
    </div>
  )
}
