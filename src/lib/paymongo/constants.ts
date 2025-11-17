export const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1'
export const PAYMONGO_API_VERSION = '2024-03-15'
export const PAYMONGO_WEBHOOK_TOLERANCE = 5 * 60 * 1000 // 5 minutes

const secretKey = process.env.PAYMONGO_SECRET_KEY || process.env.NEXT_PUBLIC_PAYMONGO_SECRET_KEY
if (!secretKey) {
  throw new Error('PAYMONGO_SECRET_KEY is not configured. Add it to your environment before starting the server.')
}

export const PAYMONGO_SECRET_KEY = secretKey
export const PAYMONGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY ?? ''

export const PAYMONGO_ALLOWED_METHODS = [
  'card',
  'paymaya',
  'gcash',
  'grab_pay',
  'qrph',
  'billease',
] as const

export type PaymongoPaymentMethod = (typeof PAYMONGO_ALLOWED_METHODS)[number]
