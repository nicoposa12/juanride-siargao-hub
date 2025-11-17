import { NextResponse } from 'next/server'

import { cancelPaymentIntent } from '@/lib/paymongo/service'
import { errorResponse } from '@/lib/paymongo/errors'
import { requireUser } from '../../../_utils'

type RouteParams = {
  params: { intentId: string }
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const intent = await cancelPaymentIntent(params.intentId)
    return NextResponse.json({ data: intent })
  } catch (error) {
    return errorResponse(error, 'Failed to cancel payment intent')
  }
}
