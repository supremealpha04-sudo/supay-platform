import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
  const { userId, signals, score, reason } = await request.json()

  await supabase.from('fraud_reports').insert({
    user_id: user?.id || userId || null,
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: signals?.userAgent?.slice(0, 500),
    fraud_score: score.score,
    fraud_flags: score.flags,
    reason,
    signals_snapshot: {
      is_headless: signals?.isHeadless,
      has_ad_blocker: signals?.hasAdBlocker,
      is_dev_tools_open: signals?.isDevToolsOpen,
      vpn_detected: signals?.vpnDetected,
      proxy_detected: signals?.proxyDetected,
      playback_speed: signals?.playbackSpeed,
      mouse_movements: signals?.mouseMovements,
      tab_switches: signals?.tabSwitches,
      window_blurs: signals?.windowBlurs,
    },
    created_at: new Date().toISOString(),
  })

  if (user?.id && score.score >= 80) {
    const { data: history } = await supabase
      .from('fraud_reports').select('id')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if ((history?.length || 0) >= 3) {
      await supabase.from('profiles').update({
        is_banned: true,
        ban_reason: 'Auto-banned: Multiple fraud detections',
        banned_at: new Date().toISOString(),
      }).eq('id', user.id)

      await supabase.from('ban_logs').insert({
        user_id: user.id,
        reason: 'Auto-ban: 3+ fraud reports in 24h',
        auto_banned: true,
        fraud_reports_count: history?.length,
      })
    }
  }

  return NextResponse.json({ success: true })
}
