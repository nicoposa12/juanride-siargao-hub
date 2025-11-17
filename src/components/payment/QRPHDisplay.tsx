'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, RefreshCw, Smartphone, Copy, Check, QrCode } from 'lucide-react'

interface QRPHDisplayProps {
  paymentIntentId: string
  qrCodeData: string // Not used for QR PH, but kept for compatibility
  amount: number
  onPaymentSuccess: () => void
  onPaymentFailed: () => void
}

export default function QRPHDisplay({
  paymentIntentId,
  amount,
  onPaymentSuccess,
  onPaymentFailed,
}: QRPHDisplayProps) {
  const [status, setStatus] = useState<'pending' | 'checking' | 'paid' | 'failed'>('pending')
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [remainingTime, setRemainingTime] = useState(600) // 10 minutes in seconds
  const [copied, setCopied] = useState(false)

  // Get last 8 characters of payment intent ID for display
  const referenceNumber = paymentIntentId.slice(-8).toUpperCase()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referenceNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Poll payment status every 5 seconds
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        setStatus('checking')
        
        // Call API route to get payment intent status
        const response = await fetch(`/api/paymongo/payment-intents/${paymentIntentId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch payment intent')
        }
        
        const { data: paymentIntent } = await response.json()
        
        if (paymentIntent.status === 'succeeded') {
          setStatus('paid')
          if (pollingInterval) clearInterval(pollingInterval)
          onPaymentSuccess()
        } else if (paymentIntent.status === 'processing') {
          setStatus('pending')
        } else if (
          paymentIntent.status === 'awaiting_payment_method' ||
          paymentIntent.status === 'awaiting_next_action'
        ) {
          setStatus('pending')
        } else {
          setStatus('failed')
          if (pollingInterval) clearInterval(pollingInterval)
          onPaymentFailed()
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
        setStatus('pending')
      }
    }

    // Start polling every 5 seconds
    const interval = setInterval(checkPaymentStatus, 5000)
    setPollingInterval(interval)

    // Initial check
    checkPaymentStatus()

    // Cleanup on unmount
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [paymentIntentId])

  // Countdown timer
  useEffect(() => {
    if (status === 'paid' || status === 'failed') return

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setStatus('failed')
          if (pollingInterval) clearInterval(pollingInterval)
          onPaymentFailed()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [status])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleRefresh = async () => {
    try {
      setStatus('checking')
      
      const response = await fetch(`/api/paymongo/payment-intents/${paymentIntentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch payment intent')
      }
      
      const { data: paymentIntent } = await response.json()
      
      if (paymentIntent.status === 'succeeded') {
        setStatus('paid')
        onPaymentSuccess()
      } else {
        setStatus('pending')
      }
    } catch (error) {
      console.error('Error refreshing payment status:', error)
    }
  }

  return (
    <div className="space-y-4">
      {status === 'paid' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment successful! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      {status === 'failed' && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Payment failed or expired. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>QR PH Payment Instructions</span>
            {status === 'checking' && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code and Reference Number Display */}
          <div className="space-y-4">
            {/* QR Code - Placeholder for merchant QR code */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-3">Scan this QR Code with your banking app</div>
              <div className="bg-white p-6 rounded-lg border-2 border-indigo-300 shadow-lg">
                <Image 
                  src="/qr-ph-merchant.png" 
                  alt="JuanRide QR PH Merchant Code" 
                  width={192} 
                  height={192}
                  className="rounded"
                />
              </div>
            </div>

            {/* Amount and Reference Number */}
            <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Payment Amount</div>
              <div className="text-3xl font-bold text-primary mb-3">
                ₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-600 mb-1">Reference Number</div>
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <span className="text-xl font-mono font-bold text-indigo-600">
                  {referenceNumber}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-7 w-7 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Smartphone className="h-5 w-5 text-primary" />
              <span>How to Pay via QR PH:</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 pl-2">
              <li className="pl-2">
                <span className="font-medium">Open your banking app</span> (GCash, Maya, BDO, BPI, UnionBank, etc.)
              </li>
              <li className="pl-2">
                <span className="font-medium">Select "Scan QR" or "QR Payment"</span>
              </li>
              <li className="pl-2">
                <span className="font-medium">Scan the QR code above</span>
              </li>
              <li className="pl-2">
                <span className="font-medium">Verify the payment amount</span> matches ₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </li>
              <li className="pl-2">
                <span className="font-medium">Enter the reference number:</span> <span className="font-mono font-semibold">{referenceNumber}</span>
              </li>
              <li className="pl-2">
                <span className="font-medium">Confirm the payment</span> in your app
              </li>
              <li className="pl-2">
                <span className="font-medium">Wait for confirmation</span> - this page will update automatically
              </li>
            </ol>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-blue-900">
              {status === 'pending' ? '⏳ Waiting for payment...' : status === 'checking' ? '🔄 Checking status...' : '✅ Payment confirmed'}
            </span>
            <span className="text-lg font-bold text-blue-900">
              {formatTime(remainingTime)}
            </span>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRefresh}
            disabled={status === 'checking' || status === 'paid'}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Payment Status
          </Button>

          {/* Info Alert */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800 text-xs">
              <strong>Important:</strong> Scan the QR code and enter reference number <span className="font-mono font-bold">{referenceNumber}</span> in your banking app. Payment expires in {formatTime(remainingTime)}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
