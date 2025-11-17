'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Wrench, Calendar, DollarSign, Loader2, Trash2, Edit } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import Navigation from '@/components/shared/Navigation'

interface MaintenanceLog {
  id: string
  vehicle_id: string
  service_date: string
  service_type: string
  description: string
  cost: number
  status: string
  created_at: string
  vehicle: {
    make: string
    model: string
    plate_number: string
  }
}

export default function OwnerMaintenancePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null)

  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_date: '',
    service_type: 'General Maintenance',
    description: '',
    cost: '',
    status: 'scheduled',
  })

  const [editFormData, setEditFormData] = useState({
    service_date: '',
    service_type: '',
    description: '',
    cost: '',
    status: '',
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'owner')) {
        router.push('/')
        return
      }
      loadData()
    }
  }, [user, profile, authLoading, router])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, make, model, plate_number')
        .eq('owner_id', user!.id)
        .order('make')

      if (vehiclesError) throw vehiclesError
      setVehicles(vehiclesData || [])

      // Load maintenance logs
      const { data: logsData, error: logsError } = await supabase
        .from('maintenance_logs')
        .select(`
          id,
          vehicle_id,
          service_date,
          service_type,
          description,
          cost,
          status,
          created_at,
          vehicle:vehicles (
            make,
            model,
            plate_number
          )
        `)
        .in('vehicle_id', vehiclesData?.map(v => v.id) || [])
        .order('service_date', { ascending: false })

      if (logsError) throw logsError
      const normalizedLogs: MaintenanceLog[] = (logsData || []).map((log: any) => {
        const vehicleInfo = Array.isArray(log.vehicle) ? log.vehicle[0] : log.vehicle
        return {
          ...log,
          vehicle: {
            make: vehicleInfo?.make || '',
            model: vehicleInfo?.model || '',
            plate_number: vehicleInfo?.plate_number || '',
          },
        }
      })
      setLogs(normalizedLogs)
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load maintenance data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.vehicle_id || !formData.service_date || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('maintenance_logs')
        .insert({
          vehicle_id: formData.vehicle_id,
          service_date: formData.service_date,
          service_type: formData.service_type,
          description: formData.description,
          cost: formData.cost ? parseFloat(formData.cost) : 0,
          status: formData.status,
        })

      if (error) throw error

      toast({
        title: 'Maintenance Log Added',
        description: 'The maintenance record has been saved successfully',
      })

      setDialogOpen(false)
      setFormData({ vehicle_id: '', service_date: '', service_type: 'General Maintenance', description: '', cost: '', status: 'scheduled' })
      loadData()
    } catch (error: any) {
      console.error('Error adding log:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to add maintenance log',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance log?')) {
      return
    }

    setDeleteId(id)
    try {
      const { error } = await supabase
        .from('maintenance_logs')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Maintenance Log Deleted',
        description: 'The maintenance record has been removed',
      })

      loadData()
    } catch (error: any) {
      console.error('Error deleting log:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete maintenance log',
        variant: 'destructive',
      })
    } finally {
      setDeleteId(null)
    }
  }

  const handleEdit = (log: MaintenanceLog) => {
    setSelectedLog(log)
    setEditFormData({
      service_date: log.service_date,
      service_type: log.service_type || 'General Maintenance',
      description: log.description,
      cost: log.cost?.toString() || '',
      status: log.status || 'scheduled',
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLog) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('maintenance_logs')
        .update({
          service_date: editFormData.service_date,
          service_type: editFormData.service_type,
          description: editFormData.description,
          cost: editFormData.cost ? parseFloat(editFormData.cost) : 0,
          status: editFormData.status,
        })
        .eq('id', selectedLog.id)

      if (error) throw error

      toast({
        title: 'Maintenance Log Updated',
        description: 'The maintenance record has been updated successfully',
      })

      setEditDialogOpen(false)
      loadData()
    } catch (error: any) {
      console.error('Error updating log:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update maintenance log',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getTotalCost = () => {
    return logs.reduce((sum, log) => sum + (log.cost || 0), 0)
  }

  const getTotalServices = () => {
    return logs.length
  }

  const getRecentServices = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return logs.filter(log => new Date(log.service_date) >= thirtyDaysAgo).length
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="py-8 pt-24">
          <div className="container mx-auto px-4">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-8 pt-24">
        <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Vehicle Maintenance</h1>
            <p className="text-muted-foreground mt-2">
              Track service history and maintenance costs
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance Record
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                Total Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalServices()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time maintenance records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Recent Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getRecentServices()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Total Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(getTotalCost())}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time maintenance expenses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
            <CardDescription>
              View and manage all maintenance records for your vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Maintenance Records</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your vehicle maintenance by adding a record
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Record
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {log.vehicle.make} {log.vehicle.model}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {log.vehicle.plate_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(log.service_date)}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.description}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(log.cost || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(log)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(log.id)}
                              disabled={deleteId === log.id}
                            >
                              {deleteId === log.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Maintenance Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Maintenance Record</DialogTitle>
              <DialogDescription>
                Record a new maintenance or service for your vehicle
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="vehicle">Vehicle *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                >
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.plate_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service_date">Service Date *</Label>
                <Input
                  id="service_date"
                  type="date"
                  value={formData.service_date}
                  onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="service_type">Service Type *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                >
                  <SelectTrigger id="service_type">
                    <SelectValue placeholder="Select service type" />
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
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Oil change, tire rotation, brake pad replacement..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cost">Cost (₱)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Add Record'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Maintenance Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Maintenance Record</DialogTitle>
              <DialogDescription>
                Update the maintenance or service record
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {selectedLog && (
                <div>
                  <Label>Vehicle</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedLog.vehicle.make} {selectedLog.vehicle.model} ({selectedLog.vehicle.plate_number})
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="edit_service_date">Service Date *</Label>
                <Input
                  id="edit_service_date"
                  type="date"
                  value={editFormData.service_date}
                  onChange={(e) => setEditFormData({ ...editFormData, service_date: e.target.value })}
                  required
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
                  placeholder="e.g., Oil change, tire rotation, brake pad replacement..."
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  required
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
                <Label htmlFor="edit_cost">Cost (₱)</Label>
                <Input
                  id="edit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editFormData.cost}
                  onChange={(e) => setEditFormData({ ...editFormData, cost: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  )
}
