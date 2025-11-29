'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  DollarSign,
  MapPin,
  Loader2,
  CreditCard,
  Wallet,
  Calendar,
  MoreVertical,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import {
  getOwnerCommissionDetails,
  getOwnerCommissionsSummary,
  updateCommissionStatus,
  suspendOwner,
  unsuspendOwner,
  PAYMENT_METHOD_LABELS,
  COMMISSION_STATUS_LABELS,
  type Commission,
  type CommissionSummary,
  type OwnerCommissionSummary,
  type CommissionStatus,
} from '@/lib/supabase/queries/commissions'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

type TimePeriod = 'daily' | 'monthly' | 'yearly'

export default function OwnerCommissionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ownerId = params?.ownerId as string
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [owner, setOwner] = useState<OwnerCommissionSummary | null>(null)
  const [transactions, setTransactions] = useState<Commission[]>([])
  const [summary, setSummary] = useState<CommissionSummary>({
    total_commission: 0,
    cashless_commission: 0,
    cash_commission: 0,
    unpaid_count: 0,
    for_verification_count: 0,
    paid_count: 0,
    suspended_count: 0,
  })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<TimePeriod>('monthly')
  const [processing, setProcessing] = useState<string | null>(null)
  
  // Dialog states
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null)
  const [statusDialog, setStatusDialog] = useState(false)
  const [suspendDialog, setSuspendDialog] = useState(false)
  const [selectedAction, setSelectedAction] = useState<CommissionStatus | null>(null)
  const [suspensionReason, setSuspensionReason] = useState('')
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/unauthorized')
        return
      }
      if (ownerId) {
        loadOwnerData()
      }
    }
  }, [user, profile, authLoading, ownerId, router])
  
  useEffect(() => {
    if (ownerId) {
      loadTransactions()
    }
  }, [ownerId, period])
  
  const loadOwnerData = async () => {
    try {
      const owners = await getOwnerCommissionsSummary()
      const ownerData = owners.find((o) => o.owner_id === ownerId)
      if (ownerData) {
        setOwner(ownerData)
      }
    } catch (error) {
      console.error('Error loading owner data:', error)
    }
  }
  
  const loadTransactions = async () => {
    setLoading(true)
    try {
      const dateFilters = getDateFilters(period)
      const { commissions, summary: summaryData } = await getOwnerCommissionDetails(ownerId, dateFilters)
      setTransactions(commissions)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getDateFilters = (period: TimePeriod) => {
    const now = new Date()
    
    switch (period) {
      case 'daily':
        return {
          period,
          startDate: startOfDay(now).toISOString(),
          endDate: endOfDay(now).toISOString(),
        }
      case 'monthly':
        return {
          period,
          startDate: startOfMonth(now).toISOString(),
          endDate: endOfMonth(now).toISOString(),
        }
      case 'yearly':
        return {
          period,
          startDate: startOfYear(now).toISOString(),
          endDate: endOfYear(now).toISOString(),
        }
      default:
        return { period }
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600 hover:bg-green-700">{COMMISSION_STATUS_LABELS.paid}</Badge>
      case 'unpaid':
        return <Badge variant="destructive">{COMMISSION_STATUS_LABELS.unpaid}</Badge>
      case 'for_verification':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">{COMMISSION_STATUS_LABELS.for_verification}</Badge>
      case 'suspended':
        return <Badge variant="outline" className="border-red-500 text-red-700">{COMMISSION_STATUS_LABELS.suspended}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  const getPeriodLabel = () => {
    switch (period) {
      case 'daily':
        return 'Today'
      case 'monthly':
        return 'This Month'
      case 'yearly':
        return 'This Year'
      default:
        return ''
    }
  }
  
  const handleStatusUpdate = async () => {
    if (!selectedCommission || !selectedAction || !user) return
    
    setProcessing(selectedCommission.id)
    setStatusDialog(false)
    
    try {
      const { success, error } = await updateCommissionStatus(
        selectedCommission.id,
        selectedAction,
        user.id
      )
      
      if (success) {
        toast({
          title: 'Status Updated',
          description: `Commission marked as ${COMMISSION_STATUS_LABELS[selectedAction]}.`,
        })
        
        // Reload transactions and owner data
        await Promise.all([loadTransactions(), loadOwnerData()])
      } else {
        throw error
      }
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast({
        title: 'Update Failed',
        description: error?.message || 'Failed to update commission status.',
        variant: 'destructive',
      })
    } finally {
      setProcessing(null)
      setSelectedCommission(null)
      setSelectedAction(null)
    }
  }
  
  const handleSuspendOwner = async () => {
    if (!ownerId || !user || !suspensionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for suspension.',
        variant: 'destructive',
      })
      return
    }
    
    setProcessing('suspend')
    setSuspendDialog(false)
    
    try {
      const { success, error } = await suspendOwner(ownerId, user.id, suspensionReason)
      
      if (success) {
        toast({
          title: 'Owner Suspended',
          description: 'The owner has been suspended successfully.',
        })
        
        // Reload owner data
        await loadOwnerData()
        setSuspensionReason('')
      } else {
        throw error
      }
    } catch (error: any) {
      console.error('Error suspending owner:', error)
      toast({
        title: 'Suspension Failed',
        description: error?.message || 'Failed to suspend owner.',
        variant: 'destructive',
      })
    } finally {
      setProcessing(null)
    }
  }
  
  const handleUnsuspendOwner = async () => {
    if (!ownerId) return
    
    setProcessing('unsuspend')
    
    try {
      const { success, error } = await unsuspendOwner(ownerId)
      
      if (success) {
        toast({
          title: 'Owner Unsuspended',
          description: 'The owner has been unsuspended successfully.',
        })
        
        // Reload owner data
        await loadOwnerData()
      } else {
        throw error
      }
    } catch (error: any) {
      console.error('Error unsuspending owner:', error)
      toast({
        title: 'Unsuspension Failed',
        description: error?.message || 'Failed to unsuspend owner.',
        variant: 'destructive',
      })
    } finally {
      setProcessing(null)
    }
  }
  
  if (loading || authLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }
  
  if (!owner) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Owners
        </Button>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Owner Not Found</h3>
          <p className="text-muted-foreground">The requested owner could not be found.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-8 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/admin/commissions')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Owners
      </Button>
      
      {/* Owner Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={owner.owner_profile_image || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {owner.owner_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{owner.owner_name}</h1>
                {owner.is_suspended && (
                  <Badge variant="outline" className="border-red-500 bg-red-50 text-red-700">
                    <Ban className="h-3 w-3 mr-1" />
                    Suspended
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{owner.owner_email}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{owner.owner_location || 'Location not specified'}</span>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center justify-end gap-2">
                {owner.has_unpaid ? (
                  <Badge variant="destructive">Unpaid Commissions</Badge>
                ) : (
                  <Badge className="bg-green-600 hover:bg-green-700">All Paid</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {owner.transaction_count} total transaction{owner.transaction_count !== 1 ? 's' : ''}
              </p>
              {owner.is_suspended && owner.suspension_reason && (
                <p className="text-xs text-red-600 italic">
                  Reason: {owner.suspension_reason}
                </p>
              )}
              <div>
                {owner.is_suspended ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnsuspendOwner}
                    disabled={processing === 'suspend' || processing === 'unsuspend'}
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                  >
                    {processing === 'unsuspend' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
                    Restore Account
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSuspendDialog(true)}
                    disabled={processing === 'suspend' || processing === 'unsuspend'}
                    className="w-full"
                  >
                    {processing === 'suspend' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Ban className="h-4 w-4 mr-2" />
                    )}
                    Suspend Owner
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Time Period Tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Commission Details - {getPeriodLabel()}</h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total to Collect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.total_commission)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unpaid commissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Cashless
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.cashless_commission)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              QRPh, GCash, Maya, etc.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.cash_commission)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In-person collection
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.unpaid_count} unpaid, {summary.paid_count} paid
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Detailed commission records for {getPeriodLabel().toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
              <p className="text-muted-foreground">
                No commission transactions found for this period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Rental Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {transaction.booking?.vehicle?.make} {transaction.booking?.vehicle?.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.booking?.vehicle?.plate_number || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(transaction.rental_amount)}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(transaction.commission_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PAYMENT_METHOD_LABELS[transaction.payment_method]}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              disabled={processing === transaction.id}
                            >
                              {processing === transaction.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCommission(transaction)
                                setSelectedAction('unpaid')
                                setStatusDialog(true)
                              }}
                              disabled={transaction.status !== 'for_verification'}
                            >
                              <XCircle className="h-4 w-4 mr-2 text-yellow-600" />
                              <div>
                                <div className="font-medium">Mark as Unpaid</div>
                                <div className="text-xs text-muted-foreground">Owner has not paid yet</div>
                              </div>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCommission(transaction)
                                setSelectedAction('for_verification')
                                setStatusDialog(true)
                              }}
                              disabled={transaction.status !== 'unpaid'}
                            >
                              <Clock className="h-4 w-4 mr-2 text-blue-600" />
                              <div>
                                <div className="font-medium">For Verification</div>
                                <div className="text-xs text-muted-foreground">Owner submitted proof</div>
                              </div>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCommission(transaction)
                                setSelectedAction('paid')
                                setStatusDialog(true)
                              }}
                              disabled={transaction.status === 'paid'}
                            >
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              <div>
                                <div className="font-medium">Mark as Paid</div>
                                <div className="text-xs text-muted-foreground">Payment verified & received</div>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Commission Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this commission as {selectedAction ? COMMISSION_STATUS_LABELS[selectedAction] : ''}?
            </DialogDescription>
          </DialogHeader>
          {selectedCommission && (
            <div className="py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booking:</span>
                <span className="font-medium">
                  {selectedCommission.booking?.vehicle?.make} {selectedCommission.booking?.vehicle?.model}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commission:</span>
                <span className="font-semibold">{formatCurrency(selectedCommission.commission_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Status:</span>
                <span>{getStatusBadge(selectedCommission.status)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Suspend Owner Dialog */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Owner</DialogTitle>
            <DialogDescription>
              Suspending {owner?.owner_name} will block them from receiving new bookings until unsuspended.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="suspension-reason">Reason for Suspension</Label>
            <Textarea
              id="suspension-reason"
              placeholder="Enter the reason for suspending this owner..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSuspendDialog(false)
              setSuspensionReason('')
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspendOwner}>
              <Ban className="h-4 w-4 mr-2" />
              Suspend Owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
