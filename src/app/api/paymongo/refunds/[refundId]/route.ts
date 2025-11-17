import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { retrieveRefund } from '@/lib/paymongo/service'
import { requireUser } from '../../_utils'

type RouteParams = {
  params: { refundId: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const refund = await retrieveRefund(params.refundId)
    return NextResponse.json({ data: refund })
  } catch (error) {
    return errorResponse(error, 'Failed to retrieve refund')
  }
}
