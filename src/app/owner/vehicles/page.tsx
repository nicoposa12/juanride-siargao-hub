'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Car, AlertCircle, Edit, Eye, Trash2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/shared/Navigation'
import { formatCurrency } from '@/lib/utils/format'
import { VEHICLE_STATUS_LABELS, VEHICLE_TYPE_LABELS } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

export default function OwnerVehiclesPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'owner' && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      loadVehicles()
    }
  }, [user, profile, authLoading, router])
  
  const loadVehicles = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setVehicles(data || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load your vehicles.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return
    }
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)
      
      if (error) throw error
      
      toast({
        title: 'Vehicle Deleted',
        description: 'The vehicle has been removed from your listings.',
      })
      
      // Reload vehicles
      loadVehicles()
    } catch (error: any) {
      console.error('Error deleting vehicle:', error)
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete vehicle.',
        variant: 'destructive',
      })
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'rented':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-8 pt-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Vehicles</h1>
            <p className="text-muted-foreground mt-2">
              Manage your vehicle listings
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/owner/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Vehicle
            </Link>
          </Button>
        </div>
        
        {/* Empty State */}
        {vehicles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Vehicles Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start earning by adding your first vehicle to the platform.
              </p>
              <Button asChild>
                <Link href="/owner/vehicles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Vehicle
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-[240px_1fr] gap-6">
                  {/* Vehicle Image */}
                  <div className="relative aspect-video md:aspect-square">
                    <Image
                      src={vehicle.image_urls?.[0] || '/placeholder.svg'}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={getStatusColor(vehicle.status)}>
                        {VEHICLE_STATUS_LABELS[vehicle.status as keyof typeof VEHICLE_STATUS_LABELS]}
                      </Badge>
                    </div>
                    {!vehicle.is_approved && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="outline" className="bg-white/90">
                          Pending Approval
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Vehicle Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-semibold">
                          {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-muted-foreground">
                          {VEHICLE_TYPE_LABELS[vehicle.type as keyof typeof VEHICLE_TYPE_LABELS]} • {vehicle.year || 'N/A'}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/vehicles/${vehicle.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Public Page
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/owner/vehicles/${vehicle.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(vehicle.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {!vehicle.is_approved && vehicle.admin_notes && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Admin Notes:</strong> {vehicle.admin_notes}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Daily Rate</p>
                        <p className="font-semibold">{formatCurrency(vehicle.price_per_day)}</p>
                      </div>
                      {vehicle.price_per_week && (
                        <div>
                          <p className="text-sm text-muted-foreground">Weekly Rate</p>
                          <p className="font-semibold">{formatCurrency(vehicle.price_per_week)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-semibold">{vehicle.location || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Plate Number</p>
                        <p className="font-semibold">{vehicle.plate_number}</p>
                      </div>
                    </div>
                    
                    {vehicle.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {vehicle.description}
                      </p>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/vehicles/${vehicle.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/owner/vehicles/${vehicle.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
