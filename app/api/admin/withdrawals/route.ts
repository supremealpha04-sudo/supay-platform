import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookies().get(name)?.value },
        set(name: string, value: string, options: any) { cookies().set({ name, value, ...options }) },
        remove(name: string, options: any) { cookies().set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })

  return NextResponse.json({ withdrawals })
}

export async function PUT(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookies().get(name)?.value },
        set(name: string, value: string, options: any) { cookies().set({ name, value, ...options }) },
        remove(name: string, options: any) { cookies().set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { withdrawalId, status, txHash } = await request.json()

  await supabase
    .from('withdrawals')
    .update({
      status,
      processed_at: new Date().toISOString(),
      processed_by: user.id,
      tx_hash: txHash
    })
    .eq('id', withdrawalId)

  if (status === 'rejected') {
    const { data: withdrawal } = await supabase
      .from('withdrawals')
      .select('amount_spy, user_id')
      .eq('id', withdrawalId)
      .single()

    if (withdrawal) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('spy_balance')
        .eq('id', withdrawal.user_id)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ spy_balance: (profile.spy_balance || 0) + withdrawal.amount_spy })
          .eq('id', withdrawal.user_id)
      }
    }
  }

  return NextResponse.json({ success: true })
}