'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { FaFilter, FaDownload, FaSearch } from 'react-icons/fa'
import styles from './page.module.css'

const supabase = createClient()

export default function TransactionsPage() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchTransactions()
    }
  }, [profile, filter])

  async function fetchTransactions() {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false })
    
    if (filter !== 'all') {
      query = query.eq('type', filter)
    }
    
    const { data } = await query
    setTransactions(data || [])
    setIsLoading(false)
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Amount (SPY)', 'Balance Before', 'Balance After']
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.type,
      t.amount_spy,
      t.balance_before,
      t.balance_after
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `supay_transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeColor = (type: string) => {
    if (type.includes('reward') || type === 'deposit') return styles.typeGreen
    if (type === 'withdrawal') return styles.typeRed
    if (type === 'premium_payment') return styles.typeYellow
    return styles.typeBlue
  }

  if (isLoading) {
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.transactionsPage}>
      <div className={styles.heroCard}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Transaction History</h1>
          <p className={styles.heroSubtitle}>View all your SPY transactions</p>
        </div>
        <button
          onClick={exportToCSV}
          className={styles.exportButton}
        >
          <FaDownload /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {['all', 'deposit', 'withdrawal', 'ad_reward', 'task_reward', 'referral_bonus', 'staking_reward', 'premium_payment'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`${styles.filterButton} ${filter === type ? styles.filterButtonActive : ''}`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={styles.searchWrapper}>
        <FaSearch className={styles.searchIcon} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className={styles.searchInput}
        />
      </div>

      {/* Transactions Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.transactionsTable}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableCell}>Date</th>
                <th className={styles.tableCell}>Type</th>
                <th className={`${styles.tableCell} ${styles.textRight}`}>Amount</th>
                <th className={`${styles.tableCell} ${styles.textRight}`}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.filter(t => 
                t.type.includes(search) || t.amount_spy.toString().includes(search)
              ).map((tx) => (
                <tr key={tx.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{new Date(tx.created_at).toLocaleString()}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.typeBadge} ${getTypeColor(tx.type)}`}>
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={`${styles.tableCell} ${styles.textRight} ${tx.amount_spy > 0 ? styles.amountPositive : styles.amountNegative}`}>
                    {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy} SPY
                  </td>
                  <td className={`${styles.tableCell} ${styles.textRight}`}>{tx.balance_after} SPY</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className={styles.emptyState}>
            <p>No transactions found</p>
          </div>
        )}
      </div>
    </div>
  )
}
