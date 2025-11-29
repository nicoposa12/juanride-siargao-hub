'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Building2, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ResubmitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [userRole, setUserRole] = useState<'renter' | 'owner' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [businessName, setBusinessName] = useState('')
  
  // Track rejected documents
  const [rejectedDocuments, setRejectedDocuments] = useState<Array<{
    id: string
    document_type: string
    rejection_reason: string
  }>>([])
  
  // Renter fields - dynamic based on rejected docs (same as owners)
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({})

  useEffect(() => {
    checkRejectedAccount()
  }, [])

  const getDocumentLabel = (docType: string) => {
    const labels: Record<string, string> = {
      business_permit: 'Business Permit',
      dti_registration: 'DTI Registration',
      sec_registration: 'SEC Registration',
      bir_registration: 'BIR Certificate of Registration',
      drivers_license: "Driver's License",
      passport: 'Passport',
      national_id: 'National ID',
      umid: 'UMID',
      sss: 'SSS ID',
      philhealth: 'PhilHealth ID',
      postal: 'Postal ID',
      voters: "Voter's ID",
      prc: 'PRC ID',
      school_id: 'School ID',
    }
    return labels[docType] || docType
  }

  const handleFileChange = (docType: string, file: File | null) => {
    setDocumentFiles(prev => ({ ...prev, [docType]: file }))
  }

  const checkRejectedAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: 'Not Authenticated',
          description: 'Please sign in to resubmit documents.',
          variant: 'destructive',
        })
        router.push('/login')
        return
      }

      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        toast({
          title: 'Error',
          description: 'Could not load your account information.',
          variant: 'destructive',
        })
        router.push('/login')
        return
      }

      // Check if account is actually rejected
      if (profile.account_verification_status !== 'rejected') {
        toast({
          title: 'Account Not Rejected',
          description: 'Your account is not in rejected status.',
        })
        router.push('/login')
        return
      }

      setUserId(user.id)
      setUserEmail(profile.email)
      setUserRole(profile.role)
      setRejectionReason(profile.account_status_reason || 'No reason provided')
      setBusinessName(profile.business_name || '')
      
      // Fetch rejected documents
      if (profile.role === 'renter') {
        const { data: rejectedIdDocs } = await supabase
          .from('id_documents')
          .select('*')
          .eq('renter_id', user.id)
          .eq('status', 'rejected')
          .order('submitted_at', { ascending: false })
        
        if (rejectedIdDocs && rejectedIdDocs.length > 0) {
          setRejectedDocuments(rejectedIdDocs)
        }
      } else if (profile.role === 'owner') {
        const { data: rejectedBizDocs } = await supabase
          .from('business_documents')
          .select('*')
          .eq('owner_id', user.id)
          .eq('status', 'rejected')
          .order('submitted_at', { ascending: false })
        
        if (rejectedBizDocs && rejectedBizDocs.length > 0) {
          setRejectedDocuments(rejectedBizDocs)
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error checking account:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
      router.push('/login')
    }
  }

  const uploadIdDocument = async (userId: string, file: File, documentType: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${documentType}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('id-documents')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('id-documents')
      .getPublicUrl(fileName)

    // Insert document record with pending review status
    const { error: insertError } = await supabase
      .from('id_documents')
      .insert({
        renter_id: userId,
        document_type: documentType,
        file_url: publicUrl,
        file_path: fileName,
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
      })

    if (insertError) throw insertError
  }

  const uploadBusinessDocument = async (
    userId: string,
    file: File,
    documentType: string
  ) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${documentType}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('business-documents')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('business-documents')
      .getPublicUrl(fileName)

    // Insert document record with resubmission status
    const { error: insertError } = await supabase
      .from('business_documents')
      .insert({
        owner_id: userId,
        document_type: documentType,
        file_url: publicUrl,
        file_path: fileName,
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
      })

    if (insertError) throw insertError
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (userRole === 'renter') {
        // Validate that all rejected documents have files
        const missingDocs = rejectedDocuments.filter(doc => !documentFiles[doc.document_type])
        if (missingDocs.length > 0) {
          toast({
            title: 'Missing Documents',
            description: `Please upload: ${missingDocs.map(d => getDocumentLabel(d.document_type)).join(', ')}`,
            variant: 'destructive',
          })
          setSubmitting(false)
          return
        }

        // Upload all rejected ID documents
        const uploadPromises = rejectedDocuments.map(doc => {
          const file = documentFiles[doc.document_type]
          if (file) {
            return uploadIdDocument(userId, file, doc.document_type)
          }
          return Promise.resolve()
        })
        
        await Promise.all(uploadPromises)

        // Update user status back to pending
        await supabase
          .from('users')
          .update({
            account_verification_status: 'pending_verification',
            account_status_reason: null,
          })
          .eq('id', userId)

      } else if (userRole === 'owner') {
        // Validate that all rejected documents have files
        const missingDocs = rejectedDocuments.filter(doc => !documentFiles[doc.document_type])
        if (missingDocs.length > 0) {
          toast({
            title: 'Missing Documents',
            description: `Please upload: ${missingDocs.map(d => getDocumentLabel(d.document_type)).join(', ')}`,
            variant: 'destructive',
          })
          setSubmitting(false)
          return
        }

        // Upload only the rejected documents
        const uploadPromises = rejectedDocuments.map(doc => {
          const file = documentFiles[doc.document_type]
          if (file) {
            return uploadBusinessDocument(userId, file, doc.document_type)
          }
          return Promise.resolve()
        })
        
        await Promise.all(uploadPromises)

        // Update user status back to pending
        await supabase
          .from('users')
          .update({
            account_verification_status: 'pending_verification',
            account_status_reason: null,
          })
          .eq('id', userId)
      }

      // Sign out the user
      await supabase.auth.signOut()

      // Show success message
      toast({
        title: 'Documents Resubmitted Successfully! ✅',
        description: 'Your documents have been resubmitted. Please wait for admin approval.',
        duration: 5000,
      })

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login?message=Your+documents+have+been+resubmitted.+Please+wait+for+admin+approval.')
      }, 1500)

    } catch (error) {
      console.error('Error resubmitting documents:', error)
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to resubmit documents. Please try again.',
        variant: 'destructive',
      })
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Document Resubmission</CardTitle>
          <CardDescription>
            Your account was rejected. Please resubmit only the rejected documents for verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Rejection Reason:</strong> {rejectionReason}
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={userEmail} disabled />
            </div>

            {userRole === 'renter' && (
              <>
                {rejectedDocuments.length > 0 ? (
                  <>
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Resubmit all rejected documents:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                          {rejectedDocuments.map(doc => (
                            <li key={doc.id}>
                              • <strong>{getDocumentLabel(doc.document_type)}</strong>: {doc.rejection_reason}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {rejectedDocuments.map((doc) => (
                      <div key={doc.id} className="space-y-2 p-4 border rounded-lg bg-red-50">
                        <Label htmlFor={doc.document_type} className="text-base font-semibold">
                          {getDocumentLabel(doc.document_type)} *
                        </Label>
                        <p className="text-xs text-red-600 mb-2">
                          <strong>Rejection Reason:</strong> {doc.rejection_reason}
                        </p>
                        <div className="flex items-center gap-4">
                          <Input
                            id={doc.document_type}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(doc.document_type, e.target.files?.[0] || null)}
                            className="flex-1"
                          />
                          {documentFiles[doc.document_type] && (
                            <FileText className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Accepted formats: JPG, PNG, PDF (Max 10MB)
                        </p>
                      </div>
                    ))}
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No rejected documents found. Your account may be under review.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {userRole === 'owner' && (
              <>
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={businessName} disabled />
                </div>

                {rejectedDocuments.length > 0 ? (
                  <>
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Only resubmit rejected documents:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                          {rejectedDocuments.map(doc => (
                            <li key={doc.id}>
                              • <strong>{getDocumentLabel(doc.document_type)}</strong>: {doc.rejection_reason}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {rejectedDocuments.map((doc) => (
                      <div key={doc.id} className="space-y-2 p-4 border rounded-lg bg-red-50">
                        <Label htmlFor={doc.document_type} className="text-base font-semibold">
                          {getDocumentLabel(doc.document_type)} *
                        </Label>
                        <p className="text-xs text-red-600 mb-2">
                          <strong>Rejection Reason:</strong> {doc.rejection_reason}
                        </p>
                        <div className="flex items-center gap-4">
                          <Input
                            id={doc.document_type}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(doc.document_type, e.target.files?.[0] || null)}
                            className="flex-1"
                          />
                          {documentFiles[doc.document_type] && (
                            <FileText className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No rejected documents found. Your account may be under review.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">📋 Important Tips</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Ensure documents are clear and legible</li>
                <li>• All required information must be visible</li>
                <li>• Documents should be current and not expired</li>
                <li>• Maximum file size: 10MB per document</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Resubmit Documents
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                supabase.auth.signOut()
                router.push('/login')
              }}
              disabled={submitting}
            >
              Cancel and Return to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
