'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { uploadProfileImage } from '@/lib/supabase/storage'
import { Loader2, Upload, User, Mail, Phone, Save } from 'lucide-react'
import Navigation from '@/components/shared/Navigation'
import Footer from '@/components/shared/Footer'

export default function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !profile) {
    router.push('/login')
    return null
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const imageUrl = await uploadProfileImage(file, user.id)

      // Update user profile with new image URL
      const { error } = await supabase
        .from('users')
        .update({ profile_image_url: imageUrl })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully.',
      })

      // Refresh the page to show new image
      window.location.reload()
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload profile picture.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to update profile.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email?.[0].toUpperCase() || 'U'
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account information
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.profile_image_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <Label htmlFor="picture" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>{uploading ? 'Uploading...' : 'Change Picture'}</span>
                    </div>
                  </Label>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user.email || ''}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    placeholder="+63 917 123 4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="px-3 py-2 bg-muted rounded-md">
                  <span className="capitalize">{profile.role}</span>
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Status</span>
                <span className="font-medium">
                  {profile.is_verified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-yellow-600">Pending Verification</span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

