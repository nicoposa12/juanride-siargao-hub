import { PAYMONGO_API_BASE, PAYMONGO_API_VERSION, PAYMONGO_SECRET_KEY } from './constants'
import { PaymongoApiError } from './errors'

export interface PaymongoResource<TAttributes = Record<string, unknown>> {
  id: string
  type: string
  attributes: TAttributes
  relationships?: Record<string, unknown>
}

export interface PaymongoResponse<T extends PaymongoResource | PaymongoResource[]> {
  data: T
  has_more?: boolean
  links?: Record<string, string>
}

export interface PaymongoRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  idempotencyKey?: string
  searchParams?: Record<string, string | number | undefined>
}

const AUTH_HEADER = `Basic ${Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64')}`

function buildUrl(path: string, searchParams?: Record<string, string | number | undefined>) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${PAYMONGO_API_BASE}${normalized}`)
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      url.searchParams.set(key, String(value))
    })
  }
  return url.toString()
}

async function doFetch<T>(path: string, init: PaymongoRequestOptions = {}, attempt = 0): Promise<T> {
  const { idempotencyKey, searchParams, headers, body, ...rest } = init
  const url = buildUrl(path, searchParams)
  const response = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Paymongo-Version': PAYMONGO_API_VERSION,
      Authorization: AUTH_HEADER,
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...headers,
    },
    body: typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined,
  })

  if (response.ok) {
    if (response.status === 204) {
      return undefined as T
    }
    return (await response.json()) as T
  }

  if ([429, 500, 502, 503, 504].includes(response.status) && attempt === 0) {
    await new Promise((resolve) => setTimeout(resolve, 300 * Math.pow(2, attempt)))
    return doFetch(path, init, attempt + 1)
  }

  let payload: any
  try {
    payload = await response.json()
  } catch (error) {
    payload = undefined
  }

  throw new PaymongoApiError(response.status, payload)
}

export async function paymongoRequest<T extends PaymongoResponse<any> | Record<string, unknown>>(
  path: string,
  init?: PaymongoRequestOptions
): Promise<T> {
  return doFetch<T>(path, init)
}
