'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Plus, Wrench, Calendar, DollarSign, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { format, parseISO } from 'date-fns'

interface MaintenanceLog {
  id: string
  vehicle_id: string
  type: string
  description: string
  cost: number
  scheduled_date: string
  completed_date: string | null
  status: string
  notes: string
  created_at: string
  vehicle: {
    name: string
    license_plate: string
  }
}

interface Vehicle {
  id: string
  name: string
  license_plate: string
}

const MAINTENANCE_TYPES = [
  'Oil Change',
  'Tire Replacement',
  'Brake Service',
  'Battery Replacement',
  'General Inspection',
  'Repair',
  'Other',
]

export default function OwnerMaintenancePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_id: '',
    type: '',
    description: '',
    cost: 0,
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'owner')) {
      router.push('/')
    } else if (user) {
      fetchData()
    }
  }, [user, authLoading])

  const fetchData = async () => {
    try {
      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, name, license_plate')
        .eq('owner_id', user?.id)

      setVehicles(vehiclesData || [])

      // Fetch maintenance logs
      const { data: logsData } = await supabase
        .from('maintenance_logs')
        .select(`
          *,
          vehicle:vehicles!inner (
            name,
            license_plate,
            owner_id
          )
        `)
        .eq('vehicle.owner_id', user?.id)
        .order('scheduled_date', { ascending: false })

      setMaintenanceLogs(logsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load maintenance data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from('maintenance_logs').insert({
        vehicle_id: formData.vehicle_id,
        type: formData.type,
        description: formData.description,
        cost: formData.cost,
        scheduled_date: formData.scheduled_date,
        notes: formData.notes,
        status: 'scheduled',
      })

      if (error) throw error

      // Update vehicle availability during maintenance
      await supabase
        .from('vehicles')
        .update({ is_available: false })
        .eq('id', formData.vehicle_id)

      toast({
        title: 'Success',
        description: 'Maintenance scheduled successfully',
      })

      setIsDialogOpen(false)
      setFormData({
        vehicle_id: '',
        type: '',
        description: '',
        cost: 0,
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule maintenance',
        variant: 'destructive',
      })
    }
  }

  const handleComplete = async (logId: string, vehicleId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_logs')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString(),
        })
        .eq('id', logId)

      if (error) throw error

      // Make vehicle available again
      await supabase
        .from('vehicles')
        .update({ is_available: true })
        .eq('id', vehicleId)

      toast({
        title: 'Success',
        description: 'Maintenance marked as completed',
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update maintenance status',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: { variant: 'secondary', label: 'Scheduled' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'outline', label: 'Completed' },
    }
    const config = variants[status] || variants.scheduled
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const totalCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0)
  const scheduledCount = maintenanceLogs.filter(log => log.status === 'scheduled').length
  const completedCount = maintenanceLogs.filter(log => log.status === 'completed').length

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.user_metadata?.role !== 'owner') return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Maintenance Management</h1>
            <p className="text-muted-foreground">Track and schedule vehicle maintenance</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Maintenance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="vehicle">Vehicle *</Label>
                  <Select 
                    value={formData.vehicle_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.name} - {vehicle.license_plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Maintenance Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAINTENANCE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the maintenance work needed"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cost">Cost (₱)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="50"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="scheduled_date">Scheduled Date *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or reminders"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Schedule</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Maintenance Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Upcoming maintenance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceLogs.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No maintenance records</p>
                <p className="text-muted-foreground mb-6">
                  Schedule maintenance to keep your vehicles in top condition
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {maintenanceLogs.map(log => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{log.vehicle.name}</h4>
                        <p className="text-sm text-muted-foreground">{log.vehicle.license_plate}</p>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Type</div>
                        <div className="font-medium">{log.type}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Scheduled Date</div>
                        <div className="font-medium">
                          {format(parseISO(log.scheduled_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Cost</div>
                        <div className="font-medium">{formatCurrency(log.cost)}</div>
                      </div>
                      {log.completed_date && (
                        <div>
                          <div className="text-sm text-muted-foreground">Completed Date</div>
                          <div className="font-medium">
                            {format(parseISO(log.completed_date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-muted-foreground mb-1">Description</div>
                      <p className="text-sm">{log.description}</p>
                    </div>

                    {log.notes && (
                      <div className="mb-3">
                        <div className="text-sm text-muted-foreground mb-1">Notes</div>
                        <p className="text-sm">{log.notes}</p>
                      </div>
                    )}

                    {log.status === 'scheduled' && (
                      <Button 
                        onClick={() => handleComplete(log.id, log.vehicle_id)}
                        size="sm"
                        className="mt-2"
                      >
                        Mark as Completed
                      </Button>
                    )}
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

