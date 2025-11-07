'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import ChatWindow from '@/components/chat/ChatWindow'
import Navigation from '@/components/shared/Navigation'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [recipientId, setRecipientId] = useState<string>('')
  const [recipientName, setRecipientName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchBookingDetails()
    }
  }, [user, authLoading])

  const fetchBookingDetails = async () => {
    const supabase = createClient()
    
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          renter_id,
          vehicle:vehicles (
            owner_id,
            make,
            model
          )
        `)
        .eq('id', params.bookingId)
        .single()

      if (error) throw error

      // Determine who the other user is
      const isRenter = booking.renter_id === user?.id
      const otherUserId = isRenter
        ? booking.vehicle.owner_id
        : booking.renter_id

      // Fetch other user's details
      const { data: otherUser } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', otherUserId)
        .single()

      if (otherUser) {
        setRecipientId(otherUser.id)
        setRecipientName(otherUser.full_name)
      }
    } catch (error) {
      console.error('Error fetching booking details:', error)
      router.push('/messages')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!user || !recipientId) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      <div className="container mx-auto px-4 max-w-4xl pt-24 pb-12">
        <Link href="/messages">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>
        </Link>

        <ChatWindow
          bookingId={params.bookingId as string}
          recipientId={recipientId}
          recipientName={recipientName}
        />
      </div>
    </div>
  )
}

