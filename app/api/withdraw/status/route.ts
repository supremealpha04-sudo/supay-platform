import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const withdrawalId = searchParams.get('id')

  const { data: withdrawal } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .single()

  return NextResponse.json({ withdrawal })
}
