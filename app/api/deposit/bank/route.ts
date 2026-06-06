import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { amount, bankDetails } = await request.json()

  const amountNGN = amount * 1500
  const spyAmount = amount * 100
  const depositId = crypto.randomUUID()
  const unlockDate = new Date()
  unlockDate.setDate(unlockDate.getDate() + 30)

  await supabase.from('deposits').insert({
    id: depositId,
    user_id: user.id,
    amount_usd: amount,
    amount_ngn: amountNGN,
    spy_expected: spyAmount,
    method: 'bank',
    bank_details: bankDetails,
    unlock_date: unlockDate.toISOString(),
    status: 'pending'
  })

  return NextResponse.json({
    success: true,
    reference: depositId,
    instructions: {
      bank_name: 'GTBank',
      account_number: '0123456789',
      account_name: 'Supay Limited',
      amount: amountNGN
    }
  })
}