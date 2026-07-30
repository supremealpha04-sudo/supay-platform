export default function EarnPage() {
  const { profile, user, refreshProfile, isLoading: authLoading } = useAuth()
  
  // ===== STATE =====
  const [showAd, setShowAd] = useState(false)
  const [selectedAd, setSelectedAd] = useState<AdOption | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [stats, setStats] = useState({
    todayEarnings: 0,
    dailyRemaining: 20,
    streak: 0,
    totalAds: 0,
    platformEarnings: {} as Record<string, number>
  })
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [platformStatus, setPlatformStatus] = useState<Record<string, { 
    available: boolean, 
    ecpm?: number,
    loading: boolean 
  }>>({})
  const [isChecking, setIsChecking] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  // ===== FUNCTIONS =====
  
  // Check Adsterra availability via API
  const checkAdsterraAvailability = useCallback(async (adTier: string) => {
    // ... your code
  }, [])

  // Check Monetag availability (no API)
  const checkMonetagAvailability = useCallback(async (adTier: string) => {
    // ... your code
  }, [])

  const fetchStats = useCallback(async () => {
    // ... your code
  }, [profile, checkAdsterraAvailability, checkMonetagAvailability])

  // Load stats when profile is available
  useEffect(() => {
    // ... your code
  }, [profile, authLoading, fetchStats])

  // START AD FUNCTION
  const startAd = async (option: AdOption) => {
    setIsChecking(true)
    try {
      // ... your code
    } catch (error) {
      console.error('Error starting ad:', error)
      toast.error('Failed to check ad availability')
    } finally {
      setIsChecking(false)
    }
  }

  // HANDLE AD COMPLETE - MOVE THIS BEFORE THE RETURN
  const handleAdComplete = async (reward: number, tier: string, fraudScore: any) => {
    setShowAd(false)
    setSelectedAd(null)
    setSelectedPlatform(null)

    try {
      const res = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adTier: tier,
          platform: selectedPlatform,
          fraudSignals: fraudScore,
          fraudScore,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`+${data.reward} SPY! (${data.platform})`)
        await refreshProfile()
        fetchStats()
      } else {
        toast.error(data.message || 'Failed to process')
      }
    } catch (error) {
      console.error('Error completing ad:', error)
      toast.error('Failed to process ad completion')
    }
  }

  // HANDLE CANCEL AD - MOVE THIS BEFORE THE RETURN
  const handleCancelAd = () => {
    setShowAd(false)
    setSelectedAd(null)
    setSelectedPlatform(null)
    toast('Ad cancelled', { icon: '⚠️' })
  }

  // Filter ads by tier
  const filteredAds = selectedTier === 'all' 
    ? AD_OPTIONS 
    : AD_OPTIONS.filter(ad => ad.tier === selectedTier)

  // ===== EARLY RETURNS =====
  
  // Show auth loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400">Please log in to earn rewards</p>
          <Link href="/login" className="text-accent-500 hover:text-accent-400 mt-2 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading your earnings...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md">
          <p className="text-red-400 font-medium">Something went wrong</p>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-accent-500 rounded-lg text-white text-sm hover:bg-accent-600 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // ===== RENDER =====
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <AnimatePresence>
        {showAd && selectedAd && selectedPlatform && (
          <AdViewer
            userId={user?.id || ''}
            platform={selectedPlatform}
            adTier={selectedAd.tier}
            minDuration={selectedAd.duration}
            onComplete={handleAdComplete}
            onCancel={handleCancelAd}
          />
        )}
      </AnimatePresence>

      {/* ... rest of your JSX ... */}
    </div>
  )
}