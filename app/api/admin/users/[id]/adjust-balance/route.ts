import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminCheck } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { amount, reason } = await request.json()
  const { data: targetUser } = await supabase.from('profiles').select('spy_balance').eq('id', params.id).single()
  const newBalance = (targetUser?.spy_balance || 0) + amount

  await supabase.from('profiles').update({ spy_balance: newBalance }).eq('id', params.id)
  await supabase.from('transactions').insert({
    user_id: params.id,
    type: 'admin_adjustment',
    amount_spy: amount,
    balance_before: targetUser?.spy_balance || 0,
    balance_after: newBalance,
    metadata: { reason, admin_id: user.id }
  })

  return NextResponse.json({ success: true, new_balance: newBalance })
}