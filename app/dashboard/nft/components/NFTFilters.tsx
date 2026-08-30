// app/dashboard/nft/components/NFTFilters.tsx
'use client'

import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa'

interface NFTFiltersProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  filterType: string
  setFilterType: (value: string) => void
}

export default function NFTFilters({ 
  searchTerm, 
  setSearchTerm, 
  filterType, 
  setFilterType 
}: NFTFiltersProps) {
  const types = [
    { id: 'all', label: 'All' },
    { id: 'genesis', label: 'Genesis', icon: '👑' },
    { id: 'legendary', label: 'Legendary', icon: '💎' },
    { id: 'rare', label: 'Rare', icon: '⭐' },
    { id: 'collector', label: 'Collector', icon: '🟢' }
  ]

  const clearFilters = () => {
    setSearchTerm('')
    setFilterType('all')
  }

  const hasFilters = searchTerm !== '' || filterType !== 'all'

  return (
    <div className="nft-filters">
      <div className="nft-filter-tabs">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => setFilterType(type.id)}
            className={`nft-filter-tab ${filterType === type.id ? 'active' : ''}`}
          >
            {type.icon && <span className="nft-filter-icon">{type.icon}</span>}
            {type.label}
          </button>
        ))}
      </div>

      <div className="nft-filter-controls">
        <div className="nft-search">
          <FaSearch className="nft-search-icon" />
          <input
            type="text"
            placeholder="Search NFTs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="nft-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <FaTimes />
            </button>
          )}
        </div>

        {hasFilters && (
          <button className="nft-clear-filters" onClick={clearFilters}>
            <FaTimes /> Clear
          </button>
        )}
      </div>
    </div>
  )
}
