'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils/format'

interface PriceBreakdownProps {
  pricePerDay: number
  days: number
  pricePerWeek?: number
  pricePerMonth?: number
  serviceFeePercentage?: number
}

export function PriceBreakdown({
  pricePerDay,
  days,
  pricePerWeek,
  pricePerMonth,
  serviceFeePercentage = 0.05,
}: PriceBreakdownProps) {
  // Calculate optimal pricing
  let subtotal = 0
  let breakdown: string[] = []
  
  if (pricePerMonth && days >= 28) {
    const months = Math.floor(days / 28)
    const remainingDays = days % 28
    
    if (months > 0) {
      subtotal += months * pricePerMonth
      breakdown.push(`${months} ${months === 1 ? 'month' : 'months'} × ${formatCurrency(pricePerMonth)}`)
    }
    if (remainingDays > 0) {
      subtotal += remainingDays * pricePerDay
      breakdown.push(`${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} × ${formatCurrency(pricePerDay)}`)
    }
  } else if (pricePerWeek && days >= 7) {
    const weeks = Math.floor(days / 7)
    const remainingDays = days % 7
    
    if (weeks > 0) {
      subtotal += weeks * pricePerWeek
      breakdown.push(`${weeks} ${weeks === 1 ? 'week' : 'weeks'} × ${formatCurrency(pricePerWeek)}`)
    }
    if (remainingDays > 0) {
      subtotal += remainingDays * pricePerDay
      breakdown.push(`${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} × ${formatCurrency(pricePerDay)}`)
    }
  } else {
    subtotal = days * pricePerDay
    breakdown.push(`${days} ${days === 1 ? 'day' : 'days'} × ${formatCurrency(pricePerDay)}`)
  }
  
  const serviceFee = subtotal * serviceFeePercentage
  const total = subtotal + serviceFee
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {breakdown.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        ))}
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Service fee ({(serviceFeePercentage * 100).toFixed(0)}%)
          </span>
          <span>{formatCurrency(serviceFee)}</span>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between font-semibold text-lg">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default PriceBreakdown
