import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { retrievePaymentIntent } from '@/lib/paymongo/service'
import { requireUser } from '../../_utils'

type RouteParams = {
  params: { intentId: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const intent = await retrievePaymentIntent(params.intentId)
    return NextResponse.json({ data: intent })
  } catch (error) {
    return errorResponse(error, 'Failed to retrieve payment intent')
  }
}
