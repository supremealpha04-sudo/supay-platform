'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FaArrowLeft, FaSave } from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'
import './tasks.css'

const supabase = createClient()

export default function CreateTaskPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward_spy: 10,
    task_url: '',
    task_type: 'link',
    required_time_seconds: 60,
    max_completions: 1000,
    expires_at: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a task title')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description')
      return
    }
    if (!formData.task_url.trim()) {
      toast.error('Please enter a task URL')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          reward_spy: Number(formData.reward_spy),
          task_url: formData.task_url.trim(),
          task_type: formData.task_type,
          required_time_seconds: Number(formData.required_time_seconds),
          max_completions: Number(formData.max_completions),
          expires_at: formData.expires_at || null,
          is_active: true,
          total_completions: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        toast.error(error.message || 'Failed to create task')
        return
      }

      console.log('Task created:', data)
      toast.success('Task created successfully! 🎉')
      
      // Wait a moment then redirect
      setTimeout(() => {
        router.push('/admin/tasks')
      }, 500)
      
    } catch (err) {
      console.error('Error creating task:', err)
      toast.error('Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-task-form-page">
      {/* Header */}
      <div className="admin-task-form-header">
        <Link href="/admin/tasks" className="admin-task-form-back-btn">
          <FaArrowLeft />
        </Link>
        <div className="admin-task-form-title-group">
          <h1 className="admin-task-form-title">Create Task</h1>
          <p className="admin-task-form-subtitle">Add a new earning task for users</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="admin-task-form-card">
        <div className="admin-task-form-grid">
          
          {/* Title */}
          <div className="admin-task-form-field">
            <label className="admin-task-form-label">Task Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Follow us on Twitter"
              className="admin-task-form-input"
              required
            />
          </div>

          {/* Task Type */}
          <div className="admin-task-form-field">
            <label className="admin-task-form-label">Task Type</label>
            <select
              value={formData.task_type}
              onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
              className="admin-task-form-select"
            >
              <option value="link">Link Visit</option>
              <option value="survey">Survey</option>
              <option value="video">Video Watch</option>
              <option value="install">App Install</option>
              <option value="social">Social Follow</option>
            </select>
          </div>

          {/* Reward */}
          <div className="admin-task-form-field">
            <label className="admin-task-form-label">Reward (SPY)</label>
            <input
              type="number"
              value={formData.reward_spy}
              onChange={(e) => setFormData({ ...formData, reward_spy: Number(e.target.value) })}
              className="admin-task-form-input"
              required
              min={1}
            />
            <span className="admin-task-form-hint">Amount users will earn</span>
          </div>

          {/* Required Time */}
          <div className="admin-task-form-field">
            <label className="admin-task-form-label">Required Time (seconds)</label>
            <input
              type="number"
              value={formData.required_time_seconds}
              onChange={(e) => setFormData({ ...formData, required_time_seconds: Number(e.target.value) })}
              className="admin-task-form-input"
              min={10}
            />
            <span className="admin-task-form-hint">How long users must wait</span>
          </div>

          {/* Max Completions */}
          <div className="admin-task-form-field">
            <label className="admin-task-form-label">Max Completions</label>
            <input
              type="number"
              value={formData.max_completions}
              onChange={(e) => setFormData({ ...formData, max_completions: Number(e.target.value) })}
              className="admin-task-form-input"
              min={1}
            />
            <span className="admin-task-form-hint">Total users who can complete</span>
          </div>

          {/* Expires At */}
          <div className="admin-task-form-field">
            <label className="admin-task-form-label">Expires At (Optional)</label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="admin-task-form-input"
            />
            <span className="admin-task-form-hint">Leave empty for no expiry</span>
          </div>

          {/* Description */}
          <div className="admin-task-form-field full-width">
            <label className="admin-task-form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Explain what the user needs to do"
              className="admin-task-form-textarea"
              required
            />
          </div>

          {/* Task URL */}
          <div className="admin-task-form-field full-width">
            <label className="admin-task-form-label">Task URL</label>
            <input
              type="url"
              value={formData.task_url}
              onChange={(e) => setFormData({ ...formData, task_url: e.target.value })}
              placeholder="https://example.com/task"
              className="admin-task-form-input"
              required
            />
            <span className="admin-task-form-hint">Where users will be redirected</span>
          </div>

        </div>

        {/* Actions */}
        <div className="admin-task-form-actions">
          <button
            type="submit"
            disabled={isLoading}
            className="admin-task-form-btn submit"
          >
            <FaSave /> {isLoading ? 'Creating...' : 'Create Task'}
          </button>
          <Link href="/admin/tasks" className="admin-task-form-btn cancel">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
