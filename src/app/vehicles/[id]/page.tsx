import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Navigation from '@/components/shared/Navigation'
import Footer from '@/components/shared/Footer'
import VehicleDetails from '@/components/vehicle/VehicleDetails'
import { Skeleton } from '@/components/ui/skeleton'
import { createServerClient } from '@/lib/supabase/server'

export default async function VehicleDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name,
        profile_image_url,
        phone_number,
        email
      )
    `)
    .eq('id', params.id)
    .eq('is_approved', true)
    .single()

  if (error || !vehicle) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 mt-20">
        <Suspense fallback={<VehicleDetailsSkeleton />}>
          <VehicleDetails vehicle={vehicle} />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}

function VehicleDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  )
}

