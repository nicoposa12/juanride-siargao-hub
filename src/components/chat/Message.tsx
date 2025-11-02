'use client'

import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils/cn'

interface MessageProps {
  content: string
  created_at: string
  is_current_user: boolean
  sender_name?: string
}

export default function Message({
  content,
  created_at,
  is_current_user,
  sender_name,
}: MessageProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        is_current_user ? 'items-end' : 'items-start'
      )}
    >
      {!is_current_user && sender_name && (
        <div className="text-xs text-muted-foreground px-3">{sender_name}</div>
      )}
      <div
        className={cn(
          'rounded-2xl px-4 py-2 max-w-[70%]',
          is_current_user
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <p className="text-sm break-words">{content}</p>
      </div>
      <div className="text-xs text-muted-foreground px-3">
        {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
      </div>
    </div>
  )
}

