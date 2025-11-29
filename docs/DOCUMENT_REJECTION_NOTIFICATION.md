# Document Rejection Notification System

## Overview
Implemented an automated email notification system that alerts business owners when their submitted documents are rejected by admins, with detailed instructions on how to resubmit.

## Implementation Date
November 27, 2025

## Components Modified

### 1. Email Service (`src/lib/email/resend.ts`)
**Added**: `sendDocumentRejectionEmail()` method

**Features**:
- Professional email template with red header for urgency
- Lists all rejected documents with their specific rejection reasons
- Step-by-step resubmission instructions
- Important tips section for document quality
- Direct link to owner profile/documents section
- Mobile-responsive design

**Email Content Includes**:
- ⚠️ Clear warning header indicating action is required
- 🔍 List of rejected documents with individual rejection reasons
- 📋 Step-by-step resubmission guide:
  1. Log in to JuanRide account
  2. Go to Documents/Verification section
  3. Find rejected documents
  4. Upload corrected versions
  5. Submit for review
- 📝 Document quality tips
- 💡 Note that review will restart after resubmission
- Direct call-to-action button to resubmit

### 2. Email API Route (`src/app/api/notifications/email/route.ts`)
**Added**: `document_rejection` case handler

**Functionality**:
- Accepts document rejection notification requests
- Validates required fields (userEmail, userName, businessName, rejectedDocuments)
- Logs notification in database
- Returns success/error response

### 3. Notifications Hook (`src/hooks/use-notifications.ts`)
**Added**: `sendDocumentRejectionEmail()` function

**Purpose**:
- Provides reusable hook for sending document rejection emails
- Type-safe interface for rejection data
- Handles loading states and error handling

### 4. Admin Verification Page (`src/app/admin/verifications/page.tsx`)
**Modified**: `confirmAction()` function for business document rejections

**New Behavior**:
When an admin rejects a business document:
1. Updates document status to 'rejected' in database
2. Queries all rejected documents for the owner
3. Sends email notification with:
   - Owner's email and name
   - Business name
   - Complete list of rejected documents with reasons
4. Updates user account status
5. Shows toast notification confirming owner was notified
6. Gracefully handles email failures without blocking the rejection

**Key Features**:
- Aggregates ALL rejected documents (not just current one)
- Sends single consolidated email per rejection action
- Non-blocking: Email failure doesn't prevent document rejection
- Includes formatted document type labels
- Logs email send status to console

## Email Notification Details

### Trigger Event
- Admin clicks "Reject" button for any business document
- Admin provides rejection reason (required)
- Confirmation dialog is submitted

### Recipients
- Business owner's registered email address

### Email Subject
```
⚠️ Document Resubmission Required - [Business Name]
```

### Email Content Structure
1. **Header**: Red background with warning icon
2. **Greeting**: Personalized with owner name
3. **Rejected Documents Section**: Yellow warning box with:
   - Document type (formatted label)
   - Specific rejection reason
4. **Resubmission Instructions**: Blue info box with numbered steps
5. **Tips Section**: Bullet points for document quality
6. **CTA Button**: "Resubmit Documents Now" → Links to owner profile
7. **Footer**: JuanRide branding and support contact

### Document Types Displayed
- Business Permit
- DTI Registration
- SEC Registration
- BIR Certificate (BIR Registration)

## User Experience Flow

### For Admins
1. Review document in verification page
2. Click "Reject" button
3. Enter rejection reason (mandatory)
4. Confirm rejection
5. See toast: "Document rejected. Owner has been notified via email with instructions to resubmit."
6. Email is sent automatically in background

### For Owners
1. Receive email notification (typically within seconds)
2. Read specific rejection reasons for each document
3. Follow step-by-step instructions
4. Log in to account
5. Navigate to Documents/Verification section
6. Upload corrected documents
7. Submit for review (process restarts)

## Technical Implementation

### Database Operations
```typescript
// Update document status
UPDATE business_documents
SET status = 'rejected',
    reviewed_at = NOW(),
    reviewer_id = [admin_id],
    rejection_reason = [reason]
WHERE id = [document_id]

// Query all rejected docs for email
SELECT document_type, rejection_reason, status
FROM business_documents
WHERE owner_id = [owner_id] AND status = 'rejected'

// Update owner account status
UPDATE users
SET account_verification_status = 'rejected',
    account_status_reason = [reason]
WHERE id = [owner_id]
```

### API Call Structure
```typescript
POST /api/notifications/email
{
  type: 'document_rejection',
  data: {
    userEmail: string,
    userName: string,
    businessName: string,
    rejectedDocuments: Array<{
      documentType: string,
      rejectionReason: string
    }>
  }
}
```

## Error Handling

### Email Send Failures
- Logged to console with warning emoji: `⚠️ Failed to send rejection email:`
- Does NOT block document rejection
- Admin toast still shows document was rejected
- Email service may retry automatically (Resend built-in)

### Missing Data
- Fallback values provided:
  - userName: 'Owner'
  - businessName: 'Your Business'
  - rejectionReason: 'No reason provided'

### Authentication
- Email API requires authenticated user (admin)
- Returns 401 if not authenticated
- Validates Supabase session

## Configuration Requirements

### Environment Variables
```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_sender_email
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

### Resend Setup
1. Create Resend account
2. Verify sender email domain
3. Add API key to environment variables
4. Test email sending in development

## Testing Checklist

- [ ] Admin can reject business document
- [ ] Rejection reason is required
- [ ] Email is sent to correct owner
- [ ] Email contains all rejected documents
- [ ] Email contains correct rejection reasons
- [ ] Email has proper formatting
- [ ] CTA button links to correct page
- [ ] Multiple rejections are aggregated
- [ ] Email failure doesn't block rejection
- [ ] Toast shows correct message
- [ ] Console logs success/failure

## Future Enhancements

1. **In-App Notifications**: Add bell icon notifications in addition to email
2. **SMS Notifications**: Send SMS for urgent rejections
3. **Batch Notifications**: Allow rejecting multiple documents at once
4. **Email Templates**: Add more dynamic content based on document type
5. **Resubmission Tracking**: Track how many times documents are resubmitted
6. **Auto-reminders**: Send reminder if owner doesn't resubmit within X days
7. **Document Comparison**: Show side-by-side comparison of old vs new documents

## Support Information

If owners have questions about rejection:
- Email: support@juanride.com
- Available: 24/7
- Response time: Within 24 hours

## Related Files

- `/src/lib/email/resend.ts` - Email service with templates
- `/src/app/api/notifications/email/route.ts` - Email API endpoint
- `/src/hooks/use-notifications.ts` - Notification hooks
- `/src/app/admin/verifications/page.tsx` - Admin verification page
- `/supabase/migrations/` - Database schema for notifications

## Notes

- Email delivery typically takes 1-5 seconds
- Resend has rate limits (check plan details)
- All emails are logged in `notifications` table
- Email content is HTML with inline CSS for compatibility
- Mobile-responsive design for all email clients
