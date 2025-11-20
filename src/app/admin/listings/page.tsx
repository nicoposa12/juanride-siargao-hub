'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TablePagination } from '@/components/ui/table-pagination'
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
  FileText,
  ExternalLink,
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
  const [documentsDialog, setDocumentsDialog] = useState<{
    open: boolean
    vehicle: any | null
  }>({ open: false, vehicle: null })
  const [adminNotes, setAdminNotes] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  
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
    setCurrentPage(1) // Reset to first page when filters change
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
      filtered = filtered.filter(v => v.approval_status === 'pending')
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(v => v.approval_status === 'approved')
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter(v => v.approval_status === 'rejected')
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
            approval_status: 'approved',
            status: 'available',
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
            approval_status: 'rejected',
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
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-700">Vehicle Listings</h1>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg font-medium">
            Review and approve vehicle listings
          </p>
        </div>
        
        {/* Search */}
        <Card className="mb-6 card-gradient shadow-layered-md border-border/50">
          <CardContent className="pt-6">
            <div className="relative group">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary-600 transition-colors duration-300" />
              <Input
                placeholder="Search by make, model, plate number, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus-visible:ring-primary-500 hover:shadow-sm transition-all duration-300"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({vehicles.filter(v => v.approval_status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({vehicles.filter(v => v.approval_status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({vehicles.filter(v => v.approval_status === 'rejected').length})
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
            <>
            <div className="space-y-4">
              {filteredVehicles
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden card-gradient hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer border-border/50 hover:border-primary-200/50">
                  <div className="grid md:grid-cols-[200px_1fr] gap-6">
                    {/* Vehicle Image */}
                    <div className="relative aspect-video md:aspect-square overflow-hidden">
                      <Image
                        src={vehicle.image_urls?.[0] || '/placeholder.svg'}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    {/* Vehicle Details */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-primary-700 group-hover:text-primary-600 transition-colors">
                              {vehicle.make} {vehicle.model}
                            </h3>
                            <Badge className={
                              vehicle.approval_status === 'approved' 
                                ? 'bg-green-100 text-green-800 border border-green-200 shadow-sm'
                                : vehicle.approval_status === 'rejected'
                                ? 'bg-red-100 text-red-800 border border-red-200 shadow-sm'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm pulse-glow'
                            }>
                              {vehicle.approval_status === 'approved' 
                                ? 'Approved' 
                                : vehicle.approval_status === 'rejected'
                                ? 'Rejected'
                                : 'Pending'}
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
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" asChild className="hover:bg-primary-50 hover:border-primary-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group/btn">
                          <a href={`/vehicles/${vehicle.id}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                            View Listing
                          </a>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDocumentsDialog({ open: true, vehicle })}
                          className="hover:bg-blue-50 hover:border-blue-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group/btn"
                        >
                          <FileText className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                          View Documents
                        </Button>
                        
                        {vehicle.approval_status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedVehicle(vehicle)
                                setActionDialog({ open: true, action: 'approve', processing: false })
                              }}
                              className="shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 group/btn"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2 group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedVehicle(vehicle)
                                setActionDialog({ open: true, action: 'reject', processing: false })
                              }}
                              className="shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 group/btn"
                            >
                              <XCircle className="h-4 w-4 mr-2 group-hover/btn:scale-110 group-hover/btn:-rotate-12 transition-all" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {vehicle.approval_status === 'approved' && (
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
                        
                        {vehicle.approval_status === 'rejected' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedVehicle(vehicle)
                              setActionDialog({ open: true, action: 'approve', processing: false })
                            }}
                            className="shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 group/btn"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2 group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Pagination */}
            {filteredVehicles.length > itemsPerPage && (
              <div className="mt-8">
                <TablePagination
                  currentPage={currentPage}
                  totalItems={filteredVehicles.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
            </>
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
        
        {/* Vehicle Documents Dialog */}
        <Dialog open={documentsDialog.open} onOpenChange={(open) => setDocumentsDialog({ open, vehicle: documentsDialog.vehicle })}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vehicle Documents</DialogTitle>
              <DialogDescription>
                Review uploaded documents for {documentsDialog.vehicle?.make} {documentsDialog.vehicle?.model}
              </DialogDescription>
            </DialogHeader>
            
            {documentsDialog.vehicle && (
              <div className="space-y-6">
                {/* Registration Document */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Vehicle Registration (OR/CR)</Label>
                    {documentsDialog.vehicle.registration_document_url ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </div>
                  {documentsDialog.vehicle.registration_document_url ? (
                    <Card className="border-green-200 bg-green-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="font-medium">Registration Document</p>
                              <p className="text-xs text-muted-foreground">Click to view or download</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="hover:bg-green-100"
                          >
                            <a href={documentsDialog.vehicle.registration_document_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Alert variant="destructive">
                      <AlertDescription>Registration document not uploaded</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {/* Insurance Document */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Insurance Certificate</Label>
                    {documentsDialog.vehicle.insurance_document_url ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </div>
                  {documentsDialog.vehicle.insurance_document_url ? (
                    <Card className="border-green-200 bg-green-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="font-medium">Insurance Certificate</p>
                              <p className="text-xs text-muted-foreground">Click to view or download</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="hover:bg-green-100"
                          >
                            <a href={documentsDialog.vehicle.insurance_document_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Alert variant="destructive">
                      <AlertDescription>Insurance document not uploaded</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {/* Proof of Ownership */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Proof of Ownership</Label>
                    {documentsDialog.vehicle.proof_of_ownership_url ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </div>
                  {documentsDialog.vehicle.proof_of_ownership_url ? (
                    <Card className="border-green-200 bg-green-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="font-medium">Proof of Ownership</p>
                              <p className="text-xs text-muted-foreground">Click to view or download</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="hover:bg-green-100"
                          >
                            <a href={documentsDialog.vehicle.proof_of_ownership_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Alert variant="destructive">
                      <AlertDescription>Proof of ownership not uploaded</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {/* Inspection Certificate (Optional) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Vehicle Inspection Certificate</Label>
                    {documentsDialog.vehicle.inspection_certificate_url ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </div>
                  {documentsDialog.vehicle.inspection_certificate_url ? (
                    <Card className="border-green-200 bg-green-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="font-medium">Inspection Certificate</p>
                              <p className="text-xs text-muted-foreground">Click to view or download</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="hover:bg-green-100"
                          >
                            <a href={documentsDialog.vehicle.inspection_certificate_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No inspection certificate uploaded (optional)</p>
                  )}
                </div>
                
                {/* Document Summary */}
                <Alert className={
                  documentsDialog.vehicle.registration_document_url && 
                  documentsDialog.vehicle.insurance_document_url && 
                  documentsDialog.vehicle.proof_of_ownership_url
                    ? "border-green-300 bg-green-50"
                    : "border-orange-300 bg-orange-50"
                }>
                  <AlertDescription className="text-sm">
                    {documentsDialog.vehicle.registration_document_url && 
                     documentsDialog.vehicle.insurance_document_url && 
                     documentsDialog.vehicle.proof_of_ownership_url ? (
                      <span className="text-green-900">
                        <strong>✓ All required documents uploaded.</strong> This vehicle can be approved.
                      </span>
                    ) : (
                      <span className="text-orange-900">
                        <strong>⚠ Missing required documents.</strong> Request the owner to upload all required documents before approval.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDocumentsDialog({ open: false, vehicle: null })}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  )
}
