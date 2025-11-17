'use client'

import { useState } from 'react'

const formatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

type RequestConfig = {
  path: string
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  query?: Record<string, string>
}

async function callApi({ path, method = 'GET', body, query }: RequestConfig) {
  const searchParams = query
    ? `?${new URLSearchParams(Object.entries(query).filter(([, value]) => value))}`
    : ''
  const response = await fetch(`/api/paymongo/${path}${searchParams}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Request failed')
  }

  return payload
}

type WorkflowLog = {
  step: string
  status: 'pending' | 'success' | 'error'
  data?: unknown
  error?: string
}

export default function PaymongoTesterPage() {
  const [intentAmount, setIntentAmount] = useState(100)
  const [intentDescription, setIntentDescription] = useState('Manual test booking')
  const [intentId, setIntentId] = useState('')
  const [intentListLimit, setIntentListLimit] = useState(5)
  const [intentStatusFilter, setIntentStatusFilter] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [gcashAmount, setGcashAmount] = useState(100)
  const [gcashReturnUrl, setGcashReturnUrl] = useState('https://example.com/success')
  const [paymentMethodLimit, setPaymentMethodLimit] = useState(5)
  const [paymentMethodCustomerId, setPaymentMethodCustomerId] = useState('')
  const [logs, setLogs] = useState('No requests yet.')
  const [pending, setPending] = useState(false)

  // PIPM Workflow states
  const [pipmAmount, setPipmAmount] = useState(100)
  const [pipmDescription, setPipmDescription] = useState('PIPM Workflow Test')
  const [pipmCardNumber, setPipmCardNumber] = useState('4343434343434345')
  const [pipmCardExpMonth, setPipmCardExpMonth] = useState('12')
  const [pipmCardExpYear, setPipmCardExpYear] = useState('25')
  const [pipmCardCvc, setPipmCardCvc] = useState('123')
  const [pipmBillingName, setPipmBillingName] = useState('Juan Dela Cruz')
  const [pipmBillingEmail, setPipmBillingEmail] = useState('juan@example.com')
  const [pipmBillingPhone, setPipmBillingPhone] = useState('+639171234567')
  const [pipmWorkflowLogs, setPipmWorkflowLogs] = useState<WorkflowLog[]>([])

  const run = async (action: () => Promise<unknown>) => {
    setPending(true)
    try {
      const result = await action()
      setLogs(JSON.stringify(result, null, 2))
    } catch (error) {
      setLogs(String((error as Error).message))
    } finally {
      setPending(false)
    }
  }

  const handlePipmWorkflow = async () => {
    setPending(true)
    setPipmWorkflowLogs([])
    const workflowLogs: WorkflowLog[] = []

    const addLog = (step: string, status: WorkflowLog['status'], data?: unknown, error?: string) => {
      const log: WorkflowLog = { step, status, data, error }
      workflowLogs.push(log)
      setPipmWorkflowLogs([...workflowLogs])
    }

    try {
      // Step 1: Create Payment Intent
      addLog('Creating Payment Intent', 'pending')
      const intentResponse = await callApi({
        path: 'payment-intents/create',
        method: 'POST',
        body: {
          amount: Math.round(pipmAmount * 100),
          description: pipmDescription,
          paymentMethodAllowed: ['card', 'gcash'],
        },
      })
      const createdIntent = intentResponse.data
      addLog('Creating Payment Intent', 'success', createdIntent)

      // Step 2: Create a new payment method
      // Note: PayMongo doesn't support listing payment methods without a customer context
      addLog('Creating payment method', 'pending')
      const paymentMethodResponse = await callApi({
        path: 'payment-methods/create',
        method: 'POST',
        body: {
          type: 'card',
          details: {
            card_number: pipmCardNumber,
            exp_month: Number(pipmCardExpMonth),
            exp_year: Number(pipmCardExpYear),
            cvc: pipmCardCvc,
          },
          billing: {
            name: pipmBillingName,
            email: pipmBillingEmail,
            phone: pipmBillingPhone,
          },
        },
      })
      const createdMethod = paymentMethodResponse.data
      const paymentMethodId = createdMethod.id
      addLog('Creating payment method', 'success', createdMethod)

      // Step 3: Attach payment method to intent
      addLog('Attaching payment method to intent', 'pending')
      const attachResponse = await callApi({
        path: `payment-intents/${createdIntent.id}/attach`,
        method: 'POST',
        body: {
          paymentMethodId,
        },
      })
      addLog('Attaching payment method to intent', 'success', attachResponse.data)

      // Final summary
      setLogs(
        JSON.stringify(
          {
            success: true,
            summary: {
              intentId: createdIntent.id,
              paymentMethodId,
              amount: pipmAmount,
              status: attachResponse.data.status,
            },
            fullWorkflow: workflowLogs,
          },
          null,
          2
        )
      )
    } catch (error) {
      const errorMessage = (error as Error).message
      addLog('Workflow failed', 'error', undefined, errorMessage)
      setLogs(
        JSON.stringify(
          {
            success: false,
            error: errorMessage,
            completedSteps: workflowLogs,
          },
          null,
          2
        )
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-3xl font-semibold">PayMongo Controller Tester</h1>
        <p className="text-sm text-muted-foreground">
          Use these utilities to manually call the new /api/paymongo routes. All requests use your current
          Supabase session cookie, so log in first if a 401 is returned.
        </p>
      </header>

      {/* PIPM Workflow Section */}
      <section className="rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
        <h2 className="text-xl font-semibold text-blue-900">🚀 PIPM Workflow (Payment Intent + Payment Method)</h2>
        <p className="mt-1 text-sm text-blue-700">
          Complete workflow: Create intent → Create payment method → Attach to intent
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Amount (PHP)
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1"
              value={pipmAmount}
              step="0.01"
              min="0"
              onChange={(event) => setPipmAmount(Number(event.target.value))}
            />
          </label>
          <label className="text-sm">
            Description
            <input
              type="text"
              className="mt-1 w-full rounded border px-2 py-1"
              value={pipmDescription}
              onChange={(event) => setPipmDescription(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-3 rounded border border-blue-300 bg-white p-3">
          <h3 className="text-sm font-medium text-blue-900">Card Details</h3>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Card Number
              <input
                type="text"
                className="mt-1 w-full rounded border px-2 py-1"
                value={pipmCardNumber}
                onChange={(event) => setPipmCardNumber(event.target.value)}
                placeholder="4343434343434345"
              />
            </label>
            <label className="text-sm">
              Billing Name
              <input
                type="text"
                className="mt-1 w-full rounded border px-2 py-1"
                value={pipmBillingName}
                onChange={(event) => setPipmBillingName(event.target.value)}
              />
            </label>
            <label className="text-sm">
              Exp Month
              <input
                type="text"
                className="mt-1 w-full rounded border px-2 py-1"
                value={pipmCardExpMonth}
                onChange={(event) => setPipmCardExpMonth(event.target.value)}
                placeholder="12"
              />
            </label>
            <label className="text-sm">
              Exp Year
              <input
                type="text"
                className="mt-1 w-full rounded border px-2 py-1"
                value={pipmCardExpYear}
                onChange={(event) => setPipmCardExpYear(event.target.value)}
                placeholder="25"
              />
            </label>
            <label className="text-sm">
              CVC
              <input
                type="text"
                className="mt-1 w-full rounded border px-2 py-1"
                value={pipmCardCvc}
                onChange={(event) => setPipmCardCvc(event.target.value)}
                placeholder="123"
              />
            </label>
            <label className="text-sm">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded border px-2 py-1"
                value={pipmBillingEmail}
                onChange={(event) => setPipmBillingEmail(event.target.value)}
              />
            </label>
            <label className="text-sm md:col-span-2">
              Phone
              <input
                type="tel"
                className="mt-1 w-full rounded border px-2 py-1"
                value={pipmBillingPhone}
                onChange={(event) => setPipmBillingPhone(event.target.value)}
              />
            </label>
          </div>
        </div>

        <button
          className="mt-4 rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={pending}
          onClick={handlePipmWorkflow}
        >
          {pending ? 'Running Workflow...' : `Run PIPM Workflow (${formatter.format(pipmAmount)})`}
        </button>

        {pipmWorkflowLogs.length > 0 && (
          <div className="mt-4 rounded border border-blue-300 bg-white p-3">
            <h3 className="text-sm font-medium text-blue-900">Workflow Progress</h3>
            <div className="mt-2 space-y-2">
              {pipmWorkflowLogs.map((log, index) => {
                const dataString = log.data ? JSON.stringify(log.data, null, 2) : null
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2 rounded border p-2 text-sm ${
                      log.status === 'success'
                        ? 'border-green-300 bg-green-50'
                        : log.status === 'error'
                          ? 'border-red-300 bg-red-50'
                          : 'border-yellow-300 bg-yellow-50'
                    }`}
                  >
                    <span className="text-lg">
                      {log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⏳'}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{log.step}</div>
                      {log.error && <div className="text-red-700">{log.error}</div>}
                      {dataString && (
                        <pre className="mt-1 max-h-32 overflow-auto text-xs">{dataString}</pre>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-medium">Create Payment Intent</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Amount (PHP)
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1"
              value={intentAmount}
              step="0.01"
              min="0"
              onChange={(event) => setIntentAmount(Number(event.target.value))}
            />
          </label>
          <label className="text-sm">
            Description
            <input
              type="text"
              className="mt-1 w-full rounded border px-2 py-1"
              value={intentDescription}
              onChange={(event) => setIntentDescription(event.target.value)}
            />
          </label>
        </div>
        <button
          className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
          disabled={pending}
          onClick={() =>
            run(() =>
              callApi({
                path: 'payment-intents/create',
                method: 'POST',
                body: {
                  amount: Math.round(intentAmount * 100),
                  description: intentDescription,
                  paymentMethodAllowed: ['gcash', 'card'],
                },
              })
            )
          }
        >
          {pending ? 'Sending…' : `Create Intent (${formatter.format(intentAmount)})`}
        </button>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-medium">List Payment Intents</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            Limit
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1"
              min={1}
              max={50}
              value={intentListLimit}
              onChange={(event) => setIntentListLimit(Number(event.target.value))}
            />
          </label>
          <label className="text-sm md:col-span-2">
            Status (optional)
            <input
              type="text"
              className="mt-1 w-full rounded border px-2 py-1"
              placeholder="processing, succeeded, etc."
              value={intentStatusFilter}
              onChange={(event) => setIntentStatusFilter(event.target.value)}
            />
          </label>
        </div>
        <button
          className="mt-4 rounded bg-secondary px-4 py-2 text-secondary-foreground disabled:opacity-60"
          disabled={pending}
          onClick={() =>
            run(() => {
              const query: Record<string, string> = {
                limit: String(intentListLimit),
              }
              if (intentStatusFilter) {
                query.status = intentStatusFilter
              }

              return callApi({
                path: 'payment-intents/list',
                query,
              })
            })
          }
        >
          Fetch Intents
        </button>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-medium">Retrieve Payment Intent</h2>
        <label className="text-sm">
          Intent ID
          <input
            type="text"
            className="mt-1 w-full rounded border px-2 py-1"
            value={intentId}
            onChange={(event) => setIntentId(event.target.value)}
            placeholder="pi_..."
          />
        </label>
        <button
          className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
          disabled={!intentId || pending}
          onClick={() => run(() => callApi({ path: `payment-intents/${intentId}` }))}
        >
          Fetch Intent
        </button>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-medium">Retrieve Payment</h2>
        <label className="text-sm">
          Payment ID
          <input
            type="text"
            className="mt-1 w-full rounded border px-2 py-1"
            value={paymentId}
            onChange={(event) => setPaymentId(event.target.value)}
            placeholder="pay_..."
          />
        </label>
        <button
          className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
          disabled={!paymentId || pending}
          onClick={() => run(() => callApi({ path: `payments/${paymentId}` }))}
        >
          Fetch Payment
        </button>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-medium">GCash Deep Link</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Amount (PHP)
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1"
              value={gcashAmount}
              step="0.01"
              min="0"
              onChange={(event) => setGcashAmount(Number(event.target.value))}
            />
          </label>
          <label className="text-sm">
            Return URL
            <input
              type="url"
              className="mt-1 w-full rounded border px-2 py-1"
              value={gcashReturnUrl}
              onChange={(event) => setGcashReturnUrl(event.target.value)}
            />
          </label>
        </div>
        <button
          className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
          disabled={pending}
          onClick={() =>
            run(() =>
              callApi({
                path: 'gcash/deeplink',
                method: 'POST',
                body: { amount: Math.round(gcashAmount * 100), returnUrl: gcashReturnUrl },
              })
            )
          }
        >
          Create Deep Link
        </button>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-medium">List Latest Payments</h2>
        <button
          className="mt-2 rounded bg-secondary px-4 py-2 text-secondary-foreground disabled:opacity-60"
          disabled={pending}
          onClick={() => run(() => callApi({ path: 'payments/list', query: { limit: '5' } }))}
        >
          Refresh
        </button>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-medium">List Payment Methods</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            Limit
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1"
              min={1}
              max={50}
              value={paymentMethodLimit}
              onChange={(event) => setPaymentMethodLimit(Number(event.target.value))}
            />
          </label>
          <label className="text-sm md:col-span-2">
            Customer ID (optional)
            <input
              type="text"
              className="mt-1 w-full rounded border px-2 py-1"
              placeholder="cust_..."
              value={paymentMethodCustomerId}
              onChange={(event) => setPaymentMethodCustomerId(event.target.value)}
            />
          </label>
        </div>
        <button
          className="mt-4 rounded bg-secondary px-4 py-2 text-secondary-foreground disabled:opacity-60"
          disabled={pending}
          onClick={() =>
            run(() => {
              const query: Record<string, string> = {
                limit: String(paymentMethodLimit),
              }
              if (paymentMethodCustomerId) {
                query.customerId = paymentMethodCustomerId
              }

              return callApi({
                path: 'payment-methods/list',
                query,
              })
            })
          }
        >
          Fetch Methods
        </button>
      </section>

      <section className="rounded-lg border bg-muted p-4">
        <h2 className="text-xl font-medium">Response Log</h2>
        <pre className="mt-2 max-h-96 overflow-auto rounded bg-background p-4 text-xs">
          {logs}
        </pre>
      </section>
    </div>
  )
}
