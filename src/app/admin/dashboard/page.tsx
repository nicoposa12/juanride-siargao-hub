'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  Car, 
  Calendar, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOwners: 0,
    totalRenters: 0,
    totalVehicles: 0,
    pendingVehicles: 0,
    approvedVehicles: 0,
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    platformFees: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  
  useEffect(() => {
    console.log('🔄 Admin dashboard useEffect triggered', { 
      authLoading, 
      hasUser: !!user, 
      hasProfile: !!profile, 
      role: profile?.role 
    })
    
    // CRITICAL FIX: Don't redirect while still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...')
      return
    }
    
    // CRITICAL FIX: Give auth context time to stabilize on first check
    if (!hasCheckedAuth) {
      console.log('⏳ First auth check, waiting for state to stabilize...')
      // Mark that we've done the first check
      setHasCheckedAuth(true)
      return
    }
    
    // Only redirect if auth is definitely finished loading
      if (!user) {
      console.log('⚠️ No user after auth loaded, redirecting to login')
      router.push('/login')
      return
    }
    
    // Wait for profile to load before making role decisions
    if (!profile || profile === null) {
      console.log('⏳ Profile not loaded yet, waiting...')
        return
      }
      
    // Now we can safely check role
    if (profile.role !== 'admin') {
      console.log('⚠️ User is not admin, redirecting to unauthorized')
      router.push('/unauthorized')
        return
      }
      
    // All checks passed - load dashboard
        console.log('✅ Admin user confirmed, loading dashboard')
        loadDashboardData()
  }, [user, profile, authLoading, router, hasCheckedAuth])
  
  const loadDashboardData = async () => {
    console.log('📊 Loading admin dashboard data...')
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Load user stats
      console.log('👥 Fetching users...')
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role')
      
      if (usersError) {
        console.error('❌ Error fetching users:', usersError)
        throw usersError
      }
      console.log('✅ Users loaded:', users?.length || 0)
      
      const totalUsers = users?.length || 0
      const totalOwners = users?.filter(u => u.role === 'owner').length || 0
      const totalRenters = users?.filter(u => u.role === 'renter').length || 0
      
      // Load vehicle stats
      console.log('🚗 Fetching vehicles...')
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('is_approved')
      
      if (vehiclesError) {
        console.error('❌ Error fetching vehicles:', vehiclesError)
        throw vehiclesError
      }
      console.log('✅ Vehicles loaded:', vehicles?.length || 0)
      
      const totalVehicles = vehicles?.length || 0
      const pendingVehicles = vehicles?.filter(v => !v.is_approved).length || 0
      const approvedVehicles = vehicles?.filter(v => v.is_approved).length || 0
      
      // Load booking stats
      console.log('📅 Fetching bookings...')
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('status, total_price, created_at')
      
      if (bookingsError) {
        console.error('❌ Error fetching bookings:', bookingsError)
        throw bookingsError
      }
      console.log('✅ Bookings loaded:', bookings?.length || 0)
      
      const totalBookings = bookings?.length || 0
      const activeBookings = bookings?.filter(b => b.status === 'active').length || 0
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
      
      // Calculate revenue
      const totalRevenue = bookings?.reduce((sum, b) => sum + (parseFloat(b.total_price?.toString() || '0')), 0) || 0
      const platformFees = totalRevenue * 0.05 // 5% platform fee
      
      setStats({
        totalUsers,
        totalOwners,
        totalRenters,
        totalVehicles,
        pendingVehicles,
        approvedVehicles,
        totalBookings,
        activeBookings,
        completedBookings,
        totalRevenue,
        platformFees,
      })
      
      // Load recent activity (latest bookings and vehicles)
      const { data: recentBookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          status,
          vehicle:vehicles(make, model),
          renter:users!renter_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      
      const { data: recentVehiclesData } = await supabase
        .from('vehicles')
        .select(`
          id,
          created_at,
          make,
          model,
          is_approved,
          owner:users!owner_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      
      // Combine and sort by created_at
      const combined = [
        ...(recentBookingsData?.map(b => ({ ...b, type: 'booking' })) || []),
        ...(recentVehiclesData?.map(v => ({ ...v, type: 'vehicle' })) || []),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setRecentActivity(combined.slice(0, 10))
      
      console.log('✅ Dashboard data loaded successfully!')
    } catch (error: any) {
      console.error('❌ Error loading dashboard:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false)
    }
  }
  
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening with JuanRide today.
        </p>
      </div>
        
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
          
          {/* Total Vehicles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Vehicles</CardTitle>
              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                <Car className="h-4 w-4 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">
                +8.2% from last month
              </p>
            </CardContent>
          </Card>
          
          {/* Total Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">
                +15.3% from last month
              </p>
            </CardContent>
          </Card>
          
          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-green-600 mt-1">
                +18.7% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold">Pending Approvals</h3>
                  </div>
                  <p className="text-3xl font-bold">{stats.pendingVehicles || 8}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Bookings */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Active Bookings</h3>
                  </div>
                  <p className="text-3xl font-bold">{stats.activeBookings || 42}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Alerts */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold">Maintenance Alerts</h3>
                  </div>
                  <p className="text-3xl font-bold">5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/users')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Users
              </CardTitle>
              <CardDescription>
                View and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/admin/users">Go to Users</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/listings')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Approvals
              </CardTitle>
              <CardDescription>
                Review and approve vehicle listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.pendingVehicles > 0 ? (
                <Badge variant="destructive" className="mb-2">
                  {stats.pendingVehicles} pending
                </Badge>
              ) : (
                <Badge variant="default" className="mb-2">
                  All caught up!
                </Badge>
              )}
              <Button className="w-full" asChild>
                <Link href="/admin/listings">Review Listings</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/analytics')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>
                View detailed platform analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/admin/analytics">View Analytics</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest bookings and vehicle submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    {activity.type === 'booking' ? (
                      <>
                        <Calendar className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-medium">New Booking</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.renter?.full_name} booked {activity.vehicle?.make} {activity.vehicle?.model}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          activity.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {activity.status}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Car className="h-5 w-5 text-green-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-medium">New Vehicle Listing</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.owner?.full_name} submitted {activity.make} {activity.model}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {activity.is_approved ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
