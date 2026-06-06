import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { amount, cardDetails } = await request.json()

  const response = await fetch('https://api.paystack.co/transaction/charge', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount * 100,
      email: user.email,
      card: cardDetails,
      metadata: { user_id: user.id }
    })
  })

  const data = await response.json()
  return NextResponse.json(data)
}