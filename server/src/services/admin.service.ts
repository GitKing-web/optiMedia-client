import { Resend } from 'resend'
import { prisma } from '../db/prisma.ts'
import { money } from '../utils.ts'
import type { AdminRow } from '../types.ts'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

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

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        include: { service: true },
        orderBy: { createdAt: 'desc' },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt.toISOString(),
    subscriptions: user.subscriptions.map((s) => ({
      id: s.id,
      serviceName: s.service.name,
      status: s.status,
      price: s.price,
      icon: s.icon,
      activeDate: s.activeDate?.toISOString() || null,
      nextBilling: s.nextBilling?.toISOString() || null,
      createdAt: s.createdAt.toISOString(),
    })),
    payments: user.payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: p.amount,
      status: p.status,
      gateway: p.gateway,
      paidAt: p.paidAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
    })),
    activities: user.activities.map((a) => ({
      id: a.id,
      type: a.type,
      service: a.service,
      amount: a.amount,
      status: a.status,
      date: a.date,
      createdAt: a.createdAt.toISOString(),
    })),
  }
}

export async function bulkActivateUsers(userIds: string[]) {
  const results: { userId: string; success: boolean; error?: string }[] = []

  for (const userId of userIds) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            include: { service: true },
            where: { status: 'pending' },
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!user) {
        results.push({ userId, success: false, error: 'User not found' })
        continue
      }

      const pending = user.subscriptions[0]
      if (!pending) {
        results.push({ userId, success: false, error: 'No pending subscription' })
        continue
      }

      const startDate = new Date()
      const expireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      await prisma.subscription.update({
        where: { id: pending.id },
        data: { status: 'active', activeDate: startDate, durationDays: 30, nextBilling: expireDate },
      })

      await prisma.activity.create({
        data: {
          userId,
          type: 'payment',
          service: `${pending.service.name} Renewal`,
          amount: money(pending.price),
          status: 'Completed',
          date: 'Just now',
          icon: 'fa-solid fa-credit-card',
        },
      })

      results.push({ userId, success: true })
    } catch (e) {
      results.push({ userId, success: false, error: String(e) })
    }
  }

  return results
}

export async function getRevenueStats() {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const payments = await prisma.payment.findMany({
    where: {
      status: 'success',
      paidAt: { gte: sixMonthsAgo },
    },
    orderBy: { paidAt: 'asc' },
  })

  const monthlyMap = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, 0)
  }

  for (const p of payments) {
    if (!p.paidAt) continue
    const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + p.amount)
    }
  }

  const months = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({ month, revenue }))

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

  return { months, totalRevenue }
}

export async function getSubscriptionLogs() {
  const activities = await prisma.activity.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return activities.map((a) => ({
    id: a.id,
    userName: a.user.name,
    userEmail: a.user.email,
    type: a.type,
    service: a.service,
    amount: a.amount,
    status: a.status,
    date: a.date,
    createdAt: a.createdAt.toISOString(),
  }))
}

export async function exportUsersCSV() {
  const users = await prisma.user.findMany({
    include: {
      subscriptions: {
        include: { service: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const rows = users.map((u) => {
    const sub = u.subscriptions[0]
    return {
      Name: u.name,
      Email: u.email,
      WhatsApp: u.whatsapp,
      Role: u.role,
      Service: sub?.service.name || 'None',
      Status: sub?.status || 'none',
      Price: sub?.price ? `₦${sub.price.toLocaleString()}` : '',
      ActiveDate: sub?.activeDate?.toISOString() || '',
      ExpireDate: sub?.nextBilling?.toISOString() || '',
      Joined: u.createdAt.toISOString(),
    }
  })

  const headers = Object.keys(rows[0] || {})
  const csvLines = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = String((r as Record<string, string>)[h] || '')
        return v.includes(',') ? `"${v}"` : v
      }).join(','),
    ),
  ]

  return csvLines.join('\n')
}

export async function sendEmailBroadcast(payload: { subject: string; html: string; userIds?: string[] }) {
  if (!resend) {
    return { error: 'Resend is not configured. Set RESEND_API_KEY.' }
  }

  let users
  if (payload.userIds && payload.userIds.length > 0) {
    users = await prisma.user.findMany({
      where: { id: { in: payload.userIds } },
      select: { email: true, name: true },
    })
  } else {
    users = await prisma.user.findMany({
      select: { email: true, name: true },
    })
  }

  const emails = users.map((u) => u.email).filter(Boolean) as string[]
  if (emails.length === 0) {
    return { error: 'No recipients found.' }
  }

  const errors: string[] = []
  let sent = 0

  for (const email of emails) {
    try {
      await resend.emails.send({
        from: 'OptiMedia <noreply@optimedia.local>',
        to: [email],
        subject: payload.subject,
        html: payload.html,
      })
      sent++
    } catch {
      errors.push(email)
    }
  }

  return { sent, failed: errors.length, total: emails.length }
}
