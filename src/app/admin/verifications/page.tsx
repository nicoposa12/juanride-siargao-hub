'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  Loader2,
  Building2,
  Users,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'

interface IdDocument {
  id: string
  renter_id: string
  document_type: string
  status: string
  file_url: string
  file_path: string
  submitted_at: string
  rejection_reason?: string
  renter?: {
    id: string
    email: string
    full_name: string
    phone_number: string
    created_at: string
    account_verification_status: string
  }
}

interface BusinessDocument {
  id: string
  owner_id: string
  document_type: string
  status: string
  file_url: string
  file_path: string
  submitted_at: string
  rejection_reason?: string
  business_name?: string
  registration_number?: string
  owner?: {
    id: string
    email: string
    full_name: string
    phone_number: string
    created_at: string
    account_verification_status: string
    business_name: string
    business_type: string
  }
}

export default function AdminVerificationsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [documents, setDocuments] = useState<IdDocument[]>([])
  const [businessDocuments, setBusinessDocuments] = useState<BusinessDocument[]>([])
  const [groupedOwners, setGroupedOwners] = useState<Map<string, BusinessDocument[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<IdDocument | null>(null)
  const [selectedBusinessDoc, setSelectedBusinessDoc] = useState<BusinessDocument | null>(null)
  const [selectedOwnerDocs, setSelectedOwnerDocs] = useState<BusinessDocument[]>([])
  const [viewDialog, setViewDialog] = useState(false)
  const [actionDialog, setActionDialog] = useState(false)
  const [imageViewerDialog, setImageViewerDialog] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('pending_review')
  const [viewType, setViewType] = useState<'renters' | 'owners'>('renters')
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      if (viewType === 'renters') {
        loadDocuments()
      } else {
        loadBusinessDocuments()
      }
    }
  }, [user, profile, authLoading, router, filterStatus, viewType])
  
  const loadDocuments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('id_documents')
        .select(`
          *,
          renter:users!id_documents_renter_id_fkey (
            id,
            email,
            full_name,
            phone_number,
            created_at,
            account_verification_status
          )
        `)
        .order('submitted_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading documents:', error)
        toast({
          title: 'Error',
          description: 'Failed to load ID documents',
          variant: 'destructive',
        })
        return
      }

      setDocuments(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const loadBusinessDocuments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('business_documents')
        .select(`
          *,
          owner:users!business_documents_owner_id_fkey (
            id,
            email,
            full_name,
            phone_number,
            created_at,
            account_verification_status,
            business_name,
            business_type
          )
        `)
        .order('submitted_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading business documents:', error)
        toast({
          title: 'Error',
          description: 'Failed to load business documents',
          variant: 'destructive',
        })
        return
      }

      setBusinessDocuments(data || [])
      
      // Group documents by owner
      const grouped = new Map<string, BusinessDocument[]>()
      data?.forEach(doc => {
        const ownerId = doc.owner_id
        if (!grouped.has(ownerId)) {
          grouped.set(ownerId, [])
        }
        grouped.get(ownerId)!.push(doc)
      })
      setGroupedOwners(grouped)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleViewDocument = (doc: IdDocument) => {
    setSelectedDoc(doc)
    setSelectedBusinessDoc(null)
    setViewDialog(true)
  }
  
  const handleViewBusinessDocument = (doc: BusinessDocument) => {
    setSelectedBusinessDoc(doc)
    setSelectedDoc(null)
    setViewDialog(true)
  }
  
  const handleViewOwnerDocuments = (ownerDocs: BusinessDocument[]) => {
    setSelectedOwnerDocs(ownerDocs)
    setSelectedDoc(null)
    setSelectedBusinessDoc(null)
    setViewDialog(true)
  }
  
  const handleAction = (doc: IdDocument, actionType: 'approve' | 'reject') => {
    setSelectedDoc(doc)
    setSelectedBusinessDoc(null)
    setAction(actionType)
    setRejectionReason('')
    setActionDialog(true)
  }
  
  const handleBusinessAction = (doc: BusinessDocument, actionType: 'approve' | 'reject') => {
    setSelectedBusinessDoc(doc)
    setSelectedDoc(null)
    setAction(actionType)
    setRejectionReason('')
    setActionDialog(true)
  }
  
  const confirmAction = async () => {
    if (!selectedDoc && !selectedBusinessDoc) return
    
    if (action === 'reject' && !rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      })
      return
    }
    
    setProcessing(true)
    
    try {
      if (selectedDoc) {
        // Handle renter ID document
        const { error: docError } = await supabase
          .from('id_documents')
          .update({
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewed_at: new Date().toISOString(),
            reviewer_id: user?.id,
            rejection_reason: action === 'reject' ? rejectionReason : null,
          })
          .eq('id', selectedDoc.id)
        
        if (docError) throw docError
        
        // Update user account verification status
        const accountStatus = action === 'approve' ? 'approved' : 'rejected'
        const { error: userError } = await supabase
          .from('users')
          .update({
            account_verification_status: accountStatus,
            account_verified_at: action === 'approve' ? new Date().toISOString() : null,
            verified_by: user?.id,
            account_status_reason: action === 'reject' ? rejectionReason : null,
          })
          .eq('id', selectedDoc.renter_id)
        
        if (userError) throw userError
        
        toast({
          title: action === 'approve' ? 'Account Approved' : 'Account Rejected',
          description: `The renter account has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
        })
        
        loadDocuments()
      } else if (selectedBusinessDoc) {
        // Handle owner business document
        const { error: docError } = await supabase
          .from('business_documents')
          .update({
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewed_at: new Date().toISOString(),
            reviewer_id: user?.id,
            rejection_reason: action === 'reject' ? rejectionReason : null,
          })
          .eq('id', selectedBusinessDoc.id)
        
        if (docError) throw docError
        
        // Check if owner has all required documents approved
        const { data: ownerDocs } = await supabase
          .from('business_documents')
          .select('document_type, status')
          .eq('owner_id', selectedBusinessDoc.owner_id)
        
        const hasBusinessPermit = ownerDocs?.some(d => d.document_type === 'business_permit' && d.status === 'approved')
        const hasDtiOrSec = ownerDocs?.some(d => (d.document_type === 'dti_registration' || d.document_type === 'sec_registration') && d.status === 'approved')
        const hasBir = ownerDocs?.some(d => d.document_type === 'bir_registration' && d.status === 'approved')
        
        // Only approve account if ALL required documents are approved
        let accountStatus = 'pending_verification'
        if (action === 'approve' && hasBusinessPermit && hasDtiOrSec && hasBir) {
          accountStatus = 'approved'
        } else if (action === 'reject') {
          accountStatus = 'rejected'
        }
        
        const { error: userError } = await supabase
          .from('users')
          .update({
            account_verification_status: accountStatus,
            account_verified_at: accountStatus === 'approved' ? new Date().toISOString() : null,
            verified_by: user?.id,
            account_status_reason: action === 'reject' ? rejectionReason : null,
          })
          .eq('id', selectedBusinessDoc.owner_id)
        
        if (userError) throw userError
        
        const message = accountStatus === 'approved' 
          ? 'All business documents approved. Owner account is now active.'
          : action === 'reject'
            ? 'Document rejected. Owner account cannot login.'
            : 'Document approved. Waiting for all required documents to be approved.'
        
        toast({
          title: action === 'approve' ? 'Document Approved' : 'Document Rejected',
          description: message,
        })
        
        loadBusinessDocuments()
      }
      
      setActionDialog(false)
      setViewDialog(false)
      setSelectedDoc(null)
      setSelectedBusinessDoc(null)
      setSelectedOwnerDocs([])
    } catch (error) {
      console.error('Error processing action:', error)
      toast({
        title: 'Error',
        description: 'Failed to process action',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }
  
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      drivers_license: "Driver's License",
      passport: 'Passport',
      umid: 'UMID',
      sss: 'SSS ID',
      philhealth: 'PhilHealth ID',
      postal: 'Postal ID',
      voters: "Voter's ID",
      national_id: 'National ID',
      prc: 'PRC ID',
      school_id: 'School ID',
      business_permit: 'Business Permit',
      dti_registration: 'DTI Registration',
      sec_registration: 'SEC Registration',
      bir_registration: 'BIR Certificate',
    }
    return labels[type] || type
  }
  
  const getBusinessTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sole_proprietorship: 'Sole Proprietorship',
      partnership: 'Partnership',
      corporation: 'Corporation',
      cooperative: 'Cooperative',
    }
    return labels[type] || type
  }
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending_review: { variant: 'secondary', icon: Clock, label: 'Pending Review' },
      approved: { variant: 'default', icon: CheckCircle, label: 'Approved' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
    }
    const config = variants[status] || variants.pending_review
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }
  
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Verifications</h1>
        <p className="text-muted-foreground">
          Review and approve renter ID documents and owner business documents
        </p>
      </div>
      
      <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'renters' | 'owners')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="renters" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Renter IDs
          </TabsTrigger>
          <TabsTrigger value="owners" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Owner Business Docs
          </TabsTrigger>
        </TabsList>
        
        {/* RENTER ID DOCUMENTS TAB */}
        <TabsContent value="renters" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.filter((d) => d.status === 'pending_review').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.filter((d) => d.status === 'approved').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.filter((d) => d.status === 'rejected').length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Renter ID Documents</CardTitle>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No ID documents found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Renter</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{doc.renter?.full_name}</span>
                        <span className="text-sm text-muted-foreground">{doc.renter?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getDocumentTypeLabel(doc.document_type)}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>{formatDate(doc.submitted_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {doc.status === 'pending_review' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAction(doc, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleAction(doc, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* OWNER BUSINESS DOCUMENTS TAB */}
        <TabsContent value="owners" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {businessDocuments.filter((d) => d.status === 'pending_review').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {businessDocuments.filter((d) => d.status === 'approved').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {businessDocuments.filter((d) => d.status === 'rejected').length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Owner Business Documents</CardTitle>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {groupedOwners.size === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No business documents found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Documents Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(groupedOwners.entries()).map(([ownerId, docs]) => {
                      const firstDoc = docs[0]
                      const allApproved = docs.every(d => d.status === 'approved')
                      const anyRejected = docs.some(d => d.status === 'rejected')
                      const allPending = docs.every(d => d.status === 'pending_review')
                      const latestDate = docs.reduce((latest, doc) => {
                        return new Date(doc.submitted_at) > new Date(latest) ? doc.submitted_at : latest
                      }, docs[0].submitted_at)
                      
                      return (
                        <TableRow key={ownerId}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{firstDoc.owner?.full_name}</span>
                              <span className="text-sm text-muted-foreground">{firstDoc.owner?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{firstDoc.owner?.business_name}</span>
                              <span className="text-xs text-muted-foreground">{getBusinessTypeLabel(firstDoc.owner?.business_type || '')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-xs">
                                {docs.map(doc => (
                                  <div key={doc.id} className="flex items-center">
                                    {doc.status === 'approved' && <CheckCircle className="h-3 w-3 text-green-600" />}
                                    {doc.status === 'rejected' && <XCircle className="h-3 w-3 text-red-600" />}
                                    {doc.status === 'pending_review' && <Clock className="h-3 w-3 text-yellow-600" />}
                                  </div>
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {docs.length} document{docs.length > 1 ? 's' : ''}
                                {allApproved && ' (All Approved)'}
                                {anyRejected && ' (Some Rejected)'}
                                {allPending && ' (All Pending)'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(latestDate)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOwnerDocuments(docs)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View All ({docs.length})
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* View Document Dialog */}
      <Dialog open={viewDialog} onOpenChange={(open) => {
        setViewDialog(open)
        if (!open) {
          setSelectedDoc(null)
          setSelectedBusinessDoc(null)
          setSelectedOwnerDocs([])
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDoc && 'ID Document Details'}
              {selectedBusinessDoc && 'Business Document Details'}
              {selectedOwnerDocs.length > 0 && 'Owner Business Documents'}
            </DialogTitle>
            <DialogDescription>
              {selectedDoc && "Review the renter's ID document and information"}
              {selectedBusinessDoc && "Review the owner's business document and information"}
              {selectedOwnerDocs.length > 0 && `Review all ${selectedOwnerDocs.length} business documents for this owner`}
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              {/* Renter Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Renter Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedDoc.renter?.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedDoc.renter?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedDoc.renter?.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Registered: {formatDate(selectedDoc.renter?.created_at || '')}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Document Info */}
              <div className="space-y-2">
                <Label>Document Type</Label>
                <p>{getDocumentTypeLabel(selectedDoc.document_type)}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <div>{getStatusBadge(selectedDoc.status)}</div>
              </div>
              
              {selectedDoc.rejection_reason && (
                <div className="space-y-2">
                  <Label>Rejection Reason</Label>
                  <p className="text-sm text-muted-foreground">{selectedDoc.rejection_reason}</p>
                </div>
              )}
              
              {/* Document Image */}
              <div className="space-y-2">
                <Label>Document Image</Label>
                <div 
                  className="border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    setSelectedImage({ url: selectedDoc.file_url, title: getDocumentTypeLabel(selectedDoc.document_type) })
                    setImageViewerDialog(true)
                  }}
                >
                  <div className="relative group">
                    <img src={selectedDoc.file_url} alt="ID Document" className="w-full h-auto bg-gray-50" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Eye className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Click image to view full size</p>
              </div>
            </div>
          )}
          
          {selectedBusinessDoc && (
            <div className="space-y-4">
              {/* Owner Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Owner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedBusinessDoc.owner?.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedBusinessDoc.owner?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedBusinessDoc.owner?.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{selectedBusinessDoc.owner?.business_name}</span>
                      <span className="text-xs text-muted-foreground">{getBusinessTypeLabel(selectedBusinessDoc.owner?.business_type || '')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Registered: {formatDate(selectedBusinessDoc.owner?.created_at || '')}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Document Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Document Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Document Type:</span>
                    <span className="text-sm font-medium">{getDocumentTypeLabel(selectedBusinessDoc.document_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(selectedBusinessDoc.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Submitted:</span>
                    <span className="text-sm">{formatDate(selectedBusinessDoc.submitted_at)}</span>
                  </div>
                  {selectedBusinessDoc.rejection_reason && (
                    <div className="flex flex-col gap-1 pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Rejection Reason:</span>
                      <span className="text-sm text-destructive">{selectedBusinessDoc.rejection_reason}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Document Preview - Clickable */}
              <div className="space-y-2">
                <h4 className="font-medium">Document Preview</h4>
                <div 
                  className="border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    setSelectedImage({
                      url: selectedBusinessDoc.file_url,
                      title: getDocumentTypeLabel(selectedBusinessDoc.document_type)
                    })
                    setImageViewerDialog(true)
                  }}
                >
                  <div className="relative group">
                    <img
                      src={selectedBusinessDoc.file_url}
                      alt="Business Document"
                      className="w-full h-auto bg-gray-50"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Eye className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Click image to view full size</p>
              </div>
            </div>
          )}
          
          {selectedOwnerDocs.length > 0 && (
            <div className="space-y-4">
              {/* Owner Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Owner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedOwnerDocs[0].owner?.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedOwnerDocs[0].owner?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedOwnerDocs[0].owner?.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{selectedOwnerDocs[0].owner?.business_name}</span>
                      <span className="text-xs text-muted-foreground">{getBusinessTypeLabel(selectedOwnerDocs[0].owner?.business_type || '')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Registered: {formatDate(selectedOwnerDocs[0].owner?.created_at || '')}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* All Documents */}
              <div className="space-y-3">
                <h4 className="font-medium">Business Documents ({selectedOwnerDocs.length})</h4>
                {selectedOwnerDocs.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{getDocumentTypeLabel(doc.document_type)}</CardTitle>
                        {getStatusBadge(doc.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Submitted:</span>
                        <span>{formatDate(doc.submitted_at)}</span>
                      </div>
                      {doc.rejection_reason && (
                        <div className="flex flex-col gap-1 pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Rejection Reason:</span>
                          <span className="text-sm text-destructive">{doc.rejection_reason}</span>
                        </div>
                      )}
                      
                      {/* Document Preview - Clickable */}
                      <div 
                        className="border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                        onClick={() => {
                          setSelectedImage({
                            url: doc.file_url,
                            title: getDocumentTypeLabel(doc.document_type)
                          })
                          setImageViewerDialog(true)
                        }}
                      >
                        <div className="relative group">
                          <img
                            src={doc.file_url}
                            alt={getDocumentTypeLabel(doc.document_type)}
                            className="w-full h-auto max-h-64 object-contain bg-gray-50"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">Click image to view full size</p>
                      
                      <div className="flex gap-2">
                        {doc.status === 'pending_review' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setViewDialog(false)
                                handleBusinessAction(doc, 'approve')
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setViewDialog(false)
                                handleBusinessAction(doc, 'reject')
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            {selectedDoc?.status === 'pending_review' && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    setViewDialog(false)
                    handleAction(selectedDoc, 'approve')
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialog(false)
                    handleAction(selectedDoc, 'reject')
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            {selectedBusinessDoc?.status === 'pending_review' && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    setViewDialog(false)
                    handleBusinessAction(selectedBusinessDoc, 'approve')
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Document
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialog(false)
                    handleBusinessAction(selectedBusinessDoc, 'reject')
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Document
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Account' : 'Reject Account'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'This will approve the renter account and allow them to log in.'
                : 'This will reject the renter account. They will not be able to log in.'}
            </DialogDescription>
          </DialogHeader>
          {action === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this ID was rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant={action === 'approve' ? 'default' : 'destructive'}
              onClick={confirmAction}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {action === 'approve' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Image Viewer Dialog */}
      <Dialog open={imageViewerDialog} onOpenChange={setImageViewerDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{selectedImage?.title || 'Document Image'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {selectedImage && (
              <div className="relative w-full flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="max-w-full max-h-[80vh] object-contain"
                  loading="lazy"
                />
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button 
              variant="outline" 
              onClick={() => window.open(selectedImage?.url, '_blank')}
            >
              Open in New Tab
            </Button>
            <Button onClick={() => setImageViewerDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
