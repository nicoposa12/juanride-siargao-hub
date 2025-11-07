'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Calendar, Lock } from 'lucide-react'

interface CardPaymentFormProps {
  onCardDetailsChange: (details: CardDetails) => void
  billingName: string
  billingEmail: string
}

export interface CardDetails {
  cardNumber: string
  expMonth: string
  expYear: string
  cvc: string
  isValid: boolean
}

export default function CardPaymentForm({
  onCardDetailsChange,
  billingName,
  billingEmail,
}: CardPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const groups = cleaned.match(/.{1,4}/g)
    return groups ? groups.join(' ') : cleaned
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
    }
    return cleaned
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '')
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(value)
      updateCardDetails(value, expiry, cvc)
    }
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 4) {
      setExpiry(value)
      updateCardDetails(cardNumber, value, cvc)
    }
  }

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setCvc(value)
      updateCardDetails(cardNumber, expiry, value)
    }
  }

  const updateCardDetails = (card: string, exp: string, cvv: string) => {
    const isCardValid = card.length === 16
    const isExpiryValid = exp.length === 4
    const isCvcValid = cvv.length >= 3

    const expMonth = exp.slice(0, 2)
    const expYear = exp.slice(2, 4)

    onCardDetailsChange({
      cardNumber: card,
      expMonth,
      expYear: '20' + expYear, // Convert to full year
      cvc: cvv,
      isValid: isCardValid && isExpiryValid && isCvcValid,
    })
  }

  const getCardType = (number: string) => {
    const firstDigit = number.charAt(0)
    if (firstDigit === '4') return 'Visa'
    if (firstDigit === '5') return 'Mastercard'
    if (firstDigit === '3') return 'Amex'
    return null
  }

  const cardType = getCardType(cardNumber)

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="card-number">Card Number</Label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="card-number"
            placeholder="1234 5678 9012 3456"
            value={formatCardNumber(cardNumber)}
            onChange={handleCardNumberChange}
            className="pl-10"
            maxLength={19}
          />
          {cardType && (
            <span className="absolute right-3 top-3 text-xs font-semibold text-muted-foreground">
              {cardType}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiry">Expiry Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="expiry"
              placeholder="MM/YY"
              value={formatExpiry(expiry)}
              onChange={handleExpiryChange}
              className="pl-10"
              maxLength={5}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cvc">CVC</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="cvc"
              type="password"
              placeholder="123"
              value={cvc}
              onChange={handleCvcChange}
              className="pl-10"
              maxLength={4}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-2 border-t">
        <h4 className="font-semibold text-sm">Billing Information</h4>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{billingName || 'Not provided'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{billingEmail || 'Not provided'}</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Lock className="h-4 w-4 text-gray-600 mt-0.5" />
          <div className="text-xs text-gray-600">
            <p className="font-semibold mb-0.5">Secure Payment</p>
            <p>
              Your card information is transmitted securely using 256-bit SSL encryption.
              We never store your card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

