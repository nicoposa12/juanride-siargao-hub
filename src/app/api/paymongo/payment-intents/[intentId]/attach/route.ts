import { NextResponse } from 'next/server'

import { attachPaymentIntent } from '@/lib/paymongo/service'
import { attachPaymentIntentSchema } from '@/lib/paymongo/schemas'
import { errorResponse } from '@/lib/paymongo/errors'
import { requireUser } from '../../../_utils'

type RouteParams = {
  params: { intentId: string }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const payload = attachPaymentIntentSchema.parse(await request.json())
    const result = await attachPaymentIntent(params.intentId, payload)
    return NextResponse.json({ data: result })
  } catch (error) {
    return errorResponse(error, 'Failed to attach payment method to intent')
  }
}
