'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Search, Download, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
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
      name: string
    }
    renter: {
      full_name: string
    }
  }
}

export default function AdminTransactionsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'admin')) {
      router.push('/')
    } else if (user) {
      fetchTransactions()
    }
  }, [user, authLoading])

  useEffect(() => {
    filterTransactions()
  }, [searchQuery, transactions])

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings!inner (
            start_date,
            end_date,
            vehicle:vehicles (
              name
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
    if (!searchQuery) {
      setFilteredTransactions(transactions)
      return
    }

    const filtered = transactions.filter(t =>
      t.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.booking.vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.booking.renter.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
      t.booking.vehicle.name,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.user_metadata?.role !== 'admin') return null

  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const platformCommission = totalRevenue * 0.05

  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  const monthlyRevenue = transactions
    .filter(t => {
      const date = parseISO(t.created_at)
      return t.status === 'completed' && 
             date.getMonth() === thisMonth && 
             date.getFullYear() === thisYear
    })
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transaction Management</h1>
          <p className="text-muted-foreground">Monitor and manage all platform transactions</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {transactions.filter(t => t.status === 'completed').length} completed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(), 'MMMM yyyy')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(platformCommission)}</div>
              <p className="text-xs text-muted-foreground mt-1">5% of total revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by transaction ID, vehicle, or renter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
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
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Renter</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(parseISO(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {transaction.transaction_id}
                      </TableCell>
                      <TableCell>{transaction.booking.vehicle.name}</TableCell>
                      <TableCell>{transaction.booking.renter.full_name}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-muted-foreground text-center">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>
    </div>
  )
}

