import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { PaymongoWebhookEvent } from '@/lib/paymongo/webhook'
import { verifyPaymongoSignature } from '@/lib/paymongo/webhook'

async function syncPaymentStatus(status: string, event: PaymongoWebhookEvent) {
  const admin = getSupabaseAdmin()
  const metadata = (event.data.attributes as any)?.metadata ?? {}
  const bookingId = metadata.booking_id ?? metadata.bookingId
  if (!bookingId) return

  const updateData = {
    status,
    transaction_id: event.data.id,
    updated_at: new Date().toISOString(),
  }

  const { error } = await (admin as any)
    .from('payments')
    .update(updateData)
    .eq('booking_id', bookingId)
  
  if (error) {
    console.error('[paymongo][webhook] failed to update payment status', error)
  }
}

async function handleEvent(event: PaymongoWebhookEvent) {
  switch (event.type) {
    case 'payment.paid':
      await syncPaymentStatus('paid', event)
      break
    case 'payment.failed':
    case 'payment.expired':
    case 'payment_intent.payment_failed':
      await syncPaymentStatus('failed', event)
      break
    case 'payment.refunded':
    case 'refund.processed':
      await syncPaymentStatus('refunded', event)
      break
    default:
      break
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get('paymongo-signature') ?? request.headers.get('Paymongo-Signature')
  const rawBody = await request.text()

  if (!verifyPaymongoSignature(rawBody, signature ?? undefined)) {
    return NextResponse.json({ error: { message: 'Invalid signature' } }, { status: 400 })
  }

  try {
    const event = JSON.parse(rawBody) as PaymongoWebhookEvent
    await handleEvent(event)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[paymongo][webhook] failed to process event', error)
    return NextResponse.json({ error: { message: 'Webhook processing failed' } }, { status: 500 })
  }
}
