import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { updateCustomer } from '@/lib/paymongo/service'
import { updateCustomerSchema } from '@/lib/paymongo/schemas'
import { requireUser } from '../../../_utils'

type RouteParams = {
  params: { customerId: string }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const payload = updateCustomerSchema.parse(await request.json())
    const customer = await updateCustomer(params.customerId, payload)
    return NextResponse.json({ data: customer })
  } catch (error) {
    return errorResponse(error, 'Failed to update customer')
  }
}
