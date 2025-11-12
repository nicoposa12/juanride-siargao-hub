# Payment Integration Setup Guide

JuanRide uses **PayMongo** as the payment gateway to accept payments via GCash, Maya (PayMaya), Credit/Debit Cards, and GrabPay.

## Prerequisites

1. Create a PayMongo account at [https://dashboard.paymongo.com/](https://dashboard.paymongo.com/)
2. Complete the KYC verification process
3. Get your API keys from the Developer section

## Environment Variables

Add these variables to your `.env.local` file:

```env
# PayMongo Configuration
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
NEXT_PUBLIC_PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
```

### Getting Your API Keys

1. Log in to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Navigate to **Developers** → **API Keys**
3. Copy your **Public Key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

⚠️ **Important**: Use test keys (`pk_test_` and `sk_test_`) during development. Switch to live keys only when deploying to production.

## Supported Payment Methods

### 1. **GCash** (E-Wallet)
- Most popular payment method in the Philippines
- Instant confirmation
- Customers are redirected to GCash app/web
- No additional setup required

### 2. **Maya (PayMaya)** (E-Wallet)
- Popular digital wallet
- Instant confirmation
- Customers are redirected to Maya app/web
- No additional setup required

### 3. **Credit/Debit Cards**
- Visa, Mastercard, JCB, AMEX
- 3D Secure authentication supported
- Requires card tokenization for security
- Direct payment (no redirect)

### 4. **GrabPay** (E-Wallet)
- Digital wallet integration
- Instant confirmation
- Redirect-based payment
- No additional setup required

## Payment Flow

### For E-Wallets (GCash, Maya, GrabPay):

1. User selects payment method on checkout page
2. Creates a Payment Source with redirect URLs
3. Creates a Payment linked to the source
4. User is redirected to the payment gateway
5. User completes payment in the app/web
6. User is redirected back to success/failed page
7. Payment status is updated in database

### For Credit/Debit Cards:

1. User selects card payment and enters card details
2. Creates a Payment Intent
3. Creates a Payment Method (tokenizes card)
4. Attaches Payment Method to Payment Intent
5. Handles 3D Secure authentication if required
6. Payment is processed immediately
7. Booking is confirmed

## Testing

### Test Card Numbers

```
Visa (Successful):      4123450131001381
Visa (Failed):          4571736000000075
Mastercard (Successful):5339080000000003
Mastercard (Failed):    5455590000000009

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
```

### Test E-Wallets

For GCash and Maya testing:
1. The payment gateway will redirect to a test page
2. Click "Authorize" to simulate successful payment
3. Or click "Cancel" to simulate failed payment

## Webhooks (Optional - for Production)

Set up webhooks to receive real-time payment notifications:

1. Go to PayMongo Dashboard → **Developers** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/paymongo`
3. Select events:
   - `payment.paid`
   - `payment.failed`
   - `source.chargeable`

## Production Deployment Checklist

- [ ] Replace test API keys with live keys
- [ ] Set up webhook endpoints
- [ ] Test all payment methods in production
- [ ] Enable email notifications for successful payments
- [ ] Set up proper error logging
- [ ] Configure payment refund policies
- [ ] Add fraud detection rules
- [ ] Set up automatic reconciliation

## Security Best Practices

1. **Never expose secret keys**: Keep `NEXT_PUBLIC_PAYMONGO_SECRET_KEY` server-side only
2. **Use HTTPS**: Always use SSL in production
3. **Validate webhooks**: Verify webhook signatures
4. **PCI Compliance**: Never store raw card data
5. **Rate limiting**: Implement rate limits on payment endpoints
6. **Logging**: Log all payment attempts and failures
7. **Error handling**: Don't expose sensitive error details to users

## Payment Fees

PayMongo charges the following fees (as of 2024):

- **GCash**: 2.5% + ₱0
- **Maya**: 2.5% + ₱0
- **Cards**: 3.5% + ₱15
- **GrabPay**: 2.5% + ₱0

💡 **Tip**: Consider passing these fees to customers or factoring them into your pricing.

## Support

- **PayMongo Docs**: [https://developers.paymongo.com/docs](https://developers.paymongo.com/docs)
- **PayMongo Support**: support@paymongo.com
- **JuanRide Support**: support@juanride.com

## File Structure

```
src/
├── lib/
│   └── payment/
│       └── paymongo.ts          # PayMongo API integration
├── components/
│   └── payment/
│       ├── PaymentMethodSelector.tsx  # Payment method UI
│       └── CardPaymentForm.tsx        # Card input form
├── app/
│   ├── checkout/[bookingId]/
│   │   └── page.tsx             # Checkout page
│   └── payment/
│       ├── success/
│       │   └── page.tsx         # Payment success page
│       └── failed/
│           └── page.tsx         # Payment failed page
```

## Troubleshooting

### "Invalid API Key" Error
- Check that you've copied the correct API keys
- Ensure no extra spaces in the environment variables
- Verify keys are in `.env.local` file

### Payment Redirects Not Working
- Check redirect URLs in `paymongo.ts`
- Ensure URLs are absolute (include protocol and domain)
- Verify your app URL is correctly set

### Card Payment Fails
- Use test card numbers provided above
- Check that card details are valid
- Ensure billing information is complete

### E-Wallet Redirect Fails
- Clear browser cache and cookies
- Check if redirect URLs are accessible
- Verify payment source creation was successful

## Next Steps

1. Set up email notifications for payment confirmations
2. Implement payment refund functionality
3. Add payment history in user dashboard
4. Set up automatic reconciliation reports
5. Configure webhook handlers for real-time updates

