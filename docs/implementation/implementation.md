# JuanRide Implementation Guide

## Development Philosophy

JuanRide follows a pragmatic development approach that prioritizes rapid delivery without sacrificing code quality. We leverage modern frameworks and services to minimize boilerplate while maintaining scalability and maintainability. This document outlines our implementation standards, coding conventions, and architectural patterns.

---

## Project Architecture Overview

JuanRide uses a modern full-stack architecture with clear separation of concerns:

**Frontend:** Next.js 14 with React (Server Components + Client Components)  
**Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)  
**Mobile:** Android WebView wrapper  
**Deployment:** Vercel (Frontend) + Supabase Cloud (Backend)

This architecture enables rapid development while maintaining performance and scalability.

---

## Code Organization

### Frontend Structure (Next.js 14 App Router)

```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/              # Protected route group
│   │   ├── my-bookings/
│   │   │   └── page.tsx
│   │   ├── favorites/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (owner)/                  # Owner route group
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── vehicles/
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (admin)/                  # Admin route group
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── listings/
│   │   └── layout.tsx
│   │
│   ├── vehicles/                 # Public vehicle pages
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   │
│   ├── search/
│   │   └── page.tsx
│   │
│   ├── checkout/
│   │   └── page.tsx
│   │
│   ├── api/                      # API routes
│   │   ├── webhooks/
│   │   │   └── payment/
│   │   │       └── route.ts
│   │   └── bookings/
│   │       └── route.ts
│   │
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── not-found.tsx
│
├── components/                   # React components
│   ├── ui/                       # Shadcn/UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── shared/                   # Shared components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── MobileNav.tsx
│   │
│   ├── vehicle/                  # Vehicle-related components
│   │   ├── VehicleCard.tsx
│   │   ├── VehicleGallery.tsx
│   │   ├── VehicleFilters.tsx
│   │   └── VehicleList.tsx
│   │
│   ├── booking/                  # Booking components
│   │   ├── BookingWidget.tsx
│   │   ├── BookingCard.tsx
│   │   ├── DateRangePicker.tsx
│   │   └── PriceBreakdown.tsx
│   │
│   └── owner/                    # Owner dashboard components
│       ├── FleetOverview.tsx
│       ├── BookingManagement.tsx
│       └── RevenueChart.tsx
│
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase client
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   │
│   ├── utils/                    # Utility functions
│   │   ├── cn.ts                 # Class name merger
│   │   ├── format.ts             # Date/number formatting
│   │   └── validation.ts         # Validators
│   │
│   └── constants.ts              # App constants
│
├── hooks/                        # Custom React hooks
│   ├── use-user.ts               # User authentication
│   ├── use-bookings.ts           # Booking management
│   ├── use-vehicles.ts           # Vehicle data
│   └── use-toast.ts              # Toast notifications
│
├── types/                        # TypeScript types
│   ├── database.types.ts         # Supabase generated types
│   ├── vehicle.types.ts
│   ├── booking.types.ts
│   └── user.types.ts
│
└── styles/
    └── globals.css               # Global styles with Tailwind
```

---

## Implementation Standards

### 1. Component Development

#### React Server Components (RSC) vs Client Components

**Use Server Components (default) for:**
- Pages that fetch data
- Static content
- SEO-important pages
- Non-interactive components

**Use Client Components ('use client') for:**
- Interactive elements (forms, buttons with onClick)
- State management (useState, useReducer)
- Effects (useEffect)
- Browser-only APIs
- Event handlers

**Example: Vehicle Details Page (Server Component)**

```typescript
// app/vehicles/[id]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { VehicleGallery } from '@/components/vehicle/VehicleGallery'
import { BookingWidget } from '@/components/booking/BookingWidget'
import { Database } from '@/types/database.types'

export default async function VehiclePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = createServerComponentClient<Database>({ cookies })

  // Fetch data on the server
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name,
        phone_number
      ),
      reviews (
        id,
        rating,
        comment,
        created_at,
        reviewer:users!reviewer_id (full_name)
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !vehicle) {
    return <div>Vehicle not found</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VehicleGallery images={vehicle.image_urls} />
          
          <div className="mt-6">
            <h1 className="text-3xl font-bold">{vehicle.type} - {vehicle.model}</h1>
            <p className="text-gray-600 mt-2">{vehicle.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
            {/* Reviews list */}
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Client component for interactivity */}
          <BookingWidget 
            vehicleId={vehicle.id}
            pricePerDay={Number(vehicle.price_per_day)}
          />
        </div>
      </div>
    </div>
  )
}
```

**Example: Booking Widget (Client Component)**

```typescript
// components/booking/BookingWidget.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/booking/DateRangePicker'
import { useToast } from '@/hooks/use-toast'
import { calculateTotalPrice } from '@/lib/utils/pricing'

interface BookingWidgetProps {
  vehicleId: string
  pricePerDay: number
}

export function BookingWidget({ vehicleId, pricePerDay }: BookingWidgetProps) {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select rental dates",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Create booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          startDate,
          endDate
        })
      })

      if (!response.ok) throw new Error('Booking failed')

      const { bookingId } = await response.json()
      router.push(`/checkout/${bookingId}`)
      
    } catch (error) {
      toast({
        title: "Booking failed",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalPrice = startDate && endDate 
    ? calculateTotalPrice(startDate, endDate, pricePerDay)
    : 0

  return (
    <div className="border rounded-lg p-6 sticky top-4">
      <div className="text-2xl font-bold mb-4">
        ₱{pricePerDay.toLocaleString()} <span className="text-base font-normal text-gray-600">/ day</span>
      </div>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        vehicleId={vehicleId}
      />

      {totalPrice > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between mb-2">
            <span>Total</span>
            <span className="font-semibold">₱{totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      <Button 
        className="w-full mt-4" 
        onClick={handleBooking}
        disabled={!startDate || !endDate || isLoading}
      >
        {isLoading ? 'Processing...' : 'Book Now'}
      </Button>
    </div>
  )
}
```

---

### 2. Database Integration with Supabase

#### Type-Safe Database Access

Generate TypeScript types from your Supabase schema:

```bash
# Generate types
npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
```

#### Database Query Patterns

```typescript
// lib/supabase/queries/vehicles.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function getAvailableVehicles(
  startDate: string,
  endDate: string,
  vehicleType?: string
) {
  const supabase = createServerComponentClient<Database>({ cookies })

  let query = supabase
    .from('vehicles')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name
      )
    `)
    .eq('status', 'available')

  // Filter by type if provided
  if (vehicleType) {
    query = query.eq('type', vehicleType)
  }

  const { data: vehicles, error } = await query

  if (error) throw error

  // Filter out vehicles with conflicting bookings
  const availableVehicles = await Promise.all(
    vehicles.map(async (vehicle) => {
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .in('status', ['confirmed', 'active'])
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

      return conflicts?.length === 0 ? vehicle : null
    })
  )

  return availableVehicles.filter(Boolean)
}
```

#### Row Level Security (RLS) Policies

```sql
-- Enable RLS on vehicles table
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active vehicles
CREATE POLICY "Public vehicles are viewable by everyone"
ON vehicles FOR SELECT
USING (status = 'available');

-- Policy: Owners can view their own vehicles
CREATE POLICY "Owners can view own vehicles"
ON vehicles FOR SELECT
USING (auth.uid() = owner_id);

-- Policy: Owners can update their own vehicles
CREATE POLICY "Owners can update own vehicles"
ON vehicles FOR UPDATE
USING (auth.uid() = owner_id);

-- Policy: Only admins can delete vehicles
CREATE POLICY "Admins can delete vehicles"
ON vehicles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

---

### 3. Authentication Implementation

#### Auth Context and Hooks

```typescript
// lib/supabase/auth-context.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(data)
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

#### Protected Routes

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect owner routes
  if (req.nextUrl.pathname.startsWith('/owner') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/owner/:path*', '/admin/:path*', '/my-bookings/:path*']
}
```

---

### 4. Real-Time Features

#### Real-Time Chat Implementation

```typescript
// components/chat/ChatWindow.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database.types'

type Message = Database['public']['Tables']['messages']['Row']

interface ChatWindowProps {
  bookingId: string
  currentUserId: string
}

export function ChatWindow({ bookingId, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    // Load existing messages
    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: currentUserId,
      content: newMessage.trim()
    })

    setNewMessage('')
  }

  return (
    <div className="flex flex-col h-96 border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender_id === currentUserId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
```

---

### 5. Payment Integration

#### Payment Processing with Edge Functions

```typescript
// supabase/functions/process-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { bookingId, paymentMethod, amount } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get booking details
    const { data: booking } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      throw new Error('Booking not found')
    }

    // Process payment based on method
    let paymentResult
    
    if (paymentMethod === 'gcash') {
      paymentResult = await processGCashPayment(amount, booking)
    } else if (paymentMethod === 'maya') {
      paymentResult = await processMayaPayment(amount, booking)
    } else if (paymentMethod === 'card') {
      paymentResult = await processCardPayment(amount, booking)
    }

    // Create payment record
    await supabaseClient.from('payments').insert({
      booking_id: bookingId,
      amount,
      payment_method: paymentMethod,
      status: paymentResult.success ? 'paid' : 'failed',
      transaction_id: paymentResult.transactionId
    })

    // Update booking status if payment successful
    if (paymentResult.success) {
      await supabaseClient
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId)

      // Update vehicle status
      await supabaseClient
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', booking.vehicle_id)
    }

    return new Response(
      JSON.stringify({ success: paymentResult.success }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

---

### 6. File Upload (Vehicle Photos)

```typescript
// lib/supabase/storage.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function uploadVehicleImage(
  file: File,
  vehicleId: string
): Promise<string> {
  const supabase = createClientComponentClient()

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${vehicleId}/${Math.random()}.${fileExt}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('vehicle-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(fileName)

  return publicUrl
}
```

---

## Testing Strategy

### Unit Testing with Jest

```typescript
// __tests__/utils/pricing.test.ts
import { calculateTotalPrice, calculateDays } from '@/lib/utils/pricing'

describe('Pricing Utilities', () => {
  describe('calculateDays', () => {
    it('calculates correct number of days', () => {
      const start = new Date('2025-01-01')
      const end = new Date('2025-01-05')
      expect(calculateDays(start, end)).toBe(4)
    })

    it('handles same day rental', () => {
      const start = new Date('2025-01-01')
      const end = new Date('2025-01-01')
      expect(calculateDays(start, end)).toBe(1)
    })
  })

  describe('calculateTotalPrice', () => {
    it('calculates total price correctly', () => {
      const start = new Date('2025-01-01')
      const end = new Date('2025-01-05')
      const dailyRate = 500
      expect(calculateTotalPrice(start, end, dailyRate)).toBe(2000)
    })
  })
})
```

---

## Performance Optimization

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image'

export function VehicleCard({ vehicle }) {
  return (
    <div>
      <Image
        src={vehicle.image_urls[0]}
        alt={vehicle.model}
        width={400}
        height={300}
        className="rounded-lg"
        loading="lazy"
      />
    </div>
  )
}
```

### Database Indexing

```sql
-- Index frequently queried columns
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(type);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
```

---

## Deployment

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payment gateways
GCASH_API_KEY=your-gcash-key
MAYA_API_KEY=your-maya-key
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## Code Quality Standards

- **TypeScript:** Strict mode enabled, no `any` types
- **ESLint:** Enforce code style and best practices
- **Prettier:** Consistent code formatting
- **Husky:** Pre-commit hooks for linting and testing
- **Conventional Commits:** Standardized commit messages

This implementation guide ensures consistent, high-quality code across the JuanRide platform.
