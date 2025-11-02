'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface PriceBreakdownProps {
  dailyRate: number
  numberOfDays: number
  serviceFee?: number
  discount?: number
}

export default function PriceBreakdown({
  dailyRate,
  numberOfDays,
  serviceFee = 0,
  discount = 0,
}: PriceBreakdownProps) {
  const subtotal = dailyRate * numberOfDays
  const total = subtotal + serviceFee - discount

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(dailyRate)} × {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'}
            </span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {serviceFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service fee</span>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-lg">{formatCurrency(total)}</span>
        </div>

        <div className="text-xs text-muted-foreground">
          You won't be charged yet. Final payment is due upon pickup.
        </div>
      </CardContent>
    </Card>
  )
}

