import { NextResponse } from 'next/server'

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(
  request: Request,
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  const ip = request.headers.get('x-forwarded-for') || identifier
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (record) {
    if (now > record.resetTime) {
      // Reset window
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
      return null
    }
    
    if (record.count >= maxRequests) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
        },
      })
    }
    
    record.count++
    rateLimitMap.set(ip, record)
  } else {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
  }

  return null
}