'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Car, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Eye,
  Ban,
  Mail,
  EyeOff,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { BOOKING_STATUS_LABELS } from '@/lib/constants'
import { getOwnerBookings } from '@/lib/supabase/queries/bookings'
import { getOwnerUnpaidCommissionSummary } from '@/lib/supabase/queries/commissions'
import Image from 'next/image'
import Navigation from '@/components/shared/Navigation'
import { VehicleStatusSelector } from '@/components/vehicle/VehicleStatusSelector'
import type { VehicleStatus } from '@/lib/supabase/queries/vehicles'
import { BookingDetailsDialog } from '@/components/booking/BookingDetailsDialog'
import { CommissionPaymentModal } from '@/components/owner/CommissionPaymentModal'

export default function OwnerDashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeBookings: 0,
    pendingBookings: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
  })
  const [commissionBalance, setCommissionBalance] = useState({
    unpaid_total: 0,
    unpaid_count: 0,
    for_verification_count: 0,
  })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [commissionModalOpen, setCommissionModalOpen] = useState(false)
  const [suspensionInfo, setSuspensionInfo] = useState<{
    is_suspended: boolean
    suspension_reason: string | null
    suspended_at: string | null
  } | null>(null)
  
  const handleVehicleStatusUpdate = (vehicleId: string, newStatus: VehicleStatus) => {
    setVehicles(prev => prev.map(vehicle => 
      vehicle.id === vehicleId 
        ? { ...vehicle, status: newStatus }
        : vehicle
    ))
  }
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'owner')) {
        router.push('/unauthorized?reason=' + encodeURIComponent('Owner access required') + '&path=' + encodeURIComponent('/owner/dashboard'))
        return
      }
      loadDashboardData()
    }
  }, [user, profile, authLoading, router])
  
  const loadDashboardData = async (silent = false) => {
    if (!user) return
    
    if (!silent) setLoading(true)
    try {
      const supabase = createClient()
      
      // Check if user is suspended
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_suspended, suspension_reason, suspended_at')
        .eq('id', user.id)
        .single()
      
      if (!userError && userData) {
        setSuspensionInfo(userData)
      }
      
      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      
      if (vehiclesError) throw vehiclesError
      
      setVehicles(vehiclesData || [])
      
      // Load bookings
      const bookings = await getOwnerBookings(user.id)
      
      // Calculate stats
      const totalVehicles = vehiclesData?.length || 0
      const activeBookings = bookings.filter(b => b.status === 'active').length
      const pendingBookings = bookings.filter(b => b.status === 'pending').length
      
      // Calculate earnings
      const paidBookings = bookings.filter(b => 
        b.payment && 
        Array.isArray(b.payment) ? 
          b.payment.some(p => p.status === 'paid') : 
          b.payment.status === 'paid'
      )
      
      const totalEarnings = paidBookings.reduce((sum, b) => sum + (b.total_price * 0.95), 0) // 95% after 5% fee
      
      // This month earnings
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisMonthBookings = paidBookings.filter(b => 
        new Date(b.created_at) >= firstDayOfMonth
      )
      const thisMonthEarnings = thisMonthBookings.reduce((sum, b) => sum + (b.total_price * 0.95), 0)
      
      setStats({
        totalVehicles,
        activeBookings,
        pendingBookings,
        totalEarnings,
        thisMonthEarnings,
      })
      
      // Load commission balance
      const commissionData = await getOwnerUnpaidCommissionSummary(user.id)
      setCommissionBalance(commissionData)
      
      // Get recent bookings
      setRecentBookings(bookings.slice(0, 5))
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      if (!silent) setLoading(false)
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-subtle bg-pattern-dots">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Suspension Warning Banner */}
        {suspensionInfo?.is_suspended && (
          <Alert variant="destructive" className="mb-8 border-red-600 bg-red-50">
            <Ban className="h-5 w-5" />
            <AlertTitle className="text-xl font-bold">Account Suspended</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p className="text-base">
                Your account has been suspended and you cannot accept new bookings at this time.
              </p>
              {suspensionInfo.suspension_reason && (
                <div className="mt-3 p-3 bg-red-100 rounded-md border border-red-300">
                  <p className="font-semibold text-red-900">Reason:</p>
                  <p className="text-red-800">{suspensionInfo.suspension_reason}</p>
                </div>
              )}
              {suspensionInfo.suspended_at && (
                <p className="text-sm text-red-700">
                  Suspended on: {formatDate(suspensionInfo.suspended_at)}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 p-3 bg-white rounded-md border border-red-200">
                <Mail className="h-5 w-5 text-red-600" />
                <p className="text-sm">
                  Please contact the administrator to resolve this issue and restore your account.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Vehicle Visibility Warning */}
        {suspensionInfo?.is_suspended && (
          <Alert variant="default" className="mb-8 border-amber-500 bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-lg font-bold text-amber-900">Vehicles Not Visible to Renters</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="flex items-start gap-3">
                <EyeOff className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-amber-900 font-medium">
                    Due to your account suspension, all your vehicles are currently hidden from the rental marketplace.
                  </p>
                  <p className="text-sm text-amber-800">
                    Renters cannot see or book your vehicles until your account is restored. Once your suspension is lifted, your vehicles will automatically become visible again.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-primary-700 tracking-tight">Owner Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            {(() => {
              const isNewOwner = profile?.created_at ? 
                new Date(profile.created_at).getTime() > Date.now() - (24 * 60 * 60 * 1000) :
                false
              return isNewOwner ?
                `Welcome to JuanRide, ${profile?.full_name || 'Owner'}! Start by adding your first vehicle to begin earning.` :
                `Welcome back, ${profile?.full_name || 'Owner'}! Here's an overview of your rental business.`
            })()}
          </p>
        </div>
        
        {/* Commission Balance Alert */}
        {commissionBalance.unpaid_total > 0 && (
          <Alert variant="default" className="mb-6 border-red-500 bg-red-50">
            <DollarSign className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-lg font-bold text-red-900">Commission Payment Due</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-800 font-semibold text-base">
                    You have {formatCurrency(commissionBalance.unpaid_total)} in unpaid commissions
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {commissionBalance.unpaid_count} unpaid transaction{commissionBalance.unpaid_count !== 1 ? 's' : ''}
                    {commissionBalance.for_verification_count > 0 && (
                      <>, {commissionBalance.for_verification_count} pending verification</>
                    )}
                  </p>
                </div>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => setCommissionModalOpen(true)}
                >
                  View Details
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="card-gradient border-primary-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            {/* Animated background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/0 to-primary-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-primary-600 transition-colors">Total Vehicles</CardTitle>
              <div className="p-2 sm:p-2.5 bg-primary-100 rounded-lg shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary-700 group-hover:scale-110 transition-transform duration-300">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                <Link href="/owner/vehicles" className="text-primary-600 hover:text-primary-500 hover:underline transition-colors inline-flex items-center gap-1">
                  Manage vehicles →
                </Link>
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-gradient border-accent-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-100/0 to-accent-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-primary-600 transition-colors">Active Bookings</CardTitle>
              <div className="p-2 sm:p-2.5 bg-accent-100 rounded-lg shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 transition-all duration-500 pulse-glow">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent-400 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary-700 group-hover:scale-110 transition-transform duration-300">{stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Currently rented out
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-gradient border-secondary-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-100/0 to-secondary-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-primary-600 transition-colors">Pending Approvals</CardTitle>
              <div className="p-2 sm:p-2.5 bg-secondary-100 rounded-lg shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-500 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary-700 group-hover:scale-110 transition-transform duration-300">{stats.pendingBookings}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                <Link href="/owner/bookings" className="text-primary-600 hover:text-primary-500 hover:underline transition-colors inline-flex items-center gap-1">
                  Review bookings →
                </Link>
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-gradient border-green-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-green-100/30 opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-green-700 transition-colors">Total Earnings</CardTitle>
              <div className="p-2 sm:p-2.5 bg-green-100 rounded-lg shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 transition-all duration-500 bounce-subtle">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-green-700 group-hover:scale-110 transition-transform duration-300">{formatCurrency(stats.totalEarnings)}</div>
              <p className="text-xs text-green-700 mt-1 flex items-center gap-1 font-semibold">
                <TrendingUp className="h-3 w-3 group-hover:animate-bounce" />
                {formatCurrency(stats.thisMonthEarnings)} this month
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/owner/bookings">
                    View All
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Latest booking requests for your vehicles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={booking.vehicle?.image_urls?.[0] || '/placeholder.svg'}
                          alt={`${booking.vehicle?.make} ${booking.vehicle?.model}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold truncate">
                              {booking.vehicle?.make} {booking.vehicle?.model}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.renter?.full_name || 'Renter'}
                            </p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {BOOKING_STATUS_LABELS[booking.status as keyof typeof BOOKING_STATUS_LABELS]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{formatDate(booking.start_date)}</span>
                          <span>→</span>
                          <span>{formatDate(booking.end_date)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-primary">
                            {formatCurrency(booking.total_price * 0.95)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setDetailsDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Your Vehicles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Vehicles</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/owner/vehicles/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Manage your vehicle listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No vehicles listed yet</p>
                  <Button asChild>
                    <Link href="/owner/vehicles/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Vehicle
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicles.slice(0, 5).map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative h-12 w-12 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={vehicle.image_urls?.[0] || '/placeholder.svg'}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(vehicle.price_per_day)}/day
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <VehicleStatusSelector 
                          vehicleId={vehicle.id}
                          currentStatus={vehicle.status}
                          onStatusUpdate={(newStatus) => handleVehicleStatusUpdate(vehicle.id, newStatus)}
                        />
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/owner/vehicles/${vehicle.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {vehicles.length > 5 && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/owner/vehicles">
                        View All {vehicles.length} Vehicles
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Booking Details Dialog */}
      <BookingDetailsDialog
        booking={selectedBooking}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onBookingUpdate={() => loadDashboardData(true)}
      />
      
      {/* Commission Payment Modal */}
      <CommissionPaymentModal
        open={commissionModalOpen}
        onOpenChange={setCommissionModalOpen}
        unpaidAmount={commissionBalance.unpaid_total}
        unpaidCount={commissionBalance.unpaid_count}
      />
    </div>
  )
}
