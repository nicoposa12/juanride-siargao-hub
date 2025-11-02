'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils/format'
import { getPriceBreakdown } from '@/lib/utils/pricing'
import { useAuth } from '@/hooks/use-auth'
import { useCreateBooking } from '@/hooks/use-bookings'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils/cn'

interface BookingWidgetProps {
  vehicleId: string
  pricePerDay: number
  pricePerWeek?: number
  pricePerMonth?: number
}

export default function BookingWidget({ 
  vehicleId, 
  pricePerDay,
  pricePerWeek,
  pricePerMonth
}: BookingWidgetProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const createBooking = useCreateBooking()

  const pricing = startDate && endDate
    ? getPriceBreakdown(startDate, endDate, pricePerDay, pricePerWeek, pricePerMonth)
    : null

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to make a booking.',
        variant: 'destructive',
      })
      router.push('/login')
      return
    }

    if (!startDate || !endDate) {
      toast({
        title: 'Select dates',
        description: 'Please select start and end dates for your rental.',
        variant: 'destructive',
      })
      return
    }

    createBooking.mutate(
      {
        vehicle_id: vehicleId,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      },
      {
        onSuccess: (data) => {
          router.push(`/checkout/${data.id}`)
        },
      }
    )
  }

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formatCurrency(pricePerDay)}</span>
          <span className="text-muted-foreground">/ day</span>
        </div>
        {pricePerWeek && (
          <p className="text-sm text-muted-foreground">
            {formatCurrency(pricePerWeek)} / week
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Selection */}
        <div className="space-y-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'MMM dd, yyyy') : 'Check-in'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'MMM dd, yyyy') : 'Check-out'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => !startDate || date <= startDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Price Breakdown */}
        {pricing && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {formatCurrency(pricing.dailyRate)} × {pricing.days} {pricing.days === 1 ? 'day' : 'days'}
                </span>
                <span>{formatCurrency(pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service fee</span>
                <span>{formatCurrency(pricing.serviceFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(pricing.total)}</span>
              </div>
            </div>
          </>
        )}

        {/* Book Button */}
        <Button 
          onClick={handleBooking}
          disabled={!startDate || !endDate || createBooking.isPending}
          className="w-full"
          size="lg"
        >
          {createBooking.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Reserve Now'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          You won't be charged yet
        </p>
      </CardContent>
    </Card>
  )
}

