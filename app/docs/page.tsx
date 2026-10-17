
'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FaArrowLeft, FaBook, FaCoins, FaWallet, FaGem,
  FaShieldAlt, FaQuestionCircle, FaChevronDown, FaChevronRight,
  FaRocket, FaUsers, FaChartLine
} from 'react-icons/fa'

const DOC_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: FaRocket,
    items: [
      {
        title: 'Create Your Account',
        content: 'Sign up with your email, choose a username, and verify your account. You must be 18+ to use Supay.'
      },
      {
        title: 'Complete Your Profile',
        content: 'Add your country, bio, and phone number to unlock full platform features and faster withdrawals.'
      },
      {
        title: 'Start Earning',
        content: 'Navigate to the Earn section to watch ads, complete tasks, or refer friends to start earning SPY tokens.'
      },
    ],
  },
  {
    id: 'earning',
    title: 'How to Earn SPY',
    icon: FaCoins,
    items: [
      {
        title: 'Watch Ads',
        content: 'Click "Watch Ad", open the ad link, and keep it open for 20 seconds. Earn 0.05 SPY per ad (up to 20 ads daily).'
      },
      {
        title: 'Complete Tasks',
        content: 'Daily tasks range from social media engagement to app signups. Each task rewards varying amounts of SPY.'
      },
      {
        title: 'Refer Friends',
        content: 'Share your referral code. Earn 10% commission from every ad your referrals watch - forever!'
      },
      {
        title: 'Stake NFTs',
        content: 'Own Supremeamer NFTs? Stake them to earn 4-8% APY. Higher tiers earn more daily rewards.'
      },
    ],
  },
  {
    id: 'wallet',
    title: 'Wallet & Withdrawals',
    icon: FaWallet,
    items: [
      {
        title: 'Minimum Withdrawal',
        content: 'You need at least 200 SPY ($2 USD) to withdraw. The fee is 2% of your withdrawal amount.'
      },
      {
        title: 'Withdrawal Process',
        content: 'Withdrawals are processed to your BEP-20 (BNB Chain) USDT wallet within 1-4 hours. Ensure your address is correct.'
      },
      {
        title: 'Withdrawal Limits',
        content: 'Maximum withdrawal is 500,000 SPY per day. If you need higher limits, contact support.'
      },
    ],
  },
  {
    id: 'nft',
    title: 'Supremeamer NFTs',
    icon: FaGem,
    items: [
      {
        title: 'NFT Tiers',
        content: 'Four tiers: Genesis (100 NFTs, $300), Legendary (400, $180), Rare (1,500, $90), Collector (3,000, $20).'
      },
      {
        title: 'Staking Rewards',
        content: 'Genesis: 8% APY, Legendary: 6%, Rare: 5%, Collector: 4%. Rewards paid in SPY daily.'
      },
      {
        title: 'Revenue Share',
        content: 'All NFT holders receive 10% of platform revenue for 15 years. Top 500 holders get an extra 3% bonus.'
      },
      {
        title: 'Marketplace',
        content: 'Buy and sell NFTs. Platform fee is 2.5% per sale. NFTs can also be used as collateral.'
      },
    ],
  },
  {
    id: 'security',
    title: 'Security & Safety',
    icon: FaShieldAlt,
    items: [
      {
        title: 'Account Security',
        content: 'Use a strong password, enable 2FA where possible, and never share your login credentials.'
      },
      {
        title: 'Anti-Fraud',
        content: 'We use advanced fraud detection including device fingerprinting, behavioral analysis, and AI pattern detection.'
      },
      {
        title: 'Phishing Protection',
        content: 'We will NEVER ask for your password or private keys. Report suspicious emails to security@supay.app'
      },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: FaQuestionCircle,
    items: [
      {
        title: 'Is Supay free to use?',
        content: 'Yes! Creating an account and earning SPY is completely free. We earn from ad revenue, you earn from watching.'
      },
      {
        title: 'How long does withdrawal take?',
        content: 'USDT withdrawals to BEP-20 addresses are processed within 1-4 hours, usually faster.'
      },
      {
        title: 'Can I have multiple accounts?',
        content: 'No. Multiple accounts violate our Terms and will result in all accounts being banned.'
      },
      {
        title: 'Do SPY tokens have real value?',
        content: 'Yes. SPY can be withdrawn as USDT (BEP-20). Current rate: 100 SPY = $1 USD equivalent.'
      },
      {
        title: 'What happens if I miss a day?',
        content: 'Your streak resets. Daily streaks boost your rewards - don\'t break the chain!'
      },
    ],
  },
]

export default function DocsPage() {
  const [openSections, setOpenSections] = useState<string[]>(['getting-started'])

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="docs-page">
      <Link href="/" className="docs-back">
        <FaArrowLeft /> Back to Home
      </Link>

      <div className="docs-header">
        <FaBook className="docs-icon" />
        <h1>Documentation</h1>
        <p>Everything you need to know about Supay</p>
      </div>

      {/* Quick Links */}
      <div className="docs-quick-links">
        <Link href="/dashboard/earn" className="docs-quick-link">
          <FaCoins /> Start Earning
        </Link>
        <Link href="/dashboard/wallet" className="docs-quick-link">
          <FaWallet /> My Wallet
        </Link>
        <Link href="/dashboard/nft" className="docs-quick-link">
          <FaGem /> Browse NFTs
        </Link>
        <Link href="/dashboard/referrals" className="docs-quick-link">
          <FaUsers /> Refer Friends
        </Link>
      </div>

      {/* Sections */}
      <div className="docs-sections">
        {DOC_SECTIONS.map((section) => {
          const Icon = section.icon
          const isOpen = openSections.includes(section.id)
          return (
            <div key={section.id} className="docs-section">
              <button
                onClick={() => toggleSection(section.id)}
                className="docs-section-header"
              >
                <div className="docs-section-title">
                  <div className="docs-section-icon">
                    <Icon />
                  </div>
                  <h2>{section.title}</h2>
                </div>
                {isOpen ? <FaChevronDown /> : <FaChevronRight />}
              </button>

              {isOpen && (
                <div className="docs-section-content">
                  {section.items.map((item, i) => (
                    <div key={i} className="docs-item">
                      <h3>{item.title}</h3>
                      <p>{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Contact Support */}
      <div className="docs-footer">
        <h3>Still need help?</h3>
        <p>Our support team is here to help</p>
        <div className="docs-footer-actions">
          <a href="mailto:support@supay.app" className="docs-btn primary">
            Email Support
          </a>
          <a href="https://t.me/supay" target="_blank" rel="noopener" className="docs-btn secondary">
            Join Telegram
          </a>
        </div>
      </div>
    </div>
  )
}
