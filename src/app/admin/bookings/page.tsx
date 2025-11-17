'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, MoreVertical, Eye, Check, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { useToast } from '@/hooks/use-toast'

interface BookingWithDetails {
  id: string
  booking_id: string
  start_date: string
  end_date: string
  total_price: number
  status: string
  payment_status: string
  created_at: string
  vehicle: {
    make: string
    model: string
  }
  renter: {
    full_name: string
  }
  owner: {
    full_name: string
  }
}

export default function AdminBookingsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      loadBookings()
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchQuery, statusFilter, paymentFilter])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles!inner(make, model),
          renter:users!bookings_renter_id_fkey(full_name),
          owner:users!bookings_owner_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform data to match our interface
      const transformedData = data?.map(booking => ({
        ...booking,
        booking_id: booking.id.slice(0, 8),
        payment_status: booking.status === 'confirmed' || booking.status === 'completed' ? 'paid' : 'pending'
      })) || []
      
      setBookings(transformedData)
    } catch (error: any) {
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

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(b =>
        b.booking_id.toLowerCase().includes(query) ||
        b.vehicle?.make?.toLowerCase().includes(query) ||
        b.vehicle?.model?.toLowerCase().includes(query) ||
        b.renter?.full_name?.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter)
    }

    // Filter by payment status
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(b => b.payment_status === paymentFilter)
    }

    setFilteredBookings(filtered)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Confirmed' },
      active: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Active' },
      completed: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelled' },
    }
    const variant = variants[status] || variants.pending
    return (
      <Badge className={`${variant.color} border`}>
        {variant.label}
      </Badge>
    )
  }

  const getPaymentBadge = (paymentStatus: string) => {
    if (paymentStatus === 'paid') {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">
          Paid
        </Badge>
      )
    }
    return (
      <Badge className="bg-teal-100 text-teal-800 border-teal-200 border">
        Pending
      </Badge>
    )
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return (
      <div className="text-sm">
        <div>{formatDate(startDate)}</div>
        <div className="text-muted-foreground">to {formatDate(endDate)}</div>
        <div className="text-xs text-muted-foreground">({days} days)</div>
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage all rental bookings
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by booking ID, vehicle, or renter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Payments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <h3 className="font-semibold">All Bookings ({filteredBookings.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Renter</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.booking_id}</TableCell>
                      <TableCell>
                        {booking.vehicle?.make} {booking.vehicle?.model}
                      </TableCell>
                      <TableCell>{booking.renter?.full_name || 'N/A'}</TableCell>
                      <TableCell>{booking.owner?.full_name || 'N/A'}</TableCell>
                      <TableCell>{calculateDuration(booking.start_date, booking.end_date)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(booking.total_price)}</TableCell>
                      <TableCell>{getPaymentBadge(booking.payment_status)}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/bookings/${booking.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {booking.status === 'pending' && (
                              <>
                                <DropdownMenuItem>
                                  <Check className="mr-2 h-4 w-4" />
                                  Confirm Booking
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel Booking
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
