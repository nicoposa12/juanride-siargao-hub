'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { format, parseISO } from 'date-fns'

interface Vehicle {
  id: string
  name: string
  type: string
  brand: string
  model: string
  year: number
  license_plate: string
  description: string
  daily_rate: number
  location: string
  image_url: string
  images: string[]
  status: string
  created_at: string
  owner: {
    id: string
    full_name: string
    email: string
    phone: string
  }
}

export default function AdminListingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'admin')) {
      router.push('/')
    } else if (user) {
      fetchVehicles()
    }
  }, [user, authLoading])

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          owner:users!vehicles_owner_id_fkey (
            id,
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load vehicles',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (vehicleId: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          status: 'approved',
          is_available: true 
        })
        .eq('id', vehicleId)

      if (error) throw error

      toast({
        title: 'Vehicle Approved',
        description: 'The vehicle listing is now live',
      })

      fetchVehicles()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve vehicle',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async () => {
    if (!selectedVehicle) return

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          status: 'rejected',
          is_available: false
        })
        .eq('id', selectedVehicle.id)

      if (error) throw error

      // TODO: Send notification to owner with rejection reason

      toast({
        title: 'Vehicle Rejected',
        description: 'The owner will be notified',
      })

      setIsRejectDialogOpen(false)
      setSelectedVehicle(null)
      setRejectionReason('')
      fetchVehicles()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject vehicle',
        variant: 'destructive',
      })
    }
  }

  const filterVehicles = (status: string) => {
    if (status === 'all') return vehicles
    return vehicles.filter(v => v.status === status)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending Review' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
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
          <h1 className="text-3xl font-bold mb-2">Listing Management</h1>
          <p className="text-muted-foreground">Review and approve vehicle listings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending ({filterVehicles('pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All Listings</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filterVehicles(activeTab).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No listings found</p>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending'
                      ? 'No pending listings to review'
                      : `No ${activeTab} listings`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterVehicles(activeTab).map(vehicle => (
                  <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48">
                      <img
                        src={vehicle.image_url || '/placeholder.svg'}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(vehicle.status)}
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg mb-1">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </p>
                        <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Daily Rate</span>
                          <span className="font-semibold">{formatCurrency(vehicle.daily_rate)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Location</span>
                          <span>{vehicle.location}</span>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded p-3 mb-4">
                        <div className="text-xs text-muted-foreground mb-1">Owner</div>
                        <div className="text-sm font-medium">{vehicle.owner.full_name}</div>
                        <div className="text-xs text-muted-foreground">{vehicle.owner.email}</div>
                      </div>

                      <div className="text-xs text-muted-foreground mb-4">
                        Submitted {format(parseISO(vehicle.created_at), 'MMM dd, yyyy')}
                      </div>

                      {vehicle.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleApprove(vehicle.id)}
                            size="sm"
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => {
                              setSelectedVehicle(vehicle)
                              setIsRejectDialogOpen(true)
                            }}
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {vehicle.status !== 'pending' && (
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Vehicle Listing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Please provide a reason for rejecting this vehicle listing. The owner will be notified.
                </p>
                <Label htmlFor="reason">Rejection Reason *</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Images are unclear, vehicle doesn't meet safety standards..."
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsRejectDialogOpen(false)
                    setSelectedVehicle(null)
                    setRejectionReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

