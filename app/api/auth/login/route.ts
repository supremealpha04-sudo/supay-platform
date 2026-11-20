import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rateLimit'

export async function POST(request: Request) {
  // 10 login attempts per 15 min per IP
  const limited = await rateLimit(request, 'auth', 10, 900)
  if (limited) return limited

  const supabase = createServerSupabaseClient()
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    const code = (error as any).code
    const map: Record<string, string> = {
      invalid_credentials: 'Wrong email or password.',
      email_not_confirmed: 'Please confirm your email before signing in.',
      over_request_rate_limit: 'Too many attempts. Please wait a few minutes.',
    }
    return NextResponse.json(
      { error: map[code] || error.message, code },
      { status: code === 'over_request_rate_limit' ? 429 : 401 }
    )
  }

  return NextResponse.json({ user: data.user, session: data.session })
}
