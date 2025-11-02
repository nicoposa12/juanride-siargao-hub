'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Calendar, MapPin, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Booking {
  id: string
  start_date: string
  end_date: string
  total_price: number
  status: string
  created_at: string
  vehicle: {
    id: string
    name: string
    type: string
    image_url: string
    location: string
  }
}

export default function MyBookingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchBookings()
    }
  }, [user, authLoading])

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles (
            id,
            name,
            type,
            image_url,
            location
          )
        `)
        .eq('renter_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterBookings = (status: string) => {
    if (status === 'all') return bookings
    return bookings.filter((booking) => booking.status === status)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      active: { variant: 'default', label: 'Active' },
      completed: { variant: 'outline', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const calculateDuration = (start: string, end: string) => {
    const days = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    )
    return `${days} ${days === 1 ? 'day' : 'days'}`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">Manage and track all your vehicle reservations</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Bookings</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filterBookings(activeTab).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No bookings found</p>
                  <p className="text-muted-foreground mb-6">Start exploring vehicles to make your first booking</p>
                  <Link href="/vehicles">
                    <Button>Browse Vehicles</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterBookings(activeTab).map((booking) => (
                  <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Vehicle Image */}
                        <div className="w-full md:w-48 h-32 flex-shrink-0">
                          <img
                            src={booking.vehicle.image_url || '/placeholder.svg'}
                            alt={booking.vehicle.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>

                        {/* Booking Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold mb-1">{booking.vehicle.name}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {booking.vehicle.location}
                              </p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-muted-foreground">Pick-up</div>
                                <div className="font-medium">{formatDate(booking.start_date)}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-muted-foreground">Return</div>
                                <div className="font-medium">{formatDate(booking.end_date)}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-muted-foreground">Duration</div>
                                <div className="font-medium">
                                  {calculateDuration(booking.start_date, booking.end_date)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div>
                              <div className="text-sm text-muted-foreground">Total Price</div>
                              <div className="text-2xl font-bold">
                                ₱{booking.total_price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Link href={`/vehicles/${booking.vehicle.id}`}>
                                <Button variant="outline" size="sm">
                                  View Vehicle
                                </Button>
                              </Link>
                              {booking.status === 'confirmed' && (
                                <Link href={`/booking-confirmation/${booking.id}`}>
                                  <Button size="sm">View Details</Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

