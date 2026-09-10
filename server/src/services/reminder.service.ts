import { prisma } from '../db/prisma.ts'
import { getClientUrl } from '../config.ts'
import {
  isEmailConfigured,
  sendExpiryNoticeEmail,
  sendExpiryReminderEmail,
  sendWelcomeEmail,
} from './email.service.ts'

const DAY_MS = 24 * 60 * 60 * 1000
const REMINDER_WINDOW_DAYS = 3
const EXPIRY_GRACE_DAYS = 7

function renewUrlFor(serviceSlug: string) {
  return `${getClientUrl()}/subscriptions/${serviceSlug}`
}

function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / DAY_MS)
}

export async function sendSubscriptionWelcomeEmail(subscriptionId: string) {
  if (!isEmailConfigured()) return

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true, service: true },
  })

  if (!subscription || subscription.welcomeEmailSentAt) return

  try {
    await sendWelcomeEmail(subscription.user.email, {
      name: subscription.user.name,
      serviceName: subscription.service.name,
      months: subscription.months,
      expiresAt: subscription.nextBilling,
      renewUrl: renewUrlFor(subscription.service.slug),
    })

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { welcomeEmailSentAt: new Date() },
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

export async function runSubscriptionReminders() {
  if (!isEmailConfigured()) {
    return { skipped: true, reason: 'Email not configured' }
  }

  const now = new Date()
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * DAY_MS)
  const graceStart = new Date(now.getTime() - EXPIRY_GRACE_DAYS * DAY_MS)

  const due = await prisma.subscription.findMany({
    where: {
      status: 'active',
      nextBilling: { not: null, lte: windowEnd, gte: graceStart },
    },
    include: { user: true, service: true },
  })

  let reminders = 0
  let notices = 0

  for (const subscription of due) {
    if (!subscription.nextBilling) continue

    const remaining = daysUntil(subscription.nextBilling)
    const context = {
      name: subscription.user.name,
      serviceName: subscription.service.name,
      expiresAt: subscription.nextBilling,
      renewUrl: renewUrlFor(subscription.service.slug),
    }

    try {
      if (remaining <= 0) {
        if (!subscription.expiryNoticeSentAt) {
          await sendExpiryNoticeEmail(subscription.user.email, context)
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              expiryNoticeSentAt: new Date(),
              status: 'expired',
            },
          })
          notices++
        }
      } else if (remaining <= REMINDER_WINDOW_DAYS && !subscription.reminder3dSentAt) {
        await sendExpiryReminderEmail(subscription.user.email, { ...context, daysLeft: remaining })
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { reminder3dSentAt: new Date() },
        })
        reminders++
      }
    } catch (error) {
      console.error(`Failed to send retention email for subscription ${subscription.id}:`, error)
    }
  }

  return { reminders, notices, scanned: due.length }
}

let reminderTimer: ReturnType<typeof setInterval> | null = null

export function startReminderScheduler(intervalMs = 60 * 60 * 1000) {
  if (process.env.REMINDERS_ENABLED === 'false') {
    console.log('Reminder scheduler disabled (REMINDERS_ENABLED=false)')
    return
  }

  if (reminderTimer) return

  const run = () => {
    runSubscriptionReminders().catch((error) => {
      console.error('Reminder job failed:', error)
    })
  }

  setTimeout(run, 10 * 1000)
  reminderTimer = setInterval(run, intervalMs)

  if (typeof reminderTimer.unref === 'function') {
    reminderTimer.unref()
  }

  console.log('Reminder scheduler started')
}
