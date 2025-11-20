'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updatePaymentRecord, createPayment } from '@/lib/payment/paymongo'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams?.get('bookingId')
  const amount = searchParams?.get('amount')
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!bookingId) {
      setError(true)
      setProcessing(false)
      return
    }

    const confirmPayment = async () => {
      try {
        const supabase = createClient()

        // Get the payment record to check current status
        const { data: paymentRecord } = await supabase
          .from('payments')
          .select('transaction_id, payment_method, status')
          .eq('booking_id', bookingId)
          .single()

        console.log('[Payment Success] Payment record:', {
          bookingId,
          transactionId: paymentRecord?.transaction_id,
          paymentMethod: paymentRecord?.payment_method,
          status: paymentRecord?.status,
        })

        // If payment is already marked as paid, skip payment creation
        if (paymentRecord?.status === 'paid') {
          console.log('[Payment Success] Payment already processed, skipping charge')
          
          // Automatically confirm booking after successful payment
          await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', bookingId)

          setProcessing(false)

          // Redirect to booking confirmation after 2 seconds
          setTimeout(() => {
            router.push(`/booking-confirmation/${bookingId}`)
          }, 2000)
          return
        }

        // Determine if this payment method uses Sources API or Payment Intents API
        const sourceBasedMethods = ['gcash', 'grab_pay']
        const paymentIntentMethods = ['paymaya', 'billease', 'card', 'qrph']
        
        const isSourceBased = paymentRecord?.payment_method && 
                              sourceBasedMethods.includes(paymentRecord.payment_method)
        const isPaymentIntent = paymentRecord?.payment_method && 
                                paymentIntentMethods.includes(paymentRecord.payment_method)

        console.log('[Payment Success] Payment method classification:', {
          paymentMethod: paymentRecord?.payment_method,
          isSourceBased,
          isPaymentIntent,
          transactionIdPrefix: paymentRecord?.transaction_id?.substring(0, 3),
        })

        // Only create payment for SOURCE-based methods (GCash, GrabPay)
        // Payment Intent methods (PayMaya, BillEase, Card) are self-contained
        if (isSourceBased && paymentRecord?.transaction_id && amount) {
          // Validate we have a source ID
          if (!paymentRecord.transaction_id.startsWith('src_')) {
            console.error('[Payment Success] Invalid transaction ID format:', {
              transactionId: paymentRecord.transaction_id,
              paymentMethod: paymentRecord.payment_method,
              expected: 'src_*',
              actual: paymentRecord.transaction_id.substring(0, 3) + '_*',
            })
            throw new Error(
              `Invalid transaction ID for ${paymentRecord.payment_method}: ` +
              `Expected source ID (src_*), got ${paymentRecord.transaction_id.substring(0, 10)}...`
            )
          }

          // Get booking details for metadata
          const { data: booking } = await supabase
            .from('bookings')
            .select('id, vehicle_id, renter_id')
            .eq('id', bookingId)
            .single()

          if (booking) {
            try {
              console.log('[Payment Success] Creating payment for source-based method')
              // Create payment with the now-chargeable source
              const payment = await createPayment(
                paymentRecord.transaction_id,
                parseInt(amount),
                `JuanRide Booking #${bookingId.slice(0, 8)}`,
                {
                  bookingId: booking.id,
                  userId: booking.renter_id,
                  vehicleId: booking.vehicle_id,
                }
              )

              console.log('[Payment Success] Payment created successfully:', payment.id)
              // Update payment status with transaction ID
              await updatePaymentRecord(bookingId, 'paid', payment.id)
            } catch (paymentError: any) {
              console.error('[Payment Success] Payment creation error:', paymentError)
              
              // Check if error is because source was already charged
              if (paymentError.message?.includes('not chargeable') || 
                  paymentError.message?.includes('already been used')) {
                console.log('[Payment Success] Source already charged, marking as paid')
                // Just mark as paid - the payment was already processed
                await updatePaymentRecord(bookingId, 'paid', paymentRecord.transaction_id)
              } else {
                // Re-throw other errors
                throw paymentError
              }
            }
          }
        } else if (isPaymentIntent) {
          // Payment Intent methods don't need /payments endpoint
          // Just mark as paid since PayMongo handles it automatically
          console.log('[Payment Success] Payment Intent method - marking as paid without creating payment')
          await updatePaymentRecord(bookingId, 'paid', paymentRecord?.transaction_id)
        } else {
          // Unknown or already processed
          console.log('[Payment Success] No payment creation needed, updating status')
          await updatePaymentRecord(bookingId, 'paid')
        }

        // Automatically confirm booking after successful payment
        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', bookingId)

        setProcessing(false)

        // Redirect to booking confirmation after 2 seconds
        setTimeout(() => {
          router.push(`/booking-confirmation/${bookingId}`)
        }, 2000)
      } catch (err) {
        console.error('Error confirming payment:', err)
        setError(true)
        setProcessing(false)
      }
    }

    confirmPayment()
  }, [bookingId, amount, router])

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Loader2 className="h-16 w-16 animate-spin text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Processing Payment...</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-700">Payment Error</CardTitle>
            <CardDescription>
              Something went wrong while processing your payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please contact support if you believe this is an error.
            </p>
            <Button asChild className="w-full">
              <Link href="/">Return to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-green-700">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-lg">
            Your booking has been confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Redirecting you to your booking confirmation...
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Homepage</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href={`/booking-confirmation/${bookingId}`}>
                View Booking
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

