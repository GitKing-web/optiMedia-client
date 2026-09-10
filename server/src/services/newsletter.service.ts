import { prisma } from '../db/prisma.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeNewsletterEmail(value: string) {
  return value.trim().toLowerCase()
}

export async function subscribeToNewsletter(email: string) {
  const normalized = normalizeNewsletterEmail(email)
  if (!EMAIL_RE.test(normalized)) {
    return { error: 'A valid email address is required.' }
  }

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalized },
  })

  if (existing) {
    if (!existing.active) {
      await prisma.newsletterSubscriber.update({
        where: { email: normalized },
        data: { active: true },
      })
      return { message: 'You have been re-subscribed to our newsletter.' }
    }
    return { message: 'You are already subscribed to our newsletter.' }
  }

  await prisma.newsletterSubscriber.create({
    data: { email: normalized },
  })

  return { message: 'Subscribed successfully. Welcome to the Optimedia newsletter!' }
}

export async function listNewsletterSubscribers(options: { search?: string; page?: unknown; pageSize?: unknown } = {}) {
  const search = (options.search || '').trim().toLowerCase()
  const page = Math.max(1, Math.floor(Number(options.page) || 1))
  const pageSize = Math.min(100, Math.max(1, Math.floor(Number(options.pageSize) || 10)))

  const where = search ? { email: { contains: search, mode: 'insensitive' as const } } : {}

  const [total, subscribers] = await Promise.all([
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    subscribers: subscribers.map((s) => ({
      id: s.id,
      email: s.email,
      active: s.active,
      createdAt: s.createdAt.toISOString(),
    })),
    pagination: { total, page: Math.min(page, totalPages), pageSize, totalPages },
  }
}

export async function removeNewsletterSubscriber(id: string) {
  await prisma.newsletterSubscriber.delete({ where: { id } })
  return { message: 'Subscriber removed.' }
}
