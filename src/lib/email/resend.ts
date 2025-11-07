import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

export class EmailService {
  private static readonly FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  private static readonly FROM_NAME = 'JuanRide Siargao'

  static async sendEmail({ to, subject, html, from }: EmailData) {
    try {
      const { data, error } = await resend.emails.send({
        from: from || `${this.FROM_NAME} <${this.FROM_ADDRESS}>`,
        to: [to],
        subject,
        html,
      })

      if (error) {
        console.error('❌ Email send error:', error)
        throw new Error(`Failed to send email: ${error.message}`)
      }

      console.log('✅ Email sent successfully:', data?.id)
      return { success: true, id: data?.id }
    } catch (error: any) {
      console.error('💥 Email service error:', error)
      return { success: false, error: error.message }
    }
  }

  // Booking confirmation email
  static async sendBookingConfirmation(data: {
    userEmail: string
    userName: string
    bookingId: string
    vehicleName: string
    startDate: string
    endDate: string
    totalPrice: number
    location: string
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .highlight { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
              <p>Your vehicle rental is all set</p>
            </div>
            <div class="content">
              <h2>Hi ${data.userName}!</h2>
              <p>Great news! Your booking has been confirmed. Here are the details:</p>
              
              <div class="highlight">
                <h3>📋 Booking Details</h3>
                <p><strong>Booking ID:</strong> ${data.bookingId}</p>
                <p><strong>Vehicle:</strong> ${data.vehicleName}</p>
                <p><strong>Location:</strong> ${data.location}</p>
                <p><strong>Rental Period:</strong> ${data.startDate} to ${data.endDate}</p>
                <p><strong>Total Amount:</strong> ₱${data.totalPrice.toLocaleString()}</p>
              </div>

              <h3>🚗 What's Next?</h3>
              <ul>
                <li>The vehicle owner will contact you with pickup details</li>
                <li>Please bring a valid driver's license</li>
                <li>Arrive on time for pickup</li>
                <li>Have an amazing ride in Siargao! 🏄‍♂️</li>
              </ul>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings" class="button">
                View Booking Details
              </a>
            </div>
            <div class="footer">
              <p>JuanRide Siargao - Your trusted vehicle rental platform</p>
              <p>Questions? Reply to this email or contact us.</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: data.userEmail,
      subject: `🎉 Booking Confirmed - ${data.vehicleName}`,
      html,
    })
  }

  // Welcome email for new users
  static async sendWelcomeEmail(data: {
    userEmail: string
    userName: string
    role: 'renter' | 'owner'
  }) {
    const isOwner = data.role === 'owner'
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to JuanRide</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #fff; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f8f9fa; }
            .highlight { background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏝️ Welcome to JuanRide!</h1>
              <p>Your gateway to Siargao adventures</p>
            </div>
            <div class="content">
              <h2>Hi ${data.userName}! 👋</h2>
              <p>Welcome to JuanRide Siargao - the premier vehicle rental platform for exploring this beautiful island!</p>
              
              ${isOwner ? `
                <div class="highlight">
                  <h3>🚗 Ready to Start Earning?</h3>
                  <p>As a vehicle owner, you can:</p>
                  <ul>
                    <li>List your vehicles and start earning passive income</li>
                    <li>Manage bookings with our easy-to-use dashboard</li>
                    <li>Connect with travelers from around the world</li>
                    <li>Track your earnings and performance</li>
                  </ul>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/owner/vehicles/new" class="button">
                    Add Your First Vehicle
                  </a>
                </div>
              ` : `
                <div class="highlight">
                  <h3>🏄‍♂️ Ready to Explore Siargao?</h3>
                  <p>As a renter, you can:</p>
                  <ul>
                    <li>Browse hundreds of vehicles from motorcycles to cars</li>
                    <li>Book instantly with secure payments</li>
                    <li>Chat with vehicle owners directly</li>
                    <li>Explore hidden gems across the island</li>
                  </ul>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/vehicles" class="button">
                    Browse Vehicles
                  </a>
                </div>
              `}

              <h3>🌟 Why JuanRide?</h3>
              <ul>
                <li><strong>Local Focus:</strong> Built specifically for Siargao</li>
                <li><strong>Secure Payments:</strong> GCash, Maya, and card payments</li>
                <li><strong>Real-time Chat:</strong> Direct communication with ${isOwner ? 'renters' : 'owners'}</li>
                <li><strong>Verified Listings:</strong> All vehicles are checked for quality</li>
              </ul>

              <p>Need help getting started? Our team is here to assist you every step of the way!</p>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" class="button">
                Complete Your Profile
              </a>
            </div>
            <div class="footer">
              <p><strong>JuanRide Siargao</strong> - Connecting travelers with trusted vehicle owners</p>
              <p>📧 Email: support@juanride.com | 📱 Support available 24/7</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: data.userEmail,
      subject: `🏝️ Welcome to JuanRide Siargao${isOwner ? ' - Start Earning Today!' : ' - Let\'s Explore!'}`,
      html,
    })
  }

  // Payment confirmation email
  static async sendPaymentConfirmation(data: {
    userEmail: string
    userName: string
    bookingId: string
    amount: number
    paymentMethod: string
    vehicleName: string
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Received</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .highlight { background: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745; }
            .amount { font-size: 24px; font-weight: bold; color: #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Received!</h1>
              <p>Your payment has been processed successfully</p>
            </div>
            <div class="content">
              <h2>Hi ${data.userName}!</h2>
              <p>Thank you! We've received your payment for the vehicle booking.</p>
              
              <div class="highlight">
                <h3>💳 Payment Details</h3>
                <p><strong>Booking ID:</strong> ${data.bookingId}</p>
                <p><strong>Vehicle:</strong> ${data.vehicleName}</p>
                <p><strong>Amount Paid:</strong> <span class="amount">₱${data.amount.toLocaleString()}</span></p>
                <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
                <p><strong>Status:</strong> ✅ Confirmed</p>
              </div>

              <p>Your booking is now fully confirmed and the vehicle owner has been notified. You'll receive pickup instructions soon!</p>
            </div>
            <div class="footer">
              <p>JuanRide Siargao - Secure and reliable payments</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: data.userEmail,
      subject: `✅ Payment Confirmed - ₱${data.amount.toLocaleString()}`,
      html,
    })
  }
}

export default EmailService
