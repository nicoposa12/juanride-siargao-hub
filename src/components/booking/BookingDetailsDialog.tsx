'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Car,
  AlertCircle,
  FileText,
  CreditCard,
  Loader2,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import {
  confirmBooking,
  completeBooking,
  cancelBooking,
  type BookingWithDetails,
} from '@/lib/supabase/queries/bookings'

interface BookingDetailsDialogProps {
  booking: BookingWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onBookingUpdate?: () => void
}

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
  onBookingUpdate,
}: BookingDetailsDialogProps) {
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  if (!booking) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handleAction = async (action: 'confirm' | 'complete' | 'cancel') => {
    setActionLoading(action)
    
    try {
      let result
      
      switch (action) {
        case 'confirm':
          result = await confirmBooking(booking.id)
          break
        case 'complete':
          result = await completeBooking(booking.id)
          break
        case 'cancel':
          result = await cancelBooking(booking.id)
          break
      }
      
      if (result?.success) {
        toast({
          title: 'Success',
          description: `Booking ${action}ed successfully.`,
        })
        onBookingUpdate?.()
        onOpenChange(false)
      } else {
        throw new Error(result?.error?.message || 'Action failed')
      }
    } catch (error: any) {
      console.error('Error performing action:', error)
      toast({
        title: 'Action Failed',
        description: error.message || `Failed to ${action} booking.`,
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const calculateDuration = () => {
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getPaymentInfo = () => {
    if (!booking.payment) return null
    
    // Handle both array and object payment structures
    const payment = Array.isArray(booking.payment) 
      ? booking.payment.find(p => p.status === 'paid') || booking.payment[0]
      : booking.payment
    
    return payment
  }

  const payment = getPaymentInfo()
  const duration = calculateDuration()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-primary-700">
                Booking Details
              </DialogTitle>
              <DialogDescription className="mt-1">
                Complete information about this rental booking
              </DialogDescription>
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {BOOKING_STATUS_LABELS[booking.status as keyof typeof BOOKING_STATUS_LABELS]}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="px-6 space-y-6">
            {/* Vehicle Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Car className="h-5 w-5 text-primary-600" />
                Vehicle Details
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid md:grid-cols-[200px_1fr] gap-4">
                  <div className="relative aspect-video md:aspect-square">
                    <Image
                      src={booking.vehicle?.image_urls?.[0] || '/placeholder.svg'}
                      alt={`${booking.vehicle?.make} ${booking.vehicle?.model}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-xl text-primary-700">
                      {booking.vehicle?.make} {booking.vehicle?.model}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Year:</span>
                        <span className="ml-2 font-medium">{booking.vehicle?.year}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Plate:</span>
                        <span className="ml-2 font-medium">{booking.vehicle?.plate_number}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2 font-medium capitalize">{booking.vehicle?.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Daily Rate:</span>
                        <span className="ml-2 font-medium">{formatCurrency(booking.vehicle?.price_per_day)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Renter Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" />
                Renter Information
              </h3>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{booking.renter?.full_name || 'Unknown'}</span>
                </div>
                {booking.renter?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${booking.renter.email}`} className="text-primary-600 hover:underline">
                      {booking.renter.email}
                    </a>
                  </div>
                )}
                {booking.renter?.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${booking.renter.phone_number}`} className="text-primary-600 hover:underline">
                      {booking.renter.phone_number}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Booking Timeline */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-600" />
                Rental Period
              </h3>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Start Date</label>
                    <div className="font-medium">{formatDate(booking.start_date)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">End Date</label>
                    <div className="font-medium">{formatDate(booking.end_date)}</div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Duration</label>
                  <div className="font-medium">{duration} {duration === 1 ? 'day' : 'days'}</div>
                </div>
                <Separator />
                <div>
                  <label className="text-sm text-muted-foreground">Pickup Location</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.pickup_location || 'Not specified'}</span>
                  </div>
                </div>
                {booking.return_location && (
                  <div>
                    <label className="text-sm text-muted-foreground">Return Location</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.return_location}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests */}
            {booking.special_requests && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                    Special Requests
                  </h3>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{booking.special_requests}</AlertDescription>
                  </Alert>
                </div>
              </>
            )}

            <Separator />

            {/* Payment Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
                Payment Details
              </h3>
              <div className="border rounded-lg p-4 space-y-3">
                {payment && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Payment Status:</span>
                    <Badge className={getPaymentStatusColor(payment.status)}>
                      {PAYMENT_STATUS_LABELS[payment.status as keyof typeof PAYMENT_STATUS_LABELS] || payment.status}
                    </Badge>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({duration} days)</span>
                    <span className="font-medium">{formatCurrency(booking.total_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (5%)</span>
                    <span className="text-red-600">-{formatCurrency(booking.total_price * 0.05)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-green-700">Your Earnings</span>
                    <span className="text-green-700">{formatCurrency(booking.total_price * 0.95)}</span>
                  </div>
                </div>
                {payment?.payment_method && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Payment Method: </span>
                    <span className="text-sm font-medium capitalize">{payment.payment_method.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Timeline */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                Timeline
              </h3>
              <div className="border rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Created</span>
                  <span className="font-medium">{formatDate(booking.created_at)}</span>
                </div>
                {booking.updated_at !== booking.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium">{formatDate(booking.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="p-6 pt-4 flex-col sm:flex-row gap-2">
          <div className="flex-1 flex gap-2 justify-start">
            <Button variant="outline" asChild>
              <Link href={`/messages?booking=${booking.id}`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Renter
              </Link>
            </Button>
          </div>
          
          <div className="flex gap-2">
            {/* Show complete button for ongoing bookings (confirmed and within rental period) */}
            {booking.status === 'confirmed' && (() => {
              const today = new Date()
              const startDate = new Date(booking.start_date)
              const endDate = new Date(booking.end_date)
              today.setHours(0, 0, 0, 0)
              startDate.setHours(0, 0, 0, 0)
              endDate.setHours(23, 59, 59, 999)
              return today >= startDate && today <= endDate
            })() && (
              <Button
                onClick={() => handleAction('complete')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'complete' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </>
                )}
              </Button>
            )}
            
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
