// components/shared/ConfirmationDialog.tsx
'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmationDialogProps) {
  const variantColors = {
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`} />
          <p className="text-gray-300">{message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={onClose} variant="outline" fullWidth>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} fullWidth className={variantColors[variant]}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
