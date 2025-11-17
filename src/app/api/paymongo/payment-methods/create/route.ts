import { NextResponse } from 'next/server'

import { createPaymentMethod } from '@/lib/paymongo/service'
import { createPaymentMethodSchema } from '@/lib/paymongo/schemas'
import { errorResponse } from '@/lib/paymongo/errors'
import { requireUser } from '../../_utils'

export async function POST(request: Request) {
  try {
    const { user } = await requireUser()
    const payload = createPaymentMethodSchema.parse(await request.json())
    const method = await createPaymentMethod({
      ...payload,
      metadata: {
        ...payload.metadata,
        owner_id: payload.metadata?.owner_id ?? user.id,
      },
    })

    return NextResponse.json({ data: method }, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'Failed to create payment method')
  }
}
