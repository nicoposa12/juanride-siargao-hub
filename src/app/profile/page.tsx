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
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  Loader2,
  ShieldCheck,
  Lock,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { USER_ROLE_LABELS } from '@/lib/constants'
import Navigation from '@/components/shared/Navigation'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [updating, setUpdating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
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
                        {USER_ROLE_LABELS[profile.role as keyof typeof USER_ROLE_LABELS]}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {profile.role}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-muted-foreground">Account Status</Label>
                      <p className="font-medium mt-1">
                        {profile.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-muted-foreground">Verification Status</Label>
                      <p className="font-medium mt-1">
                        {profile.is_verified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                    <Badge variant={profile.is_verified ? 'default' : 'secondary'}>
                      {profile.is_verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-muted-foreground">Member Since</Label>
                    <p className="font-medium mt-1">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                
                {!profile.is_verified && (
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
