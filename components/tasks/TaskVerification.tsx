// components/tasks/TaskVerification.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

interface TaskVerificationProps {
  isOpen: boolean
  onClose: () => void
  taskTitle: string
  taskUrl: string
  onVerify: (screenshot?: File) => void
}

export function TaskVerification({ isOpen, onClose, taskTitle, taskUrl, onVerify }: TaskVerificationProps) {
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = async () => {
    setIsLoading(true)
    await onVerify(screenshot || undefined)
    setIsLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Complete: ${taskTitle}`}>
      <div className="space-y-5">
        <div className="bg-navy-800 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-2">Task Instructions</p>
          <ol className="text-sm text-white space-y-2 list-decimal list-inside">
            <li>Click the button below to open the task</li>
            <li>Complete the required action</li>
            <li>Take a screenshot of completion</li>
            <li>Upload screenshot below</li>
          </ol>
        </div>

        <a
          href={taskUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 bg-primary-500 text-white rounded-xl text-center block hover:bg-primary-600 transition"
        >
          Open Task
        </a>

        <div className="border-2 border-dashed border-primary-500/30 rounded-xl p-6 text-center">
          <input
            type="file"
            id="screenshot"
            accept="image/*"
            className="hidden"
            onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
          />
          <label htmlFor="screenshot" className="cursor-pointer">
            <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {screenshot ? screenshot.name : 'Click to upload screenshot'}
            </p>
          </label>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" fullWidth>
            Cancel
          </Button>
          <Button onClick={handleVerify} isLoading={isLoading} fullWidth>
            Submit for Verification
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Verification may take up to 5 minutes
        </p>
      </div>
    </Modal>
  )
}
