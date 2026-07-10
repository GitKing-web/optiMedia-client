import { prisma } from '../db/prisma.ts'
import { addDays, createId, money } from '../utils.ts'
import type { AuthUser, Service, Subscription, SubscriptionStatus } from '../types.ts'

function serializeService(service: {
  id: string
  slug: string
  name: string
  price: number
  icon: string
  bg: string
  description: string
  features: string[]
}) {
  return service
}

export async function getAllServices() {
  return prisma.service.findMany({
    orderBy: { createdAt: 'asc' },
  })
}

export async function findService(value: string) {
  const normalized = value.trim().toLowerCase()

  return prisma.service.findFirst({
    where: {
      OR: [
        { id: normalized },
        { slug: normalized },
        { name: { equals: normalized, mode: 'insensitive' } },
        { name: { contains: normalized, mode: 'insensitive' } },
      ],
    },
  })
}

export function publicSubscription(subscription: Subscription & { service?: Service | null }) {
  return {
    ...subscription,
    service: subscription.service ? serializeService(subscription.service) : null,
  }
}

export async function getUserSubscriptions(userId: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { service: true },
  })

  return subscriptions.map((subscription) => ({
    ...subscription,
    service: serializeService(subscription.service),
  }))
}

export async function buildDashboard(user: AuthUser) {
  const [subscriptions, activities, services] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { service: true },
    }),
    prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    getAllServices(),
  ])

  const activeSubscriptions = subscriptions.filter((item) => item.status === 'active')
  const pendingSubscriptions = subscriptions.filter((item) => item.status === 'pending')
  const monthlySpend = activeSubscriptions.reduce((sum, item) => sum + item.price, 0)

  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp,
      role: user.role,
      avatar: user.avatar,
    },
    metrics: {
      monthlySpend,
      activeServices: activeSubscriptions.length,
      pendingRequests: pendingSubscriptions.length,
      financialHealth: monthlySpend > 0 ? 'Excellent' : 'New',
    },
    subscriptions: subscriptions.map((subscription) => ({
      ...subscription,
      service: serializeService(subscription.service),
    })),
    activities,
    services,
  }
}

export async function requestSubscription(user: AuthUser, service: Service) {
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      serviceId: service.id,
      status: { not: 'expired' },
    },
  })

  if (existingSubscription) {
    return { error: 'You already have a pending or active request for this service' }
  }

  const subscription = await prisma.subscription.create({
    data: {
      id: createId('sub'),
      userId: user.id,
      serviceId: service.id,
      status: 'pending',
      price: service.price,
      icon: service.icon,
      bg: service.bg,
    },
    include: { service: true },
  })

  await prisma.activity.create({
    data: {
      id: createId('act'),
      userId: user.id,
      type: 'subscription',
      service: `${service.name} Request`,
      amount: money(service.price),
      status: 'Pending',
      date: 'Just now',
      icon: service.icon,
    },
  })

  return {
    subscription: {
      ...subscription,
      service: serializeService(subscription.service),
    },
  }
}

export async function updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { service: true },
  })

  if (!subscription) {
    return { error: 'Subscription not found' }
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status,
      activeDate: status === 'active' ? new Date() : subscription.activeDate,
      durationDays: status === 'active' ? subscription.durationDays || 30 : subscription.durationDays,
      nextBilling:
        status === 'active'
          ? new Date(addDays(new Date(), subscription.durationDays || 30))
          : subscription.nextBilling,
    },
    include: { service: true },
  })

  return {
    subscription: {
      ...updated,
      service: serializeService(updated.service),
    },
  }
}
