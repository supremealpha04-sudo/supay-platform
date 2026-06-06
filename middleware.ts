import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Only run middleware on specific paths
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for static files and API routes during build
  if (pathname.includes('._') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Check if Supabase environment variables exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // During build, skip authentication checks
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return NextResponse.next()
    }
  }

  const supabase = createServerClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value)
        },
        remove(name: string, options: any) {
          request.cookies.set(name, '')
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register', '/api/webhooks']
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path))

  if (!isPublicPath && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Admin only routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    try {
      const supabaseAdmin = createServerClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseKey || 'placeholder',
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              request.cookies.set(name, value)
            },
            remove(name: string, options: any) {
              request.cookies.set(name, '')
            },
          },
        }
      )

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (!profile?.is_admin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Admin check failed:', error)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}