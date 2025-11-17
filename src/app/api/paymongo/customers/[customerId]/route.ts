import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { retrieveCustomer } from '@/lib/paymongo/service'
import { requireUser } from '../../_utils'

type RouteParams = {
  params: { customerId: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const customer = await retrieveCustomer(params.customerId)
    return NextResponse.json({ data: customer })
  } catch (error) {
    return errorResponse(error, 'Failed to retrieve customer')
  }
}
