'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Star, 
  Users, 
  Car, 
  TrendingUp, 
  Download,
  FileSpreadsheet,
  MapPin
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, startOfDay, endOfDay, subDays, startOfYear, endOfYear, subYears } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface PeriodData {
  label: string
  revenue: number
  bookings: number
}

interface TopVehicle {
  id: string
  name: string
  type: string
  bookings: number
  revenue: number
  rating: number
}

interface TopLocation {
  location: string
  count: number
}

export default function ReportsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState(0)
  const [activeRenters, setActiveRenters] = useState(0)
  const [vehicleUtilization, setVehicleUtilization] = useState(0)
  const [revenueGrowth, setRevenueGrowth] = useState(0)
  const [periodData, setPeriodData] = useState<PeriodData[]>([])
  const [topVehicles, setTopVehicles] = useState<TopVehicle[]>([])
  const [topLocations, setTopLocations] = useState<TopLocation[]>([])
  const [totalReviews, setTotalReviews] = useState(0)
  const [responseRate, setResponseRate] = useState(0)
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all')

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      loadData()
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    if (!authLoading && user) {
      loadPeriodData()
    }
  }, [timePeriod])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadAverageRating(),
        loadActiveRenters(),
        loadVehicleUtilization(),
        loadRevenueGrowth(),
        loadPeriodData(),
        loadTopVehicles(),
        loadTopLocations(),
        loadCustomerSatisfaction()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAverageRating = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')

      if (error) throw error

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length
        setAverageRating(parseFloat(avg.toFixed(1)))
      }
    } catch (error) {
      console.error('Error loading average rating:', error)
    }
  }

  const loadActiveRenters = async () => {
    try {
      // Get unique renters from the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('bookings')
        .select('renter_id')
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (error) throw error

      const uniqueRenters = new Set(data?.map(b => b.renter_id) || [])
      setActiveRenters(uniqueRenters.size)
    } catch (error) {
      console.error('Error loading active renters:', error)
    }
  }

  const loadVehicleUtilization = async () => {
    try {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id')

      if (vehiclesError) throw vehiclesError

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('vehicle_id')
        .in('status', ['confirmed', 'active', 'completed'])

      if (bookingsError) throw bookingsError

      const bookedVehicles = new Set(bookings?.map(b => b.vehicle_id) || [])
      const utilizationPercent = vehicles && vehicles.length > 0
        ? Math.round((bookedVehicles.size / vehicles.length) * 100)
        : 0

      setVehicleUtilization(utilizationPercent)
    } catch (error) {
      console.error('Error loading vehicle utilization:', error)
    }
  }

  const loadRevenueGrowth = async () => {
    try {
      const now = new Date()
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      const { data: currentData, error: currentError } = await supabase
        .from('bookings')
        .select('total_price')
        .gte('created_at', currentMonth.toISOString())
        .eq('status', 'completed')

      if (currentError) throw currentError

      const { data: lastData, error: lastError } = await supabase
        .from('bookings')
        .select('total_price')
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', currentMonth.toISOString())
        .eq('status', 'completed')

      if (lastError) throw lastError

      const currentRevenue = currentData?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
      const lastRevenue = lastData?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0

      const growth = lastRevenue > 0
        ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
        : 0

      setRevenueGrowth(parseFloat(growth.toFixed(1)))
    } catch (error) {
      console.error('Error loading revenue growth:', error)
    }
  }

  const loadPeriodData = async () => {
    try {
      let data: PeriodData[] = []

      switch (timePeriod) {
        case 'daily': {
          // Last 7 days
          for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i)
            const label = format(date, 'EEE') // Mon, Tue, etc.
            const dayStart = startOfDay(date)
            const dayEnd = endOfDay(date)

            const { data: bookings, error } = await supabase
              .from('bookings')
              .select('total_price')
              .gte('created_at', dayStart.toISOString())
              .lte('created_at', dayEnd.toISOString())
              .eq('status', 'completed')

            if (error) throw error

            const revenue = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
            const bookingCount = bookings?.length || 0

            data.push({ label, revenue, bookings: bookingCount })
          }
          break
        }
        case 'weekly': {
          // Last 8 weeks
          for (let i = 7; i >= 0; i--) {
            const date = subWeeks(new Date(), i)
            const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday
            const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
            const label = `W${format(weekStart, 'w')}`

            const { data: bookings, error } = await supabase
              .from('bookings')
              .select('total_price')
              .gte('created_at', weekStart.toISOString())
              .lte('created_at', weekEnd.toISOString())
              .eq('status', 'completed')

            if (error) throw error

            const revenue = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
            const bookingCount = bookings?.length || 0

            data.push({ label, revenue, bookings: bookingCount })
          }
          break
        }
        case 'yearly': {
          // Last 5 years
          for (let i = 4; i >= 0; i--) {
            const date = subYears(new Date(), i)
            const label = format(date, 'yyyy')
            const yearStart = startOfYear(date)
            const yearEnd = endOfYear(date)

            const { data: bookings, error } = await supabase
              .from('bookings')
              .select('total_price')
              .gte('created_at', yearStart.toISOString())
              .lte('created_at', yearEnd.toISOString())
              .eq('status', 'completed')

            if (error) throw error

            const revenue = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
            const bookingCount = bookings?.length || 0

            data.push({ label, revenue, bookings: bookingCount })
          }
          break
        }
        default: {
          // Monthly - Last 6 months
          for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i)
            const label = format(date, 'MMM')
            const monthStart = startOfMonth(date)
            const monthEnd = endOfMonth(date)

            const { data: bookings, error } = await supabase
              .from('bookings')
              .select('total_price')
              .gte('created_at', monthStart.toISOString())
              .lte('created_at', monthEnd.toISOString())
              .eq('status', 'completed')

            if (error) throw error

            const revenue = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
            const bookingCount = bookings?.length || 0

            data.push({ label, revenue, bookings: bookingCount })
          }
          break
        }
      }

      setPeriodData(data)
    } catch (error) {
      console.error('Error loading period data:', error)
    }
  }

  const loadTopVehicles = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          vehicle_id,
          total_price,
          vehicle:vehicles (
            id,
            make,
            model,
            type
          )
        `)
        .in('status', ['confirmed', 'active', 'completed'])

      if (error) throw error

      // Group by vehicle
      const vehicleMap = new Map<string, { name: string; type: string; bookings: number; revenue: number }>()

      bookings?.forEach((booking: any) => {
        const vehicle = booking.vehicle
        if (!vehicle) return

        const vehicleId = vehicle.id
        const vehicleName = `${vehicle.make} ${vehicle.model}`
        const vehicleType = vehicle.type
        
        if (vehicleMap.has(vehicleId)) {
          const existing = vehicleMap.get(vehicleId)!
          existing.bookings += 1
          existing.revenue += booking.total_price || 0
        } else {
          vehicleMap.set(vehicleId, {
            name: vehicleName,
            type: vehicleType,
            bookings: 1,
            revenue: booking.total_price || 0
          })
        }
      })

      // Get all ratings in a single query
      const vehicleIds = Array.from(vehicleMap.keys())
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('vehicle_id, rating')
        .in('vehicle_id', vehicleIds)

      // Calculate average rating per vehicle
      const ratingMap = new Map<string, number>()
      const reviewCountMap = new Map<string, number>()
      
      allReviews?.forEach((review) => {
        const currentSum = ratingMap.get(review.vehicle_id) || 0
        const currentCount = reviewCountMap.get(review.vehicle_id) || 0
        ratingMap.set(review.vehicle_id, currentSum + review.rating)
        reviewCountMap.set(review.vehicle_id, currentCount + 1)
      })

      // Build top vehicles data
      const topVehiclesData: TopVehicle[] = []
      
      for (const [id, data] of vehicleMap.entries()) {
        const totalRating = ratingMap.get(id) || 0
        const reviewCount = reviewCountMap.get(id) || 0
        const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0

        topVehiclesData.push({
          id,
          name: data.name,
          type: data.type,
          bookings: data.bookings,
          revenue: data.revenue,
          rating: parseFloat(avgRating.toFixed(1))
        })
      }

      // Sort by bookings descending
      topVehiclesData.sort((a, b) => b.bookings - a.bookings)
      setTopVehicles(topVehiclesData)
    } catch (error) {
      console.error('Error loading top vehicles:', error)
    }
  }

  const loadTopLocations = async () => {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('location')
        .eq('approval_status', 'approved')
        .not('location', 'is', null)

      if (error) throw error

      // Count vehicles per location
      const locationMap = new Map<string, number>()

      vehicles?.forEach((vehicle) => {
        const location = vehicle.location?.trim()
        if (location) {
          locationMap.set(location, (locationMap.get(location) || 0) + 1)
        }
      })

      // Convert to array and sort by count
      const topLocationsData: TopLocation[] = Array.from(locationMap.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6) // Get top 6 locations

      setTopLocations(topLocationsData)
    } catch (error) {
      console.error('Error loading top locations:', error)
    }
  }

  const loadCustomerSatisfaction = async () => {
    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating, created_at')

      if (error) throw error

      const totalReviews = reviews?.length || 0
      setTotalReviews(totalReviews)

      // Calculate review response rate (% of vehicles with at least 1 review)
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('approval_status', 'approved')
      
      if (vehicles && vehicles.length > 0) {
        // Count vehicles with reviews
        const vehicleIds = vehicles.map(v => v.id)
        const { data: reviewedVehicles } = await supabase
          .from('reviews')
          .select('vehicle_id')
          .in('vehicle_id', vehicleIds)
        
        const uniqueReviewedVehicles = new Set(reviewedVehicles?.map(r => r.vehicle_id) || [])
        const responseRate = Math.round((uniqueReviewedVehicles.size / vehicles.length) * 100)
        setResponseRate(responseRate)
      } else {
        setResponseRate(0)
      }
    } catch (error) {
      console.error('Error loading customer satisfaction:', error)
    }
  }

  const handleExportPDF = () => {
    // Create a printable version
    window.print()
  }

  const handleExportExcel = () => {
    // Create CSV data
    const csvData = []
    
    // Header
    csvData.push(['JuanRide Siargao Hub - Reports & Analytics'])
    csvData.push(['Generated:', new Date().toLocaleDateString()])
    csvData.push([])
    
    // Metrics
    csvData.push(['Key Metrics'])
    csvData.push(['Average Rating', averageRating])
    csvData.push(['Monthly Active Renters', activeRenters])
    csvData.push(['Vehicle Utilization', `${vehicleUtilization}%`])
    csvData.push(['Revenue Growth', `${revenueGrowth}%`])
    csvData.push([])
    
    // Period Trends
    csvData.push(['Revenue & Booking Trends'])
    csvData.push(['Period', 'Revenue (₱)', 'Bookings'])
    periodData.forEach((m: PeriodData) => {
      csvData.push([m.label, m.revenue, m.bookings])
    })
    csvData.push([])
    
    // Top Vehicles
    const filteredVehiclesForExport = vehicleTypeFilter === 'all' 
      ? topVehicles 
      : topVehicles.filter(v => v.type === vehicleTypeFilter)
    const top5ForExport = filteredVehiclesForExport.slice(0, 5)
    
    csvData.push(['Top 5 Most Booked Vehicles'])
    csvData.push(['Rank', 'Vehicle', 'Type', 'Bookings', 'Revenue (₱)', 'Rating'])
    top5ForExport.forEach((v, i) => {
      csvData.push([i + 1, v.name, v.type, v.bookings, v.revenue, v.rating])
    })
    csvData.push([])
    
    // Top Locations
    csvData.push(['Top Locations'])
    csvData.push(['Rank', 'Location', 'Vehicle Count'])
    topLocations.forEach((loc, i) => {
      csvData.push([i + 1, loc.location, loc.count])
    })
    csvData.push([])
    
    // Customer Satisfaction
    csvData.push(['Customer Satisfaction'])
    csvData.push(['Total Reviews', totalReviews])
    csvData.push(['Response Rate', `${responseRate}%`])
    
    // Convert to CSV string
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `juanride-reports-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (authLoading || loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button className="bg-cyan-500 hover:bg-cyan-600" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageRating}</div>
          </CardContent>
        </Card>

        {/* Monthly Active Renters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Active Renters
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeRenters}</div>
          </CardContent>
        </Card>

        {/* Vehicle Utilization */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vehicle Utilization
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
              <Car className="h-4 w-4 text-cyan-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vehicleUtilization}%</div>
          </CardContent>
        </Card>

        {/* Revenue Growth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Growth
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Booking Trends with Period Selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>
              {timePeriod === 'daily' && 'Daily Revenue & Booking Trends'}
              {timePeriod === 'weekly' && 'Weekly Revenue & Booking Trends'}
              {timePeriod === 'monthly' && 'Monthly Revenue & Booking Trends'}
              {timePeriod === 'yearly' && 'Yearly Revenue & Booking Trends'}
            </CardTitle>
            <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as any)}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={periodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="label" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="left" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#06b6d4"
                strokeWidth={3}
                name="Revenue (₱)"
                dot={{ r: 5, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bookings"
                stroke="#0ea5e9"
                strokeWidth={3}
                name="Bookings"
                dot={{ r: 5, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 5 Most Booked Vehicles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Top 5 Most Booked Vehicles</CardTitle>
            <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="scooter">Scooter</SelectItem>
                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="van">Van</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(() => {
              const filteredVehicles = vehicleTypeFilter === 'all' 
                ? topVehicles 
                : topVehicles.filter(v => v.type === vehicleTypeFilter)
              const top5 = filteredVehicles.slice(0, 5)
              
              if (top5.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No vehicles found for this type</p>
                  </div>
                )
              }
              
              return top5.map((vehicle, index) => (
                <div key={vehicle.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="h-12 w-12 rounded-full bg-cyan-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-base">{vehicle.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                        {vehicle.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{vehicle.bookings} bookings</span>
                      <span>•</span>
                      <span>{formatCurrency(vehicle.revenue)} revenue</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        {vehicle.rating}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Top Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cyan-600" />
            Top Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topLocations.map((location, index) => (
              <div
                key={location.location}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="font-medium text-base">{location.location}</span>
                </div>
                <span className="text-2xl font-bold text-cyan-600">{location.count}</span>
              </div>
            ))}
          </div>
          {topLocations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No location data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Satisfaction Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Satisfaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Average Rating</p>
              <p className="text-4xl font-bold mb-2">{averageRating}</p>
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(averageRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Total Reviews */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Reviews</p>
              <p className="text-4xl font-bold mb-2">{totalReviews.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">All time</p>
            </div>

            {/* Vehicles with Reviews */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Vehicles with Reviews</p>
              <p className="text-4xl font-bold mb-2">{responseRate}%</p>
              <p className="text-sm text-muted-foreground">Have at least 1 review</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
