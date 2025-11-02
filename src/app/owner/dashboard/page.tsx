'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { 
  Car, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { format, isToday, parseISO } from 'date-fns'

interface DashboardStats {
  totalVehicles: number
  availableVehicles: number
  activeBookings: number
  pendingApproval: number
  monthlyRevenue: number
  totalRevenue: number
}

interface RecentBooking {
  id: string
  start_date: string
  end_date: string
  total_price: number
  status: string
  vehicle: {
    name: string
    type: string
  }
  renter: {
    full_name: string
  }
}

export default function OwnerDashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    availableVehicles: 0,
    activeBookings: 0,
    pendingApproval: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
  })
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [todayActivity, setTodayActivity] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    if (!authLoading && profile && profile.role !== 'owner') {
      router.push('/')
      return
    }
    
    if (user && profile && profile.role === 'owner') {
      fetchDashboardData()
    }
  }, [user, profile, authLoading])

  const fetchDashboardData = async () => {
    if (!user) return
    
    try {
      // Fetch vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user.id)

      const totalVehicles = vehicles?.length || 0
      const availableVehicles = vehicles?.filter(v => v.is_available).length || 0
      const pendingApproval = vehicles?.filter(v => v.status === 'pending').length || 0

      // Fetch bookings
      const { data: allBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          total_price,
          status,
          vehicle:vehicles!inner (
            id,
            name,
            type,
            owner_id
          ),
          renter:users!bookings_renter_id_fkey (
            full_name
          )
        `)
        .eq('vehicle.owner_id', user.id)
        .order('created_at', { ascending: false })

      const activeBookings = allBookings?.filter(b => 
        b.status === 'confirmed' || b.status === 'active'
      ).length || 0

      // Calculate revenue
      const completedBookings = allBookings?.filter(b => b.status === 'completed') || []
      const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total_price, 0)
      
      const thisMonth = new Date().getMonth()
      const thisYear = new Date().getFullYear()
      const monthlyRevenue = completedBookings
        .filter(b => {
          const date = new Date(b.start_date)
          return date.getMonth() === thisMonth && date.getFullYear() === thisYear
        })
        .reduce((sum, b) => sum + b.total_price, 0)

      setStats({
        totalVehicles,
        availableVehicles,
        activeBookings,
        pendingApproval,
        monthlyRevenue,
        totalRevenue,
      })

      // Recent bookings (last 5)
      setRecentBookings(allBookings?.slice(0, 5) || [])

      // Today's activity (pickups and returns)
      const today = allBookings?.filter(b => {
        const startDate = parseISO(b.start_date)
        const endDate = parseISO(b.end_date)
        return isToday(startDate) || isToday(endDate)
      }) || []
      setTodayActivity(today)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
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
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.user_metadata?.full_name || 'Owner'}!
            </p>
          </div>
          <Link href="/owner/vehicles/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.availableVehicles} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently rented
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approval Alert */}
        {stats.pendingApproval > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium">Pending Approval</p>
                <p className="text-sm text-muted-foreground">
                  You have {stats.pendingApproval} vehicle{stats.pendingApproval !== 1 ? 's' : ''} waiting for admin approval
                </p>
              </div>
              <Link href="/owner/vehicles">
                <Button variant="outline" size="sm">
                  View Vehicles
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No pickups or returns scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayActivity.map(booking => (
                    <div key={booking.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold">{booking.vehicle.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.renter.full_name}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {isToday(parseISO(booking.start_date)) && (
                            <Badge variant="default">Pick-up Today</Badge>
                          )}
                          {isToday(parseISO(booking.end_date)) && (
                            <Badge variant="secondary">Return Today</Badge>
                          )}
                        </div>
                      </div>
                      <Link href={`/owner/bookings/${booking.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Bookings</span>
                <Link href="/owner/bookings">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map(booking => (
                    <div key={booking.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold">{booking.vehicle.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.renter.full_name}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{format(parseISO(booking.start_date), 'MMM dd')}</span>
                          <span>→</span>
                          <span>{format(parseISO(booking.end_date), 'MMM dd')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.status)}
                        <div className="text-sm font-semibold mt-2">
                          {formatCurrency(booking.total_price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/owner/vehicles/new">
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Button>
              </Link>
              <Link href="/owner/vehicles">
                <Button variant="outline" className="w-full">
                  <Car className="h-4 w-4 mr-2" />
                  Manage Fleet
                </Button>
              </Link>
              <Link href="/owner/bookings">
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Bookings
                </Button>
              </Link>
              <Link href="/owner/earnings">
                <Button variant="outline" className="w-full">
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Earnings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

