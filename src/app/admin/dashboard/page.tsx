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
    userGrowth: 0,
    vehicleGrowth: 0,
    bookingGrowth: 0,
    revenueGrowth: 0,
    maintenanceAlerts: 0,
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
        .select('role, created_at')
      
      if (usersError) {
        console.error('❌ Error fetching users:', usersError)
        throw usersError
      }
      console.log('✅ Users loaded:', users?.length || 0)
      
      const totalUsers = users?.length || 0
      const totalOwners = users?.filter(u => u.role === 'owner').length || 0
      const totalRenters = users?.filter(u => u.role === 'renter').length || 0
      
      // Calculate user growth (users created in last 30 days vs previous 30 days)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      
      const recentUsers = users?.filter(u => {
        const createdAt = new Date(u.created_at || '')
        return createdAt >= thirtyDaysAgo
      }).length || 0
      
      const previousUsers = users?.filter(u => {
        const createdAt = new Date(u.created_at || '')
        return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
      }).length || 0
      
      const userGrowth = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers * 100) : (recentUsers > 0 ? 100 : 0)
      
      // Load vehicle stats
      console.log('🚗 Fetching vehicles...')
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('is_approved, created_at, status')
      
      if (vehiclesError) {
        console.error('❌ Error fetching vehicles:', vehiclesError)
        throw vehiclesError
      }
      console.log('✅ Vehicles loaded:', vehicles?.length || 0)
      
      const totalVehicles = vehicles?.length || 0
      const pendingVehicles = vehicles?.filter(v => !v.is_approved).length || 0
      const approvedVehicles = vehicles?.filter(v => v.is_approved).length || 0
      
      // Calculate vehicle growth
      const recentVehicles = vehicles?.filter(v => {
        const createdAt = new Date(v.created_at || '')
        return createdAt >= thirtyDaysAgo
      }).length || 0
      
      const previousVehicles = vehicles?.filter(v => {
        const createdAt = new Date(v.created_at || '')
        return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
      }).length || 0
      
      const vehicleGrowth = previousVehicles > 0 ? ((recentVehicles - previousVehicles) / previousVehicles * 100) : (recentVehicles > 0 ? 100 : 0)
      
      // Calculate maintenance alerts
      const maintenanceAlerts = vehicles?.filter(v => v.status === 'maintenance').length || 0
      
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
      
      // Calculate booking growth
      const recentBookings = bookings?.filter(b => {
        const createdAt = new Date(b.created_at || '')
        return createdAt >= thirtyDaysAgo
      }).length || 0
      
      const previousBookings = bookings?.filter(b => {
        const createdAt = new Date(b.created_at || '')
        return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
      }).length || 0
      
      const bookingGrowth = previousBookings > 0 ? ((recentBookings - previousBookings) / previousBookings * 100) : (recentBookings > 0 ? 100 : 0)
      
      // Calculate revenue
      const totalRevenue = bookings?.reduce((sum, b) => sum + (parseFloat(b.total_price?.toString() || '0')), 0) || 0
      const platformFees = totalRevenue * 0.10 // 10% platform fee
      
      // Calculate revenue growth
      const recentRevenue = bookings?.filter(b => {
        const createdAt = new Date(b.created_at || '')
        return createdAt >= thirtyDaysAgo
      }).reduce((sum, b) => sum + (parseFloat(b.total_price?.toString() || '0')), 0) || 0
      
      const previousRevenue = bookings?.filter(b => {
        const createdAt = new Date(b.created_at || '')
        return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
      }).reduce((sum, b) => sum + (parseFloat(b.total_price?.toString() || '0')), 0) || 0
      
      const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue * 100) : (recentRevenue > 0 ? 100 : 0)
      
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
        userGrowth: Math.round(userGrowth * 10) / 10,
        vehicleGrowth: Math.round(vehicleGrowth * 10) / 10,
        bookingGrowth: Math.round(bookingGrowth * 10) / 10,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        maintenanceAlerts,
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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-primary-700">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base md:text-lg font-medium">
          Welcome back! Here's what's happening with JuanRide today.
        </p>
      </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {/* Total Users */}
          <Card className="card-gradient border-blue-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/0 to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-blue-700 transition-colors">Total Users</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center shadow-layered-md group-hover:shadow-layered-lg group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary-700 group-hover:scale-105 transition-transform duration-300">{stats.totalUsers.toLocaleString()}</div>
              <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3" />
                {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth}% from last month
              </p>
            </CardContent>
          </Card>
          
          {/* Total Vehicles */}
          <Card className="card-gradient border-teal-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-100/0 to-teal-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-teal-700 transition-colors">Total Vehicles</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-teal-100 flex items-center justify-center shadow-layered-md group-hover:shadow-layered-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Car className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary-700 group-hover:scale-105 transition-transform duration-300">{stats.totalVehicles.toLocaleString()}</div>
              <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${stats.vehicleGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3" />
                {stats.vehicleGrowth >= 0 ? '+' : ''}{stats.vehicleGrowth}% from last month
              </p>
            </CardContent>
          </Card>
          
          {/* Total Bookings */}
          <Card className="card-gradient border-red-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-100/0 to-red-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-red-700 transition-colors">Total Bookings</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-100 flex items-center justify-center shadow-layered-md group-hover:shadow-layered-lg group-hover:scale-110 transition-all duration-500">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary-700 group-hover:scale-105 transition-transform duration-300">{stats.totalBookings.toLocaleString()}</div>
              <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${stats.bookingGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3" />
                {stats.bookingGrowth >= 0 ? '+' : ''}{stats.bookingGrowth}% from last month
              </p>
            </CardContent>
          </Card>
          
          {/* Total Revenue */}
          <Card className="card-gradient border-green-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/0 to-green-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-green-700 transition-colors">Total Revenue</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center shadow-layered-md group-hover:shadow-layered-lg group-hover:scale-110 transition-all duration-500">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-green-700 group-hover:scale-105 transition-transform duration-300">{formatCurrency(stats.totalRevenue)}</div>
              <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${stats.revenueGrowth >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3" />
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Pending Approvals */}
          <Card className="border-l-4 border-l-yellow-500 card-gradient hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-yellow-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all">
                      <AlertCircle className="h-5 w-5 text-yellow-600 group-hover:rotate-12 transition-transform" />
                    </div>
                    <h3 className="font-bold text-primary-700">Pending Approvals</h3>
                  </div>
                  <p className="text-3xl font-extrabold text-yellow-700 group-hover:scale-110 transition-transform">{stats.pendingVehicles || 8}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Bookings */}
          <Card className="border-l-4 border-l-blue-500 card-gradient hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all pulse-glow">
                      <TrendingUp className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="font-bold text-primary-700">Active Bookings</h3>
                  </div>
                  <p className="text-3xl font-extrabold text-blue-700 group-hover:scale-110 transition-transform">{stats.activeBookings || 42}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Alerts */}
          <Card className="border-l-4 border-l-red-500 card-gradient hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-red-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all bounce-subtle">
                      <AlertCircle className="h-5 w-5 text-red-600 group-hover:-rotate-12 transition-transform" />
                    </div>
                    <h3 className="font-bold text-primary-700">Maintenance Alerts</h3>
                  </div>
                  <p className="text-3xl font-extrabold text-red-700 group-hover:scale-110 transition-transform">{stats.maintenanceAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="card-gradient hover:shadow-layered-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary-300/50" onClick={() => router.push('/admin/users')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-primary-700 group-hover:text-primary-600 transition-colors">
                <div className="p-2 bg-primary-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <Users className="h-5 w-5 text-primary-600 group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-bold">Manage Users</span>
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
          
          <Card className="card-gradient hover:shadow-layered-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer group border-border/50 hover:border-teal-300/50" onClick={() => router.push('/admin/listings')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-primary-700 group-hover:text-teal-700 transition-colors">
                <div className="p-2 bg-teal-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:scale-110 group-hover:-rotate-3 transition-all">
                  <Car className="h-5 w-5 text-teal-600 group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-bold">View Vehicles</span>
              </CardTitle>
              <CardDescription>
                View and manage all vehicle listings
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
                <Link href="/admin/listings">View Listings</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="card-gradient hover:shadow-layered-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer group border-border/50 hover:border-blue-300/50" onClick={() => router.push('/admin/reports')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-primary-700 group-hover:text-blue-700 transition-colors">
                <div className="p-2 bg-blue-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all pulse-glow">
                  <Activity className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-bold">Reports</span>
              </CardTitle>
              <CardDescription>
                View detailed platform reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/admin/reports">View Reports</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card className="card-gradient shadow-layered-md border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary-700 flex items-center gap-2">
              <div className="p-2 bg-primary-100 rounded-lg shadow-sm">
                <Activity className="h-5 w-5 text-primary-600" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription className="font-medium">
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
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border border-border/50 rounded-lg hover:shadow-layered-md hover:border-primary-200 hover:-translate-x-1 transition-all duration-300 group cursor-pointer bg-white/50">
                    {activity.type === 'booking' ? (
                      <>
                        <div className="p-2 bg-blue-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all mt-0.5">
                          <Calendar className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-primary-700 group-hover:text-blue-700 transition-colors">New Booking</p>
                          <p className="text-sm text-muted-foreground font-medium">
                            {activity.renter?.full_name} booked {activity.vehicle?.make} {activity.vehicle?.model}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800 shadow-sm' :
                          activity.status === 'confirmed' ? 'bg-green-100 text-green-800 shadow-sm' :
                          'bg-blue-100 text-blue-800 shadow-sm'
                        }>
                          {activity.status}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-green-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all mt-0.5">
                          <Car className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-primary-700 group-hover:text-green-700 transition-colors">New Vehicle Listing</p>
                          <p className="text-sm text-muted-foreground font-medium">
                            {activity.owner?.full_name} submitted {activity.make} {activity.model}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {activity.is_approved ? (
                          <div className="p-1 bg-green-100 rounded-full">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="p-1 bg-yellow-100 rounded-full pulse-glow">
                            <Clock className="h-5 w-5 text-yellow-600" />
                          </div>
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
