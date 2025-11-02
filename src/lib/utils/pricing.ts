import { differenceInDays } from 'date-fns'

export function calculateDays(startDate: Date, endDate: Date): number {
  const days = differenceInDays(endDate, startDate)
  return days === 0 ? 1 : days
}

export function calculateTotalPrice(
  startDate: Date,
  endDate: Date,
  dailyRate: number,
  weeklyRate?: number,
  monthlyRate?: number
): number {
  const days = calculateDays(startDate, endDate)
  
  // Apply weekly or monthly rates if available and beneficial
  if (monthlyRate && days >= 30) {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    return (months * monthlyRate) + (remainingDays * dailyRate)
  }
  
  if (weeklyRate && days >= 7) {
    const weeks = Math.floor(days / 7)
    const remainingDays = days % 7
    return (weeks * weeklyRate) + (remainingDays * dailyRate)
  }
  
  return days * dailyRate
}

export function calculateServiceFee(subtotal: number, feePercentage: number = 0.05): number {
  return subtotal * feePercentage
}

export function calculateTotal(subtotal: number, serviceFee: number): number {
  return subtotal + serviceFee
}

export interface PriceBreakdown {
  days: number
  dailyRate: number
  subtotal: number
  serviceFee: number
  total: number
}

export function getPriceBreakdown(
  startDate: Date,
  endDate: Date,
  dailyRate: number,
  weeklyRate?: number,
  monthlyRate?: number
): PriceBreakdown {
  const days = calculateDays(startDate, endDate)
  const subtotal = calculateTotalPrice(startDate, endDate, dailyRate, weeklyRate, monthlyRate)
  const serviceFee = calculateServiceFee(subtotal)
  const total = calculateTotal(subtotal, serviceFee)
  
  return {
    days,
    dailyRate,
    subtotal,
    serviceFee,
    total
  }
}

