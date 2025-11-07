'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS } from '@/lib/constants'

export default function AdminListingsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [vehicles, setVehicles] = useState<any[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action: 'approve' | 'reject' | null
    processing: boolean
  }>({ open: false, action: null, processing: false })
  const [adminNotes, setAdminNotes] = useState('')
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      loadVehicles()
    }
  }, [user, profile, authLoading, router])
  
  useEffect(() => {
    filterVehicles()
  }, [vehicles, activeTab, searchQuery])
  
  const loadVehicles = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          owner:users!owner_id (
            id,
            full_name,
            email,
            phone_number
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setVehicles(data || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load vehicle listings.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const filterVehicles = () => {
    let filtered = [...vehicles]
    
    // Filter by approval status
    if (activeTab === 'pending') {
      filtered = filtered.filter(v => !v.is_approved)
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(v => v.is_approved)
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v =>
        v.make?.toLowerCase().includes(query) ||
        v.model?.toLowerCase().includes(query) ||
        v.plate_number?.toLowerCase().includes(query) ||
        v.owner?.full_name?.toLowerCase().includes(query)
      )
    }
    
    setFilteredVehicles(filtered)
  }
  
  const handleAction = async () => {
    if (!selectedVehicle || !actionDialog.action) return
    
    setActionDialog(prev => ({ ...prev, processing: true }))
    
    try {
      const supabase = createClient()
      
      if (actionDialog.action === 'approve') {
        const { error } = await supabase
          .from('vehicles')
          .update({
            is_approved: true,
            admin_notes: adminNotes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedVehicle.id)
        
        if (error) throw error
        
        toast({
          title: 'Vehicle Approved',
          description: 'The vehicle listing has been approved.',
        })
      } else {
        const { error } = await supabase
          .from('vehicles')
          .update({
            is_approved: false,
            status: 'inactive',
            admin_notes: adminNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedVehicle.id)
        
        if (error) throw error
        
        toast({
          title: 'Vehicle Rejected',
          description: 'The vehicle listing has been rejected.',
        })
      }
      
      await loadVehicles()
      setActionDialog({ open: false, action: null, processing: false })
      setSelectedVehicle(null)
      setAdminNotes('')
    } catch (error: any) {
      console.error('Error processing action:', error)
      toast({
        title: 'Action Failed',
        description: error.message || 'Failed to process action.',
        variant: 'destructive',
      })
    } finally {
      setActionDialog(prev => ({ ...prev, processing: false }))
    }
  }
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Vehicle Listings</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve vehicle listings
          </p>
        </div>
        
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by make, model, plate number, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({vehicles.filter(v => !v.is_approved).length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({vehicles.filter(v => v.is_approved).length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({vehicles.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Vehicles List */}
          {filteredVehicles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Vehicles Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'No vehicles match the selected filter.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="grid md:grid-cols-[200px_1fr] gap-6">
                    {/* Vehicle Image */}
                    <div className="relative aspect-video md:aspect-square">
                      <Image
                        src={vehicle.image_urls?.[0] || '/placeholder.svg'}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Vehicle Details */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">
                              {vehicle.make} {vehicle.model}
                            </h3>
                            <Badge className={vehicle.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {vehicle.is_approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {VEHICLE_TYPE_LABELS[vehicle.type as keyof typeof VEHICLE_TYPE_LABELS]} • {vehicle.plate_number}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-muted-foreground">Owner</Label>
                          <p className="font-medium">{vehicle.owner?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{vehicle.owner?.email}</p>
                        </div>
                        
                        <div>
                          <Label className="text-muted-foreground">Pricing</Label>
                          <p className="font-medium">{formatCurrency(vehicle.price_per_day)}/day</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.location || 'No location set'}
                          </p>
                        </div>
                      </div>
                      
                      {vehicle.admin_notes && (
                        <Alert className="mb-4">
                          <AlertDescription>
                            <strong>Admin Notes:</strong> {vehicle.admin_notes}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/vehicles/${vehicle.id}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            View Listing
                          </a>
                        </Button>
                        
                        {!vehicle.is_approved && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedVehicle(vehicle)
                                setActionDialog({ open: true, action: 'approve', processing: false })
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedVehicle(vehicle)
                                setActionDialog({ open: true, action: 'reject', processing: false })
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {vehicle.is_approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVehicle(vehicle)
                              setActionDialog({ open: true, action: 'reject', processing: false })
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Revoke Approval
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Tabs>
        
        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.action === 'approve' ? 'Approve Vehicle' : 'Reject Vehicle'}
              </DialogTitle>
              <DialogDescription>
                {actionDialog.action === 'approve' 
                  ? 'This will make the vehicle visible to renters.' 
                  : 'This will hide the vehicle and notify the owner.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Admin Notes {actionDialog.action === 'reject' && '*'}</Label>
                <Textarea
                  id="notes"
                  placeholder={actionDialog.action === 'approve' 
                    ? 'Optional notes for internal reference...' 
                    : 'Reason for rejection (required)...'}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setActionDialog({ open: false, action: null, processing: false })
                  setAdminNotes('')
                }}
                disabled={actionDialog.processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={actionDialog.processing || (actionDialog.action === 'reject' && !adminNotes)}
                variant={actionDialog.action === 'approve' ? 'default' : 'destructive'}
              >
                {actionDialog.processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  actionDialog.action === 'approve' ? 'Approve' : 'Reject'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
