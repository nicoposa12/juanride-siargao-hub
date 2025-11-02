'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Search, MoreVertical, Eye, Ban, CheckCircle, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface User {
  id: string
  email: string
  full_name: string
  phone: string
  role: string
  profile_image_url: string | null
  created_at: string
  last_sign_in_at: string | null
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'admin')) {
      router.push('/')
    } else if (user) {
      fetchUsers()
    }
  }, [user, authLoading])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, roleFilter, users])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.includes(searchQuery)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      admin: { variant: 'destructive', label: 'Admin' },
      owner: { variant: 'default', label: 'Owner' },
      renter: { variant: 'secondary', label: 'Renter' },
    }
    const config = variants[role] || variants.renter
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getInitials = (name: string) => {
    if (!name) return '??'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.user_metadata?.role !== 'admin') return null

  const stats = {
    total: users.length,
    renters: users.filter(u => u.role === 'renter').length,
    owners: users.filter(u => u.role === 'owner').length,
    admins: users.filter(u => u.role === 'admin').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Renters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.renters}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Owners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.owners}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={roleFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={roleFilter === 'renter' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('renter')}
                  size="sm"
                >
                  Renters
                </Button>
                <Button
                  variant={roleFilter === 'owner' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('owner')}
                  size="sm"
                >
                  Owners
                </Button>
                <Button
                  variant={roleFilter === 'admin' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('admin')}
                  size="sm"
                >
                  Admins
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">No users found</p>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try a different search term' : 'No users match the selected filters'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((usr) => (
                    <TableRow key={usr.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {usr.profile_image_url ? (
                              <img
                                src={usr.profile_image_url}
                                alt={usr.full_name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">{getInitials(usr.full_name)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{usr.full_name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{usr.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{usr.email}</TableCell>
                      <TableCell>{usr.phone || 'N/A'}</TableCell>
                      <TableCell>{getRoleBadge(usr.role)}</TableCell>
                      <TableCell>
                        {format(parseISO(usr.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {usr.last_sign_in_at
                          ? format(parseISO(usr.last_sign_in_at), 'MMM dd, yyyy')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-muted-foreground text-center">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  )
}

