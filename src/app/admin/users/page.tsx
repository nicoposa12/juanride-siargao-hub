'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  UserCog,
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editDialog, setEditDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  const [editForm, setEditForm] = useState({
    role: '',
    is_active: true,
    is_verified: false,
  })
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      loadUsers()
    }
  }, [user, profile, authLoading, router])
  
  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter, statusFilter])
  
  const loadUsers = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const filterUsers = () => {
    let filtered = [...users]
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }
    
    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.is_active)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(u => !u.is_active)
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone_number?.toLowerCase().includes(query)
      )
    }
    
    setFilteredUsers(filtered)
  }
  
  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setEditForm({
      role: user.role,
      is_active: user.is_active,
      is_verified: user.is_verified,
    })
    setEditDialog(true)
  }
  
  const handleSaveUser = async () => {
    if (!selectedUser) return
    
    setProcessing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({
          role: editForm.role,
          is_active: editForm.is_active,
          is_verified: editForm.is_verified,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id)
      
      if (error) throw error
      
      toast({
        title: 'User Updated',
        description: 'User information has been updated successfully.',
      })
      
      await loadUsers()
      setEditDialog(false)
      setSelectedUser(null)
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update user.',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }
  
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      
      if (error) throw error
      
      toast({
        title: 'Status Updated',
        description: `User has been ${!currentStatus ? 'activated' : 'deactivated'}.`,
      })
      
      await loadUsers()
    } catch (error: any) {
      console.error('Error toggling status:', error)
      toast({
        title: 'Action Failed',
        description: error.message || 'Failed to update user status.',
        variant: 'destructive',
      })
    }
  }
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts and permissions
          </p>
        </div>
        
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-[1fr_200px_200px] gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="renter">Renters</SelectItem>
                  <SelectItem value="owner">Owners</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserCog className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'No users match the selected filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || 'No Name'}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone_number || 'Not provided'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'owner'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                            {user.role}
                          </Badge>
                          {user.is_verified && (
                            <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" title="Verified" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? 'default' : 'secondary'}
                            className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.created_at)}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={user.is_active ? 'destructive' : 'default'}
                              onClick={() => handleToggleStatus(user.id, user.is_active)}
                            >
                              {user.is_active ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Edit User Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user role and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-info">User Information</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{selectedUser?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="renter">Renter</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="font-normal">
                  Active Account
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_verified"
                  checked={editForm.is_verified}
                  onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_verified" className="font-normal">
                  Verified User
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialog(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveUser} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
