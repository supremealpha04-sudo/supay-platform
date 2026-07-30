// app/api/ads/debug/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.ADSTERRA_API_KEY
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'not set',
    environment: process.env.NODE_ENV
  })
}