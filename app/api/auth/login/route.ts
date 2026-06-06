import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rateLimit'

export async function POST(request: Request) {
  const rateLimitResult = await rateLimit(request, 'auth', 5, 900)
  if (rateLimitResult) return rateLimitResult

  const supabase = createServerSupabaseClient()
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return NextResponse.json({ user: data.user, session: data.session })
}
