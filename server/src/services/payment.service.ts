import { randomUUID } from 'node:crypto'
import { type Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.ts'
import { findAuthUserById } from './auth.service.ts'
import { createId, money } from '../utils.ts'
import type { AuthUser, Service } from '../types.ts'
import { createPendingSubscription, grantPaidMonths, normalizeMonths } from './subscription.service.ts'
import { sendSubscriptionWelcomeEmail } from './reminder.service.ts'
import { getActiveProvider, getProvider } from './payments/registry.ts'
import type { PaymentProvider, VerifyResult } from './payments/types.ts'
import { getClientUrl } from '../config.ts'
import { getPlatformFee } from './settings.service.ts'
import { evaluateCoupon, incrementCouponUsage } from './coupon.service.ts'

function generateReference(providerName: string) {
  const prefix = providerName === 'flutterwave' ? 'flw' : 'ps'
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 18)}`
}

interface FinalizeTransaction {
  amount: number
  paidAt?: string | null
  raw: unknown
}

async function finalizeSuccessfulPayment(paymentReference: string, transaction: FinalizeTransaction, user: AuthUser) {
  const payment = await prisma.payment.findUnique({
    where: { reference: paymentReference },
  })

  if (!payment) {
    return { error: 'Payment reference not found' }
  }

  if (payment.status === 'success') {
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        serviceId: payment.serviceId,
        status: { not: 'expired' },
      },
      include: { service: true },
    })

    return {
      message: 'Payment was already verified',
      payment,
      subscription: existingSubscription,
      ignored: true,
    }
  }

  const service = await prisma.service.findUnique({
    where: { id: payment.serviceId },
  })

  if (!service) {
    return { error: 'Service not found for this payment' }
  }

  const months = normalizeMonths(payment.months ?? 1)
  const totalAmount = service.price * months

  let subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      serviceId: service.id,
      status: { not: 'expired' },
    },
    include: { service: true },
  })

  if (!subscription) {
    const created = await createPendingSubscription(user, service, months)
    if ('error' in created) {
      return created
    }

    subscription = created.subscription as NonNullable<typeof subscription>
  } else {
    const granted = await grantPaidMonths(subscription.id, months)
    if ('subscription' in granted) {
      subscription = granted.subscription as NonNullable<typeof subscription>
    }
  }

  await prisma.activity.create({
    data: {
      id: createId('act'),
      userId: user.id,
      type: 'payment',
      service: `${service.name} Payment${months > 1 ? ` (${months} months)` : ''}`,
      amount: money(totalAmount),
      status: 'Completed',
      date: 'Just now',
      icon: service.icon,
    },
  })

  const updatedPayment = await prisma.payment.update({
    where: { reference: paymentReference },
    data: {
      status: 'success',
      paidAt: transaction.paidAt ? new Date(transaction.paidAt) : new Date(),
      subscriptionId: subscription.id,
      paystackResponse: transaction.raw as Prisma.InputJsonValue,
    },
  })

  if (payment.couponCode) {
    await incrementCouponUsage(payment.couponCode).catch(() => null)
  }

  await sendSubscriptionWelcomeEmail(subscription.id).catch((error) => {
    console.error('Welcome email failed:', error)
  })

  return {
    message: 'Payment verified successfully',
    payment: updatedPayment,
    subscription,
  }
}

export async function createCheckout(user: AuthUser, service: Service, monthsInput: unknown = 1, couponInput?: unknown) {
  const months = normalizeMonths(monthsInput)
  const subtotal = service.price * months
  const platformFee = await getPlatformFee()

  let discount = 0
  let couponCode: string | null = null
  if (typeof couponInput === 'string' && couponInput.trim()) {
    const evaluation = await evaluateCoupon(couponInput, subtotal)
    if (!evaluation.valid) {
      return { error: evaluation.message }
    }
    discount = evaluation.discount
    couponCode = evaluation.code
  }

  const totalAmount = Math.max(0, subtotal - discount) + platformFee

  if (totalAmount <= 0) {
    return { error: 'Nothing to pay for this order. Please review your coupon.' }
  }

  const provider = await getActiveProvider()
  const reference = generateReference(provider.name)
  const callbackUrl = `${getClientUrl()}/subscriptions/${service.slug}?reference=${reference}`

  const initialized = await provider.initialize({
    email: user.email,
    name: user.name,
    amount: totalAmount,
    currency: 'NGN',
    reference,
    callbackUrl,
    metadata: {
      userId: user.id,
      serviceId: service.id,
      serviceSlug: service.slug,
      months,
      monthlyPrice: service.price,
      provider: provider.name,
      couponCode,
      discount,
      platformFee,
    },
  })

  await prisma.payment.create({
    data: {
      id: createId('pay'),
      userId: user.id,
      serviceId: service.id,
      reference,
      gateway: provider.name,
      amount: totalAmount,
      months,
      platformFee,
      discount,
      couponCode,
      status: 'pending',
      authorizationUrl: initialized.authorizationUrl,
      accessCode: initialized.accessCode ?? null,
    },
  })

  return {
    message: `${provider.name} checkout initialized`,
    provider: provider.name,
    authorizationUrl: initialized.authorizationUrl,
    reference,
    months,
    subtotal,
    platformFee,
    discount,
    couponCode,
    amount: totalAmount,
  }
}

export async function verifyCheckout(user: AuthUser, reference: string) {
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

  const provider = getProvider(payment.gateway)
  const verification: VerifyResult = await provider.verify(reference)

  if (verification.status !== 'success') {
    await prisma.payment.update({
      where: { reference },
      data: {
        status: 'failed',
        paystackResponse: verification.raw as Prisma.InputJsonValue,
      },
    })

    return { error: `Payment is ${verification.status}` }
  }

  const service = await prisma.service.findUnique({
    where: { id: payment.serviceId },
  })

  if (!service) {
    return { error: 'Service not found for this payment' }
  }

  return finalizeSuccessfulPayment(
    reference,
    { amount: verification.amount, paidAt: verification.paidAt, raw: verification.raw },
    user,
  )
}

export async function handleWebhook(
  providerName: string,
  rawBody: string | Buffer,
  headers: Record<string, string | undefined>,
) {
  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody
  const provider: PaymentProvider = getProvider(providerName)

  const parsed = await provider.parseWebhook(payload, headers)
  if ('error' in parsed) return { error: parsed.error }
  if ('ignored' in parsed) return { ignored: true }

  const payment = await prisma.payment.findUnique({
    where: { reference: parsed.reference },
  })

  if (!payment) {
    return { error: 'Payment reference not found' }
  }

  const user = await findAuthUserById(payment.userId)
  if (!user) {
    return { error: 'User not found for payment' }
  }

  return finalizeSuccessfulPayment(
    parsed.reference,
    {
      amount: parsed.transaction.amount,
      paidAt: parsed.transaction.paidAt,
      raw: parsed.transaction.raw,
    },
    user,
  )
}
