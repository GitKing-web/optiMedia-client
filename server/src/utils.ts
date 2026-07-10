import { randomUUID } from 'node:crypto'

export function nowIso() {
  return new Date().toISOString()
}

export function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
}

export function money(amount: number) {
  return `₦${amount.toLocaleString()}`
}

export function createId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function normalizeWhatsApp(value: string) {
  return value.replace(/[^\d+]/g, '')
}

export function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, '')
}
