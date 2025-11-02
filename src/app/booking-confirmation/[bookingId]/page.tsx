'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, Calendar, MapPin, Car, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface BookingDetails {
  id: string
  start_date: string
  end_date: string
  total_price: number
  status: string
  created_at: string
  vehicle: {
    name: string
    type: string
    image_url: string
    location: string
    license_plate: string
  }
  owner: {
    full_name: string
    phone: string
    email: string
  }
}

export default function BookingConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookingDetails()
  }, [params.bookingId])

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles (
            name,
            type,
            image_url,
            location,
            license_plate,
            owner_id
          )
        `)
        .eq('id', params.bookingId)
        .single()

      if (error) throw error

      // Fetch owner details
      const { data: ownerData } = await supabase
        .from('users')
        .select('full_name, phone, email')
        .eq('id', data.vehicle.owner_id)
        .single()

      setBooking({
        ...data,
        owner: ownerData,
      })
    } catch (error) {
      console.error('Error fetching booking:', error)
      router.push('/vehicles')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading confirmation...</p>
        </div>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your booking has been successfully confirmed. Check your email for details.
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <p className="text-sm text-muted-foreground">Booking ID: {booking.id.slice(0, 8).toUpperCase()}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vehicle Info */}
            <div className="flex gap-4">
              <img
                src={booking.vehicle.image_url || '/placeholder.svg'}
                alt={booking.vehicle.name}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{booking.vehicle.name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {booking.vehicle.type} • {booking.vehicle.license_plate}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {booking.vehicle.location}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Rental Period */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rental Period
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Pick-up</div>
                  <div className="font-semibold">{formatDate(booking.start_date)}</div>
                  <div className="text-sm text-muted-foreground">{formatTime(booking.start_date)}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Return</div>
                  <div className="font-semibold">{formatDate(booking.end_date)}</div>
                  <div className="text-sm text-muted-foreground">{formatTime(booking.end_date)}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Owner Contact */}
            <div>
              <h4 className="font-semibold mb-3">Owner Contact</h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{booking.owner.full_name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{booking.owner.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{booking.owner.email}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div>
              <h4 className="font-semibold mb-3">Payment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">
                    ₱{booking.total_price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-green-600 font-medium">Paid</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="mb-6 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/10">
          <CardHeader>
            <CardTitle className="text-base">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Please bring a valid ID and driver's license for pick-up</p>
            <p>• Arrive 15 minutes early for vehicle inspection</p>
            <p>• Contact the owner if you need to make any changes</p>
            <p>• Cancellations must be made 24 hours in advance for a full refund</p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button variant="outline" size="lg" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
          <Link href="/dashboard/bookings" className="w-full">
            <Button size="lg" className="w-full">
              View My Bookings
            </Button>
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link href="/vehicles">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse More Vehicles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

