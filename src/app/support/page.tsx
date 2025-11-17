'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Ticket, Loader2 } from 'lucide-react'
import Navigation from '@/components/shared/Navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'

interface SupportTicket {
  id: string
  ticket_number: string
  type: string
  subject: string
  description: string
  priority: string
  status: string
  created_at: string
}

export default function SupportPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([])

  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    description: '',
    priority: 'medium',
  })

  useEffect(() => {
    if (user) {
      loadMyTickets()
    }
  }, [user])

  const loadMyTickets = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyTickets(data || [])
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to submit a support ticket',
        variant: 'destructive',
      })
      return
    }

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user.id,
          type: formData.type,
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          status: 'open',
        }])

      if (error) throw error

      toast({
        title: 'Ticket Submitted',
        description: 'Our support team will respond shortly',
      })

      // Reset form
      setFormData({
        type: 'general',
        subject: '',
        description: '',
        priority: 'medium',
      })
      setShowForm(false)

      // Reload tickets
      loadMyTickets()
    } catch (error) {
      console.error('Error submitting ticket:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit ticket. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navigation />

      <div className="pt-20 container mx-auto px-4 py-12 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Need help? <span className="text-primary-600 font-medium">Browse our frequently asked questions</span> or reach out to our support team.
          </p>
        </div>

        {/* Submit Ticket Section */}
        {user && (
          <section>
            {!showForm ? (
              <Card className="max-w-2xl mx-auto shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_12px_24px_rgba(0,0,0,0.12)] transition-all duration-300 border border-gray-100/50">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center space-y-6">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.05)]">
                      <Ticket className="h-12 w-12 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Need Help?</h3>
                      <p className="text-gray-600">
                        Submit a support ticket and our team will assist you
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowForm(true)} 
                      className="gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.15)] transition-all duration-300"
                      size="lg"
                    >
                      <Send className="h-4 w-4" />
                      Submit Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="max-w-2xl mx-auto shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_rgba(0,0,0,0.08)] border border-gray-100/50">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-2xl">Submit Support Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="booking">Booking</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="account">Account</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Provide detailed information about your issue"
                        rows={5}
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Ticket
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* My Tickets Section */}
        {user && myTickets.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">My Support Tickets</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {myTickets.map((ticket) => (
                  <Card key={ticket.id} className="shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-300 border border-gray-100/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-muted-foreground">
                              #{ticket.ticket_number}
                            </span>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <h3 className="font-semibold">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="capitalize">{ticket.type}</span>
                            <span>•</span>
                            <span>{formatDate(ticket.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Contact Support Card */}
        <section>
          <Card className="max-w-2xl mx-auto shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_16px_rgba(0,0,0,0.08)] border border-gray-100/50 bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-2xl font-bold text-gray-900">Still need help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <p className="text-gray-700 text-base leading-relaxed">
                Our support team is available <span className="font-semibold text-primary-600">9 AM–6 PM (GMT+8), Monday to Saturday</span>. We typically respond within 24 hours.
              </p>
              {!user && (
                <div className="p-4 bg-primary-50/50 border border-primary-100 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700 underline underline-offset-2">Sign in</Link> to submit a support ticket
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="mailto:support@juanride.com" className="w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300 border-gray-200"
                  >
                    Email Us
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
