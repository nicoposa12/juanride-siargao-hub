'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updatePaymentRecord } from '@/lib/payment/paymongo'

export default function PaymentFailedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')

  useEffect(() => {
    if (!bookingId) return

    const markPaymentFailed = async () => {
      try {
        // Update payment status to failed
        await updatePaymentRecord(bookingId, 'failed')
      } catch (err) {
        console.error('Error marking payment as failed:', err)
      }
    }

    markPaymentFailed()
  }, [bookingId])

  const handleTryAgain = () => {
    if (bookingId) {
      router.push(`/checkout/${bookingId}`)
    } else {
      router.push('/vehicles')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-red-700">
            Payment Failed
          </CardTitle>
          <CardDescription className="text-lg">
            Your payment could not be processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-left bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm">Common reasons:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Insufficient funds in your account</li>
              <li>Incorrect payment details</li>
              <li>Payment was cancelled</li>
              <li>Network connection issues</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button onClick={handleTryAgain} className="w-full">
              Try Again
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/vehicles">Browse Vehicles</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@juanride.com" className="text-primary hover:underline">
              support@juanride.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

