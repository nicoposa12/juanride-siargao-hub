'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  Car, 
  Calendar, 
  DollarSign,
  TrendingUp,
  MapPin
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { format, subDays, parseISO } from 'date-fns'
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

// Chart colors
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [analytics, setAnalytics] = useState({
    userGrowth: [] as { date: string; count: number }[],
    vehiclesByType: [] as { type: string; count: number }[],
    bookingsByStatus: [] as { status: string; count: number }[],
    revenueByMonth: [] as { month: string; revenue: number }[],
    topVehicles: [] as { name: string; bookings: number; revenue: number }[],
    topLocations: [] as { location: string; vehicles: number }[],
  })

  useEffect(() => {
    // Don't redirect while still loading
    if (authLoading) {
      return
    }
    
    // Give auth context time to stabilize on first check
    if (!hasCheckedAuth) {
      setHasCheckedAuth(true)
      return
    }
    
    // Check if user is authenticated
    if (!user) {
      router.push('/login')
      return
    }
    
    // Wait for profile to load
    if (!profile) {
      return
    }
    
    // Check if user is admin
    if (profile.role !== 'admin') {
      router.push('/unauthorized')
      return
    }
    
    // All checks passed - load analytics
    fetchAnalytics()
  }, [user, profile, authLoading, router, hasCheckedAuth])

  const fetchAnalytics = async () => {
    try {
      const supabase = createClient()
      
      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('created_at')
        .order('created_at', { ascending: true })

      if (usersError) {
        console.error('Error fetching users:', usersError)
      }

      // Fetch vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('type, make, model, location')

      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError)
      }
      console.log('Vehicles fetched:', vehicles?.length || 0)

      // Fetch bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('status, total_price, start_date, vehicle_id, vehicles(make, model)')

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
      }
      console.log('Bookings fetched:', bookings?.length || 0)

      // Process data
      const vehiclesByType = vehicles?.reduce((acc: any[], v) => {
        const existing = acc.find(x => x.type === v.type)
        if (existing) {
          existing.count++
        } else {
          acc.push({ type: v.type, count: 1 })
        }
        return acc
      }, []) || []

      const bookingsByStatus = bookings?.reduce((acc: any[], b) => {
        const existing = acc.find(x => x.status === b.status)
        if (existing) {
          existing.count++
        } else {
          acc.push({ status: b.status, count: 1 })
        }
        return acc
      }, []) || []

      // Top vehicles
      const vehicleBookings = bookings?.reduce((acc: any, b: any) => {
        const vehicleRelation = Array.isArray(b.vehicles) ? b.vehicles[0] : b.vehicles
        const vehicleName = vehicleRelation?.make && vehicleRelation?.model 
          ? `${vehicleRelation.make} ${vehicleRelation.model}` 
          : 'Unknown'
        if (!acc[vehicleName]) {
          acc[vehicleName] = { bookings: 0, revenue: 0 }
        }
        acc[vehicleName].bookings++
        if (b.status === 'completed') {
          acc[vehicleName].revenue += b.total_price
        }
        return acc
      }, {})

      console.log('Vehicle bookings processed:', Object.keys(vehicleBookings || {}).length)

      const topVehicles = Object.entries(vehicleBookings || {})
        .map(([name, data]: any) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Top locations
      const locationCounts = vehicles?.reduce((acc: any, v) => {
        acc[v.location] = (acc[v.location] || 0) + 1
        return acc
      }, {})

      const topLocations = Object.entries(locationCounts || {})
        .map(([location, vehicles]) => ({ location, vehicles: vehicles as number }))
        .sort((a, b) => b.vehicles - a.vehicles)
        .slice(0, 5)

      console.log('Analytics processed:', {
        vehiclesByType: vehiclesByType.length,
        bookingsByStatus: bookingsByStatus.length,
        topVehicles: topVehicles.length,
        topLocations: topLocations.length
      })

      setAnalytics({
        userGrowth: [],
        vehiclesByType,
        bookingsByStatus,
        revenueByMonth: [],
        topVehicles,
        topLocations,
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
          <p className="text-muted-foreground">Insights and performance metrics</p>
        </div>

        {/* Vehicles by Type */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicles by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.vehiclesByType.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.vehiclesByType}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="type" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {analytics.vehiclesByType.map((item, index) => (
                      <div key={item.type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium capitalize">{item.type}</span>
                        </div>
                        <span className="text-muted-foreground">{item.count} vehicles</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Bookings by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.bookingsByStatus.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.bookingsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.bookingsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {analytics.bookingsByStatus.map((item, index) => (
                      <div key={item.status} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium capitalize">{item.status}</span>
                        </div>
                        <span className="text-muted-foreground">{item.count} bookings</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Vehicles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topVehicles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topVehicles} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={150}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6 grid gap-4">
                  {analytics.topVehicles.map((vehicle, index) => (
                    <div key={vehicle.name} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{vehicle.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.bookings} booking{vehicle.bookings !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{formatCurrency(vehicle.revenue)}</div>
                        <div className="text-xs text-muted-foreground">Total revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topLocations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {analytics.topLocations.map(location => (
                  <div key={location.location} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{location.location}</span>
                    </div>
                    <div className="text-xl font-bold">{location.vehicles}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

