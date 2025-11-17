import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { updatePaymentMethod } from '@/lib/paymongo/service'
import { updatePaymentMethodSchema } from '@/lib/paymongo/schemas'
import { requireUser } from '../../../_utils'

type RouteParams = {
  params: { paymentMethodId: string }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const payload = updatePaymentMethodSchema.parse(await request.json())
    const method = await updatePaymentMethod(params.paymentMethodId, payload)
    return NextResponse.json({ data: method })
  } catch (error) {
    return errorResponse(error, 'Failed to update payment method')
  }
}
