// lib/constants/nftTiers.ts
export const nftTiers = {
  Bronze: {
    tier: 'Bronze',
    premiumMonthsRequired: 3,
    purchasePriceSPY: 500,
    stakingRewardDaily: 5,
    maxSupply: 10000,
    benefits: {
      earningMultiplier: 1.1,
      withdrawalFeeDiscount: 0.5,
      exclusiveTasksPerWeek: 5
    }
  },
  Silver: {
    tier: 'Silver',
    premiumMonthsRequired: 6,
    purchasePriceSPY: 2000,
    stakingRewardDaily: 15,
    maxSupply: 5000,
    benefits: {
      earningMultiplier: 1.25,
      withdrawalFeeDiscount: 0.75,
      exclusiveTasksPerWeek: 10,
      stakingBoost: 0.05
    }
  },
  Gold: {
    tier: 'Gold',
    premiumMonthsRequired: 12,
    purchasePriceSPY: 10000,
    stakingRewardDaily: 50,
    maxSupply: 1000,
    benefits: {
      earningMultiplier: 1.5,
      withdrawalFeeDiscount: 0.9,
      exclusiveTasksPerWeek: 20,
      stakingBoost: 0.10,
      governanceVoting: true
    }
  },
  Platinum: {
    tier: 'Platinum',
    premiumMonthsRequired: 24,
    purchasePriceSPY: 50000,
    stakingRewardDaily: 200,
    maxSupply: 100,
    benefits: {
      earningMultiplier: 2.0,
      withdrawalFeeDiscount: 1.0,
      exclusiveTasksPerWeek: 999,
      stakingBoost: 0.25,
      revenueShare: 0.005
    }
  },
  Diamond: {
    tier: 'Diamond',
    premiumMonthsRequired: 36,
    purchasePriceSPY: 250000,
    stakingRewardDaily: 1000,
    maxSupply: 10,
    benefits: {
      earningMultiplier: 3.0,
      withdrawalFeeDiscount: 1.0,
      exclusiveTasksPerWeek: 999,
      stakingBoost: 0.50,
      revenueShare: 0.02,
      customNFT: true,
      lifetimePremium: true
    }
  }
}

export const upgradeCosts = {
  bronze_to_silver: {
    cost_spy: 2000,
    cost_usd: 20,
    cost_ngn: 30000,
    time_to_earn_days: 90,
    time_to_deposit_minutes: 2
  },
  silver_to_gold: {
    cost_spy: 10000,
    cost_usd: 100,
    cost_ngn: 150000,
    time_to_earn_days: 240,
    time_to_deposit_minutes: 2
  },
  gold_to_platinum: {
    cost_spy: 50000,
    cost_usd: 500,
    cost_ngn: 750000,
    time_to_earn_days: 720,
    time_to_deposit_minutes: 5
  },
  platinum_to_diamond: {
    cost_spy: 250000,
    cost_usd: 2500,
    cost_ngn: 3750000,
    time_to_earn_days: 1440,
    time_to_deposit_minutes: 10
  }
}
