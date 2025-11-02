'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Calendar, MapPin, Clock, AlertCircle, Eye, MessageCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { format, parseISO } from 'date-fns'

interface Booking {
  id: string
  start_date: string
  end_date: string
  total_price: number
  status: string
  created_at: string
  pickup_confirmed: boolean
  return_confirmed: boolean
  vehicle: {
    id: string
    name: string
    type: string
    image_url: string
    license_plate: string
  }
  renter: {
    id: string
    full_name: string
    email: string
    phone: string
  }
}

export default function OwnerBookingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'owner')) {
      router.push('/')
    } else if (user) {
      fetchBookings()
    }
  }, [user, authLoading])

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          total_price,
          status,
          created_at,
          pickup_confirmed,
          return_confirmed,
          vehicle:vehicles!inner (
            id,
            name,
            type,
            image_url,
            license_plate,
            owner_id
          ),
          renter:users!bookings_renter_id_fkey (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('vehicle.owner_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filterBookings = (status: string) => {
    if (status === 'all') return bookings
    return bookings.filter(booking => booking.status === status)
  }

  const handlePickupConfirmation = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          pickup_confirmed: true,
          status: 'active'
        })
        .eq('id', bookingId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Pickup confirmed',
      })

      fetchBookings()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to confirm pickup',
        variant: 'destructive',
      })
    }
  }

  const handleReturnConfirmation = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          return_confirmed: true,
          status: 'completed'
        })
        .eq('id', bookingId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Return confirmed',
      })

      fetchBookings()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to confirm return',
        variant: 'destructive',
      })
    }
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

  const calculateDuration = (start: string, end: string) => {
    const days = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    )
    return `${days} ${days === 1 ? 'day' : 'days'}`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.user_metadata?.role !== 'owner') return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Booking Management</h1>
          <p className="text-muted-foreground">Track and manage all bookings for your vehicles</p>
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
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? 'You have no bookings yet' 
                      : `No ${activeTab} bookings`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterBookings(activeTab).map(booking => (
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
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold">{booking.vehicle.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {booking.vehicle.license_plate}
                              </p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>

                          {/* Renter Info */}
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="text-sm font-medium mb-1">Renter</div>
                            <div className="text-sm">
                              <div className="font-semibold">{booking.renter.full_name}</div>
                              <div className="text-muted-foreground">{booking.renter.email}</div>
                              <div className="text-muted-foreground">{booking.renter.phone}</div>
                            </div>
                          </div>

                          {/* Booking Timeline */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-muted-foreground">Pick-up</div>
                                <div className="font-medium">
                                  {format(parseISO(booking.start_date), 'MMM dd, yyyy')}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-muted-foreground">Return</div>
                                <div className="font-medium">
                                  {format(parseISO(booking.end_date), 'MMM dd, yyyy')}
                                </div>
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

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                              <div className="text-sm text-muted-foreground">Total Amount</div>
                              <div className="text-2xl font-bold">
                                {formatCurrency(booking.total_price)}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {booking.status === 'confirmed' && !booking.pickup_confirmed && (
                                <Button 
                                  onClick={() => handlePickupConfirmation(booking.id)}
                                  size="sm"
                                >
                                  Confirm Pickup
                                </Button>
                              )}

                              {booking.status === 'active' && !booking.return_confirmed && (
                                <Button 
                                  onClick={() => handleReturnConfirmation(booking.id)}
                                  size="sm"
                                  variant="secondary"
                                >
                                  Confirm Return
                                </Button>
                              )}

                              <Link href={`/messages/${booking.id}`}>
                                <Button variant="outline" size="sm">
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Chat
                                </Button>
                              </Link>

                              <Link href={`/owner/bookings/${booking.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>

                          {/* Status Indicators */}
                          {booking.status === 'confirmed' && (
                            <div className="flex gap-2">
                              <Badge variant={booking.pickup_confirmed ? 'default' : 'secondary'}>
                                {booking.pickup_confirmed ? 'Picked Up' : 'Awaiting Pickup'}
                              </Badge>
                            </div>
                          )}
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

