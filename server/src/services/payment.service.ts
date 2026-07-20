import { createHmac, randomUUID } from 'node:crypto'
import { type Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.ts'
import { findAuthUserById } from './auth.service.ts'
import { createId, money } from '../utils.ts'
import type { AuthUser, Service } from '../types.ts'
import { createPendingSubscription } from './subscription.service.ts'

const PAYSTACK_API_BASE = 'https://api.paystack.co'

type PaystackInitializationPayload = {
  email: string
  amount: number
  reference: string
  callback_url: string
  metadata: Record<string, unknown>
}

type PaystackApiResponse<T> = {
  status: boolean
  message: string
  data: T
}

type PaystackTransaction = {
  reference: string
  status: 'success' | 'failed' | 'abandoned' | 'pending'
  amount: number
  paid_at?: string | null
  authorization?: {
    authorization_code?: string
    access_code?: string
    last4?: string
  }
  metadata?: Record<string, unknown>
  gateway_response?: string
}

type PaystackWebhookEvent = {
  event?: string
  data?: PaystackTransaction & {
    metadata?: Record<string, unknown>
  }
}

function getPaystackSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is required')
  }

  return secretKey
}

function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:3001'
}

function generateReference() {
  return `ps_${randomUUID().replace(/-/g, '').slice(0, 18)}`
}

async function paystackFetch<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${getPaystackSecretKey()}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const payload = (await response.json()) as PaystackApiResponse<T>

  if (!response.ok || !payload.status) {
    throw new Error(payload.message || 'Paystack request failed')
  }

  return payload
}

async function initializePaystackTransaction(payload: PaystackInitializationPayload) {
  return paystackFetch<{ authorization_url: string; access_code: string; reference: string }>(
    '/transaction/initialize',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

async function verifyPaystackTransaction(reference: string) {
  return paystackFetch<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`)
}

function getReferenceFromTransaction(transaction?: PaystackWebhookEvent['data']) {
  return transaction?.reference || String(transaction?.metadata?.reference || '')
}

async function finalizeSuccessfulPayment(paymentReference: string, transaction: PaystackTransaction, user: AuthUser) {
  const payment = await prisma.payment.findUnique({
    where: { reference: paymentReference },
  })

  if (!payment) {
    return { error: 'Payment reference not found' }
  }

  const service = await prisma.service.findUnique({
    where: { id: payment.serviceId },
  })

  if (!service) {
    return { error: 'Service not found for this payment' }
  }

  let subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      serviceId: service.id,
      status: { not: 'expired' },
    },
    include: { service: true },
  })

  if (!subscription) {
    const created = await createPendingSubscription(user, service)
    if ('error' in created) {
      return created
    }

    subscription = created.subscription as unknown as typeof subscription
  }

  await prisma.activity.create({
    data: {
      id: createId('act'),
      userId: user.id,
      type: 'payment',
      service: `${service.name} Payment`,
      amount: money(service.price),
      status: 'Completed',
      date: 'Just now',
      icon: service.icon,
    },
  })

  const updatedPayment = await prisma.payment.update({
    where: { reference: paymentReference },
    data: {
      status: 'success',
      paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
      subscriptionId: subscription.id,
      paystackResponse: transaction as Prisma.InputJsonValue,
    },
  })

  return {
    message: 'Payment verified successfully',
    payment: updatedPayment,
    subscription,
  }

  await prisma.activity.create({
    data: {
      id: createId('act'),
      userId: user.id,
      type: 'payment',
      service: `${service.name} Payment`,
      amount: money(service.price),
      status: 'Completed',
      date: 'Just now',
      icon: service.icon,
    },
  })

  const updatedPayment = await prisma.payment.update({
    where: { reference: paymentReference },
    data: {
      status: 'success',
      paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
      subscriptionId: subscription?.id,
      paystackResponse: transaction as Prisma.InputJsonValue,
    },
  })

  return {
    message: 'Payment verified successfully',
    payment: updatedPayment,
    subscription,
  }
}

export async function createPaystackCheckout(user: AuthUser, service: Service) {
  const reference = generateReference()
  const callbackUrl = `${getClientUrl()}/subscriptions/${service.slug}?reference=${reference}`
  const payload: PaystackInitializationPayload = {
    email: user.email,
    amount: service.price * 100,
    reference,
    callback_url: callbackUrl,
    metadata: {
      userId: user.id,
      serviceId: service.id,
      serviceSlug: service.slug,
    },
  }

  const response = await initializePaystackTransaction(payload)

  await prisma.payment.create({
    data: {
      id: createId('pay'),
      userId: user.id,
      serviceId: service.id,
      reference,
      gateway: 'paystack',
      amount: service.price,
      status: 'pending',
      authorizationUrl: response.data.authorization_url,
      accessCode: response.data.access_code,
    },
  })

  return {
    message: 'Paystack checkout initialized',
    authorizationUrl: response.data.authorization_url,
    reference: response.data.reference,
  }
}

export async function verifyPaystackCheckout(user: AuthUser, reference: string) {
  const payment = await prisma.payment.findUnique({
    where: { reference },
  })

  if (!payment) {
    return { error: 'Payment reference not found' }
  }

  if (payment.userId !== user.id) {
    return { error: 'This payment does not belong to the current user' }
  }

  if (payment.status === 'success') {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        serviceId: payment.serviceId,
        status: { not: 'expired' },
      },
      include: { service: true },
    })

    return {
      payment,
      subscription,
      message: 'Payment was already verified',
    }
  }

  const verification = await verifyPaystackTransaction(reference)
  const transaction = verification.data

  if (transaction.status !== 'success') {
    await prisma.payment.update({
      where: { reference },
      data: {
        status: 'failed',
        paystackResponse: transaction as Prisma.InputJsonValue,
      },
    })

    return { error: `Payment is ${transaction.status}` }
  }

  const service = await prisma.service.findUnique({
    where: { id: payment.serviceId },
  })

  if (!service) {
    return { error: 'Service not found for this payment' }
  }

  return finalizeSuccessfulPayment(reference, transaction, user)
}

export async function handlePaystackWebhook(event: PaystackWebhookEvent, signature?: string | null) {
  const secretKey = getPaystackSecretKey()
  const expected = createHmac('sha512', secretKey)
  const payload = JSON.stringify(event)
  expected.update(payload)
  const digest = expected.digest('hex')

  if (!signature || signature !== digest) {
    return { error: 'Invalid webhook signature' }
  }

  if (event.event !== 'charge.success') {
    return { ignored: true }
  }

  const reference = getReferenceFromTransaction(event.data)
  if (!reference) {
    return { error: 'Webhook reference missing' }
  }

  const payment = await prisma.payment.findUnique({
    where: { reference },
  })

  if (!payment) {
    return { error: 'Payment reference not found' }
  }

  const user = await findAuthUserById(payment.userId)
  if (!user) {
    return { error: 'User not found for payment' }
  }

  return finalizeSuccessfulPayment(reference, event.data || ({ reference, status: 'success', amount: payment.amount } as PaystackTransaction), user)
}
