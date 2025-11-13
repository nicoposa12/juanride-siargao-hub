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
  Trash2,
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
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  
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
    
    // Validate role change
    if (editForm.role && !['renter', 'owner', 'admin'].includes(editForm.role)) {
      toast({
        title: 'Invalid Role',
        description: 'Please select a valid role.',
        variant: 'destructive',
      })
      return
    }
    
    // Prevent removing admin role from yourself
    if (selectedUser.id === profile?.id && selectedUser.role === 'admin' && editForm.role !== 'admin') {
      toast({
        title: 'Cannot Change Own Role',
        description: 'You cannot remove admin privileges from your own account.',
        variant: 'destructive',
      })
      return
    }
    
    setProcessing(true)
    try {
      const supabase = createClient()
      
      // Build update object only with changed fields
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }
      
      if (editForm.role !== selectedUser.role) {
        updateData.role = editForm.role
      }
      if (editForm.is_active !== selectedUser.is_active) {
        updateData.is_active = editForm.is_active
      }
      if (editForm.is_verified !== selectedUser.is_verified) {
        updateData.is_verified = editForm.is_verified
      }
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', selectedUser.id)
      
      if (error) throw error
      
      // Log role change for admin tracking
      if (updateData.role) {
        console.log(`Admin ${profile?.email} changed user ${selectedUser.email} role from ${selectedUser.role} to ${updateData.role}`)
      }
      
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

  const handleDeleteUser = (user: any) => {
    // Prevent deleting yourself
    if (user.id === profile?.id) {
      toast({
        title: 'Cannot Delete',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      })
      return
    }
    
    // Prevent deleting other admins unless you're a super admin
    if (user.role === 'admin') {
      toast({
        title: 'Cannot Delete',
        description: 'Admin accounts cannot be deleted for security reasons.',
        variant: 'destructive',
      })
      return
    }
    
    setUserToDelete(user)
    setDeleteDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    
    setProcessing(true)
    try {
      // Call the admin API to delete user
      const response = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userToDelete.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }
      
      toast({
        title: 'User Deleted',
        description: 'User account has been permanently deleted.',
      })
      
      await loadUsers()
      setDeleteDialog(false)
      setUserToDelete(null)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete user account.',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
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
                            <span className="inline-flex items-center ml-2" title="Verified">
                              <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                              <span className="sr-only">Verified</span>
                            </span>
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
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user)}
                              disabled={user.role === 'admin' || user.id === profile?.id}
                            >
                              <Trash2 className="h-4 w-4" />
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

        {/* Delete User Confirmation Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm User Deletion</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the user account and remove all associated data.
              </DialogDescription>
            </DialogHeader>
            
            {userToDelete && (
              <div className="py-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">
                        Delete User: {userToDelete.full_name}
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        Email: {userToDelete.email} | Role: {userToDelete.role}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Are you absolutely sure you want to delete this user? All their bookings, reviews, and associated data will be permanently removed.
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
