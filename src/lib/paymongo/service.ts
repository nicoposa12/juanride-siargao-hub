import type { z } from 'zod'

import { paymongoRequest, type PaymongoResource, type PaymongoResponse } from './client'
import {
  attachPaymentIntentSchema,
  createCustomerSchema,
  createPaymentIntentSchema,
  createPaymentMethodSchema,
  createRefundSchema,
  gcashDeepLinkSchema,
  listRefundsSchema,
  listPaymentIntentsSchema,
  listPaymentMethodsSchema,
  retrievePaymentListSchema,
  updateCustomerSchema,
  updatePaymentMethodSchema,
} from './schemas'
import {
  transformCustomer,
  transformGeneric,
  transformPayment,
  transformPaymentIntent,
  transformPaymentMethod,
  transformRefund,
} from './transformers'

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>
export type AttachPaymentIntentInput = z.infer<typeof attachPaymentIntentSchema>
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>
export type PaymentListQuery = z.infer<typeof retrievePaymentListSchema>
export type CreateRefundInput = z.infer<typeof createRefundSchema>
export type RefundListQuery = z.infer<typeof listRefundsSchema>
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type GcashDeepLinkInput = z.infer<typeof gcashDeepLinkSchema>
export type PaymentIntentListQuery = z.infer<typeof listPaymentIntentsSchema>
export type PaymentMethodListQuery = z.infer<typeof listPaymentMethodsSchema>

const extractData = <T extends PaymongoResource | PaymongoResource[]>(response: PaymongoResponse<T>) => response.data

export async function createPaymentIntent(input: CreatePaymentIntentInput) {
  const body = {
    data: {
      attributes: {
        amount: input.amount,
        payment_method_allowed: input.paymentMethodAllowed,
        currency: input.currency ?? 'PHP',
        description: input.description,
        statement_descriptor: input.statementDescriptor,
        metadata: input.metadata,
        customer_id: input.customerId,
      },
    },
  }

  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>('/payment_intents', {
    method: 'POST',
    body,
    idempotencyKey: input.idempotencyKey,
  })

  return transformPaymentIntent(extractData(response))
}

export async function retrievePaymentIntent(intentId: string) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>(`/payment_intents/${intentId}`)
  return transformPaymentIntent(extractData(response))
}

export async function attachPaymentIntent(intentId: string, input: AttachPaymentIntentInput) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>(
    `/payment_intents/${intentId}/attach`,
    {
      method: 'POST',
      body: {
        data: {
          attributes: {
            payment_method: input.paymentMethodId,
            metadata: input.metadata,
            client_key: input.clientKey,
          },
        },
      },
    }
  )

  return transformPaymentIntent(extractData(response))
}

export async function cancelPaymentIntent(intentId: string) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>(
    `/payment_intents/${intentId}/cancel`,
    { method: 'POST' }
  )
  return transformPaymentIntent(extractData(response))
}

export async function createPaymentMethod(input: CreatePaymentMethodInput) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>('/payment_methods', {
    method: 'POST',
    body: {
      data: {
        attributes: {
          type: input.type,
          details: input.details,
          billing: input.billing,
          metadata: input.metadata,
        },
      },
    },
  })

  return transformPaymentMethod(extractData(response))
}

export async function retrievePaymentMethod(paymentMethodId: string) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>(`/payment_methods/${paymentMethodId}`)
  return transformPaymentMethod(extractData(response))
}

export async function updatePaymentMethod(paymentMethodId: string, input: UpdatePaymentMethodInput) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>(`/payment_methods/${paymentMethodId}`, {
    method: 'PATCH',
    body: {
      data: {
        attributes: {
          billing: input.billing,
        },
      },
    },
  })

  return transformPaymentMethod(extractData(response))
}

export async function retrievePayment(paymentId: string) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>(`/payments/${paymentId}`)
  return transformPayment(extractData(response))
}

export async function listPayments(query: PaymentListQuery) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource[]>>('/payments', {
    searchParams: {
      limit: query.limit,
      before: query.before,
      after: query.after,
      status: query.status,
    },
  })

  return extractData(response).map(transformPayment)
}

export async function listPaymentIntents(query: PaymentIntentListQuery) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource[]>>('/payment_intents', {
    searchParams: {
      limit: query.limit,
      before: query.before,
      after: query.after,
      status: query.status,
    },
  })

  return extractData(response).map(transformPaymentIntent)
}

export async function retrievePaymentSource(sourceId: string) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>(`/sources/${sourceId}`)
  return transformGeneric(extractData(response))
}

export async function createRefund(input: CreateRefundInput) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>('/refunds', {
    method: 'POST',
    body: {
      data: {
        attributes: {
          payment_id: input.paymentId,
          amount: input.amount,
          reason: input.reason,
          notes: input.notes,
          metadata: input.metadata,
        },
      },
    },
  })

  return transformRefund(extractData(response))
}

export async function retrieveRefund(refundId: string) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>(`/refunds/${refundId}`)
  return transformRefund(extractData(response))
}

export async function listRefunds(query: RefundListQuery) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource[]>>('/refunds', {
    searchParams: {
      limit: query.limit,
      payment_id: query.paymentId,
    },
  })

  return extractData(response).map(transformRefund)
}

export async function createCustomer(input: CreateCustomerInput) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>('/customers', {
    method: 'POST',
    body: {
      data: {
        attributes: {
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          phone: input.phone,
          default_payment_method_id: input.defaultPaymentMethodId,
          metadata: input.metadata,
        },
      },
    },
  })

  return transformCustomer(extractData(response))
}

export async function retrieveCustomer(customerId: string) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>(`/customers/${customerId}`)
  return transformCustomer(extractData(response))
}

export async function updateCustomer(customerId: string, input: UpdateCustomerInput) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>(`/customers/${customerId}`, {
    method: 'PATCH',
    body: {
      data: {
        attributes: {
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          phone: input.phone,
          default_payment_method_id: input.defaultPaymentMethodId,
          metadata: input.metadata,
        },
      },
    },
  })

  return transformCustomer(extractData(response))
}

export async function deleteCustomer(customerId: string) {
  await paymongoRequest(`/customers/${customerId}`, { method: 'DELETE' })
  return { id: customerId, deleted: true }
}

export async function listCustomerPaymentMethods(customerId: string) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource[]>>(
    `/customers/${customerId}/payment_methods`
  )
  return extractData(response).map(transformPaymentMethod)
}

export async function deleteCustomerPaymentMethod(customerId: string, paymentMethodId: string) {
  await paymongoRequest(`/customers/${customerId}/payment_methods/${paymentMethodId}`, { method: 'DELETE' })
  return { id: paymentMethodId, deleted: true }
}

export async function createGcashDeepLink(input: GcashDeepLinkInput) {
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource>>('/sources', {
    method: 'POST',
    body: {
      data: {
        attributes: {
          type: 'gcash',
          amount: input.amount,
          currency: 'PHP',
          redirect: {
            success: input.returnUrl,
            failed: input.cancelUrl ?? input.returnUrl,
          },
          metadata: input.metadata,
          statement_descriptor: input.description,
        },
      },
    },
  })

  return transformGeneric(extractData(response))
}

export async function listPaymentMethods(query: PaymentMethodListQuery) {
  const searchParams: Record<string, string | number | undefined> = {
    limit: query.limit,
    before: query.before,
    after: query.after,
  }
  if (query.customerId) {
    searchParams['customer_id'] = query.customerId
  }
  const response = await paymongoRequest<PaymongoResponse<PaymongoResource[]>>('/payment_methods', {
    searchParams,
  })
  return extractData(response).map(transformPaymentMethod)
}
