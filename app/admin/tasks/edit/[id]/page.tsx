'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FaArrowLeft, FaSave } from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'
import '../../tasks.css'

const supabase = createClient()

export default function EditTaskPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
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

  // Fetch existing task
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (error) {
        console.error('Error fetching task:', error)
        toast.error('Task not found')
        router.push('/admin/tasks')
        return
      }

      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          reward_spy: data.reward_spy || 10,
          task_url: data.task_url || '',
          task_type: data.task_type || 'link',
          required_time_seconds: data.required_time_seconds || 60,
          max_completions: data.max_completions || 1000,
          expires_at: data.expires_at 
            ? new Date(data.expires_at).toISOString().slice(0, 16) 
            : ''
        })
      }

      setIsFetching(false)
    }

    fetchTask()
  }, [taskId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      const { error } = await supabase
        .from('tasks')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          reward_spy: Number(formData.reward_spy),
          task_url: formData.task_url.trim(),
          task_type: formData.task_type,
          required_time_seconds: Number(formData.required_time_seconds),
          max_completions: Number(formData.max_completions),
          expires_at: formData.expires_at || null
        })
        .eq('id', taskId)

      if (error) {
        console.error('Supabase error:', error)
        toast.error(error.message || 'Failed to update task')
        return
      }

      toast.success('Task updated successfully! 🎉')

      setTimeout(() => {
        router.push('/admin/tasks')
      }, 500)

    } catch (err) {
      console.error('Error updating task:', err)
      toast.error('Failed to update task')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="admin-tasks-loading">
        <div className="admin-tasks-spinner" />
      </div>
    )
  }

  return (
    <div className="admin-task-form-page">
      {/* Header */}
      <div className="admin-task-form-header">
        <Link href="/admin/tasks" className="admin-task-form-back-btn">
          <FaArrowLeft />
        </Link>
        <div className="admin-task-form-title-group">
          <h1 className="admin-task-form-title">Edit Task</h1>
          <p className="admin-task-form-subtitle">Update task details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="admin-task-form-card">
        <div className="admin-task-form-grid">
          
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

        <div className="admin-task-form-actions">
          <button
            type="submit"
            disabled={isLoading}
            className="admin-task-form-btn submit"
          >
            <FaSave /> {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin/tasks" className="admin-task-form-btn cancel">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
