'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TablePagination } from '@/components/ui/table-pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS } from '@/lib/constants'

export default function AdminListingsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [vehicles, setVehicles] = useState<any[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      loadVehicles()
    }
  }, [user, profile, authLoading, router])
  
  useEffect(() => {
    filterVehicles()
    setCurrentPage(1) // Reset to first page when filters change
  }, [vehicles, searchQuery])
  
  const loadVehicles = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          owner:users!owner_id (
            id,
            full_name,
            email,
            phone_number
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setVehicles(data || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load vehicle listings.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const filterVehicles = () => {
    let filtered = [...vehicles]
    
    // Filter by search query only
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v =>
        v.make?.toLowerCase().includes(query) ||
        v.model?.toLowerCase().includes(query) ||
        v.plate_number?.toLowerCase().includes(query) ||
        v.owner?.full_name?.toLowerCase().includes(query)
      )
    }
    
    setFilteredVehicles(filtered)
  }
  
  
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-700">Vehicle Listings</h1>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg font-medium">
            View all vehicle listings
          </p>
        </div>
        
        {/* Search */}
        <Card className="mb-6 card-gradient shadow-layered-md border-border/50">
          <CardContent className="pt-6">
            <div className="relative group">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary-600 transition-colors duration-300" />
              <Input
                placeholder="Search by make, model, plate number, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus-visible:ring-primary-500 hover:shadow-sm transition-all duration-300"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Vehicles List */}
        <div className="space-y-6">
          {filteredVehicles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Vehicles Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'No vehicles match the selected filter.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
            <div className="space-y-4">
              {filteredVehicles
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden card-gradient hover:shadow-layered-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer border-border/50 hover:border-primary-200/50">
                  <div className="grid md:grid-cols-[200px_1fr] gap-6">
                    {/* Vehicle Image */}
                    <div className="relative aspect-video md:aspect-square overflow-hidden">
                      <Image
                        src={vehicle.image_urls?.[0] || '/placeholder.svg'}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    {/* Vehicle Details */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-primary-700 group-hover:text-primary-600 transition-colors">
                              {vehicle.make} {vehicle.model}
                            </h3>
                            <Badge className='bg-blue-100 text-blue-800 border border-blue-200 shadow-sm'>
                              Active
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {VEHICLE_TYPE_LABELS[vehicle.type as keyof typeof VEHICLE_TYPE_LABELS]} • {vehicle.plate_number}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-muted-foreground">Owner</Label>
                          <p className="font-medium">{vehicle.owner?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{vehicle.owner?.email}</p>
                        </div>
                        
                        <div>
                          <Label className="text-muted-foreground">Pricing</Label>
                          <p className="font-medium">{formatCurrency(vehicle.price_per_day)}/day</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.location || 'No location set'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" asChild className="hover:bg-primary-50 hover:border-primary-500 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group/btn">
                          <a href={`/vehicles/${vehicle.id}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                            View Listing
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Pagination */}
            {filteredVehicles.length > itemsPerPage && (
              <div className="mt-8">
                <TablePagination
                  currentPage={currentPage}
                  totalItems={filteredVehicles.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
            </>
          )}
        </div>
        
    </div>
  )
}
