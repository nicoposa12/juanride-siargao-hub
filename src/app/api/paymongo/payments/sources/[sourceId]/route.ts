import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { retrievePaymentSource } from '@/lib/paymongo/service'
import { requireUser } from '../../../_utils'

type RouteParams = {
  params: { sourceId: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const source = await retrievePaymentSource(params.sourceId)
    return NextResponse.json({ data: source })
  } catch (error) {
    return errorResponse(error, 'Failed to retrieve payment source')
  }
}
