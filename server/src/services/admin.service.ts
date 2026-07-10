import { prisma } from '../db/prisma.ts'
import { money } from '../utils.ts'
import type { AdminRow, AuthUser } from '../types.ts'

function daysRemaining(expireDate?: Date | null) {
  if (!expireDate) return 0
  const diff = expireDate.getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function toAdminRow(user: {
  id: string
  name: string
  email: string
  whatsapp: string
  subscriptions: {
    status: string
    price: number
    icon: string
    service: { name: string }
    activeDate: Date | null
    nextBilling: Date | null
  }[]
}): AdminRow {
  const prioritizedSubscription =
    user.subscriptions.find((subscription) => subscription.status === 'active') ||
    user.subscriptions.find((subscription) => subscription.status === 'pending') ||
    user.subscriptions[0]

  if (!prioritizedSubscription) {
    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      whatsappContact: user.whatsapp,
      serviceName: 'None',
      status: 'none',
      price: 0,
      icon: 'fa-solid fa-ban',
    }
  }

  return {
    userId: user.id,
    authUserId: user.id,
    userName: user.name,
    userEmail: user.email,
    whatsappContact: user.whatsapp,
    serviceName: prioritizedSubscription.service.name,
    status: prioritizedSubscription.status as AdminRow['status'],
    price: prioritizedSubscription.price,
    icon: prioritizedSubscription.icon,
    startDate: prioritizedSubscription.activeDate?.toISOString(),
    expireDate: prioritizedSubscription.nextBilling?.toISOString(),
  }
}

export async function buildAdminSummary() {
  const [totalUsers, pendingCount, activeCount, expiringCount] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'pending' } }),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({
      where: {
        status: 'active',
        nextBilling: {
          gte: new Date(),
          lte: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  return {
    totalUsers,
    activeCount,
    pendingCount,
    expiringCount,
  }
}

export async function filterAdminUsers(tab: string) {
  const users = await prisma.user.findMany({
    include: {
      subscriptions: {
        include: { service: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const rows = users.map(toAdminRow)

  switch (tab.toLowerCase()) {
    case 'pending':
      return rows.filter((row) => row.status === 'pending')
    case 'active':
      return rows.filter((row) => row.status === 'active')
    case 'expiring':
      return rows.filter((row) => {
        const remaining = daysRemaining(row.expireDate ? new Date(row.expireDate) : null)
        return remaining > 0 && remaining <= 10
      })
    default:
      return rows
  }
}

export async function activateAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        include: { service: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) {
    return { error: 'User row not found' }
  }

  const pendingSubscription = user.subscriptions.find((subscription) => subscription.status === 'pending')
  if (!pendingSubscription) {
    return { error: 'Only pending subscriptions can be activated' }
  }

  const startDate = new Date()
  const expireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.subscription.update({
    where: { id: pendingSubscription.id },
    data: {
      status: 'active',
      activeDate: startDate,
      durationDays: 30,
      nextBilling: expireDate,
    },
  })

  await prisma.activity.create({
    data: {
      userId: user.id,
      type: 'payment',
      service: `${pendingSubscription.service.name} Renewal`,
      amount: money(pendingSubscription.price),
      status: 'Completed',
      date: 'Just now',
      icon: 'fa-solid fa-credit-card',
    },
  })

  return {
    row: {
      userId: user.id,
      authUserId: user.id,
      userName: user.name,
      userEmail: user.email,
      whatsappContact: user.whatsapp,
      serviceName: pendingSubscription.service.name,
      status: 'active',
      price: pendingSubscription.price,
      icon: pendingSubscription.icon,
      startDate: startDate.toISOString(),
      expireDate: expireDate.toISOString(),
    } satisfies AdminRow,
  }
}

export async function findAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        include: { service: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) {
    return null
  }

  return toAdminRow(user)
}
