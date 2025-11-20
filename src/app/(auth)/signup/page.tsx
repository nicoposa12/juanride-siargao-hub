'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Mail, Lock, User, UserPlus, Phone, Upload, FileText, AlertCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PendingApprovalModal } from '@/components/auth/pending-approval-modal'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [role, setRole] = useState<'renter' | 'owner'>('renter')
  const [loading, setLoading] = useState(false)
  
  // ID verification fields for renters
  const [idDocumentType, setIdDocumentType] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showPendingModal, setShowPendingModal] = useState(false)
  
  // Business verification fields for owners
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [businessPermitFile, setBusinessPermitFile] = useState<File | null>(null)
  const [dtiSecFile, setDtiSecFile] = useState<File | null>(null)
  const [dtiSecType, setDtiSecType] = useState<'dti_registration' | 'sec_registration'>('dti_registration')
  const [birFile, setBirFile] = useState<File | null>(null)
  
  const { signUp, signIn, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  
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
      const { data: uploadData, error: uploadError } = await supabase.storage
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 8) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      })
      return
    }

    if (!phoneNumber.trim()) {
      toast({
        title: 'Phone number required',
        description: 'Please provide a valid phone number so we can contact you regarding bookings.',
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

    setLoading(true)

    try {
      const { data, error } = await signUp(email, password, fullName, phoneNumber.trim(), role)

      if (error) {
        toast({
          title: 'Sign Up Failed',
          description: error.message,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // If renter, upload ID document and set account to pending
      if (role === 'renter' && data?.user) {
        try {
          // Upload ID document
          await uploadIdDocument(data.user.id)
          
          // Update user account status to pending verification
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              account_verification_status: 'pending_verification'
            })
            .eq('id', data.user.id)

          if (updateError) {
            console.error('Error updating account status:', updateError)
          }

          // Show pending approval modal
          toast({
            title: 'Registration Submitted! 🎉',
            description: 'Your account is pending approval.',
          })
          
          setShowPendingModal(true)
        } catch (uploadError) {
          toast({
            title: 'Upload Failed',
            description: 'Failed to upload ID document. Please contact support.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
      } else if (role === 'owner' && data?.user) {
        // Owner accounts require business document verification
        try {
          // Upload all business documents
          await Promise.all([
            uploadBusinessDocument(data.user.id, businessPermitFile!, 'business_permit'),
            uploadBusinessDocument(data.user.id, dtiSecFile!, dtiSecType),
            uploadBusinessDocument(data.user.id, birFile!, 'bir_registration'),
          ])
          
          // Update user with business info and set to pending verification
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              account_verification_status: 'pending_verification',
              business_name: businessName,
              business_type: businessType,
            })
            .eq('id', data.user.id)

          if (updateError) {
            console.error('Error updating account status:', updateError)
          }

          // Show pending approval modal
          toast({
            title: 'Registration Submitted! 🎉',
            description: 'Your business documents are under review.',
          })
          
          setShowPendingModal(true)
        } catch (uploadError) {
          toast({
            title: 'Upload Failed',
            description: 'Failed to upload business documents. Please contact support.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        toast({
          title: 'Sign Up Failed',
          description: error.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join JuanRide and start your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used to coordinate bookings and verify owner accounts.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-3">
              <Label>I want to:</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as 'renter' | 'owner')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="renter" id="renter" />
                  <Label htmlFor="renter" className="font-normal cursor-pointer">
                    Rent vehicles (Renter)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="owner" id="owner" />
                  <Label htmlFor="owner" className="font-normal cursor-pointer">
                    List my vehicles (Owner)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* ID Verification for Renters */}
            {role === 'renter' && (
              <>
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
              </>
            )}

            {/* Business Document Verification for Owners */}
            {role === 'owner' && (
              <>
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
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignUp}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign up with Google
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
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

