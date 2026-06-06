'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase
      .from('tasks')
      .insert({
        ...formData,
        reward_spy: parseInt(formData.reward_spy.toString()),
        required_time_seconds: parseInt(formData.required_time_seconds.toString()),
        max_completions: parseInt(formData.max_completions.toString()),
        is_active: true
      })

    if (!error) {
      toast.success('Task created successfully')
      router.push('/admin/tasks')
    } else {
      toast.error('Failed to create task')
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/tasks" className="p-2 glass rounded-lg hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Task</h1>
          <p className="text-gray-400 text-sm">Add a new earning task for users</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Task Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Task Type</label>
            <select
              value={formData.task_type}
              onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
              className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
            >
              <option value="link">Link Visit</option>
              <option value="survey">Survey</option>
              <option value="video">Video Watch</option>
              <option value="install">App Install</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Reward (SPY)</label>
            <input
              type="number"
              value={formData.reward_spy}
              onChange={(e) => setFormData({ ...formData, reward_spy: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              required
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Required Time (seconds)</label>
            <input
              type="number"
              value={formData.required_time_seconds}
              onChange={(e) => setFormData({ ...formData, required_time_seconds: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              min={10}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Max Completions</label>
            <input
              type="number"
              value={formData.max_completions}
              onChange={(e) => setFormData({ ...formData, max_completions: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Expires At (Optional)</label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white resize-none"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-300 mb-2">Task URL</label>
            <input
              type="url"
              value={formData.task_url}
              onChange={(e) => setFormData({ ...formData, task_url: e.target.value })}
              placeholder="https://example.com/task"
              className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isLoading ? 'Creating...' : 'Create Task'}
          </button>
          <Link
            href="/admin/tasks"
            className="px-6 py-2 glass rounded-xl text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
