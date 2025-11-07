# 📧 Email Notifications Setup Guide

## Overview
JuanRide uses **Resend** for professional email notifications. This system automatically sends emails for:

- 🎉 **Welcome emails** when users sign up
- ✅ **Booking confirmations** when rentals are booked
- 💳 **Payment confirmations** when payments are processed
- 🔔 **In-app notifications** for various user actions

## 🚀 Setup Instructions

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email address

### 2. Get API Key

1. In your Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name like "JuanRide Production"
4. Copy the API key (starts with `re_`)

### 3. Set Up Domain (Optional but Recommended)

For production, you should use your own domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `juanride.com`)
4. Follow DNS setup instructions
5. Verify the domain

### 4. Environment Variables

Add these to your `.env.local`:

```env
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com  # or use resend's default
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your app URL
```

### 5. Test the Setup

1. Restart your development server: `npm run dev`
2. Sign up for a new account
3. Check your email for the welcome message
4. Complete a booking to test confirmation emails

## 📧 Email Templates

The system includes professional email templates for:

### Welcome Email
- **Trigger**: User signs up
- **Recipient**: New user
- **Content**: Welcome message, next steps, platform overview
- **Personalized** for renters vs owners

### Booking Confirmation
- **Trigger**: Booking status changes to 'confirmed'
- **Recipient**: Renter
- **Content**: Booking details, pickup instructions, contact info

### Payment Confirmation
- **Trigger**: Payment status changes to 'paid'
- **Recipient**: Renter
- **Content**: Payment receipt, booking reference, amount details

## 🔔 In-App Notifications

The notification center shows real-time notifications to users:

- **Bell icon** in the navigation bar
- **Badge** showing unread count
- **Dropdown panel** with notification history
- **Mark as read** functionality
- **Action links** for relevant notifications

## 🔧 Customization

### Email Templates
Edit templates in `src/lib/email/resend.ts`:
- Modify HTML content
- Update styling
- Add new notification types

### Notification Center
Customize in `src/components/notifications/NotificationCenter.tsx`:
- Change appearance
- Add new notification types
- Modify behavior

## 🏗️ Database Schema

Notifications are stored in the `notifications` table:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'info', 'success', 'warning', 'error'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📱 Usage in Code

### Send Email Notification
```typescript
import { useNotifications } from '@/hooks/use-notifications'

const { sendBookingConfirmation } = useNotifications()

await sendBookingConfirmation({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  bookingId: 'booking-123',
  vehicleName: 'Honda Click',
  startDate: '2024-01-15',
  endDate: '2024-01-18',
  totalPrice: 2400,
  location: 'General Luna'
})
```

### Create In-App Notification
```typescript
const { createInAppNotification } = useNotifications()

await createInAppNotification({
  userId: 'user-123',
  type: 'success',
  title: 'Booking Approved',
  message: 'Your vehicle booking has been approved by the owner.',
  actionUrl: '/dashboard/bookings/booking-123'
})
```

## 🔍 Troubleshooting

### Emails Not Sending
1. Check your Resend API key is correct
2. Verify the `RESEND_FROM_EMAIL` is properly configured
3. Check console logs for error messages
4. Ensure your domain is verified (for custom domains)

### Notifications Not Appearing
1. Check database permissions (RLS policies)
2. Verify user is authenticated
3. Check console for JavaScript errors
4. Ensure notification was created in database

### Rate Limits
- Free tier: 100 emails/day, 3,000/month
- Paid plans start at $20/month for 50,000 emails
- Monitor usage in Resend dashboard

## 🎯 Best Practices

1. **Don't spam users** - Only send essential notifications
2. **Make emails actionable** - Include clear next steps
3. **Mobile-friendly** - Emails work on all devices
4. **Track deliverability** - Monitor bounce rates
5. **A/B test** - Try different subject lines and content
6. **Respect unsubscribes** - Implement preference management

## 🔒 Security Notes

- API keys are server-side only (not exposed to client)
- Email content is sanitized
- User data is encrypted in transit
- Rate limiting prevents abuse
- Unsubscribe links (when implemented) are validated

---

With this setup, JuanRide will automatically send professional email notifications to keep users informed throughout their rental journey! 🚗✨
