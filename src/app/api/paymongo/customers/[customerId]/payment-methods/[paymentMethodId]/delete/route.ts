import { NextResponse } from 'next/server'

import { deleteCustomerPaymentMethod } from '@/lib/paymongo/service'
import { errorResponse } from '@/lib/paymongo/errors'
import { requireUser } from '../../../../../_utils'

type RouteParams = {
  params: { customerId: string; paymentMethodId: string }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const result = await deleteCustomerPaymentMethod(params.customerId, params.paymentMethodId)
    return NextResponse.json({ data: result })
  } catch (error) {
    return errorResponse(error, 'Failed to delete customer payment method')
  }
}
