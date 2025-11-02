'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { 
  Users, 
  Car, 
  Calendar, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface AdminStats {
  totalUsers: number
  totalVehicles: number
  pendingApprovals: number
  activeBookings: number
  totalRevenue: number
  monthlyRevenue: number
  platformCommission: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalVehicles: 0,
    pendingApprovals: 0,
    activeBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    platformCommission: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'admin')) {
      router.push('/')
    } else if (user) {
      fetchDashboardData()
    }
  }, [user, authLoading])

  const fetchDashboardData = async () => {
    try {
      // Fetch users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Fetch vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('status')

      const totalVehicles = vehicles?.length || 0
      const pendingApprovals = vehicles?.filter(v => v.status === 'pending').length || 0

      // Fetch bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, total_price, start_date')

      const activeBookings = bookings?.filter(b => 
        b.status === 'confirmed' || b.status === 'active'
      ).length || 0

      const completedBookings = bookings?.filter(b => b.status === 'completed') || []
      const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total_price, 0)

      const thisMonth = new Date().getMonth()
      const thisYear = new Date().getFullYear()
      const monthlyRevenue = completedBookings
        .filter(b => {
          const date = new Date(b.start_date)
          return date.getMonth() === thisMonth && date.getFullYear() === thisYear
        })
        .reduce((sum, b) => sum + b.total_price, 0)

      const platformCommission = totalRevenue * 0.05 // 5% commission

      setStats({
        totalUsers: usersCount || 0,
        totalVehicles,
        pendingApprovals,
        activeBookings,
        totalRevenue,
        monthlyRevenue,
        platformCommission,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.user_metadata?.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform Overview & Management</p>
        </div>

        {/* Alert for Pending Approvals */}
        {stats.pendingApprovals > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium">Pending Vehicle Approvals</p>
                <p className="text-sm text-muted-foreground">
                  {stats.pendingApprovals} vehicle{stats.pendingApprovals !== 1 ? 's' : ''} waiting for review
                </p>
              </div>
              <Link href="/admin/listings">
                <button className="px-4 py-2 border rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors">
                  Review Now
                </button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingApprovals} pending approval
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
              <p className="text-xs text-muted-foreground mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.platformCommission)}</div>
              <p className="text-xs text-muted-foreground mt-1">5% of total revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Overview */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">This Month</div>
                    <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/admin/listings">
                  <button className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <Car className="h-6 w-6 mb-2" />
                    <div className="font-medium">Manage Listings</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.pendingApprovals} pending
                    </div>
                  </button>
                </Link>

                <Link href="/admin/users">
                  <button className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <Users className="h-6 w-6 mb-2" />
                    <div className="font-medium">Manage Users</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.totalUsers} total
                    </div>
                  </button>
                </Link>

                <Link href="/admin/transactions">
                  <button className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <DollarSign className="h-6 w-6 mb-2" />
                    <div className="font-medium">Transactions</div>
                    <div className="text-xs text-muted-foreground">
                      View all
                    </div>
                  </button>
                </Link>

                <Link href="/admin/analytics">
                  <button className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <TrendingUp className="h-6 w-6 mb-2" />
                    <div className="font-medium">Analytics</div>
                    <div className="text-xs text-muted-foreground">
                      View reports
                    </div>
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

