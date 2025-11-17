import crypto from 'node:crypto'
import { PAYMONGO_SECRET_KEY, PAYMONGO_WEBHOOK_TOLERANCE } from './constants'

export type PaymongoEventType =
  | 'payment.paid'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.expired'
  | 'refund.processed'
  | 'payment_intent.payment_failed'
  | 'source.chargeable'

export interface PaymongoWebhookEvent<TAttributes = Record<string, unknown>> {
  id: string
  type: PaymongoEventType
  data: {
    id: string
    type: string
    attributes: TAttributes
  }
}

export function verifyPaymongoSignature(body: string, signatureHeader?: string): boolean {
  if (!signatureHeader) return false
  const parts = signatureHeader.split(',').map((part) => part.split('='))
  const timestamp = parts.find(([key]) => key === 't')?.[1]
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value)

  if (!timestamp || signatures.length === 0) {
    return false
  }

  const payload = `${timestamp}.${body}`
  const expected = crypto.createHmac('sha256', PAYMONGO_SECRET_KEY ?? '').update(payload).digest('hex')

  // Reject if timestamp too old
  const timestampMs = Number(timestamp) * 1000
  if (Number.isFinite(timestampMs)) {
    const now = Date.now()
    if (Math.abs(now - timestampMs) > PAYMONGO_WEBHOOK_TOLERANCE) {
      return false
    }
  }

  return signatures.some((signature) => crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
}
