import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import EmailService from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()
    
    // Verify request has required fields
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing type or data' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user (for authentication)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let result

    switch (type) {
      case 'welcome':
        result = await EmailService.sendWelcomeEmail({
          userEmail: data.userEmail,
          userName: data.userName,
          role: data.role,
        })
        break

      case 'booking_confirmation':
        result = await EmailService.sendBookingConfirmation({
          userEmail: data.userEmail,
          userName: data.userName,
          bookingId: data.bookingId,
          vehicleName: data.vehicleName,
          startDate: data.startDate,
          endDate: data.endDate,
          totalPrice: data.totalPrice,
          location: data.location,
        })
        break

      case 'payment_confirmation':
        result = await EmailService.sendPaymentConfirmation({
          userEmail: data.userEmail,
          userName: data.userName,
          bookingId: data.bookingId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          vehicleName: data.vehicleName,
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    if (result.success) {
      // Log the notification in database
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'email',
        title: `Email sent: ${type}`,
        message: `Email notification sent to ${data.userEmail}`,
        is_read: true, // Email notifications are automatically "read"
        metadata: {
          email_type: type,
          email_id: result.id,
          recipient: data.userEmail,
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully',
        id: result.id
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check email service status
export async function GET() {
  try {
    // Simple health check
    return NextResponse.json({ 
      status: 'ok',
      service: 'email-notifications',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    )
  }
}
