'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar as CalendarIcon, AlertCircle, Loader2 } from 'lucide-react'
import { format, differenceInDays, addDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatCurrency, calculateDays } from '@/lib/utils/format'
import { checkVehicleAvailability } from '@/lib/supabase/queries/vehicles'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

interface BookingWidgetProps {
  vehicle: any
  onBook?: () => void
}

export function BookingWidget({ vehicle, onBook }: BookingWidgetProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [bookingInProgress, setBookingInProgress] = useState(false)
  
  const handleStartDateSelect = async (date: Date | undefined) => {
    setStartDate(date)
    setIsAvailable(null)
    
    if (date && endDate) {
      await checkAvailability(date, endDate)
    } else if (date) {
      // Auto-select end date as 1 day after start date
      const nextDay = addDays(date, 1)
      setEndDate(nextDay)
      await checkAvailability(date, nextDay)
    }
  }
  
  const handleEndDateSelect = async (date: Date | undefined) => {
    setEndDate(date)
    setIsAvailable(null)
    
    if (startDate && date) {
      await checkAvailability(startDate, date)
    }
  }
  
  const checkAvailability = async (start: Date, end: Date) => {
    setCheckingAvailability(true)
    try {
      const available = await checkVehicleAvailability(
        vehicle.id,
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      )
      setIsAvailable(available)
      
      if (!available) {
        toast({
          title: 'Not Available',
          description: 'This vehicle is not available for the selected dates.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      toast({
        title: 'Error',
        description: 'Failed to check availability. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCheckingAvailability(false)
    }
  }
  
  const handleBooking = async () => {
    if (!user) {
      router.push(`/login?redirect=/vehicles/${vehicle.id}`)
      return
    }
    
    if (!startDate || !endDate) {
      toast({
        title: 'Select Dates',
        description: 'Please select both start and end dates for your rental.',
        variant: 'destructive',
      })
      return
    }
    
    if (isAvailable === false) {
      toast({
        title: 'Not Available',
        description: 'This vehicle is not available for the selected dates.',
        variant: 'destructive',
      })
      return
    }
    
    setBookingInProgress(true)
    
    try {
      // Create booking
      const bookingData = {
        vehicle_id: vehicle.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        total_price: calculateTotalPrice(),
      }
      
      // Store booking data in session storage for checkout
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData))
      
      // Redirect to checkout
      router.push(`/checkout?vehicle=${vehicle.id}&start=${format(startDate, 'yyyy-MM-dd')}&end=${format(endDate, 'yyyy-MM-dd')}`)
      
      onBook?.()
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: 'Booking Failed',
        description: 'Failed to create booking. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setBookingInProgress(false)
    }
  }
  
  const calculateTotalPrice = (): number => {
    if (!startDate || !endDate) return 0
    
    const days = calculateDays(startDate, endDate)
    
    // Check if weekly or monthly pricing is more economical
    if (vehicle.price_per_month && days >= 28) {
      const months = Math.floor(days / 28)
      const remainingDays = days % 28
      return (months * vehicle.price_per_month) + (remainingDays * vehicle.price_per_day)
    } else if (vehicle.price_per_week && days >= 7) {
      const weeks = Math.floor(days / 7)
      const remainingDays = days % 7
      return (weeks * vehicle.price_per_week) + (remainingDays * vehicle.price_per_day)
    } else {
      return days * vehicle.price_per_day
    }
  }
  
  const rentalDays = startDate && endDate ? calculateDays(startDate, endDate) : 0
  const totalPrice = calculateTotalPrice()
  const serviceFee = totalPrice * 0.05 // 5% service fee
  const finalPrice = totalPrice + serviceFee
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          {formatCurrency(vehicle.price_per_day)}
          <span className="text-base font-normal text-muted-foreground"> / day</span>
        </CardTitle>
        <CardDescription>Book this vehicle for your trip</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label>Rental Period</Label>
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'MMM dd, yyyy') : 'Start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateSelect}
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
                    'justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                  disabled={!startDate}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'MMM dd, yyyy') : 'End date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateSelect}
                  disabled={(date) => !startDate || date <= startDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Availability Status */}
        {checkingAvailability && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking availability...</span>
          </div>
        )}
        
        {isAvailable === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This vehicle is not available for the selected dates.
            </AlertDescription>
          </Alert>
        )}
        
        {isAvailable === true && (
          <Alert className="border-green-600 bg-green-50 text-green-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ✓ Vehicle is available for your selected dates!
            </AlertDescription>
          </Alert>
        )}
        
        {/* Price Breakdown */}
        {rentalDays > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatCurrency(vehicle.price_per_day)} × {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
                </span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Service fee (5%)</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(finalPrice)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleBooking}
          disabled={!startDate || !endDate || isAvailable === false || checkingAvailability || bookingInProgress}
          className="w-full"
          size="lg"
        >
          {bookingInProgress ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : !user ? (
            'Login to Book'
          ) : (
            'Reserve Now'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
