import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { retrievePayment } from '@/lib/paymongo/service'
import { requireUser } from '../../_utils'

type RouteParams = {
  params: { paymentId: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const payment = await retrievePayment(params.paymentId)
    return NextResponse.json({ data: payment })
  } catch (error) {
    return errorResponse(error, 'Failed to retrieve payment')
  }
}
