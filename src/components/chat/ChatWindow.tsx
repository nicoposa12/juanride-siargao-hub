'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { Send, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Message from './Message'
import {
  getBookingMessages,
  sendMessage,
  subscribeToBookingMessages,
  unsubscribeChannel,
  type Message as MessageType,
} from '@/lib/supabase/realtime'

interface ChatWindowProps {
  bookingId: string
  recipientId: string
  recipientName: string
}

export default function ChatWindow({
  bookingId,
  recipientId,
  recipientName,
}: ChatWindowProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<MessageType[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (bookingId) {
      fetchMessages()
      setupRealtimeSubscription()
    }

    return () => {
      if (channelRef.current) {
        unsubscribeChannel(channelRef.current)
      }
    }
  }, [bookingId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const data = await getBookingMessages(bookingId)
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = subscribeToBookingMessages(bookingId, (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev
        }
        return [...prev, message]
      })
    })

    channelRef.current = channel
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !user) return

    setSending(true)
    try {
      await sendMessage(bookingId, user.id, recipientId, newMessage.trim())
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading chat...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Chat with {recipientName}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start a conversation!
              </div>
            ) : (
              messages.map((message) => (
                <Message
                  key={message.id}
                  content={message.content}
                  created_at={message.created_at}
                  is_current_user={message.sender_id === user?.id}
                  sender_name={message.sender?.full_name || 'Unknown'}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

