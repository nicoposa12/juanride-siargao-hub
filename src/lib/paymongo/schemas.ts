import { z } from 'zod'
import { PAYMONGO_ALLOWED_METHODS } from './constants'

const metadataSchema = z.record(z.string(), z.string()).optional()

export const createPaymentIntentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.enum(['PHP']).default('PHP').optional(),
  description: z.string().optional(),
  paymentMethodAllowed: z.array(z.enum(PAYMONGO_ALLOWED_METHODS)).nonempty(),
  statementDescriptor: z.string().max(22).optional(),
  metadata: metadataSchema,
  customerId: z.string().optional(),
  idempotencyKey: z.string().optional(),
})

export const attachPaymentIntentSchema = z.object({
  paymentMethodId: z.string(),
  clientKey: z.string().optional(),
  metadata: metadataSchema,
})

export const createPaymentMethodSchema = z.object({
  type: z.enum(PAYMONGO_ALLOWED_METHODS),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  billing: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z
      .object({
        line1: z.string().optional(),
        line2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postal_code: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
  }),
  metadata: metadataSchema,
})

export const updatePaymentMethodSchema = createPaymentMethodSchema.pick({ billing: true })

export const retrievePaymentListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  before: z.string().optional(),
  after: z.string().optional(),
  status: z
    .enum(['pending', 'paid', 'failed', 'refunded', 'expired'])
    .optional(),
})

export const createRefundSchema = z.object({
  paymentId: z.string(),
  amount: z.number().int().positive().optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer', 'others']).optional(),
  metadata: metadataSchema,
  notes: z.string().optional(),
})

export const listRefundsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  paymentId: z.string().optional(),
})

export const listPaymentIntentsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  before: z.string().optional(),
  after: z.string().optional(),
  status: z
    .enum(['awaiting_payment_method', 'processing', 'succeeded', 'failed', 'canceled'])
    .optional(),
})

export const listPaymentMethodsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  before: z.string().optional(),
  after: z.string().optional(),
  customerId: z.string().optional(),
})

export const createCustomerSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  defaultPaymentMethodId: z.string().optional(),
  metadata: metadataSchema,
})

export const updateCustomerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  defaultPaymentMethodId: z.string().optional(),
  metadata: metadataSchema,
})

export const gcashDeepLinkSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().optional(),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url().optional(),
  metadata: metadataSchema,
})
