'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Plus, MoreVertical, Edit, Trash2, Eye, AlertCircle } from 'lucide-react'

interface Vehicle {
  id: string
  name: string
  type: string
  image_url: string
  daily_rate: number
  status: string
  is_available: boolean
  location: string
  created_at: string
}

export default function OwnerVehiclesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'owner')) {
      router.push('/')
    } else if (user) {
      fetchVehicles()
    }
  }, [user, authLoading])

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load vehicles',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw error

      toast({
        title: 'Vehicle deleted',
        description: 'Your vehicle has been removed',
      })

      setVehicles(prev => prev.filter(v => v.id !== vehicleId))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete vehicle',
        variant: 'destructive',
      })
    }
  }

  const toggleAvailability = async (vehicleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_available: !currentStatus })
        .eq('id', vehicleId)

      if (error) throw error

      toast({
        title: 'Status updated',
        description: `Vehicle is now ${!currentStatus ? 'available' : 'unavailable'}`,
      })

      setVehicles(prev => prev.map(v => 
        v.id === vehicleId ? { ...v, is_available: !currentStatus } : v
      ))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update availability',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending Approval' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.user_metadata?.role !== 'owner') return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Vehicles</h1>
            <p className="text-muted-foreground">Manage your vehicle listings</p>
          </div>
          <Link href="/owner/vehicles/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Vehicle
            </Button>
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No vehicles yet</p>
              <p className="text-muted-foreground mb-6">Start by adding your first vehicle</p>
              <Link href="/owner/vehicles/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Vehicle
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map(vehicle => (
              <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <img
                    src={vehicle.image_url || '/placeholder.svg'}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary" className="rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/vehicles/${vehicle.id}`} className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />
                            View Listing
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/owner/vehicles/${vehicle.id}/edit`} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleAvailability(vehicle.id, vehicle.is_available)}
                          className="cursor-pointer"
                        >
                          {vehicle.is_available ? 'Mark Unavailable' : 'Mark Available'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(vehicle.id)}
                          className="text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                      <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                    </div>
                    {getStatusBadge(vehicle.status)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Daily Rate</span>
                      <span className="font-semibold">
                        ₱{vehicle.daily_rate.toLocaleString('en-PH')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Availability</span>
                      <Badge variant={vehicle.is_available ? 'default' : 'secondary'}>
                        {vehicle.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>

                    <div className="pt-3 border-t">
                      <Link href={`/owner/vehicles/${vehicle.id}/edit`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Vehicle
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

