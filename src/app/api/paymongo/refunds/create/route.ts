import { NextResponse } from 'next/server'

import { createRefund } from '@/lib/paymongo/service'
import { createRefundSchema } from '@/lib/paymongo/schemas'
import { errorResponse } from '@/lib/paymongo/errors'
import { requireUser } from '../../_utils'

export async function POST(request: Request) {
  try {
    await requireUser()
    const payload = createRefundSchema.parse(await request.json())
    const refund = await createRefund(payload)
    return NextResponse.json({ data: refund }, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'Failed to create refund')
  }
}
