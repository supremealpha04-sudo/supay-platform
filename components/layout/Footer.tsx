// components/layout/Footer.tsx
'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-primary-500/20 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-3">Supay</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              <li><Link href="/press" className="hover:text-white">Press</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/community" className="hover:text-white">Community</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              <li><Link href="/cookies" className="hover:text-white">Cookies</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="mailto:support@supay.com" className="hover:text-white">support@supay.com</a></li>
              <li><a href="https://twitter.com/supay" className="hover:text-white">Twitter</a></li>
              <li><a href="https://t.me/supay" className="hover:text-white">Telegram</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-primary-500/20 text-center text-sm text-gray-500">
          © 2026 Supay. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
