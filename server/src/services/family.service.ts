import { prisma } from '../db/prisma.ts'
import { createId } from '../utils.ts'

type FamilySlotStatusValue = 'vacant' | 'occupied' | 'expired'

interface FamilyAccountInput {
  label?: string
  serviceName?: string
  masterEmail?: string
  masterPassword?: string | null
  capacity?: number
  monthlyCost?: number | null
  renewalDate?: string | null
  notes?: string | null
}

interface FamilySlotInput {
  memberName?: string
  memberEmail?: string
  memberContact?: string
  months?: number
  expireDate?: string | null
  notes?: string | null
}

const MAX_CAPACITY = 50
const DEFAULT_CAPACITY = 6

function normalizeCapacity(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 1) return DEFAULT_CAPACITY
  return Math.min(Math.floor(numeric), MAX_CAPACITY)
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function daysFromMonths(months: number) {
  return months * 30
}

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000)
}

/** Effective status: an occupied slot past its expiry reads as expired. */
function effectiveStatus(status: string, expireDate: Date | null): FamilySlotStatusValue {
  if (status === 'occupied' && expireDate && expireDate.getTime() < Date.now()) {
    return 'expired'
  }
  return status as FamilySlotStatusValue
}

function serializeAccount(account: {
  id: string
  label: string
  serviceName: string
  masterEmail: string
  masterPassword: string | null
  capacity: number
  monthlyCost: number | null
  renewalDate: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  slots: {
    id: string
    slotNumber: number
    memberName: string | null
    memberEmail: string | null
    memberContact: string | null
    status: string
    startDate: Date | null
    expireDate: Date | null
    notes: string | null
  }[]
}) {
  const slots = [...account.slots]
    .sort((a, b) => a.slotNumber - b.slotNumber)
    .map((slot) => ({
      id: slot.id,
      slotNumber: slot.slotNumber,
      memberName: slot.memberName,
      memberEmail: slot.memberEmail,
      memberContact: slot.memberContact,
      status: effectiveStatus(slot.status, slot.expireDate),
      startDate: slot.startDate?.toISOString() || null,
      expireDate: slot.expireDate?.toISOString() || null,
      notes: slot.notes,
    }))

  const occupied = slots.filter((slot) => slot.status === 'occupied').length
  const expired = slots.filter((slot) => slot.status === 'expired').length
  const vacant = slots.filter((slot) => slot.status === 'vacant').length

  return {
    id: account.id,
    label: account.label,
    serviceName: account.serviceName,
    masterEmail: account.masterEmail,
    masterPassword: account.masterPassword,
    capacity: account.capacity,
    monthlyCost: account.monthlyCost,
    renewalDate: account.renewalDate?.toISOString() || null,
    notes: account.notes,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    slots,
    summary: {
      capacity: account.capacity,
      occupied,
      expired,
      vacant,
      utilization: account.capacity > 0 ? Math.round((occupied / account.capacity) * 100) : 0,
    },
  }
}

export async function listFamilyAccounts() {
  const accounts = await prisma.familyAccount.findMany({
    include: { slots: true },
    orderBy: { createdAt: 'desc' },
  })

  return accounts.map(serializeAccount)
}

export async function createFamilyAccount(input: FamilyAccountInput) {
  const label = (input.label || '').trim()
  const serviceName = (input.serviceName || '').trim()
  const masterEmail = (input.masterEmail || '').trim()

  if (!label || !serviceName || !masterEmail) {
    return { error: 'label, serviceName and masterEmail are required' }
  }

  const capacity = normalizeCapacity(input.capacity)

  const account = await prisma.familyAccount.create({
    data: {
      id: createId('fam'),
      label,
      serviceName,
      masterEmail,
      masterPassword: input.masterPassword || null,
      capacity,
      monthlyCost: typeof input.monthlyCost === 'number' ? input.monthlyCost : null,
      renewalDate: toDate(input.renewalDate),
      notes: input.notes || null,
      slots: {
        create: Array.from({ length: capacity }, (_, index) => ({
          id: createId('slot'),
          slotNumber: index + 1,
          status: 'vacant',
        })),
      },
    },
    include: { slots: true },
  })

  return { account: serializeAccount(account) }
}

export async function updateFamilyAccount(id: string, input: FamilyAccountInput) {
  const existing = await prisma.familyAccount.findUnique({ where: { id }, include: { slots: true } })
  if (!existing) {
    return { error: 'Family account not found' }
  }

  const data: Record<string, unknown> = {}
  if (typeof input.label === 'string' && input.label.trim()) data.label = input.label.trim()
  if (typeof input.serviceName === 'string' && input.serviceName.trim()) data.serviceName = input.serviceName.trim()
  if (typeof input.masterEmail === 'string' && input.masterEmail.trim()) data.masterEmail = input.masterEmail.trim()
  if (input.masterPassword !== undefined) data.masterPassword = input.masterPassword || null
  if (input.notes !== undefined) data.notes = input.notes || null
  if (input.monthlyCost !== undefined) data.monthlyCost = typeof input.monthlyCost === 'number' ? input.monthlyCost : null
  if (input.renewalDate !== undefined) data.renewalDate = toDate(input.renewalDate)

  if (input.capacity !== undefined) {
    const capacity = normalizeCapacity(input.capacity)
    data.capacity = capacity

    const currentNumbers = new Set(existing.slots.map((slot) => slot.slotNumber))
    const missing = []
    for (let slotNumber = 1; slotNumber <= capacity; slotNumber++) {
      if (!currentNumbers.has(slotNumber)) missing.push(slotNumber)
    }

    if (missing.length > 0) {
      data.slots = {
        create: missing.map((slotNumber) => ({
          id: createId('slot'),
          slotNumber,
          status: 'vacant',
        })),
      }
    }

    const toRemove = existing.slots.filter((slot) => slot.slotNumber > capacity && slot.status === 'vacant')
    if (toRemove.length > 0) {
      await prisma.familySlot.deleteMany({ where: { id: { in: toRemove.map((slot) => slot.id) } } })
    }
  }

  const account = await prisma.familyAccount.update({
    where: { id },
    data,
    include: { slots: true },
  })

  return { account: serializeAccount(account) }
}

export async function deleteFamilyAccount(id: string) {
  const existing = await prisma.familyAccount.findUnique({ where: { id } })
  if (!existing) {
    return { error: 'Family account not found' }
  }

  await prisma.familyAccount.delete({ where: { id } })
  return { message: 'Family account deleted' }
}

export async function assignFamilySlot(accountId: string, slotId: string, input: FamilySlotInput) {
  const slot = await prisma.familySlot.findFirst({ where: { id: slotId, familyAccountId: accountId } })
  if (!slot) {
    return { error: 'Slot not found' }
  }

  const memberName = (input.memberName || '').trim()
  if (!memberName) {
    return { error: 'memberName is required' }
  }

  const months = Number(input.months)
  const startDate = new Date()
  const explicitExpiry = toDate(input.expireDate)
  const expireDate =
    explicitExpiry ||
    (Number.isFinite(months) && months > 0 ? addDays(startDate, daysFromMonths(months)) : addDays(startDate, 30))

  const updated = await prisma.familySlot.update({
    where: { id: slotId },
    data: {
      memberName,
      memberEmail: input.memberEmail?.trim() || null,
      memberContact: input.memberContact?.trim() || null,
      status: 'occupied',
      startDate,
      expireDate,
      notes: input.notes || null,
    },
  })

  return { slot: serializeSlot(updated) }
}

export async function vacateFamilySlot(accountId: string, slotId: string) {
  const slot = await prisma.familySlot.findFirst({ where: { id: slotId, familyAccountId: accountId } })
  if (!slot) {
    return { error: 'Slot not found' }
  }

  const updated = await prisma.familySlot.update({
    where: { id: slotId },
    data: {
      memberName: null,
      memberEmail: null,
      memberContact: null,
      status: 'vacant',
      startDate: null,
      expireDate: null,
      notes: null,
    },
  })

  return { slot: serializeSlot(updated), message: 'Slot freed' }
}

export async function extendFamilySlot(accountId: string, slotId: string, monthsInput: unknown) {
  const slot = await prisma.familySlot.findFirst({ where: { id: slotId, familyAccountId: accountId } })
  if (!slot) {
    return { error: 'Slot not found' }
  }

  const months = Number(monthsInput)
  const safeMonths = Number.isFinite(months) && months > 0 ? Math.min(Math.floor(months), 12) : 1
  const now = new Date()
  const base = slot.expireDate && slot.expireDate > now ? slot.expireDate : now

  const updated = await prisma.familySlot.update({
    where: { id: slotId },
    data: {
      status: 'occupied',
      expireDate: addDays(base, daysFromMonths(safeMonths)),
      startDate: slot.startDate || now,
    },
  })

  return { slot: serializeSlot(updated), message: `Extended by ${safeMonths} month(s)` }
}

export async function cleanupExpiredSlots(accountId: string) {
  const result = await prisma.familySlot.updateMany({
    where: {
      familyAccountId: accountId,
      status: 'occupied',
      expireDate: { lt: new Date() },
    },
    data: {
      memberName: null,
      memberEmail: null,
      memberContact: null,
      status: 'vacant',
      startDate: null,
      expireDate: null,
      notes: null,
    },
  })

  return { message: `Freed ${result.count} expired slot(s)`, freed: result.count }
}

function serializeSlot(slot: {
  id: string
  slotNumber: number
  memberName: string | null
  memberEmail: string | null
  memberContact: string | null
  status: string
  startDate: Date | null
  expireDate: Date | null
  notes: string | null
}) {
  return {
    id: slot.id,
    slotNumber: slot.slotNumber,
    memberName: slot.memberName,
    memberEmail: slot.memberEmail,
    memberContact: slot.memberContact,
    status: effectiveStatus(slot.status, slot.expireDate),
    startDate: slot.startDate?.toISOString() || null,
    expireDate: slot.expireDate?.toISOString() || null,
    notes: slot.notes,
  }
}
