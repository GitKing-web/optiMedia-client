import { beforeEach, expect, mock, test } from 'bun:test'

let state: any
let failActivity = false
let conflicts = 0
const service = { id: 'svc', name: 'Music', price: 1000, icon: 'music', bg: '' }
const user = { id: 'user', email: 'user@example.com' } as any
const tx = {
  payment: {
    findUnique: async () => state.payment,
    update: async ({ data }: any) => (state.payment = { ...state.payment, ...data }),
  },
  service: { findUnique: async () => service },
  subscription: {
    findUnique: async () => state.subscription,
    update: async ({ data }: any) => (state.subscription = { ...state.subscription, ...data, service }),
    create: async ({ data }: any) => (state.subscription = { ...data, service }),
  },
  activity: { create: async ({ data }: any) => {
    if (failActivity) throw new Error('activity failed')
    state.activities.push(data)
  } },
}
mock.module('../db/prisma.ts', () => ({ prisma: {
  ...tx,
  $transaction: async (fn: any, options: any) => {
    expect(options.isolationLevel).toBe('Serializable')
    if (conflicts > 0) { conflicts--; throw Object.assign(new Error('conflict'), { code: 'P2034' }) }
    const snapshot = structuredClone(state)
    try { return await fn(tx) } catch (error) { state = snapshot; throw error }
  },
} }))
mock.module('./auth.service.ts', () => ({ findAuthUserById: async () => user }))
mock.module('./reminder.service.ts', () => ({ sendSubscriptionWelcomeEmail: async () => {} }))
mock.module('../config.ts', () => ({ getClientUrl: () => 'http://localhost' }))
mock.module('./settings.service.ts', () => ({ getPlatformFee: async () => 0 }))
mock.module('./payments/registry.ts', () => ({
  getProvider: () => ({ verify: async () => ({ status: 'success', amount: 1000, raw: {} }) }),
  getActiveProvider: async () => ({}),
}))
const { verifyCheckout } = await import('./payment.service.ts')

beforeEach(() => {
  failActivity = false
  conflicts = 0
  state = {
    payment: { reference: 'ref', userId: 'user', serviceId: 'svc', status: 'pending', amount: 1000, months: 1, gateway: 'paystack', subscriptionId: null },
    subscription: { id: 'sub', status: 'expired', months: 1, durationDays: 30, activeDate: new Date('2020-01-01'), nextBilling: new Date('2020-01-31'), reminder3dSentAt: new Date(), expiryNoticeSentAt: new Date() },
    activities: [],
  }
})

test('expired renewal reuses the subscription and grants a fresh 30 days', async () => {
  const before = Date.now()
  await verifyCheckout(user, 'ref')
  expect(state.subscription.id).toBe('sub')
  expect(state.subscription.status).toBe('active')
  expect(state.subscription.nextBilling.getTime()).toBeGreaterThanOrEqual(before + 30 * 86400000)
  expect(state.subscription.reminder3dSentAt).toBeNull()
  expect(state.subscription.expiryNoticeSentAt).toBeNull()
  expect(state.payment.subscriptionId).toBe('sub')
  expect(state.payment.status).toBe('success')
})

test('active renewal preserves remaining time and duplicate verification grants nothing extra', async () => {
  const expiry = new Date(Date.now() + 10 * 86400000)
  state.subscription.status = 'active'
  state.subscription.nextBilling = expiry
  await verifyCheckout(user, 'ref')
  await verifyCheckout(user, 'ref')
  expect(state.subscription.nextBilling.getTime()).toBe(expiry.getTime() + 30 * 86400000)
  expect(state.activities).toHaveLength(1)
})

test('fulfillment failure rolls back payment and subscription, allowing retry', async () => {
  failActivity = true
  await expect(verifyCheckout(user, 'ref')).rejects.toThrow('activity failed')
  expect(state.payment.status).toBe('pending')
  expect(state.subscription.status).toBe('expired')
  failActivity = false
  await verifyCheckout(user, 'ref')
  expect(state.subscription.status).toBe('active')
})

test('new purchase creates an active subscription', async () => {
  state.subscription = null
  await verifyCheckout(user, 'ref')
  expect(state.subscription.status).toBe('active')
  expect(state.payment.subscriptionId).toBe(state.subscription.id)
})

test('serialization conflicts retry without duplicating fulfillment', async () => {
  conflicts = 2
  await verifyCheckout(user, 'ref')
  expect(state.activities).toHaveLength(1)
  expect(state.payment.status).toBe('success')
})

test('legacy success without a subscription link is reported for reconciliation', async () => {
  state.payment.status = 'success'
  const result = await verifyCheckout(user, 'ref')
  expect('error' in result).toBe(true)
  expect(state.subscription.status).toBe('expired')
})
