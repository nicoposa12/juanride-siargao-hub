'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Loader2,
  ShieldCheck,
  Lock,
  AlertCircle,
  IdCard,
  FileUp,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import {
  USER_ROLE_LABELS,
  ID_DOCUMENT_TYPES,
  ID_DOCUMENT_TYPE_LABELS,
  ID_DOCUMENT_STATUS_LABELS,
} from '@/lib/constants'
import Navigation from '@/components/shared/Navigation'
import { uploadIdDocument, getIdDocumentSignedUrl } from '@/lib/supabase/storage'
import type { Database } from '@/types/database.types'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [updating, setUpdating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [identityDocs, setIdentityDocs] = useState<Database['public']['Tables']['id_documents']['Row'][]>([])
  const [identityDocsLoading, setIdentityDocsLoading] = useState(true)
  const [identityUploadInProgress, setIdentityUploadInProgress] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<typeof ID_DOCUMENT_TYPES[number] | ''>('')
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Profile form state
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile')
    }
  }, [user, authLoading, router])
  
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhoneNumber(profile.phone_number || '')
      setProfileImageUrl(profile.profile_image_url || '')
    }
  }, [profile])

  useEffect(() => {
    const fetchIdentityDocuments = async () => {
      if (!user) return
      setIdentityDocsLoading(true)
      const { data, error } = await supabase
        .from('id_documents')
        .select('*')
        .eq('renter_id', user.id)
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error loading identity documents:', error)
        toast({
          title: 'Unable to load documents',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        setIdentityDocs(data || [])
      }

      setIdentityDocsLoading(false)
    }

    if (user) {
      fetchIdentityDocuments()
    }
  }, [supabase, toast, user])

  const refreshIdentityDocs = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('id_documents')
      .select('*')
      .eq('renter_id', user.id)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error refreshing identity documents:', error)
      toast({
        title: 'Failed to refresh documents',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    setIdentityDocs(data || [])
  }
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      })
      return
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      })
      return
    }
    
    setUploadingImage(true)
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`
      
      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)
      
      // Update profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id)
      
      if (updateError) throw updateError
      
      setProfileImageUrl(publicUrl)
      
      // Refresh the profile context to ensure the new image persists
      await refreshProfile()
      
      toast({
        title: 'Image Uploaded',
        description: 'Your profile image has been updated.',
      })
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image.',
        variant: 'destructive',
      })
    } finally {
      setUploadingImage(false)
    }
  }
  
  const handleIdentityFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload a JPG, PNG, GIF, or PDF file.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum allowed size is 10MB.',
        variant: 'destructive',
      })
      return
    }

    setSelectedDocFile(file)
  }

  const handleIdentityUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedDocType || !selectedDocFile) {
      toast({
        title: 'Missing information',
        description: 'Select an ID type and file before uploading.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIdentityUploadInProgress(true)
      setUploadProgress(20)

      const { filePath } = await uploadIdDocument(selectedDocFile, user.id, selectedDocType)
      setUploadProgress(65)

      const { error } = await supabase.from('id_documents').insert({
        renter_id: user.id,
        document_type: selectedDocType,
        file_url: filePath,
        file_path: filePath,
        status: 'pending_review',
      })

      if (error) throw error

      setUploadProgress(100)
      await refreshIdentityDocs()
      setSelectedDocType('')
      setSelectedDocFile(null)
      toast({
        title: 'Document submitted',
        description: 'Your ID has been sent for owner review.',
      })
    } catch (error: any) {
      console.error('Identity upload failed:', error)
      toast({
        title: 'Upload failed',
        description: error.message || 'Unable to submit ID document.',
        variant: 'destructive',
      })
    } finally {
      setIdentityUploadInProgress(false)
      setUploadProgress(0)
    }
  }

  const handleViewDocument = async (
    doc: Database['public']['Tables']['id_documents']['Row']
  ) => {
    try {
      const signedUrl = await getIdDocumentSignedUrl(doc.file_path)
      if (!signedUrl) {
        toast({
          title: 'Unable to open document',
          description: 'Please try again shortly.',
          variant: 'destructive',
        })
        return
      }

      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    } catch (error: any) {
      console.error('Unable to open ID document:', error)
      toast({
        title: 'Failed to open document',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      })
    }
  }
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setUpdating(true)
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      // Refresh the profile context to ensure changes persist
      await refreshProfile()
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved.',
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please make sure both passwords match.',
        variant: 'destructive',
      })
      return
    }
    
    if (newPassword.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      })
      return
    }
    
    setChangingPassword(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      
      if (error) throw error
      
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      })
      
      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast({
        title: 'Password Change Failed',
        description: error.message || 'Failed to change password.',
        variant: 'destructive',
      })
    } finally {
      setChangingPassword(false)
    }
  }
  
  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const ensuredProfile = profile
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 max-w-4xl pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account information and preferences
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="identity">Identity Docs</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImageUrl} />
                    <AvatarFallback className="text-2xl">
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor="profile-image" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-primary hover:underline">
                        <Camera className="h-4 w-4" />
                        <span>
                          {uploadingImage ? 'Uploading...' : 'Change Profile Picture'}
                        </span>
                      </div>
                    </Label>
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Profile Form */}
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="pl-10 bg-gray-50"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10"
                        placeholder="+63 XXX XXX XXXX"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={updating} className="w-full">
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>
                    Keep your account secure by using a strong, unique password.
                  </AlertDescription>
                </Alert>
                
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Enter new password"
                        minLength={8}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Confirm new password"
                        minLength={8}
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    className="w-full"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Identity Tab */}
          <TabsContent value="identity">
            <Card>
              <CardHeader>
                <CardTitle>Identity Verification</CardTitle>
                <CardDescription>
                  Upload any government-issued ID to speed up bookings for cars and motorcycles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Alert>
                    <IdCard className="h-4 w-4" />
                    <AlertDescription>
                      Accepted IDs: Driver's License, Passport, UMID, SSS, PhilHealth, Postal, Voter's, National ID, PRC, or School ID
                      (students must attach supporting documents). Only approved IDs can be used for bookings.
                    </AlertDescription>
                  </Alert>
                </div>

                <form onSubmit={handleIdentityUpload} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select
                        value={selectedDocType}
                        onValueChange={(value) => setSelectedDocType(value as typeof ID_DOCUMENT_TYPES[number])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ID" />
                        </SelectTrigger>
                        <SelectContent>
                          {ID_DOCUMENT_TYPES.map((docType) => (
                            <SelectItem key={docType} value={docType}>
                              {ID_DOCUMENT_TYPE_LABELS[docType]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Upload File</Label>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleIdentityFileChange}
                        disabled={identityUploadInProgress}
                      />
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, GIF, or PDF — Max size 10MB
                      </p>
                    </div>
                  </div>

                  {identityUploadInProgress && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Uploading...</Label>
                      <Progress value={uploadProgress} className="mt-1" />
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={identityUploadInProgress || !selectedDocType || !selectedDocFile}
                  >
                    {identityUploadInProgress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FileUp className="mr-2 h-4 w-4" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                </form>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Your Documents</h3>
                    <Button variant="ghost" size="sm" onClick={refreshIdentityDocs} disabled={identityDocsLoading}>
                      Refresh
                    </Button>
                  </div>

                  {identityDocsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading documents...
                    </div>
                  ) : identityDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      You haven’t uploaded any ID yet. Upload now to avoid delays when booking.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {identityDocs.map((doc) => (
                        <Card key={doc.id} className="border border-muted">
                          <CardContent className="py-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-semibold">
                                  {ID_DOCUMENT_TYPE_LABELS[doc.document_type as keyof typeof ID_DOCUMENT_TYPE_LABELS]}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Submitted {new Date(doc.submitted_at).toLocaleDateString()}
                                </p>
                                {doc.reviewed_at && (
                                  <p className="text-xs text-muted-foreground">
                                    Reviewed {new Date(doc.reviewed_at).toLocaleDateString()}
                                  </p>
                                )}
                                {doc.rejection_reason && (
                                  <p className="text-sm text-destructive mt-1">
                                    Reason: {doc.rejection_reason}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 md:items-end">
                                <Badge
                                  variant={
                                    doc.status === 'approved'
                                      ? 'default'
                                      : doc.status === 'pending_review'
                                      ? 'secondary'
                                      : 'destructive'
                                  }
                                >
                                  {ID_DOCUMENT_STATUS_LABELS[doc.status as keyof typeof ID_DOCUMENT_STATUS_LABELS]}
                                </Badge>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDocument(doc)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </Button>
                                  {doc.status === 'rejected' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedDocType(doc.document_type as typeof ID_DOCUMENT_TYPES[number])
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                      }}
                                    >
                                      Re-upload
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View your account status and role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-muted-foreground">Account Role</Label>
                      <p className="font-medium mt-1">
                        {USER_ROLE_LABELS[ensuredProfile.role as keyof typeof USER_ROLE_LABELS]}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {ensuredProfile.role}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-muted-foreground">Account Status</Label>
                      <p className="font-medium mt-1">
                        {ensuredProfile.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <Badge variant={ensuredProfile.is_active ? 'default' : 'secondary'}>
                      {ensuredProfile.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-muted-foreground">Verification Status</Label>
                      <p className="font-medium mt-1">
                        {ensuredProfile.is_verified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                    <Badge variant={ensuredProfile.is_verified ? 'default' : 'secondary'}>
                      {ensuredProfile.is_verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-muted-foreground">Member Since</Label>
                    <p className="font-medium mt-1">
                      {new Date(ensuredProfile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                
                {!ensuredProfile.is_verified && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Your account is not yet verified. Some features may be limited until verification is complete.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
