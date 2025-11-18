'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TablePagination } from '@/components/ui/table-pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MessageSquare, Search, Eye } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'

interface SupportTicket {
  id: string
  ticket_number: string
  user_id: string
  type: string
  subject: string
  description: string
  priority: string
  status: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  user: {
    full_name: string
    email: string
  }
}

export default function AdminSupportPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Stats
  const [openCount, setOpenCount] = useState(0)
  const [inProgressCount, setInProgressCount] = useState(0)
  const [resolvedCount, setResolvedCount] = useState(0)
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    if (!authLoading) {
      if (!user || (profile && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      loadTickets()
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    filterTickets()
    setCurrentPage(1) // Reset to first page when filters change
  }, [tickets, searchQuery, typeFilter, statusFilter, priorityFilter])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user:users (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const normalizedTickets: SupportTicket[] = (data || []).map((ticket: any) => ({
        ...ticket,
        user: Array.isArray(ticket.user) ? ticket.user[0] : ticket.user,
      }))

      setTickets(normalizedTickets)

      // Calculate stats
      setOpenCount(normalizedTickets.filter(t => t.status === 'open').length)
      setInProgressCount(normalizedTickets.filter(t => t.status === 'in_progress').length)
      setResolvedCount(normalizedTickets.filter(t => t.status === 'resolved').length)
    } catch (error) {
      console.error('Error loading tickets:', error)
      toast({
        title: 'Error',
        description: 'Failed to load support tickets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTickets = () => {
    let filtered = [...tickets]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.ticket_number.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        t.user?.full_name?.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter)
    }

    setFilteredTickets(filtered)
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId)

      if (error) throw error

      toast({
        title: 'Status Updated',
        description: `Ticket status changed to ${newStatus}`,
      })

      loadTickets()
      if (selectedTicket?.id === ticketId) {
        setDetailsOpen(false)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive',
      })
    }
  }

  const handleViewDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setDetailsOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Open</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>
      case 'closed':
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge className="bg-cyan-500">Medium</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Support & Issue Reports</h1>
        <p className="text-muted-foreground">Manage customer support tickets and inquiries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-3xl font-bold">{openCount}</p>
              </div>
              <MessageSquare className="h-12 w-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold">{inProgressCount}</p>
              </div>
              <MessageSquare className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold">{resolvedCount}</p>
              </div>
              <MessageSquare className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {/* Search and Filters */}
          <div className="p-6 border-b space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket ID, user, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Support Tickets ({filteredTickets.length} total)
            </h3>
            
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tickets found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell>{ticket.user?.full_name || 'Unknown'}</TableCell>
                        <TableCell className="capitalize">{ticket.type}</TableCell>
                        <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{ticket.assigned_to || '—'}</TableCell>
                        <TableCell>{formatDate(ticket.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(ticket)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination */}
            {filteredTickets.length > 0 && (
              <div className="mt-6">
                <TablePagination
                  currentPage={currentPage}
                  totalItems={filteredTickets.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Ticket Details - #{selectedTicket?.ticket_number}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedTicket.user?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedTicket.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(selectedTicket.created_at)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline" className="capitalize">{selectedTicket.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Subject</p>
                <p className="font-medium">{selectedTicket.subject}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <p className="text-sm font-medium">Update Status:</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                  disabled={selectedTicket.status === 'in_progress'}
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                  disabled={selectedTicket.status === 'resolved'}
                  className="bg-green-50 hover:bg-green-100"
                >
                  Resolved
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                  disabled={selectedTicket.status === 'closed'}
                >
                  Closed
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

