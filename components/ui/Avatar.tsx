// components/ui/Avatar.tsx
'use client'

import { User } from 'lucide-react'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={`rounded-full object-cover ${sizes[size]} ${className}`}
      />
    )
  }

  return (
    <div className={`rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center ${sizes[size]} ${className}`}>
      <User className="w-1/2 h-1/2 text-white" />
    </div>
  )
}
