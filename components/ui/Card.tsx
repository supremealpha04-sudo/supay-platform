// components/ui/Card.tsx
'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
}

export function Card({ children, className = '', hover = false, glass = true }: CardProps) {
  return (
    <div
      className={`
        ${glass ? 'glass rounded-xl' : 'bg-navy-800 rounded-xl'}
        p-5 border border-primary-500/20
        ${hover ? 'transition-all duration-300 hover:border-accent-500/50 hover:scale-[1.02]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
