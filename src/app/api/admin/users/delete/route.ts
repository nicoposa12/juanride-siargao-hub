import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Create service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get the current user from the session
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get user to delete for validation
    const { data: userToDelete, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Safety checks
    if (userToDelete.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    if (userToDelete.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot be deleted' },
        { status: 400 }
      )
    }

    // Check for active bookings
    const { data: activeBookings } = await supabase
      .from('bookings')
      .select('id')
      .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)
      .in('status', ['pending', 'confirmed', 'active'])

    if (activeBookings && activeBookings.length > 0) {
      return NextResponse.json(
        { error: `User has ${activeBookings.length} active booking(s). Complete or cancel them first.` },
        { status: 400 }
      )
    }

    // Delete user using service role
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      )
    }

    // Log the deletion
    console.log(`Admin ${session.user.email} deleted user ${userToDelete.email}`)

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in delete user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
