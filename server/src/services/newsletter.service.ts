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
    // Re-activate previously unsubscribed emails and idempotently confirm subscription.
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

export async function listNewsletterSubscribers() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return subscribers.map((s) => ({
    id: s.id,
    email: s.email,
    active: s.active,
    createdAt: s.createdAt.toISOString(),
  }))
}

export async function removeNewsletterSubscriber(id: string) {
  await prisma.newsletterSubscriber.delete({ where: { id } })
  return { message: 'Subscriber removed.' }
}
