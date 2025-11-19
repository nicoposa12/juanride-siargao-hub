'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { VehicleForm } from '@/components/owner/VehicleForm'
import { Skeleton } from '@/components/ui/skeleton'

export default function NewVehiclePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'owner')) {
        router.push('/unauthorized?reason=' + encodeURIComponent('Owner access required') + '&path=' + encodeURIComponent('/owner/vehicles/new'))
        return
      }
    }
  }, [user, profile, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!user || (profile && profile.role !== 'owner')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <VehicleForm />
      </div>
    </div>
  )
}
