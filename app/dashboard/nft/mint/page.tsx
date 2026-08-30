// app/dashboard/nft/mint/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NFTService } from '@/lib/services/nft-service'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { 
  FaGem, FaImage, FaCoins, FaUpload, FaArrowRight,
  FaCheck, FaSpinner, FaRocket, FaInfoCircle
} from 'react-icons/fa'
import { TIER_COLORS, TIER_ICONS, TIER_PRICES, TIER_SUPPLY, TIER_DAILY_REWARD } from '@/types/nft'
import '../styles/nft.css'

export default function MintPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState('Collector')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [step, setStep] = useState(1)

  const tiers = [
    { tier: 'Genesis', price: TIER_PRICES.Genesis, dailyReward: TIER_DAILY_REWARD.Genesis, supply: TIER_SUPPLY.Genesis, icon: '👑' },
    { tier: 'Legendary', price: TIER_PRICES.Legendary, dailyReward: TIER_DAILY_REWARD.Legendary, supply: TIER_SUPPLY.Legendary, icon: '💎' },
    { tier: 'Rare', price: TIER_PRICES.Rare, dailyReward: TIER_DAILY_REWARD.Rare, supply: TIER_SUPPLY.Rare, icon: '⭐' },
    { tier: 'Collector', price: TIER_PRICES.Collector, dailyReward: TIER_DAILY_REWARD.Collector, supply: TIER_SUPPLY.Collector, icon: '🟢' },
  ]

  const selected = tiers.find(t => t.tier === selectedTier) || tiers[0]

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setStep(2)
    }
  }

  const handleMint = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    if (!imageFile) {
      toast.error('Please upload an image')
      return
    }

    if (!name.trim()) {
      toast.error('Please enter a name for your NFT')
      return
    }

    if ((profile?.spy_balance || 0) < selected.price) {
      toast.error(`Insufficient SPY. Need ${selected.price.toLocaleString()} SPY`)
      return
    }

    setIsLoading(true)
    try {
      // Get badge ID from database
      const badges = await NFTService.getBadges()
      const badge = badges.find(b => b.tier === selectedTier)
      if (!badge) {
        toast.error('Badge not found. Please refresh and try again.')
        setIsLoading(false)
        return
      }

      // Upload image to storage
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('name', name)
      formData.append('description', description)

      const uploadResponse = await fetch('/api/nft/upload', {
        method: 'POST',
        body: formData
      })
      const uploadData = await uploadResponse.json()
      
      if (!uploadData.success) {
        toast.error('Failed to upload image')
        setIsUploading(false)
        setIsLoading(false)
        return
      }

      setIsUploading(false)

      // Mint NFT
      const result = await NFTService.mintNFT(user.id, badge.id)
      if (result.success) {
        toast.success(`🎉 ${selectedTier} NFT minted successfully!`)
        setImageFile(null)
        setImagePreview('')
        setName('')
        setDescription('')
        setStep(1)
        router.push('/dashboard/nft')
      } else {
        toast.error(result.error || 'Mint failed')
      }
    } catch (error) {
      console.error('Mint error:', error)
      toast.error('Failed to mint NFT')
    } finally {
      setIsLoading(false)
      setIsUploading(false)
    }
  }

  return (
    <div className="nft-mint-page">
      <div className="nft-mint-header">
        <h1><FaGem className="text-accent-500" /> Mint NFT</h1>
        <p>Create your unique Supremeamer NFT</p>
      </div>

      <div className="nft-mint-container">
        {/* Step Indicator */}
        <div className="nft-mint-steps">
          <div className={`nft-mint-step ${step >= 1 ? 'active' : ''}`}>
            <span className="nft-mint-step-number">1</span>
            <span className="nft-mint-step-label">Select Tier</span>
          </div>
          <div className={`nft-mint-step ${step >= 2 ? 'active' : ''}`}>
            <span className="nft-mint-step-number">2</span>
            <span className="nft-mint-step-label">Upload Image</span>
          </div>
          <div className={`nft-mint-step ${step >= 3 ? 'active' : ''}`}>
            <span className="nft-mint-step-number">3</span>
            <span className="nft-mint-step-label">Mint</span>
          </div>
        </div>

        <div className="nft-mint-content">
          {/* Step 1: Select Tier */}
          {step === 1 && (
            <div className="nft-mint-step-content">
              <h2>Select NFT Tier</h2>
              <p>Choose the tier for your NFT</p>
              <div className="nft-mint-tier-grid">
                {tiers.map((tier) => (
                  <button
                    key={tier.tier}
                    onClick={() => {
                      setSelectedTier(tier.tier)
                      setStep(2)
                    }}
                    className={`nft-mint-tier-card ${selectedTier === tier.tier ? 'active' : ''}`}
                  >
                    <div className="nft-mint-tier-icon">{tier.icon}</div>
                    <h3>{tier.tier}</h3>
                    <p className="nft-mint-tier-price">{tier.price.toLocaleString()} SPY</p>
                    <p className="nft-mint-tier-supply">Supply: {tier.supply}</p>
                    <p className="nft-mint-tier-reward">{tier.dailyReward} SPY/day</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Upload Image */}
          {step === 2 && (
            <div className="nft-mint-step-content">
              <h2>Upload NFT Image</h2>
              <p>Upload your NFT image and add details</p>

              <div className="nft-mint-form">
                <div className="nft-mint-image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label htmlFor="imageUpload" className="nft-mint-image-label">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="nft-mint-preview" />
                        <div className="nft-mint-image-overlay">
                          <FaUpload /> Change Image
                        </div>
                      </>
                    ) : (
                      <div className="nft-mint-placeholder">
                        <FaImage className="nft-mint-placeholder-icon" />
                        <p>Click to upload NFT image</p>
                        <span>PNG, JPEG, GIF up to 10MB</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="nft-mint-fields">
                  <div className="nft-mint-field">
                    <label>NFT Name</label>
                    <input
                      type="text"
                      placeholder="Enter NFT name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={50}
                    />
                    <span className="nft-mint-field-hint">{name.length}/50</span>
                  </div>

                  <div className="nft-mint-field">
                    <label>Description</label>
                    <textarea
                      placeholder="Describe your NFT"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      maxLength={200}
                    />
                    <span className="nft-mint-field-hint">{description.length}/200</span>
                  </div>

                  <div className="nft-mint-info-box">
                    <FaInfoCircle className="text-accent-500" />
                    <div>
                      <p><strong>Tier:</strong> {selectedTier}</p>
                      <p><strong>Price:</strong> {selected.price.toLocaleString()} SPY</p>
                      <p><strong>Daily Reward:</strong> {selected.dailyReward} SPY</p>
                      <p><strong>Your Balance:</strong> {(profile?.spy_balance || 0).toLocaleString()} SPY</p>
                    </div>
                  </div>

                  <div className="nft-mint-actions">
                    <button
                      onClick={() => setStep(1)}
                      className="nft-btn-secondary"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleMint}
                      disabled={!imagePreview || isLoading || isUploading}
                      className={`nft-btn-primary ${(!imagePreview || isLoading || isUploading) ? 'disabled' : ''}`}
                    >
                      {isUploading ? (
                        <>
                          <FaSpinner className="animate-spin" /> Uploading...
                        </>
                      ) : isLoading ? (
                        <>
                          <FaSpinner className="animate-spin" /> Minting...
                        </>
                      ) : (
                        <>
                          <FaRocket /> Mint NFT
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
