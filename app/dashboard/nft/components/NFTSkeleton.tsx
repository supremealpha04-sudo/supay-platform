// app/dashboard/nft/components/NFTSkeleton.tsx
'use client'

import '../styles/nft.css'

export default function NFTSkeleton() {
  return (
    <div className="nft-skeleton">
      <div className="nft-skeleton-image" />
      <div className="nft-skeleton-content">
        <div className="nft-skeleton-line" style={{ width: '70%' }} />
        <div className="nft-skeleton-line" style={{ width: '50%' }} />
        <div className="nft-skeleton-line" style={{ width: '60%' }} />
        <div className="nft-skeleton-line" style={{ width: '40%' }} />
      </div>
    </div>
  )
}
