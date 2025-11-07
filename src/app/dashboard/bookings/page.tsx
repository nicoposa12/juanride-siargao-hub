'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calendar,
  MapPin,
  Car,
  MessageSquare,
  Search,
  AlertCircle,
  Star,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants'
import { 
  getRenterBookings,
  getUpcomingBookings,
  getPastBookings,
  cancelBooking,
  type BookingWithDetails,
} from '@/lib/supabase/queries/bookings'
import Navigation from '@/components/shared/Navigation'

export default function RenterBookingsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [allBookings, setAllBookings] = useState<BookingWithDetails[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithDetails[]>([])
  const [pastBookings, setPastBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming')
  const [cancelling, setCancelling] = useState<string | null>(null)
  
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/dashboard/bookings')
        return
      }
      loadBookings()
    }
  }, [user, authLoading, router])
  
  const loadBookings = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const [all, upcoming, past] = await Promise.all([
        getRenterBookings(user.id),
        getUpcomingBookings(user.id),
        getPastBookings(user.id),
      ])
      
      setAllBookings(all)
      setUpcomingBookings(upcoming)
      setPastBookings(past)
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load bookings.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }
    
    setCancelling(bookingId)
    try {
      const result = await cancelBooking(bookingId)
      
      if (result.success) {
        toast({
          title: 'Booking Cancelled',
          description: 'Your booking has been cancelled successfully.',
        })
        await loadBookings()
      } else {
        throw new Error(result.error?.message || 'Failed to cancel booking')
      }
    } catch (error: any) {
      console.error('Error cancelling booking:', error)
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel booking.',
        variant: 'destructive',
      })
    } finally {
      setCancelling(null)
    }
  }
  
  const filterBookings = (bookings: BookingWithDetails[]) => {
    if (!searchQuery) return bookings
    
    const query = searchQuery.toLowerCase()
    return bookings.filter(b =>
      b.vehicle?.make?.toLowerCase().includes(query) ||
      b.vehicle?.model?.toLowerCase().includes(query) ||
      b.vehicle?.plate_number?.toLowerCase().includes(query) ||
      b.vehicle?.location?.toLowerCase().includes(query)
    )
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  const renderBookingCard = (booking: BookingWithDetails) => {
    const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment
    const canCancel = booking.status === 'pending' || booking.status === 'confirmed'
    const canReview = booking.status === 'completed'
    
    return (
      <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          {/* Vehicle Image */}
          <div className="relative aspect-video md:aspect-square">
            <Image
              src={booking.vehicle?.image_urls?.[0] || '/placeholder.svg'}
              alt={`${booking.vehicle?.make} ${booking.vehicle?.model}`}
              fill
              className="object-cover"
            />
          </div>
          
          {/* Booking Details */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">
                    {booking.vehicle?.make} {booking.vehicle?.model}
                  </h3>
                  <Badge className={getStatusColor(booking.status)}>
                    {BOOKING_STATUS_LABELS[booking.status as keyof typeof BOOKING_STATUS_LABELS]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {booking.vehicle?.location}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/booking-confirmation/${booking.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rental Period</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pickup Location</p>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.pickup_location || 'Not specified'}</span>
                </div>
              </div>
            </div>
            
            {payment && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                <Badge className={payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {PAYMENT_STATUS_LABELS[payment.status as keyof typeof PAYMENT_STATUS_LABELS]}
                </Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div>
                <span className="text-sm text-muted-foreground">Total Amount:</span>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(booking.total_price)}
                </p>
              </div>
              
              <div className="flex gap-2">
                {canReview && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/vehicles/${booking.vehicle_id}#reviews`}>
                      <Star className="h-4 w-4 mr-2" />
                      Write Review
                    </Link>
                  </Button>
                )}
                
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/messages?booking=${booking.id}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Owner
                  </Link>
                </Button>
                
                {canCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancelling === booking.id}
                  >
                    {cancelling === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                )}
              </div>
            </div>
            
            {booking.special_requests && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Your notes:</strong> {booking.special_requests}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </Card>
    )
  }
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your vehicle rentals
          </p>
        </div>
        
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle make, model, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({allBookings.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            {filterBookings(upcomingBookings).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Bookings</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ? 'No bookings match your search.' : 'Ready to explore Siargao? Book a vehicle today!'}
                  </p>
                  {!searchQuery && (
                    <Button asChild>
                      <Link href="/vehicles">
                        Browse Vehicles
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterBookings(upcomingBookings).map(renderBookingCard)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {filterBookings(pastBookings).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Past Bookings</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No bookings match your search.' : 'Your rental history will appear here.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterBookings(pastBookings).map(renderBookingCard)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all">
            {filterBookings(allBookings).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ? 'No bookings match your search.' : 'Start your adventure by booking your first vehicle!'}
                  </p>
                  {!searchQuery && (
                    <Button asChild>
                      <Link href="/vehicles">
                        Browse Vehicles
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterBookings(allBookings).map(renderBookingCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
