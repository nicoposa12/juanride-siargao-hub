'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DollarSign,
  MapPin,
  Search,
  Loader2,
  Users,
  Ban,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/utils/format'
import {
  getOwnerCommissionsSummary,
  type OwnerCommissionSummary,
} from '@/lib/supabase/queries/commissions'

export default function AdminCommissionsOwnersPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [owners, setOwners] = useState<OwnerCommissionSummary[]>([])
  const [filteredOwners, setFilteredOwners] = useState<OwnerCommissionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'suspended'>('all')
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/unauthorized')
        return
      }
      loadOwners()
    }
  }, [user, profile, authLoading, router])
  
  useEffect(() => {
    filterOwners()
  }, [owners, searchQuery, statusFilter])
  
  const loadOwners = async () => {
    setLoading(true)
    try {
      const data = await getOwnerCommissionsSummary()
      setOwners(data)
      setFilteredOwners(data)
    } catch (error) {
      console.error('Error loading owners:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const filterOwners = () => {
    let filtered = owners
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((owner) => {
        if (statusFilter === 'suspended') return owner.is_suspended
        if (statusFilter === 'unpaid') return owner.has_unpaid
        if (statusFilter === 'paid') return !owner.has_unpaid && !owner.is_suspended
        return true
      })
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (owner) =>
          owner.owner_name.toLowerCase().includes(query) ||
          owner.owner_email.toLowerCase().includes(query) ||
          owner.owner_location?.toLowerCase().includes(query)
      )
    }
    
    setFilteredOwners(filtered)
  }
  
  const calculateTotalStats = () => {
    return filteredOwners.reduce(
      (acc, owner) => {
        acc.totalUnpaid += owner.total_commission
        acc.ownersWithUnpaid += owner.has_unpaid ? 1 : 0
        acc.totalPaid += owner.paid_commission
        return acc
      },
      { totalUnpaid: 0, ownersWithUnpaid: 0, totalPaid: 0 }
    )
  }
  
  const stats = calculateTotalStats()
  
  if (loading || authLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Management</h1>
          <p className="text-muted-foreground">Track and manage commission payments by owner</p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Unpaid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalUnpaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending collection from owners
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Owners with Unpaid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.ownersWithUnpaid}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Need to pay commissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time paid commissions
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Status Filter Tabs */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'unpaid' | 'paid' | 'suspended')}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({owners.length})
              </TabsTrigger>
              <TabsTrigger value="unpaid" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Unpaid ({owners.filter(o => o.has_unpaid).length})
              </TabsTrigger>
              <TabsTrigger value="paid" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Paid ({owners.filter(o => !o.has_unpaid && !o.is_suspended).length})
              </TabsTrigger>
              <TabsTrigger value="suspended" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <Ban className="h-3 w-3 mr-1" />
                Suspended ({owners.filter(o => o.is_suspended).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by owner name, email, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Owners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Owners</CardTitle>
          <CardDescription>
            Showing {filteredOwners.length} owner{filteredOwners.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOwners.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Owners Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No owners match your filter criteria.' 
                  : 'No commission records available yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount to Collect</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwners.map((owner) => (
                    <TableRow
                      key={owner.owner_id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/admin/commissions/${owner.owner_id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={owner.owner_profile_image || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {owner.owner_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{owner.owner_name}</p>
                            <p className="text-sm text-muted-foreground">{owner.owner_email}</p>
                            <p className="text-xs text-muted-foreground">
                              {owner.transaction_count} transaction{owner.transaction_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">
                            {owner.owner_location || (
                              <span className="text-muted-foreground italic">Not specified</span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {owner.has_unpaid ? (
                            <Badge variant="destructive" className="font-semibold w-fit">
                              Unpaid
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 font-semibold w-fit">
                              Paid
                            </Badge>
                          )}
                          {owner.is_suspended && (
                            <Badge variant="outline" className="border-red-500 bg-red-50 text-red-700 w-fit">
                              <Ban className="h-3 w-3 mr-1" />
                              Suspended
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold text-lg">
                          {formatCurrency(owner.total_commission)}
                        </div>
                        {owner.paid_commission > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Paid: {formatCurrency(owner.paid_commission)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
