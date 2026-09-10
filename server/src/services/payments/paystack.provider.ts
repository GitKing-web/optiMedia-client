import { createHmac } from 'node:crypto'
import { getPaystackCredentials } from '../settings.service.ts'
import type {
  InitializeParams,
  InitializeResult,
  PaymentProvider,
  VerifyResult,
  WebhookResult,
} from './types.ts'

const API_BASE = 'https://api.paystack.co'

type PaystackResponse<T> = { status: boolean; message: string; data: T }

type PaystackTransaction = {
  reference: string
  status: 'success' | 'failed' | 'abandoned' | 'pending' | 'reversed'
  amount: number
  currency?: string
  paid_at?: string | null
  authorization?: { access_code?: string }
  metadata?: Record<string, unknown>
}

function normalizeStatus(status: string): VerifyResult['status'] {
  if (status === 'success') return 'success'
  if (status === 'failed' || status === 'reversed') return 'failed'
  if (status === 'abandoned') return 'abandoned'
  return 'pending'
}

async function paystackFetch<T>(path: string, secretKey: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${secretKey}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const payload = (await response.json()) as PaystackResponse<T>
  if (!response.ok || !payload.status) {
    throw new Error(payload.message || 'Paystack request failed')
  }

  return payload.data
}

export const paystackProvider: PaymentProvider = {
  name: 'paystack',

  async initialize(params: InitializeParams): Promise<InitializeResult> {
    const { secretKey } = await getPaystackCredentials()
    if (!secretKey) throw new Error('Paystack secret key is not configured')

    const data = await paystackFetch<{ authorization_url: string; access_code: string; reference: string }>(
      '/transaction/initialize',
      secretKey,
      {
        method: 'POST',
        body: JSON.stringify({
          email: params.email,
          amount: Math.round(params.amount * 100),
          reference: params.reference,
          callback_url: params.callbackUrl,
          metadata: params.metadata,
        }),
      },
    )

    return {
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      providerReference: data.reference,
    }
  },

  async verify(reference: string): Promise<VerifyResult> {
    const { secretKey } = await getPaystackCredentials()
    if (!secretKey) throw new Error('Paystack secret key is not configured')

    const data = await paystackFetch<PaystackTransaction>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      secretKey,
    )

    return {
      status: normalizeStatus(data.status),
      amount: data.amount / 100,
      currency: data.currency,
      paidAt: data.paid_at || null,
      raw: data,
    }
  },

  async parseWebhook(rawBody: string, headers: Record<string, string | undefined>): Promise<WebhookResult> {
    const { secretKey } = await getPaystackCredentials()
    if (!secretKey) return { error: 'Paystack is not configured' }

    const signature = headers['x-paystack-signature']
    const digest = createHmac('sha512', secretKey).update(rawBody).digest('hex')
    if (!signature || signature !== digest) {
      return { error: 'Invalid webhook signature' }
    }

    let event: { event?: string; data?: PaystackTransaction }
    try {
      event = JSON.parse(rawBody)
    } catch {
      return { error: 'Invalid JSON payload' }
    }

    if (event.event !== 'charge.success' || !event.data) {
      return { ignored: true }
    }

    const reference = event.data.reference || String(event.data.metadata?.reference || '')
    if (!reference) return { error: 'Webhook reference missing' }

    return {
      reference,
      transaction: {
        status: 'success',
        amount: event.data.amount / 100,
        currency: event.data.currency,
        paidAt: event.data.paid_at || null,
        raw: event.data,
      },
    }
  },
}
