import { randomUUID } from 'node:crypto'
import { type Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.ts'
import { findAuthUserById } from './auth.service.ts'
import { createId, money } from '../utils.ts'
import type { AuthUser, Service } from '../types.ts'
import { normalizeMonths } from './subscription.service.ts'
import { sendSubscriptionWelcomeEmail } from './reminder.service.ts'
import { getActiveProvider, getProvider } from './payments/registry.ts'
import type { PaymentProvider, VerifyResult } from './payments/types.ts'
import { getClientUrl } from '../config.ts'
import { getPlatformFee } from './settings.service.ts'
import { evaluateCoupon, recordCouponRedemption } from './coupon.service.ts'

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
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({ where: { reference: paymentReference } })
        if (!payment) return { error: 'Payment reference not found' }
        if (payment.userId !== user.id) return { error: 'This payment does not belong to the current user' }

        if (payment.status === 'success') {
          if (!payment.subscriptionId) {
            return { error: 'Payment was received but subscription fulfillment is incomplete. Please contact support with your payment reference.' }
          }
          const subscription = await tx.subscription.findUnique({
            where: { id: payment.subscriptionId }, include: { service: true },
          })
          return { message: 'Payment was already verified', payment, subscription, ignored: true }
        }

        if (!Number.isFinite(transaction.amount) || transaction.amount + 0.5 < payment.amount) {
          return { error: `Payment amount mismatch (expected ${payment.amount}, received ${transaction.amount})` }
        }
        const service = await tx.service.findUnique({ where: { id: payment.serviceId } })
        if (!service) return { error: 'Service not found for this payment' }

        const existing = await tx.subscription.findUnique({
          where: { userId_serviceId: { userId: user.id, serviceId: service.id } },
        })
        const months = normalizeMonths(payment.months)
        const now = new Date()
        const extending = existing?.status === 'active' && existing.nextBilling && existing.nextBilling > now
        const base = extending ? existing.nextBilling! : now
        const data = {
          status: 'active' as const,
          price: service.price,
          months: extending ? existing.months + months : months,
          durationDays: extending ? (existing.durationDays || 0) + months * 30 : months * 30,
          activeDate: extending ? existing.activeDate || now : now,
          nextBilling: new Date(base.getTime() + months * 30 * 24 * 60 * 60 * 1000),
          reminder3dSentAt: null,
          expiryNoticeSentAt: null,
          welcomeEmailSentAt: null,
        }
        const subscription = existing
          ? await tx.subscription.update({ where: { id: existing.id }, data, include: { service: true } })
          : await tx.subscription.create({
              data: { ...data, id: createId('sub'), userId: user.id, serviceId: service.id, icon: service.icon, bg: service.bg },
              include: { service: true },
            })

        await tx.activity.create({
          data: {
            id: createId('act'), userId: user.id, type: 'payment',
            service: `${service.name} Payment${months > 1 ? ` (${months} months)` : ''}`,
            amount: money(payment.amount), status: 'Completed', date: 'Just now', icon: service.icon,
          },
        })
        if (payment.couponCode) {
          await recordCouponRedemption(payment.couponCode, user.id, paymentReference, tx)
        }
        const updatedPayment = await tx.payment.update({
          where: { reference: paymentReference },
          data: {
            status: 'success', subscriptionId: subscription.id,
            paidAt: transaction.paidAt ? new Date(transaction.paidAt) : now,
            paystackResponse: transaction.raw as Prisma.InputJsonValue,
          },
        })
        return { message: 'Payment verified successfully', payment: updatedPayment, subscription }
      }, { isolationLevel: 'Serializable' })

      if ('subscription' in result && result.subscription && !('ignored' in result)) {
        await sendSubscriptionWelcomeEmail(result.subscription.id).catch((error) => {
          console.error('Welcome email failed:', error)
        })
      }
      return result
    } catch (error) {
      if (attempt < 3 && (error as { code?: string }).code === 'P2034') continue
      throw error
    }
  }
}

export async function createCheckout(user: AuthUser, service: Service, monthsInput: unknown = 1, couponInput?: unknown) {
  const months = normalizeMonths(monthsInput)
  const subtotal = service.price * months
  const platformFee = await getPlatformFee()

  let discount = 0
  let couponCode: string | null = null
  if (typeof couponInput === 'string' && couponInput.trim()) {
    const evaluation = await evaluateCoupon(couponInput, subtotal, user.id)
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
    return finalizeSuccessfulPayment(reference, { amount: payment.amount, raw: payment.paystackResponse }, user)
  }

  const provider = getProvider(payment.gateway)
  const verification: VerifyResult = await provider.verify(reference)

  if (verification.status !== 'success') {
    const isDefinitiveFailure = verification.status === 'failed' || verification.status === 'abandoned'

    await prisma.payment.updateMany({
      where: { reference, status: { not: 'success' } },
      data: {
        ...(isDefinitiveFailure ? { status: 'failed' } : {}),
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
