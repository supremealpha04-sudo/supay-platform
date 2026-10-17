// app/terms/page.tsx
'use client'

import Link from 'next/link'
import { FaArrowLeft, FaFileContract } from 'react-icons/fa'

export default function TermsPage() {
  return (
    <div className="legal-page">
      <Link href="/" className="legal-back">
        <FaArrowLeft /> Back to Home
      </Link>

      <div className="legal-header">
        <FaFileContract className="legal-icon" />
        <h1>Terms & Conditions</h1>
        <p className="legal-updated">Last updated: January 2026</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Supay ("the Platform"), you agree to be bound by these
            Terms & Conditions. If you do not agree, you must not use the Platform.
          </p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>To use Supay, you must:</p>
          <ul>
            <li>Be at least 18 years old</li>
            <li>Have the legal capacity to enter into contracts</li>
            <li>Not be prohibited from using our services under any applicable law</li>
            <li>Provide accurate registration information</li>
          </ul>
        </section>

        <section>
          <h2>3. Account Registration</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account
            credentials. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information</li>
            <li>Not share your account with others</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be responsible for all activities under your account</li>
          </ul>
        </section>

        <section>
          <h2>4. Earning SPY</h2>
          <p>
            Users can earn SPY tokens by watching ads, completing tasks, referring friends,
            and staking NFTs. All earning activities are subject to:
          </p>
          <ul>
            <li>Daily limits as displayed on the platform</li>
            <li>Fraud detection and verification</li>
            <li>Fair use policies</li>
            <li>Availability of ad inventory</li>
          </ul>
        </section>

        <section>
          <h2>5. Prohibited Activities</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>Use bots, automation, or scripts to earn SPY</li>
            <li>Create multiple accounts to abuse the system</li>
            <li>Use VPNs or proxies to circumvent restrictions</li>
            <li>Engage in fraudulent activity or chargebacks</li>
            <li>Attempt to hack or exploit the platform</li>
            <li>Reverse engineer or copy our technology</li>
            <li>Share referral codes for compensation</li>
            <li>Manipulate ad impressions</li>
          </ul>
        </section>

        <section>
          <h2>6. Rewards & Withdrawals</h2>
          <ul>
            <li>Minimum withdrawal: $2 USD equivalent (200 SPY)</li>
            <li>Withdrawal fee: 2% of the transaction amount</li>
            <li>Processing time: 1-4 hours for USDT (BEP-20)</li>
            <li>All withdrawals are subject to verification</li>
            <li>Withdrawals must be to a valid BEP-20 wallet address</li>
            <li>Once crypto is sent, transactions are irreversible</li>
          </ul>
        </section>

        <section>
          <h2>7. NFTs and Digital Assets</h2>
          <ul>
            <li>NFTs are digital collectibles with no inherent monetary value guaranteed</li>
            <li>NFT purchases are final and non-refundable</li>
            <li>Staking rewards are subject to platform terms</li>
            <li>Revenue share (10% for 15 years) is subject to platform earnings</li>
            <li>We reserve the right to modify NFT rules with notice</li>
          </ul>
        </section>

        <section>
          <h2>8. Intellectual Property</h2>
          <p>
            All content on Supay (logos, design, code, marketing materials) is owned by
            us and protected by copyright laws. You may not use our intellectual property
            without written permission.
          </p>
        </section>

        <section>
          <h2>9. Account Suspension & Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms,
            show signs of fraud, or engage in suspicious activity. Users will be notified
            where possible, but immediate termination may occur for severe violations.
          </p>
        </section>

        <section>
          <h2>10. Limitation of Liability</h2>
          <p>
            Supay is provided "as is" without warranties. We are not liable for:
          </p>
          <ul>
            <li>Loss of crypto due to user error</li>
            <li>Ad network failures</li>
            <li>Third-party service disruptions</li>
            <li>Any indirect or consequential damages</li>
            <li>Changes in token value</li>
          </ul>
        </section>

        <section>
          <h2>11. Refund Policy</h2>
          <p>
            All transactions for SPY purchases, NFTs, and premium subscriptions are final
            and non-refundable. Withdrawals once processed cannot be reversed.
          </p>
        </section>

        <section>
          <h2>12. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Nigeria. Any disputes shall be resolved
            through arbitration in Lagos, Nigeria.
          </p>
        </section>

        <section>
          <h2>13. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. Continued use of the platform after
            changes means you accept the new terms. We recommend checking this page
            periodically.
          </p>
        </section>

        <section>
          <h2>14. Contact</h2>
          <p>
            For questions about these Terms: <strong>legal@supay.app</strong>
          </p>
        </section>
      </div>
    </div>
  )
}
