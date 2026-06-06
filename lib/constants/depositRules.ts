
export const depositRules = {
  minimum: {
    USD: 7,
    NGN: 10500,
    USDT: 7,
  },
  maximum: {
    USD: 5000,
    NGN: 7500000,
    USDT: 5000,
  },
  dailyLimit: {
    unverifiedUser: 500,
    verifiedUser: 5000,
    premiumUser: 10000,
  },
  exchangeRate: {
    USD_TO_SPY: 100,
    NGN_TO_SPY: 0.0666667,
  },
  depositedSpyLock: {
    isLocked: true,
    lockDurationDays: 30,
    withdrawableAfterDays: 30,
    reason: "Anti-money laundering and fraud prevention",
    userMessage: "SPY purchased via deposit will be available for withdrawal after 30 days. SPY earned from tasks, ads, and referrals is available immediately."
  }
}

export const withdrawalRules = {
  minimum: {
    SPY: 500,
    USD: 5,
    NGN: 7500,
  },
  maximum: {
    SPY: 50000,
    USD: 500,
    NGN: 750000,
  },
  fees: {
    percentage: 2,
    minimumSpy: 10,
  },
  processing: {
    time: "2-24 hours",
    requiresManualReview: true,
  },
  methods: [
    { name: "USDT (BEP-20)", minSpy: 500, fee: "2%", time: "1-4 hours" },
    { name: "Bank Transfer (NGN)", minSpy: 500, fee: "2%", time: "1-24 hours" },
  ]
}
