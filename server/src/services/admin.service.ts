import { prisma } from '../db/prisma.ts'
import { money } from '../utils.ts'
import { getEmailSender, getReplyTo, getResend, htmlToPlainText, isEmailConfigured, wrapInEmailTemplate } from './email.service.ts'
import type { AdminRow } from '../types.ts'

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

function normalizePagination(page?: unknown, pageSize?: unknown) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1))
  const safeSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 10)))
  return { page: safePage, pageSize: safeSize }
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    pagination: { total, page: safePage, pageSize, totalPages },
  }
}

export async function filterAdminUsers(options: { tab?: string; search?: string; page?: unknown; pageSize?: unknown }) {
  const users = await prisma.user.findMany({
    include: {
      subscriptions: {
        include: { service: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  let rows = users.map(toAdminRow)

  const tab = (options.tab || 'all').toLowerCase()
  switch (tab) {
    case 'pending':
      rows = rows.filter((row) => row.status === 'pending')
      break
    case 'active':
      rows = rows.filter((row) => row.status === 'active')
      break
    case 'expiring':
      rows = rows.filter((row) => {
        const remaining = daysRemaining(row.expireDate ? new Date(row.expireDate) : null)
        return remaining > 0 && remaining <= 10
      })
      break
  }

  const search = (options.search || '').trim().toLowerCase()
  if (search) {
    rows = rows.filter((row) =>
      [row.userName, row.userEmail, row.whatsappContact, row.serviceName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    )
  }

  const { page, pageSize } = normalizePagination(options.page, options.pageSize)
  return paginate(rows, page, pageSize)
}

export async function getUserRecipients(search?: string) {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } })
  const term = (search || '').trim().toLowerCase()
  return users
    .filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
    .map((u) => ({
      userId: u.id,
      authUserId: u.id,
      userName: u.name,
      userEmail: u.email,
      whatsappContact: '',
      serviceName: '—',
      status: 'none' as const,
      price: 0,
      icon: 'fa-solid fa-user',
      role: u.role,
    }))
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

  const months = pendingSubscription.months || 1
  const durationDays = months * 30
  const startDate = new Date()
  const expireDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

  await prisma.subscription.update({
    where: { id: pendingSubscription.id },
    data: {
      status: 'active',
      activeDate: startDate,
      durationDays,
      nextBilling: expireDate,
    },
  })

  await prisma.activity.create({
    data: {
      userId: user.id,
      type: 'payment',
      service: `${pendingSubscription.service.name} Renewal`,
      amount: money(pendingSubscription.price * months),
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

      const months = pending.months || 1
      const durationDays = months * 30
      const startDate = new Date()
      const expireDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

      await prisma.subscription.update({
        where: { id: pending.id },
        data: { status: 'active', activeDate: startDate, durationDays, nextBilling: expireDate },
      })

      await prisma.activity.create({
        data: {
          userId,
          type: 'payment',
          service: `${pending.service.name} Renewal`,
          amount: money(pending.price * months),
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

export async function getSubscriptionLogs(options: { search?: string; page?: unknown; pageSize?: unknown } = {}) {
  const search = (options.search || '').trim().toLowerCase()

  const activities = await prisma.activity.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  let rows = activities.map((a) => ({
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

  if (search) {
    rows = rows.filter((row) =>
      [row.userName, row.userEmail, row.service, row.amount, row.status]
        .some((value) => String(value).toLowerCase().includes(search)),
    )
  }

  const { page, pageSize } = normalizePagination(options.page, options.pageSize)
  return paginate(rows, page, pageSize)
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
  if (!isEmailConfigured()) {
    return { error: 'Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.' }
  }

  const resend = getResend()!
  const from = getEmailSender()
  const replyTo = getReplyTo()
  const wrappedHtml = wrapInEmailTemplate(payload.html, payload.subject)
  const plainText = htmlToPlainText(payload.html)

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

  const recipients = users.filter((u) => u.email) as { email: string; name: string }[]
  if (recipients.length === 0) {
    return { error: 'No recipients found.' }
  }

  const BATCH_SIZE = 100
  let sent = 0
  const errors: string[] = []

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)

    const emailPayloads = batch.map((user) => ({
      from,
      to: [user.email],
      subject: payload.subject,
      html: wrappedHtml,
      text: plainText,
      replyTo: replyTo,
      headers: {
        'List-Unsubscribe': `<mailto:support@optimedia.solution.com?subject=unsubscribe>`,
        'X-Mailer': 'OptiMedia',
        'Precedence': 'bulk',
      },
    }))

    try {
      const result = await resend.batch.send(emailPayloads)
      if (result.data) {
        sent += batch.length
      } else {
        for (const user of batch) {
          errors.push(user.email)
        }
      }
    } catch {
      for (const user of batch) {
        errors.push(user.email)
      }
    }
  }

  return { sent, failed: errors.length, total: recipients.length }
}
