'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { BookingConfirmation } from '@/components/booking/BookingConfirmation'
import { getBookingById } from '@/lib/supabase/queries/bookings'
import { Skeleton } from '@/components/ui/skeleton'
import type { BookingWithDetails } from '@/lib/supabase/queries/bookings'
import Navigation from '@/components/shared/Navigation'

export default function BookingConfirmationPage() {
  const params = useParams()
  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bookingId = params?.bookingId as string

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError('No booking ID provided')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching booking:', bookingId)
        const bookingData = await getBookingById(bookingId)
        
        if (!bookingData) {
          setError('Booking not found')
          setLoading(false)
          return
        }

        console.log('Booking fetched successfully:', bookingData)
        setBooking(bookingData)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError(err instanceof Error ? err.message : 'Failed to load booking')
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 max-w-4xl pt-24 pb-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Booking</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return notFound()
  }
  
  return (
    <div>
      <Navigation />
      <BookingConfirmation booking={booking} />
    </div>
  )
}
