
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, User, Mail, Calendar, Coins, Gem, TrendingUp, Shield } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const supabase = createClient()

interface UserDetail {
  id: string
  username: string
  email: string
  spy_balance: number
  total_earned_usd: number
  total_withdrawn_usd: number
  is_premium: boolean
  premium_until: string
  is_banned: boolean
  referral_code: string
  referral_count: number
  referral_earnings: number
  created_at: string
}

interface Transaction {
  id: string
  type: string
  amount_spy: number
  created_at: string
}

interface NFT {
  id: string
  tier: string
  purchase_price_spy: number
  is_staked: boolean
}

export default function UserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [nfts, setNfts] = useState<NFT[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [id])

  async function fetchUserData() {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profile) {
      setUser(profile)
    }

    // Fetch transactions
    const { data: txns } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20)

    setTransactions(txns || [])

    // Fetch NFTs
    const { data: userNfts } = await supabase
      .from('user_nfts')
      .select('*, nft_badges(*)')
      .eq('user_id', id)

    setNfts(userNfts || [])

    setIsLoading(false)
  }

  async function toggleBan() {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !user.is_banned })
      .eq('id', id)

    if (!error) {
      toast.success(`User ${user.is_banned ? 'unbanned' : 'banned'} successfully`)
      fetchUserData()
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-accent-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">User not found</p>
        <Link href="/admin/users" className="text-accent-500 hover:underline mt-2 inline-block">Back to Users</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 glass rounded-lg hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.username}</h1>
          <p className="text-gray-400 text-sm">User ID: {user.id.slice(0, 8)}...</p>
        </div>
        <button
          onClick={toggleBan}
          className={`ml-auto px-4 py-2 rounded-lg text-sm font-medium ${user.is_banned ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
        >
          {user.is_banned ? 'Unban User' : 'Ban User'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Coins className="w-8 h-8 text-accent-500" />
            <div>
              <p className="text-gray-400 text-sm">SPY Balance</p>
              <p className="text-2xl font-bold text-white">{user.spy_balance?.toLocaleString()} SPY</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">Total Earned</p>
              <p className="text-2xl font-bold text-white">${user.total_earned_usd?.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Gem className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-gray-400 text-sm">NFTs Owned</p>
              <p className="text-2xl font-bold text-white">{nfts.length}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Premium Status</p>
              <p className="text-2xl font-bold text-white">{user.is_premium ? 'Active' : 'Inactive'}</p>
              {user.premium_until && <p className="text-xs text-gray-500">Until {new Date(user.premium_until).toLocaleDateString()}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" /> Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Username</span>
              <span className="text-white">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Referral Code</span>
              <span className="text-accent-500">{user.referral_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Referrals</span>
              <span className="text-white">{user.referral_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Referral Earnings</span>
              <span className="text-white">{user.referral_earnings?.toLocaleString()} SPY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Joined</span>
              <span className="text-white">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* NFTs Owned */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gem className="w-5 h-5" /> NFTs Owned
          </h2>
          {nfts.length > 0 ? (
            <div className="space-y-2">
              {nfts.map((nft) => (
                <div key={nft.id} className="flex justify-between items-center p-3 bg-navy-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{nft.tier}</p>
                    <p className="text-xs text-gray-500">Purchased for {nft.purchase_price_spy} SPY</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${nft.is_staked ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {nft.is_staked ? 'Staked' : 'Not Staked'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No NFTs owned</p>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-primary-500/20">
              <tr>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-left py-2 px-3">Amount</th>
                <th className="text-left py-2 px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-primary-500/10">
                  <td className="py-2 px-3 text-white capitalize">{tx.type.replace('_', ' ')}</td>
                  <td className={`py-2 px-3 ${tx.amount_spy > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy} SPY
                  </td>
                  <td className="py-2 px-3 text-gray-400">{new Date(tx.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
