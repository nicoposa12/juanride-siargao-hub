import { NextResponse } from 'next/server'

import { createPaymentIntent } from '@/lib/paymongo/service'
import { createPaymentIntentSchema } from '@/lib/paymongo/schemas'
import { errorResponse } from '@/lib/paymongo/errors'
import { requireUser } from '../../_utils'

export async function POST(request: Request) {
  try {
    const { user } = await requireUser()
    const payload = createPaymentIntentSchema.parse(await request.json())

    const intent = await createPaymentIntent({
      ...payload,
      metadata: {
        ...payload.metadata,
        renter_id: payload.metadata?.renter_id ?? user.id,
      },
    })

    return NextResponse.json({ data: intent }, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'Failed to create payment intent')
  }
}
