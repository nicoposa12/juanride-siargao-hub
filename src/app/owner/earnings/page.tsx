'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/shared/Navigation'
import { DollarSign, TrendingUp, Calendar, Car } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface EarningsStats {
  totalEarnings: number
  monthlyEarnings: number
  completedBookings: number
  pendingPayouts: number
}

interface Transaction {
  id: string
  booking_id: string
  total_price: number
  start_date: string
  end_date: string
  created_at: string
  vehicle_name: string
  renter_name: string
}

interface VehicleEarnings {
  vehicle_id: string
  vehicle_name: string
  total_earnings: number
  bookings_count: number
}

export default function OwnerEarningsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    completedBookings: 0,
    pendingPayouts: 0,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [vehicleEarnings, setVehicleEarnings] = useState<VehicleEarnings[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'owner')) {
      router.push('/')
    } else if (user) {
      fetchEarningsData()
    }
  }, [user, authLoading])

  const fetchEarningsData = async () => {
    const supabase = createClient()
    
    try {
      // Fetch all bookings
      const { data: allBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          total_price,
          status,
          created_at,
          vehicle:vehicles!inner (
            id,
            make,
            model,
            owner_id
          ),
          renter:users!bookings_renter_id_fkey (
            full_name
          )
        `)
        .eq('vehicle.owner_id', user?.id)
        .order('created_at', { ascending: false })

      const completedBookings = allBookings?.filter(b => b.status === 'completed') || []
      const totalEarnings = completedBookings.reduce((sum, b) => sum + b.total_price, 0)

      // Calculate monthly earnings
      const thisMonthStart = startOfMonth(new Date())
      const thisMonthEnd = endOfMonth(new Date())
      const monthlyEarnings = completedBookings
        .filter(b => {
          const date = parseISO(b.start_date)
          return date >= thisMonthStart && date <= thisMonthEnd
        })
        .reduce((sum, b) => sum + b.total_price, 0)

      // Pending payouts (completed but not yet paid out - simplified)
      const pendingPayouts = completedBookings.length

      setStats({
        totalEarnings,
        monthlyEarnings,
        completedBookings: completedBookings.length,
        pendingPayouts: 0, // Simplified - would need payment tracking
      })

      // Transaction history
      const transactionList: Transaction[] = completedBookings.map(b => {
        const vehicleInfo = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle
        const renterInfo = Array.isArray(b.renter) ? b.renter[0] : b.renter
        return {
          id: b.id,
          booking_id: b.id,
          total_price: b.total_price,
          start_date: b.start_date,
          end_date: b.end_date,
          created_at: b.created_at,
          vehicle_name: `${vehicleInfo?.make || ''} ${vehicleInfo?.model || ''}`.trim(),
          renter_name: renterInfo?.full_name || 'Customer',
        }
      })
      setTransactions(transactionList.slice(0, 10))

      // Calculate earnings by vehicle
      const vehicleEarningsMap = new Map<string, VehicleEarnings>()
      completedBookings.forEach(booking => {
        const vehicleInfo = Array.isArray(booking.vehicle) ? booking.vehicle[0] : booking.vehicle
        if (!vehicleInfo?.id) {
          return
        }
        const vehicleId = vehicleInfo.id
        const existing = vehicleEarningsMap.get(vehicleId) || {
          vehicle_id: vehicleId,
          vehicle_name: `${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim(),
          total_earnings: 0,
          bookings_count: 0,
        }
        existing.total_earnings += booking.total_price
        existing.bookings_count += 1
        vehicleEarningsMap.set(vehicleId, existing)
      })

      const vehicleEarningsList = Array.from(vehicleEarningsMap.values())
        .sort((a, b) => b.total_earnings - a.total_earnings)
      setVehicleEarnings(vehicleEarningsList)

    } catch (error) {
      console.error('Error fetching earnings:', error)
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

  if (!user || user.user_metadata?.role !== 'owner') return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      <div className="py-12 pt-24">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Earnings & Analytics</h1>
          <p className="text-muted-foreground">Track your revenue and financial performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthlyEarnings)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(), 'MMMM yyyy')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">Total bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average per Booking</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  stats.completedBookings > 0
                    ? stats.totalEarnings / stats.completedBookings
                    : 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per rental</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Earnings by Vehicle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Earnings by Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicleEarnings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No earnings data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicleEarnings.map(vehicle => (
                    <div key={vehicle.vehicle_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold">{vehicle.vehicle_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.bookings_count} {vehicle.bookings_count === 1 ? 'booking' : 'bookings'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatCurrency(vehicle.total_earnings)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(vehicle.total_earnings / vehicle.bookings_count)} avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold">{transaction.vehicle_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.renter_name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(transaction.start_date), 'MMM dd')} - {format(parseISO(transaction.end_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(transaction.total_price)}</div>
                        <div className="text-xs text-green-600">Completed</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Platform Commission</div>
                <div className="text-lg font-semibold">5%</div>
                <div className="text-xs text-muted-foreground">
                  Est. {formatCurrency(stats.totalEarnings * 0.05)} paid
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Your Net Earnings</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(stats.totalEarnings * 0.95)}
                </div>
                <div className="text-xs text-muted-foreground">
                  After 5% commission
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Payout Schedule</div>
                <div className="text-lg font-semibold">Monthly</div>
                <div className="text-xs text-muted-foreground">
                  On the 1st of each month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  )
}

