// app/cookies/page.tsx
'use client'

import Link from 'next/link'
import { FaArrowLeft, FaCookieBite } from 'react-icons/fa'

export default function CookiesPage() {
  return (
    <div className="legal-page">
      <Link href="/" className="legal-back">
        <FaArrowLeft /> Back to Home
      </Link>

      <div className="legal-header">
        <FaCookieBite className="legal-icon" />
        <h1>Cookie Policy</h1>
        <p className="legal-updated">Last updated: January 2026</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit websites.
            They help us recognize your browser, remember your preferences, and improve
            your experience.
          </p>
        </section>

        <section>
          <h2>2. Types of Cookies We Use</h2>

          <h3>2.1 Essential Cookies</h3>
          <p>
            Required for the platform to function. These include authentication cookies
            and session management. <strong>Cannot be disabled</strong>.
          </p>

          <h3>2.2 Analytics Cookies</h3>
          <p>
            Help us understand how users interact with the platform (page views, ad
            watches, time spent). Data is anonymized.
          </p>

          <h3>2.3 Advertising Cookies</h3>
          <p>
            Used by Adsterra and Monetag to deliver relevant ads and track ad impressions.
            These are essential for our earning model.
          </p>

          <h3>2.4 Preference Cookies</h3>
          <p>
            Remember your settings like dark/light mode, language, and notification
            preferences.
          </p>
        </section>

        <section>
          <h2>3. Third-Party Cookies</h2>
          <p>We work with these third parties who may set cookies:</p>
          <ul>
            <li><strong>Supabase</strong> - Authentication and database</li>
            <li><strong>Adsterra</strong> - Ad delivery and tracking</li>
            <li><strong>Monetag</strong> - Ad delivery</li>
            <li><strong>Vercel</strong> - Hosting and analytics</li>
          </ul>
        </section>

        <section>
          <h2>4. Managing Cookies</h2>
          <p>You can control cookies through:</p>
          <ul>
            <li>Browser settings (Chrome, Safari, Firefox, etc.)</li>
            <li>Our cookie consent banner (where applicable)</li>
            <li>Opt-out tools like <a href="https://optout.aboutads.info" target="_blank" rel="noopener">DAA Opt-Out</a></li>
          </ul>
          <p>
            <strong>Note:</strong> Disabling essential or advertising cookies may prevent
            you from earning SPY on the platform.
          </p>
        </section>

        <section>
          <h2>5. Cookie Duration</h2>
          <ul>
            <li><strong>Session Cookies:</strong> Deleted when you close the browser</li>
            <li><strong>Persistent Cookies:</strong> Remain for up to 1 year</li>
          </ul>
        </section>

        <section>
          <h2>6. Data We Store</h2>
          <p>Through cookies, we may store:</p>
          <ul>
            <li>User session tokens</li>
            <li>Preferences (theme, language)</li>
            <li>Ad viewing history</li>
            <li>Click tracking for revenue attribution</li>
            <li>Fraud detection signals</li>
          </ul>
        </section>

        <section>
          <h2>7. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy as our practices change. We'll notify you
            of significant changes.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            Cookie-related questions: <strong>privacy@supay.app</strong>
          </p>
        </section>
      </div>
    </div>
  )
}
