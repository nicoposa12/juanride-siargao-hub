'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { VehicleForm } from '@/components/owner/VehicleForm'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function EditVehiclePage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const vehicleId = params.id

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'owner')) {
        router.push('/unauthorized?reason=' + encodeURIComponent('Owner access required') + '&path=' + encodeURIComponent('/owner/vehicles/' + vehicleId + '/edit'))
        return
      }
      if (vehicleId) {
        loadVehicle()
      }
    }
  }, [user, profile, authLoading, router, vehicleId])

  const loadVehicle = async () => {
    if (!user || !vehicleId) return
    
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('owner_id', user.id)
        .single()
      
      if (error) throw error
      
      if (!data) {
        toast({
          title: 'Vehicle Not Found',
          description: 'The vehicle you are trying to edit does not exist or you do not have permission to edit it.',
          variant: 'destructive',
        })
        router.push('/owner/vehicles')
        return
      }
      
      setVehicle(data)
    } catch (error: any) {
      console.error('Error loading vehicle:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load vehicle.',
        variant: 'destructive',
      })
      router.push('/owner/vehicles')
    } finally {
      setLoading(false)
    }
  }
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }
  
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Loading vehicle...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <VehicleForm initialData={vehicle} isEditing={true} />
      </div>
    </div>
  )
}
