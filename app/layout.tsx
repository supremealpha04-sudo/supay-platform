// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Supay - The Future of Reward Platforms',
  description: 'Earn rewards by watching ads, completing tasks, and referring friends. Withdraw in USDT or NGN.',
  keywords: 'reward platform, earn money, watch ads, complete tasks, referral program, crypto rewards',
  authors: [{ name: 'Supay' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Supay - The Future of Reward Platforms',
    description: 'Earn rewards by watching ads, completing tasks, and referring friends.',
    url: 'https://supay.com',
    siteName: 'Supay',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_NG',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" toastOptions={{
            style: { background: '#0A1229', color: '#fff', border: '1px solid #2342B5' }
          }} />
        </Providers>
      </body>
    </html>
  )
}
