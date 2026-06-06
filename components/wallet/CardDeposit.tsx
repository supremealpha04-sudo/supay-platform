// components/wallet/CardDeposit.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CardDepositProps {
  amount: number
  onSuccess: () => void
}

export function CardDeposit({ amount, onSuccess }: CardDepositProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })

  const handlePayment = async () => {
    setIsLoading(true)
    // Integrate with Paystack inline.js
    // const handler = PaystackPop.setup({...})
    // handler.openIframe()
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <Input
        label="Card Number"
        placeholder="1234 5678 9012 3456"
        value={cardDetails.number}
        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Expiry (MM/YY)"
          placeholder="12/25"
          value={cardDetails.expiry}
          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
        />
        <Input
          label="CVV"
          placeholder="123"
          type="password"
          value={cardDetails.cvv}
          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
        />
      </div>
      <Input
        label="Cardholder Name"
        placeholder="John Doe"
        value={cardDetails.name}
        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
      />

      <Button onClick={handlePayment} isLoading={isLoading} fullWidth>
        Pay ${amount}
      </Button>
    </div>
  )
}
