import type { PaymongoResource } from './client'

type Attributes = Record<string, any>

function withRaw<T extends Attributes>(resource: PaymongoResource<T>) {
  return {
    id: resource.id,
    type: resource.type,
    ...resource.attributes,
    raw: resource,
  }
}

export const transformPaymentIntent = withRaw
export const transformPaymentMethod = withRaw
export const transformPayment = withRaw
export const transformRefund = withRaw
export const transformCustomer = withRaw
export const transformGeneric = withRaw
