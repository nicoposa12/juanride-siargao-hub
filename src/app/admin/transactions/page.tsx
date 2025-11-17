'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Download, DollarSign, TrendingUp, AlertCircle, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'

interface Transaction {
  id: string
  booking_id: string
  amount: number
  payment_method: string
  status: string
  transaction_id: string
  created_at: string
  booking: {
    start_date: string
    end_date: string
    vehicle: {
      make: string
      model: string
    }
    renter: {
      full_name: string
    }
  }
}

export default function AdminTransactionsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      fetchTransactions()
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    filterTransactions()
  }, [searchQuery, transactions, methodFilter, statusFilter])

  const fetchTransactions = async () => {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings!inner (
            start_date,
            end_date,
            vehicle:vehicles (
              make,
              model
            ),
            renter:users!bookings_renter_id_fkey (
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
      setFilteredTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.transaction_id.toLowerCase().includes(query) ||
        `${t.booking.vehicle.make} ${t.booking.vehicle.model}`.toLowerCase().includes(query) ||
        t.booking.renter.full_name.toLowerCase().includes(query)
      )
    }

    // Filter by payment method
    if (methodFilter !== 'all') {
      filtered = filtered.filter(t => t.payment_method.toLowerCase() === methodFilter.toLowerCase())
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status.toLowerCase() === statusFilter.toLowerCase())
    }

    setFilteredTransactions(filtered)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: { variant: 'default', label: 'Completed' },
      pending: { variant: 'secondary', label: 'Pending' },
      failed: { variant: 'destructive', label: 'Failed' },
      refunded: { variant: 'outline', label: 'Refunded' },
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Transaction ID', 'Vehicle', 'Renter', 'Amount', 'Payment Method', 'Status']
    const rows = filteredTransactions.map(t => [
      format(parseISO(t.created_at), 'yyyy-MM-dd HH:mm:ss'),
      t.transaction_id,
      `${t.booking.vehicle.make} ${t.booking.vehicle.model}`,
      t.booking.renter.full_name,
      t.amount.toString(),
      t.payment_method,
      t.status,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // AdminLayout already handles auth protection, no need for additional check here

  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  
  const monthlyCompleted = transactions
    .filter(t => {
      const date = parseISO(t.created_at)
      return t.status === 'completed' && 
             date.getMonth() === thisMonth && 
             date.getFullYear() === thisYear
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const pendingPayments = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  const failedPayments = transactions
    .filter(t => t.status === 'failed')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-700">Payment & Transactions</h1>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg font-medium">
            Monitor all payment transactions and revenue
          </p>
        </div>
        <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700 shadow-layered-md hover:shadow-layered-lg hover:scale-105 transition-all duration-300 group">
          <Download className="h-4 w-4 mr-2 group-hover:scale-110 group-hover:-rotate-12 transition-all" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Collected This Month */}
        <Card className="card-gradient border-green-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-100/0 to-green-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-green-700 transition-colors">
              Total Collected This Month
            </CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 transition-all duration-500 pulse-glow">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold text-green-700 group-hover:scale-110 transition-transform duration-300">{formatCurrency(monthlyCompleted)}</div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="card-gradient border-orange-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/0 to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-orange-700 transition-colors">
              Pending Payments
            </CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-100 flex items-center justify-center shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 transition-all duration-500 bounce-subtle">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold text-orange-700 group-hover:scale-110 transition-transform duration-300">{formatCurrency(pendingPayments)}</div>
          </CardContent>
        </Card>

        {/* Failed Payments */}
        <Card className="card-gradient border-red-200/50 hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-500 group cursor-pointer overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100/0 to-red-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-semibold text-primary-700 group-hover:text-red-700 transition-colors">
              Failed Payments
            </CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-100 flex items-center justify-center shadow-layered-sm group-hover:shadow-layered-md group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold text-red-700 group-hover:scale-110 transition-transform duration-300">{formatCurrency(failedPayments)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="card-gradient shadow-layered-md border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary-600 transition-colors duration-300" />
              <Input
                placeholder="Search by transaction ID, renter, or vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus-visible:ring-primary-500 hover:shadow-sm transition-all duration-300"
              />
            </div>

            {/* Method Filter */}
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="gcash">GCash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="card-gradient shadow-layered-md border-border/50">
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <h3 className="font-semibold">All Transactions ({filteredTransactions.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">No transactions found</p>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try a different search term' : 'No transactions available'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Renter</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">
                        {transaction.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.booking_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{transaction.booking.renter.full_name}</TableCell>
                      <TableCell>{`${transaction.booking.vehicle.make} ${transaction.booking.vehicle.model}`}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.payment_method.toLowerCase().includes('gcash') ? (
                            <>
                              <CreditCard className="h-4 w-4 text-blue-600" />
                              <span className="text-sm">Gcash</span>
                            </>
                          ) : transaction.payment_method.toLowerCase().includes('credit') ? (
                            <>
                              <CreditCard className="h-4 w-4 text-purple-600" />
                              <span className="text-sm">Credit Card</span>
                            </>
                          ) : (
                            <span className="text-sm capitalize">{transaction.payment_method}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(parseISO(transaction.created_at), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          </CardContent>
        </Card>
    </div>
  )
}

