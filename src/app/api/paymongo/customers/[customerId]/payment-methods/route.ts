import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { listCustomerPaymentMethods } from '@/lib/paymongo/service'
import { requireUser } from '../../../_utils'

type RouteParams = {
  params: { customerId: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const methods = await listCustomerPaymentMethods(params.customerId)
    return NextResponse.json({ data: methods })
  } catch (error) {
    return errorResponse(error, 'Failed to list customer payment methods')
  }
}
