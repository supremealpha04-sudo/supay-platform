'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#0A1229',
              color: '#fff',
              border: '1px solid #2342B5',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}