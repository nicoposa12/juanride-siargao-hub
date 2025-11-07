'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import PriceBreakdown from '@/components/booking/PriceBreakdown'
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector'
import CardPaymentForm, { CardDetails } from '@/components/payment/CardPaymentForm'
import {
  createPaymentIntent,
  createPaymentMethod,
  attachPaymentIntent,
  createPaymentSource,
  createPayment,
  createPaymentRecord,
  updatePaymentRecord,
  toCentavos,
  PaymentMethodType,
} from '@/lib/payment/paymongo'

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
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null)
  const [cardDetails, setCardDetails] = useState<CardDetails | null>(null)
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
    if (!selectedPaymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method to continue.',
        variant: 'destructive',
      })
      return
    }

    if (!booking || !user || !profile) {
      toast({
        title: 'Error',
        description: 'Missing required information. Please try again.',
        variant: 'destructive',
      })
      return
    }

    // Validate card details for card payments
    if (selectedPaymentMethod === 'card' && (!cardDetails || !cardDetails.isValid)) {
      toast({
        title: 'Invalid Card Details',
        description: 'Please check your card information and try again.',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)

    try {
      const totalAmount = booking.total_price + (booking.total_price * 0.05) // Include service fee
      const amountInCentavos = toCentavos(totalAmount)
      
      // Create payment record in database
      const paymentRecord = await createPaymentRecord(
        booking.id,
        totalAmount,
        selectedPaymentMethod
      )

      // Handle different payment methods
      if (selectedPaymentMethod === 'card') {
        // Card payment flow
        await handleCardPayment(amountInCentavos, paymentRecord.id)
      } else {
        // E-wallet payment flow (GCash, Maya, GrabPay)
        await handleEWalletPayment(amountInCentavos, selectedPaymentMethod, paymentRecord.id)
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
      setIsProcessing(false)
    }
  }

  const handleCardPayment = async (amount: number, paymentRecordId: string) => {
    try {
      if (!cardDetails || !profile || !booking) return

      // Step 1: Create payment intent
      const paymentIntent = await createPaymentIntent({
        amount,
        description: `JuanRide Booking #${booking.id.slice(0, 8)}`,
        paymentMethod: 'card',
        metadata: {
          bookingId: booking.id,
          userId: user!.id,
          vehicleId: booking.vehicle_id,
        },
      })

      // Step 2: Create payment method (tokenize card)
      const paymentMethodData = await createPaymentMethod({
        cardNumber: cardDetails.cardNumber,
        expMonth: parseInt(cardDetails.expMonth),
        expYear: parseInt(cardDetails.expYear),
        cvc: cardDetails.cvc,
        billingDetails: {
          name: profile.full_name || 'Unknown',
          email: profile.email,
          phone: profile.phone_number || undefined,
        },
      })

      // Step 3: Attach payment method to intent
      const attachedIntent = await attachPaymentIntent(
        paymentIntent.id,
        paymentMethodData.id
      )

      // Check if payment requires additional authentication (3D Secure)
      if (attachedIntent.attributes.status === 'awaiting_payment_method') {
        throw new Error('Payment authentication required. Please try again.')
      }

      // Step 4: Update payment record and booking
      await updatePaymentRecord(booking.id, 'paid', paymentIntent.id)
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id)

      // Step 5: Send notifications
      try {
        // Send booking confirmation email
        await fetch('/api/notifications/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking_confirmation',
            data: {
              userEmail: profile.email,
              userName: profile.full_name || 'Valued Customer',
              bookingId: booking.id,
              vehicleName: booking.vehicles?.name || 'Vehicle',
              startDate: new Date(booking.start_date).toLocaleDateString(),
              endDate: new Date(booking.end_date).toLocaleDateString(),
              totalPrice: totalAmount,
              location: booking.vehicles?.location || 'Siargao',
            },
          }),
        })

        // Send payment confirmation email
        await fetch('/api/notifications/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment_confirmation',
            data: {
              userEmail: profile.email,
              userName: profile.full_name || 'Valued Customer',
              bookingId: booking.id,
              amount: totalAmount,
              paymentMethod: selectedPaymentMethod === 'card' ? 'Credit/Debit Card' : 
                           selectedPaymentMethod === 'gcash' ? 'GCash' : 'Maya',
              vehicleName: booking.vehicles?.name || 'Vehicle',
            },
          }),
        })

        console.log('✅ Notification emails sent successfully')
      } catch (emailError) {
        console.warn('⚠️ Failed to send notification emails:', emailError)
        // Don't fail the booking for email issues
      }

      toast({
        title: 'Payment Successful!',
        description: 'Your booking has been confirmed.',
      })

      router.push(`/booking-confirmation/${booking.id}`)
    } catch (error) {
      await updatePaymentRecord(booking!.id, 'failed')
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEWalletPayment = async (
    amount: number,
    method: PaymentMethodType,
    paymentRecordId: string
  ) => {
    try {
      if (!booking || !profile) return

      // Create payment source
      const source = await createPaymentSource({
        type: method === 'paymaya' ? 'gcash' : method, // PayMongo doesn't have 'paymaya' type, use gcash
        amount,
        redirect: {
          success: `${window.location.origin}/payment/success?bookingId=${booking.id}`,
          failed: `${window.location.origin}/payment/failed?bookingId=${booking.id}`,
        },
        billing: {
          name: profile.full_name || 'Unknown',
          email: profile.email,
          phone: profile.phone_number || '',
        },
      })

      // Create payment with source
      const payment = await createPayment(
        source.id,
        `JuanRide Booking #${booking.id.slice(0, 8)}`,
        {
          bookingId: booking.id,
          userId: user!.id,
          vehicleId: booking.vehicle_id,
        }
      )

      // Update payment record with transaction ID
      await updatePaymentRecord(booking.id, 'pending', payment.id)

      // Redirect to payment gateway
      if (source.attributes.redirect?.checkout_url) {
        window.location.href = source.attributes.redirect.checkout_url
      } else {
        throw new Error('Payment redirect URL not available')
      }
    } catch (error) {
      if (booking) {
        await updatePaymentRecord(booking.id, 'failed')
      }
      throw error
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
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={booking.vehicle.image_url || '/placeholder.svg'}
                        alt={booking.vehicle.name}
                        fill
                        className="object-cover"
                      />
                    </div>
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
                  <PaymentMethodSelector
                    selectedMethod={selectedPaymentMethod}
                    onSelectMethod={setSelectedPaymentMethod}
                  />
                </div>

                <Separator />

                {/* Card Payment Form */}
                {selectedPaymentMethod === 'card' && profile && (
                  <CardPaymentForm
                    onCardDetailsChange={setCardDetails}
                    billingName={profile.full_name || ''}
                    billingEmail={profile.email}
                  />
                )}
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
              disabled={isProcessing || !selectedPaymentMethod || (selectedPaymentMethod === 'card' && (!cardDetails || !cardDetails.isValid))}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
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

