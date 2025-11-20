'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Wrench, Calendar, DollarSign, CheckCircle2, MoreVertical, Eye, Edit, Trash2, MessageSquare, History } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, startOfDay, endOfDay, subDays, startOfYear, endOfYear, subYears } from 'date-fns'

interface MaintenanceRecord {
  id: string
  vehicle_id: string
  service_date: string
  description: string
  cost: number
  service_type: string
  status: string
  created_at: string
  vehicle: {
    make: string
    model: string
    plate_number: string
    owner: {
      full_name: string
    }
  }
}

export default function AdminMaintenancePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null)
  const [editFormData, setEditFormData] = useState({
    service_date: '',
    service_type: '',
    description: '',
    cost: '',
    status: 'scheduled',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      loadRecords()
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    filterRecords()
  }, [records, searchQuery, statusFilter])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select(`
          *,
          vehicle:vehicles!inner(
            make,
            model,
            plate_number,
            owner:users!vehicles_owner_id_fkey(full_name)
          )
        `)
        .order('service_date', { ascending: false })

      if (error) throw error
      
      // Set default values for missing fields
      const recordsWithDefaults = data?.map(record => ({
        ...record,
        status: record.status || 'scheduled',
        service_type: record.service_type || 'General Maintenance'
      })) || []
      
      setRecords(recordsWithDefaults)
    } catch (error: any) {
      console.error('Error loading maintenance records:', error)
      toast({
        title: 'Error',
        description: 'Failed to load maintenance records.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filterRecords = () => {
    let filtered = [...records]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r =>
        r.vehicle?.make?.toLowerCase().includes(query) ||
        r.vehicle?.model?.toLowerCase().includes(query) ||
        r.vehicle?.owner?.full_name?.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    setFilteredRecords(filtered)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'in_progress') {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">
          In Progress
        </Badge>
      )
    }
    if (status === 'scheduled') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 border">
          Scheduled
        </Badge>
      )
    }
    return (
      <Badge variant="outline">
        Completed
      </Badge>
    )
  }

  const markComplete = async (recordId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('maintenance_logs')
        .update({ status: 'completed' })
        .eq('id', recordId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Maintenance record marked as complete.',
      })
      
      loadRecords()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update record.',
        variant: 'destructive',
      })
    }
  }

  const handleViewDetails = (record: MaintenanceRecord) => {
    setSelectedRecord(record)
    setViewDialogOpen(true)
  }

  const handleEdit = (record: MaintenanceRecord) => {
    setSelectedRecord(record)
    setEditFormData({
      service_date: record.service_date,
      service_type: record.service_type,
      description: record.description,
      cost: record.cost.toString(),
      status: record.status,
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedRecord) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('maintenance_logs')
        .update({
          service_date: editFormData.service_date,
          service_type: editFormData.service_type,
          description: editFormData.description,
          cost: parseFloat(editFormData.cost) || 0,
          status: editFormData.status,
        })
        .eq('id', selectedRecord.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Maintenance record updated successfully.',
      })
      
      setEditDialogOpen(false)
      loadRecords()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update record.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (recordId: string, vehicleName: string) => {
    if (!confirm(`Are you sure you want to delete this maintenance record for ${vehicleName}?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('maintenance_logs')
        .delete()
        .eq('id', recordId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Maintenance record deleted successfully.',
      })
      
      loadRecords()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete record.',
        variant: 'destructive',
      })
    }
  }

  const handleContactOwner = (ownerName: string) => {
    toast({
      title: 'Contact Owner',
      description: `Opening message to ${ownerName}`,
    })
    // TODO: Implement messaging/contact functionality
  }

  const handleViewHistory = (vehicleId: string, vehicleName: string) => {
    // Filter to show only this vehicle's maintenance history
    setSearchQuery(vehicleName)
    toast({
      title: 'Vehicle History',
      description: `Showing all maintenance for ${vehicleName}`,
    })
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

  // Calculate stats
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0)
  const completedCount = records.filter(r => r.status === 'completed').length
  const scheduledCount = records.filter(r => r.status === 'scheduled').length

  // Calculate period data for chart based on selected time period
  const getChartData = () => {
    switch (timePeriod) {
      case 'daily': {
        // Last 7 days
        return Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i)
          const label = format(date, 'EEE') // Mon, Tue, etc.
          const dayStart = startOfDay(date)
          const dayEnd = endOfDay(date)
          
          const cost = records
            .filter(r => {
              const serviceDate = parseISO(r.service_date)
              return serviceDate >= dayStart && serviceDate <= dayEnd && r.status === 'completed'
            })
            .reduce((sum, r) => sum + r.cost, 0)
          
          return { label, cost }
        })
      }
      case 'weekly': {
        // Last 8 weeks
        return Array.from({ length: 8 }, (_, i) => {
          const date = subWeeks(new Date(), 7 - i)
          const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday
          const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
          const label = `W${format(weekStart, 'w')}`
          
          const cost = records
            .filter(r => {
              const serviceDate = parseISO(r.service_date)
              return serviceDate >= weekStart && serviceDate <= weekEnd && r.status === 'completed'
            })
            .reduce((sum, r) => sum + r.cost, 0)
          
          return { label, cost }
        })
      }
      case 'yearly': {
        // Last 5 years
        return Array.from({ length: 5 }, (_, i) => {
          const date = subYears(new Date(), 4 - i)
          const label = format(date, 'yyyy')
          const yearStart = startOfYear(date)
          const yearEnd = endOfYear(date)
          
          const cost = records
            .filter(r => {
              const serviceDate = parseISO(r.service_date)
              return serviceDate >= yearStart && serviceDate <= yearEnd && r.status === 'completed'
            })
            .reduce((sum, r) => sum + r.cost, 0)
          
          return { label, cost }
        })
      }
      default: {
        // Monthly - Last 6 months
        return Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i)
          const label = format(date, 'MMM')
          const monthStart = startOfMonth(date)
          const monthEnd = endOfMonth(date)
          
          const cost = records
            .filter(r => {
              const serviceDate = parseISO(r.service_date)
              return serviceDate >= monthStart && serviceDate <= monthEnd && r.status === 'completed'
            })
            .reduce((sum, r) => sum + r.cost, 0)
          
          return { label, cost }
        })
      }
    }
  }

  const chartData = getChartData()
  const maxCost = Math.max(...chartData.map(d => d.cost), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Monitoring</h1>
        <p className="text-muted-foreground mt-1">
          Track vehicle maintenance schedules and costs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Total Maintenance Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Maintenance Cost
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>

        {/* Scheduled */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Costs Chart with Period Selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>
              {timePeriod === 'daily' && 'Daily Maintenance Costs'}
              {timePeriod === 'weekly' && 'Weekly Maintenance Costs'}
              {timePeriod === 'monthly' && 'Monthly Maintenance Costs'}
              {timePeriod === 'yearly' && 'Yearly Maintenance Costs'}
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
          <div className="h-64 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-t border-gray-200" />
              ))}
            </div>
            
            {/* Chart bars */}
            <div className="relative h-full flex items-end gap-4 pb-4">
              {chartData.map((data, index) => {
                const heightPercentage = maxCost > 0 ? (data.cost / maxCost) * 100 : 0
                const barHeight = heightPercentage > 0 ? Math.max(heightPercentage, 5) : 0
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full relative group flex items-end" style={{ height: '200px' }}>
                      {barHeight > 0 ? (
                        <div
                          className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t cursor-pointer relative"
                          style={{
                            height: `${barHeight}%`,
                            minHeight: '10px'
                          }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {formatCurrency(data.cost)}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-1 bg-gray-200 rounded" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{data.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle, owner, or issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Records Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <h3 className="font-semibold">Maintenance Records ({filteredRecords.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Maintenance Date</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No maintenance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.vehicle.make} {record.vehicle.model}</div>
                          <div className="text-xs text-muted-foreground">{record.vehicle.plate_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>{record.vehicle.owner.full_name}</TableCell>
                      <TableCell className="text-sm">{formatDate(record.service_date)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="flex items-center gap-2 text-sm">
                            <Wrench className="h-4 w-4 text-orange-600" />
                            <span>{record.description}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(record.cost)}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(record)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Record
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleViewHistory(
                                record.vehicle_id, 
                                `${record.vehicle.make} ${record.vehicle.model}`
                              )}
                            >
                              <History className="mr-2 h-4 w-4" />
                              View Vehicle History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {record.status !== 'completed' && (
                              <>
                                <DropdownMenuItem onClick={() => markComplete(record.id)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleContactOwner(record.vehicle.owner.full_name)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Contact Owner
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(
                                record.id, 
                                `${record.vehicle.make} ${record.vehicle.model}`
                              )}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Maintenance Record Details</DialogTitle>
            <DialogDescription>
              Complete information about this maintenance record
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Vehicle</Label>
                  <p className="text-sm mt-1">
                    {selectedRecord.vehicle.make} {selectedRecord.vehicle.model}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedRecord.vehicle.plate_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Owner</Label>
                  <p className="text-sm mt-1">{selectedRecord.vehicle.owner.full_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Service Date</Label>
                  <p className="text-sm mt-1">{formatDate(selectedRecord.service_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Service Type</Label>
                  <p className="text-sm mt-1">{selectedRecord.service_type}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedRecord.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Cost</Label>
                  <p className="text-sm mt-1 font-semibold">{formatCurrency(selectedRecord.cost)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Record created: {formatDate(selectedRecord.created_at)}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Maintenance Record</DialogTitle>
            <DialogDescription>
              Update the maintenance record information
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <Label>Vehicle</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRecord.vehicle.make} {selectedRecord.vehicle.model} ({selectedRecord.vehicle.plate_number})
                </p>
              </div>

              <div>
                <Label htmlFor="edit_service_date">Service Date *</Label>
                <Input
                  id="edit_service_date"
                  type="date"
                  value={editFormData.service_date}
                  onChange={(e) => setEditFormData({ ...editFormData, service_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit_service_type">Service Type *</Label>
                <Select
                  value={editFormData.service_type}
                  onValueChange={(value) => setEditFormData({ ...editFormData, service_type: value })}
                >
                  <SelectTrigger id="edit_service_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Maintenance">General Maintenance</SelectItem>
                    <SelectItem value="Oil Change">Oil Change</SelectItem>
                    <SelectItem value="Tire Service">Tire Service</SelectItem>
                    <SelectItem value="Brake Service">Brake Service</SelectItem>
                    <SelectItem value="Engine Repair">Engine Repair</SelectItem>
                    <SelectItem value="Transmission Service">Transmission Service</SelectItem>
                    <SelectItem value="Body Work">Body Work</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit_description">Description *</Label>
                <Textarea
                  id="edit_description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit_status">Status *</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                >
                  <SelectTrigger id="edit_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit_cost">Cost (₱) *</Label>
                <Input
                  id="edit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.cost}
                  onChange={(e) => setEditFormData({ ...editFormData, cost: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
