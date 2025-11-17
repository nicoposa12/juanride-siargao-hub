import { NextResponse } from 'next/server'

import { createGcashDeepLink } from '@/lib/paymongo/service'
import { gcashDeepLinkSchema } from '@/lib/paymongo/schemas'
import { errorResponse } from '@/lib/paymongo/errors'
import { requireUser } from '../../_utils'

export async function POST(request: Request) {
  try {
    await requireUser()
    const payload = gcashDeepLinkSchema.parse(await request.json())
    const source = await createGcashDeepLink(payload)
    return NextResponse.json({ data: source }, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'Failed to create GCash deep link')
  }
}
