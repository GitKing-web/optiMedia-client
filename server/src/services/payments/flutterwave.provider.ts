import { timingSafeEqual } from 'node:crypto'
import { getFlutterwaveCredentials } from '../settings.service.ts'
import type {
  InitializeParams,
  InitializeResult,
  PaymentProvider,
  VerifyResult,
  WebhookResult,
} from './types.ts'

const API_BASE = 'https://api.flutterwave.com/v3'

type FlutterwaveResponse<T> = { status: string; message: string; data: T }

type FlutterwaveTransaction = {
  id?: number
  tx_ref?: string
  status?: string
  amount?: number
  currency?: string
  created_at?: string
  customer?: { email?: string; name?: string }
  meta?: Record<string, unknown>
}

function normalizeStatus(status?: string): VerifyResult['status'] {
  if (status === 'successful' || status === 'success') return 'success'
  if (status === 'failed' || status === 'cancelled') return 'failed'
  return 'pending'
}

async function flutterwaveFetch<T>(path: string, secretKey: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${secretKey}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const payload = (await response.json()) as FlutterwaveResponse<T>
  if (!response.ok || payload.status !== 'success') {
    throw new Error(payload.message || 'Flutterwave request failed')
  }

  return payload.data
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export const flutterwaveProvider: PaymentProvider = {
  name: 'flutterwave',

  async initialize(params: InitializeParams): Promise<InitializeResult> {
    const { secretKey } = await getFlutterwaveCredentials()
    if (!secretKey) throw new Error('Flutterwave secret key is not configured')

    const data = await flutterwaveFetch<{ link: string }>('/payments', secretKey, {
      method: 'POST',
      body: JSON.stringify({
        tx_ref: params.reference,
        amount: params.amount,
        currency: params.currency || 'NGN',
        redirect_url: params.callbackUrl,
        customer: { email: params.email, name: params.name || params.email },
        customizations: { title: 'OptiMedia', description: 'Streaming subscription' },
        meta: params.metadata,
      }),
    })

    return {
      authorizationUrl: data.link,
      providerReference: params.reference,
    }
  },

  async verify(reference: string): Promise<VerifyResult> {
    const { secretKey } = await getFlutterwaveCredentials()
    if (!secretKey) throw new Error('Flutterwave secret key is not configured')

    const data = await flutterwaveFetch<FlutterwaveTransaction>(
      `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      secretKey,
    )

    return {
      status: normalizeStatus(data.status),
      amount: Number(data.amount ?? 0),
      currency: data.currency,
      paidAt: data.created_at || null,
      raw: data,
    }
  },

  async parseWebhook(rawBody: string, headers: Record<string, string | undefined>): Promise<WebhookResult> {
    const { secretHash } = await getFlutterwaveCredentials()
    if (!secretHash) return { error: 'Flutterwave secret hash is not configured' }

    const signature = headers['verif-hash'] || headers['verif_hash']
    if (!signature || !safeEqual(signature, secretHash)) {
      return { error: 'Invalid webhook signature' }
    }

    let event: { event?: string; data?: FlutterwaveTransaction }
    try {
      event = JSON.parse(rawBody)
    } catch {
      return { error: 'Invalid JSON payload' }
    }

    if (!event.data) return { ignored: true }

    const status = normalizeStatus(event.data.status)
    if (status !== 'success') {
      return { ignored: true }
    }

    const reference = event.data.tx_ref || String(event.data.meta?.reference || '')
    if (!reference) return { error: 'Webhook reference missing' }

    return {
      reference,
      transaction: {
        status: 'success',
        amount: Number(event.data.amount ?? 0),
        currency: event.data.currency,
        paidAt: event.data.created_at || null,
        raw: event.data,
      },
    }
  },
}
