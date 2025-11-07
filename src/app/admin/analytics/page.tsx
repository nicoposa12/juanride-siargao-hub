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

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    userGrowth: [] as { date: string; count: number }[],
    vehiclesByType: [] as { type: string; count: number }[],
    bookingsByStatus: [] as { status: string; count: number }[],
    revenueByMonth: [] as { month: string; revenue: number }[],
    topVehicles: [] as { name: string; bookings: number; revenue: number }[],
    topLocations: [] as { location: string; vehicles: number }[],
  })

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'admin')) {
      router.push('/')
    } else if (user) {
      fetchAnalytics()
    }
  }, [user, authLoading])

  const fetchAnalytics = async () => {
    try {
      const supabase = createClient()
      
      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('created_at')
        .order('created_at', { ascending: true })

      // Fetch vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('type, name, location')

      // Fetch bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, total_price, start_date, vehicle_id, vehicles(name)')

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
      const vehicleBookings = bookings?.reduce((acc: any, b) => {
        const vehicleName = b.vehicles?.name || 'Unknown'
        if (!acc[vehicleName]) {
          acc[vehicleName] = { bookings: 0, revenue: 0 }
        }
        acc[vehicleName].bookings++
        if (b.status === 'completed') {
          acc[vehicleName].revenue += b.total_price
        }
        return acc
      }, {})

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

  if (!user || user.user_metadata?.role !== 'admin') return null

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
                <div className="space-y-4">
                  {analytics.vehiclesByType.map(item => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Car className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{item.type}</span>
                      </div>
                      <div className="text-2xl font-bold">{item.count}</div>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-4">
                  {analytics.bookingsByStatus.map(item => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="font-medium capitalize">{item.status}</span>
                      <div className="text-2xl font-bold">{item.count}</div>
                    </div>
                  ))}
                </div>
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
              <div className="space-y-4">
                {analytics.topVehicles.map((vehicle, index) => (
                  <div key={vehicle.name} className="flex items-center gap-4 p-4 border rounded-lg">
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
                      <div className="text-lg font-bold">{formatCurrency(vehicle.revenue)}</div>
                      <div className="text-xs text-muted-foreground">Total revenue</div>
                    </div>
                  </div>
                ))}
              </div>
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

