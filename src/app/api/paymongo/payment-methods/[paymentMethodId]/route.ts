import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { retrievePaymentMethod } from '@/lib/paymongo/service'
import { requireUser } from '../../_utils'

type RouteParams = {
  params: { paymentMethodId: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const method = await retrievePaymentMethod(params.paymentMethodId)
    return NextResponse.json({ data: method })
  } catch (error) {
    return errorResponse(error, 'Failed to retrieve payment method')
  }
}
