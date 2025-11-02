'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle } from 'lucide-react'

interface Conversation {
  booking_id: string
  other_user: {
    id: string
    full_name: string
    profile_image_url: string | null
  }
  last_message: {
    content: string
    created_at: string
  } | null
  unread_count: number
  vehicle_name: string
}

export default function ChatList() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  const fetchConversations = async () => {
    if (!user) return

    try {
      // Get all bookings where user is involved
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          renter_id,
          vehicle:vehicles (
            id,
            name,
            owner_id
          )
        `)
        .or(`renter_id.eq.${user.id},vehicle.owner_id.eq.${user.id}`)

      if (bookingsError) throw bookingsError

      // For each booking, get the last message and unread count
      const conversationsData = await Promise.all(
        (bookings || []).map(async (booking) => {
          const isRenter = booking.renter_id === user.id
          const otherUserId = isRenter
            ? booking.vehicle.owner_id
            : booking.renter_id

          // Get other user details
          const { data: otherUser } = await supabase
            .from('users')
            .select('id, full_name, profile_image_url')
            .eq('id', otherUserId)
            .single()

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('booking_id', booking.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('booking_id', booking.id)
            .eq('receiver_id', user.id)
            .eq('read', false)

          return {
            booking_id: booking.id,
            other_user: otherUser,
            last_message: lastMessage,
            unread_count: unreadCount || 0,
            vehicle_name: booking.vehicle.name,
          }
        })
      )

      // Sort by last message time
      conversationsData.sort((a, b) => {
        if (!a.last_message && !b.last_message) return 0
        if (!a.last_message) return 1
        if (!b.last_message) return -1
        return (
          new Date(b.last_message.created_at).getTime() -
          new Date(a.last_message.created_at).getTime()
        )
      })

      setConversations(conversationsData)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading conversations...</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">No conversations yet</p>
          <p className="text-muted-foreground">
            Start chatting with vehicle owners or renters from your bookings
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Link
          key={conversation.booking_id}
          href={`/messages/${conversation.booking_id}`}
        >
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={conversation.other_user.profile_image_url || undefined}
                    alt={conversation.other_user.full_name}
                  />
                  <AvatarFallback>
                    {getInitials(conversation.other_user.full_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold truncate">
                      {conversation.other_user.full_name}
                    </div>
                    {conversation.last_message && (
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(conversation.last_message.created_at),
                          { addSuffix: true }
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conversation.vehicle_name}
                  </div>
                  {conversation.last_message && (
                    <div className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.last_message.content}
                    </div>
                  )}
                </div>

                {/* Unread badge */}
                {conversation.unread_count > 0 && (
                  <Badge variant="default" className="ml-2">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

