// app/privacy/page.tsx
'use client'

import Link from 'next/link'
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa'

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <Link href="/" className="legal-back">
        <FaArrowLeft /> Back to Home
      </Link>

      <div className="legal-header">
        <FaShieldAlt className="legal-icon" />
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: January 2026</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to Supay ("we," "our," or "us"). We are committed to protecting your privacy
            and handling your personal information with care. This Privacy Policy explains how
            we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li>Account information (username, email, password)</li>
            <li>Profile details (country, bio, phone number - optional)</li>
            <li>Payment information for deposits and withdrawals</li>
            <li>Cryptocurrency wallet addresses</li>
            <li>Communication with our support team</li>
          </ul>

          <h3>2.2 Information Automatically Collected</h3>
          <ul>
            <li>Device information (browser, operating system, IP address)</li>
            <li>Usage data (pages visited, ads watched, tasks completed)</li>
            <li>Location data (country level)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3>2.3 Information from Third Parties</h3>
          <ul>
            <li>Ad networks (Adsterra, Monetag) - for ad delivery</li>
            <li>Payment processors - for transaction verification</li>
            <li>Blockchain networks - for crypto transactions</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related notices</li>
            <li>Detect, prevent, and address fraud and abuse</li>
            <li>Personalize your experience</li>
            <li>Send promotional communications (with consent)</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>4. How We Share Your Information</h2>
          <p>We do NOT sell your personal information. We may share data with:</p>
          <ul>
            <li><strong>Ad Partners:</strong> Adsterra and Monetag receive non-personal data for ad delivery</li>
            <li><strong>Payment Processors:</strong> To process deposits and withdrawals</li>
            <li><strong>Service Providers:</strong> For hosting, analytics, and customer support</li>
            <li><strong>Legal Authorities:</strong> When required by law</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures including encryption, secure
            authentication, and regular security audits. However, no system is 100% secure,
            and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing</li>
            <li>Export your data</li>
            <li>Withdraw consent</li>
          </ul>
          <p>
            To exercise these rights, contact us at <strong>privacy@supay.app</strong>
          </p>
        </section>

        <section>
          <h2>7. Children's Privacy</h2>
          <p>
            Supay is not intended for users under 18 years of age. We do not knowingly
            collect data from minors. If you believe we have data from a minor, please
            contact us immediately.
          </p>
        </section>

        <section>
          <h2>8. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries outside your
            residence. We ensure appropriate safeguards are in place for such transfers.
          </p>
        </section>

        <section>
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of
            material changes via email or platform notification.
          </p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>For privacy-related questions:</p>
          <ul>
            <li>Email: <strong>privacy@supay.app</strong></li>
            <li>Address: Supay HQ, Lagos, Nigeria</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
