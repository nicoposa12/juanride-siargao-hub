'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  MessageSquare,
  Download,
  Home,
  Clock,
  CreditCard,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency, formatDate, calculateDays } from '@/lib/utils/format'
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants'
import type { BookingWithDetails } from '@/lib/supabase/queries/bookings'

interface BookingConfirmationProps {
  booking: BookingWithDetails
}

export function BookingConfirmation({ booking }: BookingConfirmationProps) {
  const router = useRouter()
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)
  
  const vehicle = booking.vehicle
  const owner = vehicle?.owner
  const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment
  
  const rentalDays = calculateDays(booking.start_date, booking.end_date)
  
  const handleDownloadReceipt = async () => {
    setDownloadingReceipt(true)
    // TODO: Implement PDF receipt generation
    setTimeout(() => {
      setDownloadingReceipt(false)
      alert('Receipt download functionality will be implemented with PDF generation')
    }, 1000)
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Status / Success Header */}
        <div className="text-center mb-8">
          {booking.status === 'pending' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Booking Request Submitted!</h1>
              <p className="text-muted-foreground">Your booking request has been sent and is awaiting owner confirmation.</p>
            </>
          )}
          
          {booking.status === 'paid' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">Awaiting owner confirmation of your booking.</p>
            </>
          )}
          
          {booking.status === 'confirmed' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
              <p className="text-muted-foreground">Your booking has been confirmed by the owner.</p>
            </>
          )}
          
          {booking.status === 'active' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Vehicle Picked Up!</h1>
              <p className="text-muted-foreground">Your rental is currently active. Enjoy your ride!</p>
            </>
          )}
          
          {booking.status === 'completed' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Rental Completed!</h1>
              <p className="text-muted-foreground">Your rental has been completed successfully. Thank you for using JuanRide!</p>
            </>
          )}
          
          {booking.status === 'cancelled' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Booking Cancelled</h1>
              <p className="text-muted-foreground">This booking has been cancelled.</p>
            </>
          )}
        </div>
        
        {/* Status Alert */}
        {booking.status === 'pending' && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Pending Confirmation</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Your booking is pending confirmation from the vehicle owner. You'll receive a notification once it's confirmed.
            </AlertDescription>
          </Alert>
        )}
        
        {booking.status === 'paid' && (
          <Alert className="bg-blue-50 border-blue-200">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Payment Completed</AlertTitle>
            <AlertDescription className="text-blue-700">
              Your payment has been processed successfully. The vehicle owner will review and confirm your booking shortly.
            </AlertDescription>
          </Alert>
        )}
        
        {booking.status === 'confirmed' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Confirmed</AlertTitle>
            <AlertDescription className="text-green-700">
              Your booking has been confirmed by the owner. Get ready for your trip!
            </AlertDescription>
          </Alert>
        )}
        
        {booking.status === 'active' && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Active Rental</AlertTitle>
            <AlertDescription className="text-blue-700">
              Your vehicle has been picked up and your rental is currently active. Drive safely!
            </AlertDescription>
          </Alert>
        )}
        
        {booking.status === 'completed' && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Rental Completed</AlertTitle>
            <AlertDescription className="text-green-700">
              Your rental has been completed successfully. We hope you had a great experience!
            </AlertDescription>
          </Alert>
        )}
        
        {booking.status === 'cancelled' && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Booking Cancelled</AlertTitle>
            <AlertDescription className="text-red-700">
              This booking has been cancelled. If you have any questions, please contact support.
            </AlertDescription>
          </Alert>
        )}
        
        {payment && payment.status === 'pending' && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Payment Pending</AlertTitle>
            <AlertDescription className="text-blue-700">
              Payment will be processed once the owner confirms your booking.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Booking Reference */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Booking Reference</CardTitle>
                <CardDescription className="mt-1 font-mono text-base">
                  #{booking.id.split('-')[0].toUpperCase()}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(booking.status)}>
                {BOOKING_STATUS_LABELS[booking.status as keyof typeof BOOKING_STATUS_LABELS]}
              </Badge>
            </div>
          </CardHeader>
        </Card>
        
        {/* Vehicle & Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vehicle Info */}
            {vehicle && (
              <div className="flex gap-4">
                <div className="relative h-24 w-32 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={vehicle.image_urls?.[0] || '/placeholder.svg'}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {vehicle.location}
                  </p>
                  <Button
                    variant="link"
                    className="h-auto p-0 mt-2"
                    asChild
                  >
                    <Link href={`/vehicles/${vehicle.id}`}>
                      View Vehicle Details
                    </Link>
                  </Button>
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Rental Period */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Check-in
                </Label>
                <p className="font-medium text-lg">{formatDate(booking.start_date)}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Check-out
                </Label>
                <p className="font-medium text-lg">{formatDate(booking.end_date)}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="font-semibold text-lg">
                {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
              </p>
            </div>
            
            {/* Locations */}
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Pickup Location
                </Label>
                <p className="font-medium">{booking.pickup_location || 'To be confirmed'}</p>
              </div>
              {booking.return_location && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Return Location
                  </Label>
                  <p className="font-medium">{booking.return_location}</p>
                </div>
              )}
            </div>
            
            {/* Special Requests */}
            {booking.special_requests && (
              <div>
                <Label className="text-muted-foreground">Special Requests</Label>
                <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">
                  {booking.special_requests}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Payment Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Payment Summary</span>
              {payment && (
                <Badge className={getPaymentStatusColor(payment.status)}>
                  {PAYMENT_STATUS_LABELS[payment.status as keyof typeof PAYMENT_STATUS_LABELS]}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Calculate base price and fees */}
            {(() => {
              const basePrice = booking.total_price / 1.05 // Remove 5% service fee
              const serviceFee = booking.total_price - basePrice
              
              // Calculate payment processing fee based on payment method
              let paymentProcessingFee = 0
              let paymentFeeLabel = ''
              if (payment) {
                if (payment.payment_method === 'card') {
                  paymentProcessingFee = Math.round(((booking.total_price * 0.035) + 15) * 100) / 100
                  paymentFeeLabel = '3.5% + ₱15'
                } else {
                  paymentProcessingFee = Math.round((booking.total_price * 0.025) * 100) / 100
                  paymentFeeLabel = '2.5%'
                }
              }
              
              const totalPaid = payment ? Math.round((booking.total_price + paymentProcessingFee) * 100) / 100 : booking.total_price
              
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rental Amount</span>
                    <span className="font-medium">{formatCurrency(basePrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Service Fee (5%)</span>
                    <span className="font-medium">{formatCurrency(serviceFee)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between font-semibold">
                    <span>Subtotal</span>
                    <span>{formatCurrency(booking.total_price)}</span>
                  </div>
                  
                  {payment && paymentProcessingFee > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Payment processing fee ({paymentFeeLabel})
                        </span>
                        <span className="font-medium">{formatCurrency(paymentProcessingFee)}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Total Paid</span>
                        <span className="text-primary">{formatCurrency(totalPaid)}</span>
                      </div>
                    </>
                  )}
                  
                  {!payment && (
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total Amount</span>
                      <span className="text-primary">{formatCurrency(booking.total_price)}</span>
                    </div>
                  )}
                </>
              )
            })()}
            
            {payment && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t mt-3">
                <CreditCard className="h-4 w-4" />
                <span className="capitalize">
                  Payment Method: {payment.payment_method === 'paymaya' ? 'Maya (PayMaya)' : payment.payment_method === 'gcash' ? 'GCash' : payment.payment_method === 'card' ? 'Credit/Debit Card' : payment.payment_method === 'grab_pay' ? 'GrabPay' : payment.payment_method === 'billease' ? 'BillEase' : payment.payment_method === 'qrph' ? 'QR PH' : payment.payment_method.replace('_', ' ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Owner Information */}
        {owner && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Vehicle Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{owner.full_name || 'Vehicle Owner'}</p>
                  {owner.phone_number && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {owner.phone_number}
                    </p>
                  )}
                </div>
                <Button asChild>
                  <Link href={`/messages?booking=${booking.id}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message Owner
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleDownloadReceipt}
            disabled={downloadingReceipt}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloadingReceipt ? 'Downloading...' : 'Download Receipt'}
          </Button>
          <Button
            size="lg"
            asChild
          >
            <Link href="/dashboard/bookings">
              <Home className="mr-2 h-4 w-4" />
              View My Bookings
            </Link>
          </Button>
        </div>
        
        {/* Additional Info */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
              <AlertCircle className="h-5 w-5" />
              What's Next?
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>You'll receive a notification once the owner confirms your booking</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>After confirmation, you can message the owner to coordinate pickup details</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Payment will be processed according to the owner's payment terms</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Don't forget to review your experience after your rental!</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-sm font-medium ${className}`}>
      {children}
    </div>
  )
}

