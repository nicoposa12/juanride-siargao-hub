'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Calendar,
  Car,
  User,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { useToast } from '@/hooks/use-toast'

interface BookingDetails {
  id: string
  booking_id: string
  start_date: string
  end_date: string
  total_price: number
  status: string
  payment_status: string
  pickup_location: string | null
  return_location: string | null
  pickup_time: string | null
  return_time: string | null
  special_requests: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    plate_number: string
    price_per_day: number
    location: string
    image_urls: string[]
  }
  renter: {
    id: string
    full_name: string
    email: string
    phone_number: string | null
  }
  owner: {
    id: string
    full_name: string
    email: string
    phone_number: string | null
  }
}

export default function AdminBookingDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params?.bookingId as string
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<BookingDetails | null>(null)

  useEffect(() => {
    if (!authLoading && bookingId) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/unauthorized')
        return
      }
      loadBookingDetails()
    }
  }, [user, profile, authLoading, bookingId])

  const loadBookingDetails = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles (
            id,
            make,
            model,
            year,
            plate_number,
            price_per_day,
            location,
            image_urls
          ),
          renter:users!renter_id (
            id,
            full_name,
            email,
            phone_number
          ),
          owner:users!owner_id (
            id,
            full_name,
            email,
            phone_number
          )
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error

      if (!data) {
        toast({
          title: 'Booking Not Found',
          description: 'The booking you are looking for does not exist.',
          variant: 'destructive',
        })
        router.push('/admin/bookings')
        return
      }

      setBooking(data as any)
    } catch (error: any) {
      console.error('Error loading booking details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load booking details. Please try again.',
        variant: 'destructive',
      })
      router.push('/admin/bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800' },
      active: { label: 'Active', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Paid', icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
      failed: { label: 'Failed', icon: XCircle, className: 'bg-red-100 text-red-800' },
      refunded: { label: 'Refunded', icon: AlertCircle, className: 'bg-gray-100 text-gray-800' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const duration = calculateDuration(booking.start_date, booking.end_date)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/bookings')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground">Booking ID: {booking.booking_id}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(booking.status)}
          {getPaymentStatusBadge(booking.payment_status)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.vehicle.image_urls && booking.vehicle.image_urls.length > 0 && (
              <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={booking.vehicle.image_urls[0]}
                  alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-semibold">
                  {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plate Number</p>
                <p className="font-semibold">{booking.vehicle.plate_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Rate</p>
                <p className="font-semibold">{formatCurrency(booking.vehicle.price_per_day)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold">{booking.vehicle.location || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{duration} {duration === 1 ? 'day' : 'days'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-semibold">{formatDate(booking.start_date)}</p>
                {booking.pickup_time && (
                  <p className="text-sm text-muted-foreground">Pickup: {booking.pickup_time}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-semibold">{formatDate(booking.end_date)}</p>
                {booking.return_time && (
                  <p className="text-sm text-muted-foreground">Return: {booking.return_time}</p>
                )}
              </div>
              {booking.pickup_location && (
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Location</p>
                  <p className="font-semibold">{booking.pickup_location}</p>
                </div>
              )}
              {booking.return_location && (
                <div>
                  <p className="text-sm text-muted-foreground">Return Location</p>
                  <p className="font-semibold">{booking.return_location}</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(booking.total_price)}</p>
            </div>

            {booking.special_requests && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Special Requests</p>
                  <p className="font-medium">{booking.special_requests}</p>
                </div>
              </>
            )}

            {booking.cancellation_reason && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Cancellation Reason</p>
                  <p className="font-medium text-red-600">{booking.cancellation_reason}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Renter Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Renter Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{booking.renter.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{booking.renter.email}</p>
            </div>
            {booking.renter.phone_number && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{booking.renter.phone_number}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => router.push(`/profile/${booking.renter.id}`)}
            >
              View User Profile
            </Button>
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Vehicle Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{booking.owner.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{booking.owner.email}</p>
            </div>
            {booking.owner.phone_number && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{booking.owner.phone_number}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => router.push(`/profile/${booking.owner.id}`)}
            >
              View User Profile
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-semibold">{formatDate(booking.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-semibold">{formatDate(booking.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
