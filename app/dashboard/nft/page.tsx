'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  useAccount,
  useConnect,
  useSendTransaction,
  useWaitForTransaction,
  useBalance,
} from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { parseEther, formatEther } from 'viem'
import {
  FaGem, FaCoins, FaClock, FaChartLine, FaShoppingCart,
  FaExchangeAlt, FaLock, FaArrowUp, FaShieldAlt, FaGlobe,
  FaSearch, FaFilter, FaHistory, FaCertificate, FaCrown,
  FaPaintBrush, FaHandshake, FaCheckCircle, FaTimes, FaGavel,
  FaWallet, FaExternalLinkAlt
} from 'react-icons/fa'
import styles from './page.module.css'

/*//////////////////////////////////////////////////////////////
                            TYPES
//////////////////////////////////////////////////////////////*/

type Tab = 'overview' | 'marketplace' | 'legacy' | 'staking' | 'verify' | 'mint'
type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
type Era = 'Bronze' | 'Silver' | 'Gold'

interface NFTItem {
  tokenId: number
  tokenURI: string
  metadata?: { name: string; description: string; image: string; attributes: any[] }
  type: string
  tier: string
  country?: string
  era?: string
  isStaked: boolean
  stakedAt: number | null
  rewards: string
  verifiedOwner: boolean
  dbId: string
}

interface ListingItem {
  id: number
  tokenId: number
  name: string
  image: string
  price: number
  seller: string
  type: string
  tier?: string
  country?: string
  era?: string
  listingType: string
  verified: boolean
}

/*//////////////////////////////////////////////////////////////
                          CONSTANTS
//////////////////////////////////////////////////////////////*/

const TIER_NAMES: Tier[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
const ERA_NAMES: Era[] = ['Bronze', 'Silver', 'Gold']
const TIER_COLORS: Record<string, string> = {
  Bronze: '#f97316', Silver: '#cbd5e1', Gold: '#facc15',
  Platinum: '#9ca3af', Diamond: '#38bdf8',
}

const TOP_COUNTRIES = [
  { name: 'India', region: 'Asia' }, { name: 'China', region: 'Asia' },
  { name: 'USA', region: 'Americas' }, { name: 'Nigeria', region: 'Africa' },
  { name: 'Indonesia', region: 'Asia' }, { name: 'Pakistan', region: 'Asia' },
  { name: 'Brazil', region: 'Americas' }, { name: 'Bangladesh', region: 'Asia' },
  { name: 'Russia', region: 'Europe' }, { name: 'Ethiopia', region: 'Africa' },
  { name: 'Japan', region: 'Asia' }, { name: 'Mexico', region: 'Americas' },
]

const SPONSOR_TIERS = [
  { name: 'Edition #1', desc: 'Brand partnership' },
  { name: 'VIP', desc: 'VIP access' },
  { name: 'Elite', desc: 'Elite benefits' },
]

/*//////////////////////////////////////////////////////////////
                          HELPERS
//////////////////////////////////////////////////////////////*/

function resolveIPFS(url: string): string {
  if (!url) return ''
  return url.startsWith('ipfs://') ? url.replace('ipfs://', 'https://ipfs.io/ipfs/') : url
}

function formatSPY(wei: string | number | undefined): string {
  if (!wei) return '0'
  const n = typeof wei === 'string' ? Number(wei) / 1e18 : Number(wei)
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

/*//////////////////////////////////////////////////////////////
                        MAIN COMPONENT
//////////////////////////////////////////////////////////////*/

export default function NFTDashboard() {
  const { profile } = useAuth()
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({ connector: new InjectedConnector() })
  const { data: bnbBal } = useBalance({ address, chainId: 56, enabled: isConnected })

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [userNFTs, setUserNFTs] = useState<NFTItem[]>([])
  const [listings, setListings] = useState<ListingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ onChainBalance: 0, spyBalance: '0', totalMinted: 0 })

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [marketFilter, setMarketFilter] = useState<'all' | 'regular' | 'legacy' | 'sponsor'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [verifyTokenId, setVerifyTokenId] = useState('')
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)

  // Transaction states
  const [pendingTx, setPendingTx] = useState<{ to: string; data: string; value: string } | null>(null)
  const [pendingLabel, setPendingLabel] = useState('')

  // Wagmi send transaction
  const { sendTransaction, data: txHash } = useSendTransaction({
    onSuccess: () => toast.success(`${pendingLabel} transaction sent!`),
    onError: (err) => toast.error(`${pendingLabel} failed: ${err.message}`),
  })

  useWaitForTransaction({
    hash: txHash,
    onSuccess: () => {
      toast.success(`${pendingLabel} confirmed on BNB Chain!`)
      setPendingTx(null)
      setPendingLabel('')
      fetchUserData()
      if (activeTab === 'marketplace') fetchListings()
    },
  })

  /*//////////////////////////////////////////////////////////////
                     FETCH DATA FROM API ROUTES
  //////////////////////////////////////////////////////////////*/

  const fetchUserData = useCallback(async () => {
    if (!address || !isConnected) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/nft/user-nfts?address=${address}&userId=${profile?.id || ''}`)
      const data = await res.json()
      if (data.success) {
        setUserNFTs(data.nfts)
        setStats({
          onChainBalance: data.onChainBalance,
          spyBalance: data.spyBalance,
          totalMinted: data.totalMinted,
        })
      }
    } catch (err) {
      toast.error('Failed to load NFTs')
    }
    setIsLoading(false)
  }, [address, isConnected, profile?.id])

  const fetchListings = useCallback(async () => {
    try {
      const params = new URLSearchParams({ filter: marketFilter, search: searchQuery })
      const res = await fetch(`/api/nft/listings?${params}`)
      const data = await res.json()
      if (data.success) setListings(data.listings)
    } catch (err) {
      toast.error('Failed to load marketplace')
    }
  }, [marketFilter, searchQuery])

  useEffect(() => {
    if (isConnected) {
      fetchUserData()
      fetchListings()
    }
  }, [isConnected, fetchUserData, fetchListings])

  /*//////////////////////////////////////////////////////////////
                     TRANSACTION HELPERS
  //////////////////////////////////////////////////////////////*/

  async function executeTx(endpoint: string, body: object, label: string) {
    setPendingLabel(label)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setPendingTx(data.tx)
      sendTransaction({
        to: data.tx.to as `0x${string}`,
        data: data.tx.data as `0x${string}`,
        value: BigInt(data.tx.value),
        chainId: 56,
      })
    } catch (err: any) {
      toast.error(`${label} failed: ${err.message}`)
      setPendingLabel('')
    }
  }

  /*//////////////////////////////////////////////////////////////
                     ACTION HANDLERS
  //////////////////////////////////////////////////////////////*/

  const mintRegular = async (tier: Tier, tokenURI: string) => {
    await executeTx('/api/nft/mint', { type: 'regular', tier, tokenURI, userAddress: address }, `Mint ${tier}`)
  }

  const mintLegacy = async (country: string, era: Era, tokenURI: string) => {
    await executeTx('/api/nft/mint', { type: 'legacy', country, era, tokenURI, userAddress: address }, `Mint ${country} ${era}`)
  }

  const stake = async (tokenId: number) => {
    await executeTx('/api/nft/stake', { tokenId }, 'Stake NFT')
  }

  const unstake = async (tokenId: number) => {
    await executeTx('/api/nft/unstake', { tokenId }, 'Unstake NFT')
  }

  const buyListing = async (listingId: number) => {
    await executeTx('/api/nft/marketplace/buy', { listingId }, 'Buy NFT')
  }

  const verifyNFT = async () => {
    if (!verifyTokenId) return
    try {
      const res = await fetch('/api/nft/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: verifyTokenId }),
      })
      const data = await res.json()
      setVerifyResult(data.isValid)
      toast.success(data.isValid ? 'Authentic SUPAY NFT ✓' : 'Verification Failed ✗')
    } catch {
      setVerifyResult(false)
      toast.error('Verification error')
    }
  }

  /*//////////////////////////////////////////////////////////////
                     DERIVED STATE
  //////////////////////////////////////////////////////////////*/

  const stakedNFTs = useMemo(() => userNFTs.filter((n) => n.isStaked), [userNFTs])
  const dailyRewards = useMemo(() => {
    return stakedNFTs.reduce((sum, n) => {
      const map: Record<string, number> = { Bronze: 0.17, Silver: 0.68, Gold: 3.42, Platinum: 17.12, Diamond: 85.62 }
      return sum + (map[n.tier] || 0)
    }, 0)
  }, [stakedNFTs])

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (marketFilter !== 'all' && l.type !== marketFilter) return false
      if (searchQuery && !l.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [listings, marketFilter, searchQuery])

  const tabs = [
    { key: 'overview' as Tab, label: 'Overview', icon: FaGem },
    { key: 'marketplace' as Tab, label: 'Marketplace', icon: FaShoppingCart },
    { key: 'legacy' as Tab, label: 'Country Legacy', icon: FaGlobe },
    { key: 'staking' as Tab, label: 'Staking', icon: FaChartLine },
    { key: 'verify' as Tab, label: 'Verify', icon: FaShieldAlt },
    { key: 'mint' as Tab, label: 'Mint', icon: FaCertificate },
  ]

  /*//////////////////////////////////////////////////////////////
                     RENDER: WALLET CHECK
  //////////////////////////////////////////////////////////////*/

  if (!isConnected) {
    return (
      <div className={styles.nftPage}>
        <div className={styles.heroCard} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FaWallet size={48} style={{ color: '#60a5fa', marginBottom: '1.5rem' }} />
          <h1 className={styles.heroTitle}>Connect Your Wallet</h1>
          <p className={styles.heroDescription}>
            Connect MetaMask or Trust Wallet to access the SUPAY NFT Ecosystem on BNB Chain Mainnet.
          </p>
          <button onClick={() => connect()} className={styles.purchaseButton} style={{ marginTop: '1.5rem', maxWidth: 280 }}>
            <FaWallet /> Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner} />
        <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>Loading from BNB Chain...</p>
      </div>
    )
  }

  return (
    <div className={styles.nftPage}>
      {/* Pending Transaction Overlay */}
      {pendingTx && (
        <div className={styles.pendingOverlay}>
          <div className={styles.pendingCard}>
            <div className={styles.spinner} style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'white', margin: 0 }}>{pendingLabel} in progress...</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              Confirm in MetaMask and wait for BNB Chain confirmation.
            </p>
            {txHash && (
              <a
                href={`https://bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#60a5fa', fontSize: '0.85rem' }}
              >
                <FaExternalLinkAlt /> View on BscScan
              </a>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.heroCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.heroTitle}>SUPAY NFT Ecosystem</h1>
            <p className={styles.heroDescription}>BNB Chain Mainnet • Real contract data • IPFS-backed assets</p>
          </div>
          <div className={styles.statPill}>
            <FaExternalLinkAlt size={12} /> {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>
        <div className={styles.statsBar}>
          <div className={styles.statPill}><FaCoins /> {formatSPY(stats.spyBalance)} SPY</div>
          <div className={styles.statPill}><FaGem /> {stats.onChainBalance} NFTs</div>
          <div className={styles.statPill}><FaLock /> {stakedNFTs.length} Staked</div>
          <div className={styles.statPill}><FaChartLine /> {dailyRewards.toFixed(2)} SPY/day</div>
          <div className={styles.statPill}><FaCertificate /> {stats.totalMinted.toLocaleString()} Minted</div>
          <div className={styles.statPill}><FaWallet /> {Number(bnbBal?.formatted || 0).toFixed(4)} BNB</div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`${styles.tabButton} ${activeTab === t.key ? styles.tabActive : ''}`}
          >
            <t.icon /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >

          {/* ========== OVERVIEW ========== */}
          {activeTab === 'overview' && (
            <div className={styles.grid2Col}>
              <div className={styles.sectionCard}>
                <div className={styles.heroHeader}>
                  <FaGem className={styles.statIcon} />
                  <h2 className={styles.sectionTitle}>Your Collection</h2>
                </div>
                {userNFTs.length === 0 ? (
                  <p className={styles.emptyState}>No NFTs found. Visit the Mint tab to mint your first SUPAY NFT.</p>
                ) : (
                  <div className={styles.cardsGrid}>
                    {userNFTs.map((nft) => (
                      <div key={nft.tokenId} className={styles.nftCard}>
                        <div className={styles.nftImageWrapper}>
                          {nft.metadata?.image ? (
                            <img src={resolveIPFS(nft.metadata.image)} alt={nft.metadata.name} className={styles.nftImage}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          ) : (
                            <div className={styles.nftImagePlaceholder}><FaGem style={{ fontSize: '2rem', opacity: 0.3 }} /></div>
                          )}
                        </div>
                        <div className={styles.nftCardHeader}>
                          <h3 className={styles.nftName}>{nft.metadata?.name || `${nft.tier} #${nft.tokenId}`}</h3>
                          {nft.isStaked ? (
                            <span className={styles.nftBadge}><FaLock size={12} /> Staked</span>
                          ) : (
                            <button onClick={() => stake(nft.tokenId)} disabled={!!pendingTx} className={styles.stakeButtonSmall}>Stake</button>
                          )}
                        </div>
                        <div className={styles.nftMeta}>
                          <span>Type: {nft.type}</span>
                          {nft.country && <span>{nft.country}</span>}
                          {nft.era && <span>{nft.era} Era</span>}
                          {!nft.verifiedOwner && <span style={{ color: '#f87171' }}>⚠ Unverified</span>}
                        </div>
                        {nft.isStaked && (
                          <>
                            <div className={styles.nftCardRow}>
                              <span>Staked Since</span>
                              <span>{nft.stakedAt ? new Date(nft.stakedAt * 1000).toLocaleDateString() : '—'}</span>
                            </div>
                            <div className={styles.nftCardRow}>
                              <span>Pending Rewards</span>
                              <span style={{ color: '#4ade80' }}>{formatSPY(nft.rewards)} SPY</span>
                            </div>
                            <button onClick={() => unstake(nft.tokenId)} disabled={!!pendingTx} className={styles.unstakeButton}>Unstake & Claim</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.sectionCard}>
                <div className={styles.heroHeader}>
                  <FaChartLine className={styles.statIcon} />
                  <h2 className={styles.sectionTitle}>Staking Rewards</h2>
                </div>
                <div className={styles.rewardsGrid}>
                  <div className={styles.rewardCard}>
                    <p className={styles.rewardLabel}>Daily</p>
                    <p className={styles.rewardValue}>{dailyRewards.toFixed(2)} SPY</p>
                  </div>
                  <div className={styles.rewardCard}>
                    <p className={styles.rewardLabel}>Monthly</p>
                    <p className={styles.rewardValue}>{(dailyRewards * 30).toFixed(0)} SPY</p>
                  </div>
                  <div className={styles.rewardCard}>
                    <p className={styles.rewardLabel}>Yearly</p>
                    <p className={styles.rewardValue}>{(dailyRewards * 365).toFixed(0)} SPY</p>
                  </div>
                  <div className={styles.rewardCard}>
                    <p className={styles.rewardLabel}>Wallet SPY</p>
                    <p className={styles.rewardValue}>{formatSPY(stats.spyBalance)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== MARKETPLACE ========== */}
          {activeTab === 'marketplace' && (
            <div className={styles.sectionCard}>
              <div className={styles.heroHeader}>
                <FaShoppingCart className={styles.statIcon} />
                <h2 className={styles.sectionTitle}>Marketplace</h2>
                <span className={styles.feeBadge}>2.5% Platform Fee</span>
              </div>
              <div className={styles.marketControls}>
                <div className={styles.searchBox}>
                  <FaSearch />
                  <input placeholder="Search NFTs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className={styles.filterRow}>
                  {['all', 'regular', 'legacy', 'sponsor'].map((f) => (
                    <button key={f} onClick={() => setMarketFilter(f as any)}
                      className={`${styles.filterChip} ${marketFilter === f ? styles.filterChipActive : ''}`}>
                      {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.cardsGrid}>
                {filteredListings.map((listing) => (
                  <div key={listing.id} className={styles.marketCard}>
                    <div className={styles.nftImageWrapper} style={{ height: 180 }}>
                      {listing.image ? (
                        <img src={listing.image} alt={listing.name} className={styles.nftImage}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div className={styles.nftImagePlaceholder}><FaGem style={{ fontSize: '2rem', opacity: 0.3 }} /></div>
                      )}
                    </div>
                    <div className={styles.marketInfo}>
                      <h3 className={styles.marketName}>{listing.name}</h3>
                      <p className={styles.marketSeller}>Seller: {listing.seller?.slice(0, 6)}...{listing.seller?.slice(-4)}</p>
                      {!listing.verified && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>⚠ Not verified on chain</span>}
                      <div className={styles.marketPriceRow}>
                        <span className={styles.marketPrice}>{listing.price.toLocaleString()} SPY</span>
                        <button onClick={() => buyListing(listing.id)} disabled={!!pendingTx || listing.seller === address} className={styles.buyButton}>
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredListings.length === 0 && <p className={styles.emptyState}>No active listings found.</p>}
              </div>
            </div>
          )}

          {/* ========== COUNTRY LEGACY ========== */}
          {activeTab === 'legacy' && (
            <div className={styles.sectionCard}>
              <div className={styles.heroHeader}>
                <FaGlobe className={styles.statIcon} />
                <h2 className={styles.sectionTitle}>Country Legacy Collection</h2>
                <span className={styles.feeBadge}>180+ Countries • 3 Eras • On-Chain</span>
              </div>
              {!selectedCountry ? (
                <div className={styles.countryGrid}>
                  {TOP_COUNTRIES.map((c) => (
                    <button key={c.name} onClick={() => setSelectedCountry(c.name)} className={styles.countryCard}>
                      <h3>{c.name}</h3>
                      <span className={styles.countryRegion}>{c.region}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem', display: 'block' }}>Click to view 3 Eras</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <button onClick={() => setSelectedCountry(null)} className={styles.backButton}>← Back to Countries</button>
                  <h3 className={styles.sectionTitle} style={{ marginTop: '1rem' }}>{selectedCountry} Legacy</h3>
                  <div className={styles.eraGrid}>
                    {ERA_NAMES.map((era) => {
                      const [tokenURI, setTokenURI] = useState('')
                      const theme = era === 'Bronze' ? 'Time of Suffering' : era === 'Silver' ? 'Time of Freedom' : 'Time of Glory'
                      return (
                        <div key={era} className={styles.eraCard} style={{ borderColor: `${TIER_COLORS[era]}33` }}>
                          <div className={styles.eraHeader} style={{ color: TIER_COLORS[era] }}>
                            <h3>{era} Era</h3>
                            <span className={styles.eraTheme}>{theme}</span>
                          </div>
                          <div className={styles.nftCardText}>
                            <div className={styles.nftCardRow}><span>Theme</span><span>{theme}</span></div>
                          </div>
                          <input placeholder="IPFS metadata URI (e.g. ipfs://Qm.../nigeria-gold.json)"
                            value={tokenURI} onChange={(e) => setTokenURI(e.target.value)}
                            className={styles.verifyInput} style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }} />
                          <button onClick={() => tokenURI && mintLegacy(selectedCountry, era, tokenURI)}
                            disabled={!tokenURI || !!pendingTx} className={styles.purchaseButton}>
                            Mint {selectedCountry} {era}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== STAKING CALCULATOR ========== */}
          {activeTab === 'staking' && (
            <div className={styles.grid2Col}>
              <div className={styles.sectionCard}>
                <div className={styles.heroHeader}>
                  <FaChartLine className={styles.statIcon} />
                  <h2 className={styles.sectionTitle}>On-Chain Staking Calculator</h2>
                </div>
                <div className={styles.calcGrid}>
                  {TIER_NAMES.map((tier) => {
                    const apy = { Bronze: 3, Silver: 3, Gold: 5, Platinum: 5, Diamond: 9 }[tier]
                    const daily = { Bronze: 0.17, Silver: 0.68, Gold: 3.42, Platinum: 17.12, Diamond: 85.62 }[tier]
                    return (
                      <div key={tier} className={styles.calcCard}>
                        <div className={styles.calcHeader} style={{ color: TIER_COLORS[tier] }}>
                          <FaCrown /> {tier}
                        </div>
                        <div className={styles.calcRow}><span>APY</span><span>{apy}%</span></div>
                        <div className={styles.calcRow}><span>Daily SPY</span><span>{daily} SPY</span></div>
                        <div className={styles.calcRow}><span>2-Year ROI</span><span className={styles.highlight}>25%</span></div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className={styles.sectionCard}>
                <div className={styles.heroHeader}>
                  <FaHistory className={styles.statIcon} />
                  <h2 className={styles.sectionTitle}>Your Staked NFTs</h2>
                </div>
                {stakedNFTs.length === 0 ? (
                  <p className={styles.emptyState}>No staked NFTs. Stake from Overview to earn SPY.</p>
                ) : (
                  <div className={styles.historyList}>
                    {stakedNFTs.map((n) => (
                      <div key={n.tokenId} className={styles.historyItem}>
                        <div>
                          <strong>{n.metadata?.name || `${n.tier} #${n.tokenId}`}</strong>
                          <span className={styles.historyMeta}>
                            Since {n.stakedAt ? new Date(n.stakedAt * 1000).toLocaleDateString() : '—'} • {formatSPY(n.rewards)} SPY pending
                          </span>
                        </div>
                        <button onClick={() => unstake(n.tokenId)} disabled={!!pendingTx} className={styles.unstakeButton} style={{ width: 'auto', margin: 0 }}>
                          Unstake
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== VERIFY ========== */}
          {activeTab === 'verify' && (
            <div className={styles.sectionCard} style={{ maxWidth: 600, margin: '0 auto' }}>
              <div className={styles.heroHeader}>
                <FaShieldAlt className={styles.statIcon} />
                <h2 className={styles.sectionTitle}>Anti-Counterfeit Verification</h2>
              </div>
              <p className={styles.emptyState}>Enter a Token ID to verify authenticity directly on the BNB Chain smart contract.</p>
              <div className={styles.verifyBox}>
                <input className={styles.verifyInput} placeholder="Enter Token ID (e.g. 42)"
                  value={verifyTokenId} onChange={(e) => setVerifyTokenId(e.target.value)} />
                <button onClick={verifyNFT} className={styles.verifyButton}><FaCheckCircle /> Verify</button>
              </div>
              {verifyResult !== null && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className={`${styles.verifyResult} ${verifyResult ? styles.verifySuccess : styles.verifyFail}`}>
                  {verifyResult ? (
                    <><FaCheckCircle size={32} /> Authentic SUPAY NFT — On-Chain Verification Passed</>
                  ) : (
                    <><FaTimes size={32} /> Counterfeit Detected — Verification Failed</>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* ========== MINT ========== */}
          {activeTab === 'mint' && (
            <div className={styles.mintSection}>
              <div className={styles.sectionCard}>
                <div className={styles.heroHeader}>
                  <FaGem className={styles.statIcon} />
                  <h2 className={styles.sectionTitle}>Regular Collection</h2>
                </div>
                <div className={styles.cardsGrid}>
                  {TIER_NAMES.map((tier) => {
                    const [tokenURI, setTokenURI] = useState('')
                    const owned = userNFTs.some((n) => n.tier === tier && n.type === 'regular')
                    return (
                      <div key={tier} className={styles.nftCard}>
                        <div className="text-center mb-3">
                          <div className={styles.tierBadge} style={{ background: TIER_COLORS[tier] }}>{tier[0]}</div>
                          <h3 className={styles.sectionTitle}>{tier}</h3>
                        </div>
                        <div className={styles.nftCardText}>
                          <div className={styles.nftCardRow}><span>Supply</span><span>{[100000, 50000, 10000, 1000, 100][TIER_NAMES.indexOf(tier)].toLocaleString()}</span></div>
                        </div>
                        <input placeholder="IPFS metadata URI"
                          value={tokenURI} onChange={(e) => setTokenURI(e.target.value)}
                          className={styles.verifyInput} style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }} />
                        <button onClick={() => tokenURI && mintRegular(tier, tokenURI)}
                          disabled={!tokenURI || !!pendingTx || owned}
                          className={owned ? styles.ownedButton : styles.purchaseButton}>
                          {owned ? 'Owned' : `Mint ${tier}`}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={styles.sectionCard}>
                <div className={styles.heroHeader}>
                  <FaHandshake className={styles.statIcon} />
                  <h2 className={styles.sectionTitle}>Sponsor Collection</h2>
                </div>
                <div className={styles.cardsGrid}>
                  {SPONSOR_TIERS.map((s) => (
                    <div key={s.name} className={styles.nftCard}>
                      <h3 className={styles.sectionTitle}>{s.name}</h3>
                      <p className={styles.cardMeta}>{s.desc}</p>
                      <button onClick={() => toast('Sponsor mint: provide IPFS URI and call API')} className={styles.purchaseButton}>Mint Sponsor</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.sectionCard}>
                <div className={styles.heroHeader}>
                  <FaPaintBrush className={styles.statIcon} />
                  <h2 className={styles.sectionTitle}>Custom Collection</h2>
                </div>
                <div className={styles.customMintBox}>
                  <p className={styles.emptyState}>Design your own NFT. Minimum base price. Unlimited supply.</p>
                  <button onClick={() => toast('Custom mint: provide IPFS URI and call API')} className={styles.purchaseButton}>Launch Designer</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
