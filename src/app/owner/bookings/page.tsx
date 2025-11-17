'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  MessageSquare,
  Search,
  Filter,
  Loader2,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import Navigation from '@/components/shared/Navigation'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants'
import { 
  getOwnerBookings, 
  confirmBooking, 
  activateBooking,
  completeBooking,
  cancelBooking,
  type BookingWithDetails,
} from '@/lib/supabase/queries/bookings'

function BookingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingIdParam = searchParams?.get('id')
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action: 'confirm' | 'activate' | 'complete' | 'cancel' | null
    processing: boolean
  }>({ open: false, action: null, processing: false })
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'owner' && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      loadBookings()
    }
  }, [user, profile, authLoading, router])
  
  useEffect(() => {
    // Check if there's a specific booking to view
    if (bookingIdParam && bookings.length > 0) {
      const booking = bookings.find(b => b.id === bookingIdParam)
      if (booking) {
        setSelectedBooking(booking)
      }
    }
  }, [bookingIdParam, bookings])
  
  useEffect(() => {
    filterBookings()
  }, [bookings, activeTab, searchQuery])
  
  const loadBookings = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const data = await getOwnerBookings(user.id)
      setBookings(data)
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
  
  const filterBookings = () => {
    let filtered = [...bookings]
    
    // Filter by status tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(b => b.status === activeTab)
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(b =>
        b.renter?.full_name?.toLowerCase().includes(query) ||
        b.vehicle?.make?.toLowerCase().includes(query) ||
        b.vehicle?.model?.toLowerCase().includes(query) ||
        b.vehicle?.plate_number?.toLowerCase().includes(query)
      )
    }
    
    setFilteredBookings(filtered)
  }
  
  const handleAction = async () => {
    if (!selectedBooking || !actionDialog.action) return
    
    setActionDialog(prev => ({ ...prev, processing: true }))
    
    try {
      let result
      
      switch (actionDialog.action) {
        case 'confirm':
          result = await confirmBooking(selectedBooking.id)
          break
        case 'activate':
          result = await activateBooking(selectedBooking.id)
          break
        case 'complete':
          result = await completeBooking(selectedBooking.id)
          break
        case 'cancel':
          result = await cancelBooking(selectedBooking.id)
          break
      }
      
      if (result?.success) {
        toast({
          title: 'Success',
          description: `Booking ${actionDialog.action}ed successfully.`,
        })
        await loadBookings()
        setActionDialog({ open: false, action: null, processing: false })
        setSelectedBooking(null)
      } else {
        throw new Error(result?.error?.message || 'Action failed')
      }
    } catch (error: any) {
      console.error('Error performing action:', error)
      toast({
        title: 'Action Failed',
        description: error.message || `Failed to ${actionDialog.action} booking.`,
        variant: 'destructive',
      })
    } finally {
      setActionDialog(prev => ({ ...prev, processing: false }))
    }
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
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-subtle bg-pattern-dots">
      <Navigation />
      <div className="py-8 pt-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-700">Manage Bookings</h1>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg font-medium">
            View and manage booking requests for your vehicles
          </p>
        </div>
        
        {/* Search & Filter */}
        <Card className="mb-6 card-gradient shadow-layered-md border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary-600 transition-colors duration-300" />
                <Input
                  placeholder="Search by renter name, vehicle, or plate number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 focus-visible:ring-primary-500 hover:shadow-sm transition-all duration-300"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({bookings.filter(b => b.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({bookings.filter(b => b.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({bookings.filter(b => b.status === 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
            </TabsTrigger>
          </TabsList>
          
          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'No bookings match the selected filter.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden card-gradient hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer border-border/50 hover:border-primary-200/50">
                  <div className="grid md:grid-cols-[200px_1fr] gap-6">
                    {/* Vehicle Image */}
                    <div className="relative aspect-video md:aspect-square overflow-hidden">
                      <Image
                        src={booking.vehicle?.image_urls?.[0] || '/placeholder.svg'}
                        alt={`${booking.vehicle?.make} ${booking.vehicle?.model}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    {/* Booking Details */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-primary-700 group-hover:text-primary-600 transition-colors">
                              {booking.vehicle?.make} {booking.vehicle?.model}
                            </h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {BOOKING_STATUS_LABELS[booking.status as keyof typeof BOOKING_STATUS_LABELS]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Plate: {booking.vehicle?.plate_number}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                          className="hover:bg-primary-50 hover:border-primary-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group/btn"
                        >
                          <Eye className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                          View Details
                        </Button>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Renter</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{booking.renter?.full_name || 'Unknown'}</span>
                          </div>
                          {booking.renter?.phone_number && (
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {booking.renter.phone_number}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label className="text-muted-foreground">Rental Period</Label>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {booking.pickup_location || 'Not specified'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div>
                          <span className="text-sm text-muted-foreground">Your Earnings:</span>
                          <p className="text-xl font-bold text-primary">
                            {formatCurrency(booking.total_price * 0.95)}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking)
                                  setActionDialog({ open: true, action: 'cancel', processing: false })
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking)
                                  setActionDialog({ open: true, action: 'confirm', processing: false })
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirm
                              </Button>
                            </>
                          )}
                          
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setActionDialog({ open: true, action: 'activate', processing: false })
                              }}
                            >
                              <Car className="h-4 w-4 mr-2" />
                              Mark as Picked Up
                            </Button>
                          )}
                          
                          {booking.status === 'active' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setActionDialog({ open: true, action: 'complete', processing: false })
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Returned
                            </Button>
                          )}
                          
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/messages?booking=${booking.id}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Tabs>
        
        {/* Action Confirmation Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.action === 'confirm' && 'Confirm Booking'}
                {actionDialog.action === 'activate' && 'Mark as Picked Up'}
                {actionDialog.action === 'complete' && 'Mark as Completed'}
                {actionDialog.action === 'cancel' && 'Cancel Booking'}
              </DialogTitle>
              <DialogDescription>
                {actionDialog.action === 'confirm' && 'Are you sure you want to confirm this booking? The renter will be notified.'}
                {actionDialog.action === 'activate' && 'Confirm that the renter has picked up the vehicle?'}
                {actionDialog.action === 'complete' && 'Confirm that the vehicle has been returned in good condition?'}
                {actionDialog.action === 'cancel' && 'Are you sure you want to decline this booking? This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, action: null, processing: false })}
                disabled={actionDialog.processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={actionDialog.processing}
                variant={actionDialog.action === 'cancel' ? 'destructive' : 'default'}
              >
                {actionDialog.processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  )
}

export default function OwnerBookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BookingsContent />
    </Suspense>
  )
}
