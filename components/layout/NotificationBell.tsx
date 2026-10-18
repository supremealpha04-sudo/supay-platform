// components/layout/NotificationBell.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createClient()

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20) // Fetch last 20

      if (!error && data) {
        setNotifications(data)
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial Fetch & Real-time Subscription
  useEffect(() => {
    if (!user?.id) return
    
    fetchNotifications()

    // Subscribe to new notifications (Real-time)
    const channel = supabase
      .channel('schema-db-changes')
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
          toast(payload.new.title, { icon: '🔔' })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark single as read
  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (unreadCount === 0) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id).eq('is_read', false)
    toast.success('All marked as read')
  }

  // Clear all
  const clearAll = async () => {
    setNotifications([])
    await supabase.from('notifications').delete().eq('user_id', user?.id)
    toast.success('Notifications cleared')
  }

  // Delete single
  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }

  // Format time
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-white/10 transition relative"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-navy-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-navy-800 border border-primary-500/20 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary-500/10">
              <h3 className="text-white font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-primary-400 hover:text-white transition"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={clearAll}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 text-gray-600" />
                  <p className="text-gray-400 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={`relative p-4 border-b border-primary-500/5 hover:bg-white/5 transition cursor-pointer flex gap-3 ${
                        !notif.is_read ? 'bg-primary-500/5' : ''
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notif.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
                      )}
                      
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.is_read ? 'text-white font-semibold' : 'text-gray-300'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                      
                      <button
                        onClick={(e) => deleteNotification(e, notif.id)}
                        className="text-gray-500 hover:text-red-400 h-fit"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
