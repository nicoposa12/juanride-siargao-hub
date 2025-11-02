import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supabase = createRouteHandlerClient<Database>({ cookies })

  try {
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        owner:users!owner_id (
          id,
          full_name,
          profile_image_url
        )
      `)
      .eq('is_approved', true)
      .eq('status', 'available')

    // Apply filters from query params
    const type = searchParams.get('type')
    const location = searchParams.get('location')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    if (type) query = query.eq('type', type)
    if (location) query = query.eq('location', location)
    if (minPrice) query = query.gte('price_per_day', parseFloat(minPrice))
    if (maxPrice) query = query.lte('price_per_day', parseFloat(maxPrice))

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
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

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        ...body,
        owner_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create vehicle' },
      { status: 500 }
    )
  }
}

