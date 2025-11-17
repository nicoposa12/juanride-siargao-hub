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
import PaymentMethodSelector, { PaymentMethodType } from '@/components/payment/PaymentMethodSelector'
import CardPaymentForm, { CardDetails } from '@/components/payment/CardPaymentForm'
import QRPHDisplay from '@/components/payment/QRPHDisplay'
import {
  createPaymentIntent,
  createPaymentMethod,
  attachPaymentIntent,
  createPaymentSource,
  createPaymentMethodSource,
  createPayment,
  createPaymentRecord,
  updatePaymentRecord,
  toCentavos,
  createQRPHPaymentIntent,
} from '@/lib/payment/paymongo'

interface BookingData {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  total_price: number
  status: string
  vehicle: {
    make: string
    model: string
    price_per_day: number
    image_urls: string[]
    location?: string | null
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams() as { bookingId?: string }
  const bookingId = params.bookingId
  const { toast } = useToast()
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null)
  const [cardDetails, setCardDetails] = useState<CardDetails | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [qrphData, setQrphData] = useState<{ paymentIntentId: string; qrCode: string } | null>(null)

  useEffect(() => {
    if (!bookingId) {
      return
    }
    fetchBookingData(bookingId)
  }, [bookingId])

  const fetchBookingData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles (
            make,
            model,
            price_per_day,
            image_urls,
            location
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setBooking(data)
    } catch (error) {
      console.error('Error fetching booking:', error)
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

    if (!booking || !user) {
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
      // Calculate payment processing fee (rounded to 2 decimals)
      const paymentProcessingFee = selectedPaymentMethod === 'card' 
        ? Math.round(((booking.total_price * 0.035) + 15) * 100) / 100
        : Math.round((booking.total_price * 0.025) * 100) / 100
      
      const totalAmount = Math.round((booking.total_price + paymentProcessingFee) * 100) / 100
      const amountInCentavos = toCentavos(totalAmount)
      
      // Create payment record in database (store total with fees)
      const paymentRecord = await createPaymentRecord(
        booking.id,
        totalAmount,
        selectedPaymentMethod
      )

      // Handle different payment methods
      if (selectedPaymentMethod === 'card') {
        // Card payment flow
        await handleCardPayment(amountInCentavos, paymentRecord.id)
      } else if (selectedPaymentMethod === 'qrph') {
        // QR PH payment flow
        await handleQRPHPayment(amountInCentavos, paymentRecord.id)
      } else {
        // E-wallet payment flow (GCash, Maya, GrabPay, BillEase)
        await handleEWalletPayment(
          amountInCentavos,
          selectedPaymentMethod as Exclude<PaymentMethodType, 'card' | 'qrph'>,
          paymentRecord.id
        )
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
      if (!cardDetails || !booking || !user) return
      const totalAmount = amount / 100

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
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
          email: user.email || '',
          phone: user.user_metadata?.phone_number || undefined,
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
              userEmail: user.email || '',
              userName: user.user_metadata?.full_name || 'Valued Customer',
              bookingId: booking.id,
              vehicleName: `${booking.vehicle?.make || ''} ${booking.vehicle?.model || 'Vehicle'}`.trim(),
              startDate: new Date(booking.start_date).toLocaleDateString(),
              endDate: new Date(booking.end_date).toLocaleDateString(),
              totalPrice: totalAmount,
              location: booking.vehicle?.location || 'Siargao',
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
              userEmail: user.email || '',
              userName: user.user_metadata?.full_name || 'Valued Customer',
              bookingId: booking.id,
              amount: totalAmount,
              paymentMethod: selectedPaymentMethod === 'card' ? 'Credit/Debit Card' : 
                           selectedPaymentMethod === 'gcash' ? 'GCash' : 'Maya',
              vehicleName: `${booking.vehicle?.make || ''} ${booking.vehicle?.model || 'Vehicle'}`.trim(),
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

  const handleQRPHPayment = async (amount: number, paymentRecordId: string) => {
    try {
      if (!booking || !user) return

      // Create QR PH payment intent
      const paymentIntent = await createQRPHPaymentIntent({
        amount,
        description: `JuanRide Booking #${booking.id.slice(0, 8)}`,
        metadata: {
          bookingId: booking.id,
          userId: user.id,
          vehicleId: booking.vehicle_id,
        },
      })

      // Update payment record with intent ID
      await updatePaymentRecord(booking.id, 'pending', paymentIntent.id)

      console.log('QR PH Payment Intent Created:', paymentIntent)
      
      // QR PH doesn't provide a QR code to display
      // Instead, show instructions with the payment intent ID
      setQrphData({
        paymentIntentId: paymentIntent.id,
        qrCode: paymentIntent.id, // Pass the intent ID as "qrCode" for now
      })

      // Don't set isProcessing to false - let QRPHDisplay component handle the flow
    } catch (error) {
      if (booking) {
        await updatePaymentRecord(booking.id, 'failed')
      }
      throw error
    }
  }

  const handleQRPHSuccess = async () => {
    if (!booking || !user) return

    try {
      // Update payment and booking status
      await updatePaymentRecord(booking.id, 'paid')
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id)

      // Send notifications
      try {
        const totalAmount = booking.total_price + (booking.total_price * 0.025)
        
        await fetch('/api/notifications/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking_confirmation',
            data: {
              userEmail: user.email || '',
              userName: user.user_metadata?.full_name || 'Valued Customer',
              bookingId: booking.id,
              vehicleName: `${booking.vehicle?.make || ''} ${booking.vehicle?.model || 'Vehicle'}`.trim(),
              startDate: new Date(booking.start_date).toLocaleDateString(),
              endDate: new Date(booking.end_date).toLocaleDateString(),
              totalPrice: totalAmount,
              location: booking.vehicle?.location || 'Siargao',
            },
          }),
        })

        await fetch('/api/notifications/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment_confirmation',
            data: {
              userEmail: user.email || '',
              userName: user.user_metadata?.full_name || 'Valued Customer',
              bookingId: booking.id,
              amount: totalAmount,
              paymentMethod: 'QR PH',
              vehicleName: `${booking.vehicle?.make || ''} ${booking.vehicle?.model || 'Vehicle'}`.trim(),
            },
          }),
        })

        console.log('✅ Notification emails sent successfully')
      } catch (emailError) {
        console.warn('⚠️ Failed to send notification emails:', emailError)
      }

      toast({
        title: 'Payment Successful!',
        description: 'Your booking has been confirmed.',
      })

      router.push(`/booking-confirmation/${booking.id}`)
    } catch (error) {
      console.error('Error completing QR PH payment:', error)
      toast({
        title: 'Error',
        description: 'Payment was successful but booking confirmation failed. Please contact support.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQRPHFailed = async () => {
    if (booking) {
      await updatePaymentRecord(booking.id, 'failed')
    }
    
    toast({
      title: 'Payment Failed',
      description: 'QR payment was not completed. Please try again.',
      variant: 'destructive',
    })
    
    setQrphData(null)
    setIsProcessing(false)
  }

  const handleEWalletPayment = async (
    amount: number,
    method: Exclude<PaymentMethodType, 'card' | 'qrph'>,
    paymentRecordId: string
  ) => {
    try {
      if (!booking || !user) return

      // Create payment source or payment method based on type
      // Sources API: gcash, grab_pay
      // Payment Methods API: paymaya, billease, dob
      let redirectUrl: string
      let sourceId: string
      
      if (method === 'gcash' || method === 'grab_pay') {
        // Use Sources API
        const source = await createPaymentSource({
          type: method,
          amount,
          redirect: {
            success: `${window.location.origin}/payment/success?bookingId=${booking.id}&sourceId=${encodeURIComponent('SOURCE_ID_PLACEHOLDER')}&amount=${amount}`,
            failed: `${window.location.origin}/payment/failed?bookingId=${booking.id}`,
          },
          billing: {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
            email: user.email || '',
            phone: user.user_metadata?.phone_number || '',
          },
        })

        redirectUrl = source.attributes.redirect?.checkout_url || ''
        sourceId = source.id
        
        // Store source ID in payment record for later use
        await updatePaymentRecord(booking.id, 'pending', sourceId)
        
      } else if (method === 'paymaya' || method === 'billease') {
        // Use Payment Methods API
        const paymentIntent = await createPaymentMethodSource({
          type: method as 'paymaya' | 'billease',
          amount,
          billing: {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
            email: user.email || '',
            phone: user.user_metadata?.phone_number || '',
          },
          redirect: {
            success: `${window.location.origin}/payment/success?bookingId=${booking.id}&intentId=${encodeURIComponent('INTENT_ID_PLACEHOLDER')}&amount=${amount}`,
            failed: `${window.location.origin}/payment/failed?bookingId=${booking.id}`,
          },
        })
        
        redirectUrl = paymentIntent.attributes.next_action?.redirect?.url || ''
        sourceId = paymentIntent.id
        
        // Store intent ID in payment record for later use
        await updatePaymentRecord(booking.id, 'pending', sourceId)
        
      } else {
        throw new Error('Unsupported payment method')
      }

      // Redirect to payment gateway
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        throw new Error('No checkout URL provided')
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
  // booking.total_price already includes the 5% service fee from when it was created
  // So we need to calculate the base price and service fee for display
  const basePrice = booking.total_price / 1.05 // Remove the 5% to get original price
  const serviceFee = booking.total_price - basePrice // The actual service fee

  // PayMongo transaction fees
  // GCash/Maya: 2.5%, Card: 3.5% + ₱15
  const getPaymentFee = () => {
    if (!selectedPaymentMethod) return 0
    if (selectedPaymentMethod === 'card') {
      return Math.round(((booking.total_price * 0.035) + 15) * 100) / 100
    }
    // GCash, Maya, GrabPay
    return Math.round((booking.total_price * 0.025) * 100) / 100
  }

  const paymentFee = getPaymentFee()
  const totalWithPaymentFee = Math.round((booking.total_price + paymentFee) * 100) / 100

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
            {qrphData ? (
              /* Show QR Code Display when QR PH payment is initiated */
              <QRPHDisplay
                paymentIntentId={qrphData.paymentIntentId}
                qrCodeData={qrphData.qrCode}
                amount={totalWithPaymentFee}
                onPaymentSuccess={handleQRPHSuccess}
                onPaymentFailed={handleQRPHFailed}
              />
            ) : (
              /* Show normal payment flow */
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
                          src={booking.vehicle.image_urls?.[0] || '/placeholder.svg'}
                          alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-semibold">{booking.vehicle.make} {booking.vehicle.model}</div>
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
                  {selectedPaymentMethod === 'card' && user && (
                    <CardPaymentForm
                      onCardDetailsChange={setCardDetails}
                      billingName={user.user_metadata?.full_name || user.email?.split('@')[0] || ''}
                      billingEmail={user.email || ''}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'} × ₱{booking.vehicle.price_per_day.toLocaleString('en-PH')}
                  </span>
                  <span>₱{basePrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Service fee (5%)</span>
                  <span>₱{serviceFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>₱{booking.total_price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>

                {selectedPaymentMethod && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Payment processing fee (
                        {selectedPaymentMethod === 'card' ? '3.5% + ₱15' : '2.5%'}
                        {selectedPaymentMethod === 'gcash' ? ' GCash' : selectedPaymentMethod === 'paymaya' ? ' Maya' : selectedPaymentMethod === 'grab_pay' ? ' GrabPay' : selectedPaymentMethod === 'billease' ? ' BillEase' : selectedPaymentMethod === 'qrph' ? ' QR PH' : selectedPaymentMethod === 'card' ? ' Card' : ''})
                      </span>
                      <span>₱{paymentFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between font-semibold text-lg">
                      <span>Total to Pay</span>
                      <span className="text-primary">₱{totalWithPaymentFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

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
              ) : selectedPaymentMethod ? (
                `Pay ₱${totalWithPaymentFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              ) : (
                'Select Payment Method'
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

