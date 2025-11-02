import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicle:vehicles (
          id,
          type,
          make,
          model,
          plate_number,
          image_urls
        ),
        payment:payments (
          id,
          status,
          payment_method,
          amount
        )
      `)
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vehicle_id, start_date, end_date, pickup_time, special_requests } = body

    // Get vehicle to calculate price
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('price_per_day, price_per_week, price_per_month')
      .eq('id', vehicle_id)
      .single()

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Calculate total price
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalPrice = days * vehicle.price_per_day

    // Create booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        renter_id: user.id,
        vehicle_id,
        start_date,
        end_date,
        total_price: totalPrice,
        pickup_time,
        special_requests,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

