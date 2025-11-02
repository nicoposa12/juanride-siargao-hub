'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { CreditCard, Wallet, Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import PriceBreakdown from '@/components/booking/PriceBreakdown'

interface BookingData {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  total_price: number
  status: string
  vehicle: {
    name: string
    daily_rate: number
    image_url: string
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('gcash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookingData()
  }, [params.bookingId])

  const fetchBookingData = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles (
            name,
            daily_rate,
            image_url
          )
        `)
        .eq('id', params.bookingId)
        .single()

      if (error) throw error
      setBooking(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load booking details',
        variant: 'destructive',
      })
      router.push('/vehicles')
    } finally {
      setLoading(false)
    }
  }

  const calculateDays = () => {
    if (!booking) return 0
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const handlePayment = async () => {
    setIsProcessing(true)

    try {
      // Simulate payment processing (test mode)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', params.bookingId)

      if (error) throw error

      // Create payment record
      await supabase.from('payments').insert({
        booking_id: params.bookingId,
        amount: booking?.total_price,
        payment_method: paymentMethod,
        status: 'completed',
        transaction_id: `TEST_${Date.now()}`,
      })

      toast({
        title: 'Payment Successful!',
        description: 'Your booking has been confirmed.',
      })

      router.push(`/booking-confirmation/${params.bookingId}`)
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (!booking) return null

  const numberOfDays = calculateDays()
  const serviceFee = booking.total_price * 0.05 // 5% service fee

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Link href={`/vehicles/${booking.vehicle_id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicle
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Booking Summary */}
                <div>
                  <h3 className="font-semibold mb-3">Booking Summary</h3>
                  <div className="flex gap-4">
                    <img
                      src={booking.vehicle.image_url || '/placeholder.svg'}
                      alt={booking.vehicle.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div>
                      <div className="font-semibold">{booking.vehicle.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(booking.start_date).toLocaleDateString()} -{' '}
                        {new Date(booking.end_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Method */}
                <div>
                  <h3 className="font-semibold mb-4">Select Payment Method</h3>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="gcash" id="gcash" />
                        <Label htmlFor="gcash" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Wallet className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">GCash</div>
                            <div className="text-xs text-muted-foreground">Pay with GCash e-wallet</div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="font-medium">Credit/Debit Card</div>
                            <div className="text-xs text-muted-foreground">Visa, Mastercard, or JCB</div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="bank" id="bank" />
                        <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Building2 className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">Bank Transfer</div>
                            <div className="text-xs text-muted-foreground">Direct bank transfer</div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                  <div className="text-sm">
                    <strong>Test Mode:</strong> This is a test payment. No real charges will be made.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <PriceBreakdown
              dailyRate={booking.vehicle.daily_rate}
              numberOfDays={numberOfDays}
              serviceFee={serviceFee}
            />

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `Pay ₱${(booking.total_price + serviceFee).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              )}
            </Button>

            <div className="text-xs text-center text-muted-foreground">
              By confirming, you agree to our terms and conditions
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

