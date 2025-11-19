'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TablePagination } from '@/components/ui/table-pagination'
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
  const { user, profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    completedBookings: 0,
    pendingPayouts: 0,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [vehicleEarnings, setVehicleEarnings] = useState<VehicleEarnings[]>([])
  const [loading, setLoading] = useState(true)
  const [vehicleEarningsPage, setVehicleEarningsPage] = useState(1)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'owner')) {
        router.push('/unauthorized?reason=' + encodeURIComponent('Owner access required') + '&path=' + encodeURIComponent('/owner/earnings'))
        return
      }
      if (user) {
        fetchEarningsData()
      }
    }
  }, [user, profile, authLoading, router])

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
      setTransactions(transactionList)

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
    <div className="min-h-screen bg-gradient-subtle bg-pattern-dots">
      <Navigation />
      <div className="py-12 pt-24">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-700 mb-2">Earnings & Analytics</h1>
          <p className="text-muted-foreground text-base sm:text-lg font-medium">Track your revenue and financial performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="card-gradient border-green-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/0 to-green-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-green-700 transition-colors">Total Earnings</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 transition-all duration-500 pulse-glow">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-green-700 group-hover:scale-110 transition-transform duration-300">{formatCurrency(stats.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">All time</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-blue-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/0 to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-blue-700 transition-colors">This Month</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 group-hover:scale-110 transition-transform duration-300">{formatCurrency(stats.monthlyEarnings)}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {format(new Date(), 'MMMM yyyy')}
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-purple-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-purple-700 transition-colors">Completed Bookings</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 flex items-center justify-center shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 transition-all duration-500 bounce-subtle">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 group-hover:scale-110 transition-transform duration-300">{stats.completedBookings}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Total bookings</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-teal-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-100/0 to-teal-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-teal-700 transition-colors">Average per Booking</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-teal-100 flex items-center justify-center shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 group-hover:scale-110 transition-transform duration-300">
                {formatCurrency(
                  stats.completedBookings > 0
                    ? stats.totalEarnings / stats.completedBookings
                    : 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Per rental</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Earnings by Vehicle */}
          <Card className="card-gradient shadow-layered-md border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-700">
                <div className="p-2 bg-primary-100 rounded-lg shadow-sm">
                  <Car className="h-5 w-5 text-primary-600" />
                </div>
                Earnings by Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicleEarnings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No earnings data available</p>
                </div>
              ) : (
                <>
                <div className="space-y-4">
                  {vehicleEarnings
                    .slice((vehicleEarningsPage - 1) * itemsPerPage, vehicleEarningsPage * itemsPerPage)
                    .map(vehicle => (
                    <div key={vehicle.vehicle_id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:shadow-layered-md hover:border-primary-200 hover:-translate-x-1 transition-all duration-300 group cursor-pointer bg-white/50">
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
                {vehicleEarnings.length > itemsPerPage && (
                  <div className="mt-6">
                    <TablePagination
                      currentPage={vehicleEarningsPage}
                      totalItems={vehicleEarnings.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setVehicleEarningsPage}
                    />
                  </div>
                )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="card-gradient shadow-layered-md border-border/50">
            <CardHeader>
              <CardTitle className="text-primary-700">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No transactions yet</p>
                </div>
              ) : (
                <>
                <div className="space-y-4">
                  {transactions
                    .slice((transactionsPage - 1) * itemsPerPage, transactionsPage * itemsPerPage)
                    .map(transaction => (
                    <div key={transaction.id} className="flex items-start justify-between p-4 border border-border/50 rounded-lg hover:shadow-layered-md hover:border-primary-200 hover:-translate-x-1 transition-all duration-300 group cursor-pointer bg-white/50">
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
                {transactions.length > itemsPerPage && (
                  <div className="mt-6">
                    <TablePagination
                      currentPage={transactionsPage}
                      totalItems={transactions.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setTransactionsPage}
                    />
                  </div>
                )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Info */}
        <Card className="mt-6 card-gradient shadow-layered-md border-border/50">
          <CardHeader>
            <CardTitle className="text-primary-700">Financial Summary</CardTitle>
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

