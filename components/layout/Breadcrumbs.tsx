// components/layout/Breadcrumbs.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

export function Breadcrumbs() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)

  const breadcrumbs = paths.map((path, index) => {
    const href = '/' + paths.slice(0, index + 1).join('/')
    const label = path.charAt(0).toUpperCase() + path.slice(1)
    return { href, label }
  })

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-400 mb-4">
      <Link href="/dashboard" className="hover:text-white flex items-center">
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-white">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-white">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
