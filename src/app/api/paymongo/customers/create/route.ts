import { NextResponse } from 'next/server'

import { createCustomer } from '@/lib/paymongo/service'
import { createCustomerSchema } from '@/lib/paymongo/schemas'
import { errorResponse } from '@/lib/paymongo/errors'
import { requireUser } from '../../_utils'

export async function POST(request: Request) {
  try {
    const { user } = await requireUser()
    const payload = createCustomerSchema.parse(await request.json())
    const customer = await createCustomer({
      ...payload,
      metadata: {
        ...payload.metadata,
        supabase_user_id: user.id,
      },
    })

    return NextResponse.json({ data: customer }, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'Failed to create customer')
  }
}
