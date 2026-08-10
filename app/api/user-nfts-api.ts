// app/api/nft/user-nfts/route.ts
import { NextResponse } from 'next/server'
import { publicClient, NFT_CONTRACT, NFT_ABI, SPY_CONTRACT, SPY_ABI } from '@/lib/contracts/server'
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')
    const userId = searchParams.get('userId')

    if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 })

    // 1. Read on-chain balance
    const balance = await publicClient.readContract({
      address: NFT_CONTRACT,
      abi: NFT_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    })

    // 2. Read SPY balance
    const spyBalance = await publicClient.readContract({
      address: SPY_CONTRACT,
      abi: SPY_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    })

    // 3. Read total minted
    const totalMinted = await publicClient.readContract({
      address: NFT_CONTRACT,
      abi: NFT_ABI,
      functionName: 'totalMinted',
    })

    // 4. Get Supabase cached data for this user
    let dbNFTs: any[] = []
    if (userId) {
      const { data } = await supabase
        .from('user_nfts')
        .select('*, nft_badges(*)')
        .eq('user_id', userId)
      dbNFTs = data || []
    }

    // 5. For each DB NFT, verify on-chain ownership and get fresh stake info
    const enrichedNFTs = await Promise.all(
      dbNFTs.map(async (dbNft) => {
        let onChainOwner: string | null = null
        let stakeInfo = null
        let rewards = '0'
        let metadata = null

        if (dbNft.token_id) {
          try {
            // Verify ownership
            onChainOwner = await publicClient.readContract({
              address: NFT_CONTRACT,
              abi: NFT_ABI,
              functionName: 'ownerOf',
              args: [BigInt(dbNft.token_id)],
            }) as string

            // Get stake info
            stakeInfo = await publicClient.readContract({
              address: NFT_CONTRACT,
              abi: NFT_ABI,
              functionName: 'getStakeInfo',
              args: [BigInt(dbNft.token_id)],
            })

            // Calculate rewards
            const rewardAmount = await publicClient.readContract({
              address: NFT_CONTRACT,
              abi: NFT_ABI,
              functionName: 'calculateRewards',
              args: [BigInt(dbNft.token_id)],
            })
            rewards = rewardAmount.toString()

            // Fetch metadata from tokenURI
            if (dbNft.token_uri) {
              const ipfsUrl = dbNft.token_uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
              try {
                const res = await fetch(ipfsUrl, { cache: 'no-store' })
                if (res.ok) metadata = await res.json()
              } catch {
                // ignore fetch errors
              }
            }
          } catch {
            // Token may not exist on chain yet
          }
        }

        return {
          tokenId: dbNft.token_id,
          tokenURI: dbNft.token_uri,
          metadata,
          type: dbNft.type || 'regular',
          tier: dbNft.nft_badges?.tier || 'Bronze',
          country: dbNft.country,
          era: dbNft.era,
          isStaked: stakeInfo?.isStaked || dbNft.is_staked || false,
          stakedAt: stakeInfo?.stakedAt ? Number(stakeInfo.stakedAt) : null,
          rewards,
          verifiedOwner: onChainOwner?.toLowerCase() === address.toLowerCase(),
          dbId: dbNft.id,
        }
      })
    )

    return NextResponse.json({
      success: true,
      onChainBalance: Number(balance),
      spyBalance: spyBalance.toString(),
      totalMinted: Number(totalMinted),
      nfts: enrichedNFTs,
    })
  } catch (err: any) {
    console.error('User NFTs error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
