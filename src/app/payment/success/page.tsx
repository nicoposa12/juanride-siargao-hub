'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updatePaymentRecord } from '@/lib/payment/paymongo'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
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

        // Update payment status to paid
        await updatePaymentRecord(bookingId, 'paid')

        // Update booking status to confirmed
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
  }, [bookingId, router])

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

