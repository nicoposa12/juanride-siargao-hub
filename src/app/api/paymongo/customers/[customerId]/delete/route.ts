import { NextResponse } from 'next/server'

import { deleteCustomer } from '@/lib/paymongo/service'
import { errorResponse } from '@/lib/paymongo/errors'
import { requireUser } from '../../../_utils'

type RouteParams = {
  params: { customerId: string }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const result = await deleteCustomer(params.customerId)
    return NextResponse.json({ data: result })
  } catch (error) {
    return errorResponse(error, 'Failed to delete customer')
  }
}
