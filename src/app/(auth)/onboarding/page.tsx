'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ShieldCheck, User as UserIcon, Phone, FileText, AlertCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PendingApprovalModal } from '@/components/auth/pending-approval-modal'

const roleOptions: { value: 'renter' | 'owner'; label: string; description: string }[] = [
  {
    value: 'renter',
    label: 'Rent vehicles (Renter)',
    description: 'Browse, book, and manage rentals as a customer.',
  },
  {
    value: 'owner',
    label: 'List my vehicles (Owner)',
    description: 'Publish vehicles, manage bookings, and track earnings.',
  },
]

const ID_TYPES = [
  { value: 'drivers_license', label: "Driver's License (Required for motorcycles/cars)", required: false },
  { value: 'passport', label: 'Passport', required: false },
  { value: 'umid', label: 'UMID', required: false },
  { value: 'sss', label: 'SSS ID', required: false },
  { value: 'philhealth', label: 'PhilHealth ID', required: false },
  { value: 'postal', label: 'Postal ID', required: false },
  { value: 'voters', label: "Voter's ID", required: false },
  { value: 'national_id', label: 'National ID (PhilSys)', required: false },
  { value: 'prc', label: 'PRC ID', required: false },
  { value: 'school_id', label: 'School ID (with supporting documents)', required: false },
]

const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'cooperative', label: 'Cooperative' },
]

export default function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'renter' | 'owner'>('renter')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ID verification fields for renters
  const [idDocumentType, setIdDocumentType] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [showPendingModal, setShowPendingModal] = useState(false)
  
  // Business verification fields for owners
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [businessPermitFile, setBusinessPermitFile] = useState<File | null>(null)
  const [dtiSecFile, setDtiSecFile] = useState<File | null>(null)
  const [dtiSecType, setDtiSecType] = useState<'dti_registration' | 'sec_registration'>('dti_registration')
  const [birFile, setBirFile] = useState<File | null>(null)

  const nextParam = useMemo(() => {
    const params = searchParams ?? new URLSearchParams()
    const value = params.get('next')
    if (!value || !value.startsWith('/') || value === '/onboarding') {
      return null
    }
    return value
  }, [searchParams])

  // Prefill fields when profile data becomes available
  useEffect(() => {
    if (!profile) return

    setFullName(profile.full_name ?? '')
    setPhoneNumber(profile.phone_number ?? '')
    if (profile.role === 'owner' || profile.role === 'renter') {
      setRole(profile.role)
    }
  }, [profile])

  // Fallback to auth metadata before profile loads
  useEffect(() => {
    if (profile) return

    if (user?.user_metadata?.full_name) {
      setFullName((prev) => prev || (user.user_metadata!.full_name as string))
    }
    if (user?.user_metadata?.phone_number) {
      setPhoneNumber((prev) => prev || (user.user_metadata!.phone_number as string))
    }
  }, [profile, user])

  // Redirect logic for already onboarded users
  useEffect(() => {
    if (loading) return

    if (!user) {
      return
    }

    // If profile is loaded, not pending, and doesn't need onboarding, redirect
    if (profile && !profile.needs_onboarding && profile.role !== 'pending') {
      const defaultDestination = profile.role === 'admin'
        ? '/admin/dashboard'
        : profile.role === 'owner'
          ? '/owner/dashboard'
          : '/vehicles'
      const destination = nextParam ?? defaultDestination
      router.replace(destination)
    }
  }, [loading, profile, router, user, nextParam])

  const validateFile = (file: File): boolean => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a JPG, PNG, WEBP, or PDF file.',
        variant: 'destructive',
      })
      return false
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 5MB.',
        variant: 'destructive',
      })
      return false
    }
    
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setIdFile(file)
    }
  }
  
  const handleBusinessFileChange = (type: 'permit' | 'dti_sec' | 'bir', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      if (type === 'permit') setBusinessPermitFile(file)
      else if (type === 'dti_sec') setDtiSecFile(file)
      else if (type === 'bir') setBirFile(file)
    }
  }

  const uploadIdDocument = async (userId: string) => {
    if (!idFile || !idDocumentType) return null

    try {
      // Generate unique file path
      const fileExt = idFile.name.split('.').pop()
      const fileName = `${userId}/${idDocumentType}_${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(fileName, idFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('id-documents')
        .getPublicUrl(fileName)

      // Create ID document record
      const { data: docData, error: docError } = await supabase
        .from('id_documents')
        .insert({
          renter_id: userId,
          document_type: idDocumentType,
          file_url: publicUrl,
          file_path: fileName,
          status: 'pending_review',
        })
        .select()
        .single()

      if (docError) {
        console.error('Document record error:', docError)
        throw docError
      }

      return docData
    } catch (error) {
      console.error('ID upload error:', error)
      throw error
    }
  }
  
  const uploadBusinessDocument = async (userId: string, file: File, documentType: string) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('business-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('business-documents')
        .getPublicUrl(fileName)

      const { data: docData, error: docError } = await supabase
        .from('business_documents')
        .insert({
          owner_id: userId,
          document_type: documentType,
          file_url: publicUrl,
          file_path: fileName,
          status: 'pending_review',
          business_name: businessName,
        })
        .select()
        .single()

      if (docError) throw docError
      return docData
    } catch (error) {
      console.error('Business document upload error:', error)
      throw error
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      toast({
        title: 'Session not ready',
        description: 'Please wait a moment and try again.',
        variant: 'destructive',
      })
      return
    }

    const trimmedName = fullName.trim()
    const trimmedPhone = phoneNumber.trim()

    if (!trimmedName) {
      toast({
        title: 'Full name required',
        description: 'Please provide your full name to continue.',
        variant: 'destructive',
      })
      return
    }

    if (!trimmedPhone) {
      toast({
        title: 'Phone number required',
        description: 'Please provide a phone number so we can reach you about bookings.',
        variant: 'destructive',
      })
      return
    }

    if (password && password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters if provided.',
        variant: 'destructive',
      })
      return
    }

    // Validate ID upload for renters
    if (role === 'renter') {
      if (!idDocumentType) {
        toast({
          title: 'ID Type Required',
          description: 'Please select your ID document type.',
          variant: 'destructive',
        })
        return
      }
      
      if (!idFile) {
        toast({
          title: 'ID Document Required',
          description: 'Please upload a valid government-issued ID.',
          variant: 'destructive',
        })
        return
      }
    }
    
    // Validate business documents for owners
    if (role === 'owner') {
      if (!businessName.trim()) {
        toast({
          title: 'Business Name Required',
          description: 'Please enter your registered business name.',
          variant: 'destructive',
        })
        return
      }
      
      if (!businessType) {
        toast({
          title: 'Business Type Required',
          description: 'Please select your business type.',
          variant: 'destructive',
        })
        return
      }
      
      if (!businessPermitFile) {
        toast({
          title: 'Business Permit Required',
          description: 'Please upload your Business Permit or Mayor\'s Permit.',
          variant: 'destructive',
        })
        return
      }
      
      if (!dtiSecFile) {
        toast({
          title: 'DTI/SEC Registration Required',
          description: 'Please upload your DTI or SEC registration.',
          variant: 'destructive',
        })
        return
      }
      
      if (!birFile) {
        toast({
          title: 'BIR Registration Required',
          description: 'Please upload your BIR Certificate of Registration.',
          variant: 'destructive',
        })
        return
      }
    }

    setSubmitting(true)

    try {
      // 1. Upload documents first
      if (role === 'renter') {
        await uploadIdDocument(user.id)
      } else if (role === 'owner') {
        await Promise.all([
          uploadBusinessDocument(user.id, businessPermitFile!, 'business_permit'),
          uploadBusinessDocument(user.id, dtiSecFile!, dtiSecType),
          uploadBusinessDocument(user.id, birFile!, 'bir_registration'),
        ])
      }

      // 2. Update profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: trimmedName,
          phone_number: trimmedPhone,
          role,
          needs_onboarding: false,
          account_verification_status: 'pending_verification',
          onboarding_completed_at: new Date().toISOString(),
          ...(role === 'owner' ? { business_name: businessName, business_type: businessType } : {})
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // 3. Update Auth user
      const authUpdates: {
        password?: string
        data?: Record<string, string>
      } = {
        data: {
          full_name: trimmedName,
          phone_number: trimmedPhone,
        },
      }

      if (password) {
        authUpdates.password = password
      }

      const { error: authError } = await supabase.auth.updateUser(authUpdates)
      if (authError) {
        throw authError
      }

      await refreshProfile()

      toast({
        title: 'Profile submitted! 🎉',
        description: 'Your account is pending approval.',
      })

      setShowPendingModal(true)
      
    } catch (error) {
      console.error('Onboarding error:', error)
      toast({
        title: 'Could not complete onboarding',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
      setSubmitting(false)
    }
  }

  const showLoader = loading || submitting

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Complete your profile</CardTitle>
          <CardDescription>
            We use this information to personalize your JuanRide experience.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Juan Dela Cruz"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We’ll use this to coordinate rentals and verify ownership details.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Choose your role</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as 'renter' | 'owner')}>
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start space-x-3 rounded-lg border p-4 hover:border-primary cursor-pointer"
                  >
                    <RadioGroupItem value={option.value} className="mt-1" />
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* ID Verification for Renters */}
            {role === 'renter' && (
              <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Renters must upload a valid government-issued ID. Your account will be pending approval until verified by our admin team.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="idType">ID Document Type *</Label>
                  <Select value={idDocumentType} onValueChange={setIdDocumentType}>
                    <SelectTrigger id="idType">
                      <SelectValue placeholder="Select your ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Driver's License is required if you plan to rent motorcycles or cars.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idFile">Upload ID Document *</Label>
                  <div className="relative">
                    <Input
                      id="idFile"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                      required={role === 'renter'}
                    />
                    {idFile && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{idFile.name}</span>
                        <span className="text-xs">({(idFile.size / 1024).toFixed(0)} KB)</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: JPG, PNG, WEBP, PDF (max 5MB). Ensure your ID is clearly visible.
                  </p>
                </div>
              </div>
            )}

            {/* Business Document Verification for Owners */}
            {role === 'owner' && (
              <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Owners must upload business documents for verification. Your account will be pending approval until verified by our admin team.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Your registered business name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required={role === 'owner'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your business name as registered with DTI/SEC
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger id="businessType">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPermit">Business Permit / Mayor's Permit *</Label>
                  <Input
                    id="businessPermit"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={(e) => handleBusinessFileChange('permit', e)}
                    className="cursor-pointer"
                    required={role === 'owner'}
                  />
                  {businessPermitFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{businessPermitFile.name}</span>
                      <span className="text-xs">({(businessPermitFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload your valid Business Permit or Mayor's Permit
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dtiSecType">DTI or SEC Registration Type *</Label>
                  <Select value={dtiSecType} onValueChange={(val) => setDtiSecType(val as 'dti_registration' | 'sec_registration')}>
                    <SelectTrigger id="dtiSecType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dti_registration">DTI Registration</SelectItem>
                      <SelectItem value="sec_registration">SEC Registration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dtiSec">{dtiSecType === 'dti_registration' ? 'DTI' : 'SEC'} Registration *</Label>
                  <Input
                    id="dtiSec"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={(e) => handleBusinessFileChange('dti_sec', e)}
                    className="cursor-pointer"
                    required={role === 'owner'}
                  />
                  {dtiSecFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{dtiSecFile.name}</span>
                      <span className="text-xs">({(dtiSecFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload your {dtiSecType === 'dti_registration' ? 'DTI' : 'SEC'} Certificate of Registration
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bir">BIR Certificate of Registration *</Label>
                  <Input
                    id="bir"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={(e) => handleBusinessFileChange('bir', e)}
                    className="cursor-pointer"
                    required={role === 'owner'}
                  />
                  {birFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{birFile.name}</span>
                      <span className="text-xs">({(birFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload your BIR Certificate of Registration (COR)
                  </p>
                </div>

                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                  <p className="font-medium mb-1">Required Documents:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Business Permit or Mayor's Permit</li>
                    <li>DTI or SEC Registration Certificate</li>
                    <li>BIR Certificate of Registration</li>
                  </ul>
                  <p className="mt-2">All files: JPG, PNG, WEBP, PDF (max 5MB each)</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Set a password (optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password to enable email login"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                Add a password to log in without Google in the future (optional).
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full" disabled={showLoader}>
              {showLoader ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting for Review...
                </>
              ) : (
                'Submit for Approval'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              You can update these details anytime from your profile page.
            </p>
          </CardFooter>
        </form>
      </Card>
      
      <PendingApprovalModal 
        open={showPendingModal} 
        onOpenChange={setShowPendingModal}
        userName={fullName}
        userRole={role}
      />
    </div>
  )
}
