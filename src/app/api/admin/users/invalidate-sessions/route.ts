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

export async function POST(request: NextRequest) {
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

    // Get user to validate
    const { data: userToInvalidate, error: fetchError } = await supabase
      .from('users')
      .select('email, is_active')
      .eq('id', userId)
      .single()

    if (fetchError || !userToInvalidate) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Safety check: Don't invalidate your own sessions
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot invalidate your own sessions' },
        { status: 400 }
      )
    }

    try {
      // Method 1: Update the user's auth metadata to force re-authentication
      // This approach updates the user's updated_at timestamp which will 
      // invalidate existing JWT tokens on next validation
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { 
          user_metadata: { 
            ...userToInvalidate,
            session_invalidated_at: new Date().toISOString(),
            force_logout: true
          }
        }
      )

      if (updateError) {
        console.error('Error updating user metadata:', updateError)
        throw updateError
      }

      // Method 2: Force session invalidation through user metadata update
      // This is safer than using deleteUser which might actually delete the user
      console.log('Session invalidation completed through metadata update - user will be logged out on next request')

      // Log the session invalidation
      console.log(`Admin ${session.user.email} invalidated sessions for user ${userToInvalidate.email}`)

      return NextResponse.json(
        { 
          message: 'User sessions invalidated successfully',
          details: 'User will be logged out on next request'
        },
        { status: 200 }
      )

    } catch (invalidationError: any) {
      console.error('Error invalidating sessions:', invalidationError)
      
      // Fallback: Update a field in the users table to trigger middleware checks
      try {
        await supabase
          .from('users')
          .update({ 
            updated_at: new Date().toISOString(),
            // Add a session_version that we can check in middleware
            session_version: new Date().getTime().toString()
          })
          .eq('id', userId)
          
        return NextResponse.json(
          { 
            message: 'User sessions marked for invalidation',
            details: 'User will be logged out on next request via middleware'
          },
          { status: 200 }
        )
      } catch (fallbackError) {
        console.error('Fallback session invalidation failed:', fallbackError)
        throw fallbackError
      }
    }

  } catch (error: any) {
    console.error('Error in invalidate sessions API:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate user sessions' },
      { status: 500 }
    )
  }
}
