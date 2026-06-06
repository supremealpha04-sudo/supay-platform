// components/ui/Skeleton.tsx
'use client'

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-navy-700 rounded ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-5">
      <Skeleton className="w-3/4 h-6 mb-3" />
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-1/2 h-4" />
    </div>
  )
}
