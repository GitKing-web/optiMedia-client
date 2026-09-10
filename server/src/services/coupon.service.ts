import { prisma } from '../db/prisma.ts'
import { createId } from '../utils.ts'

export type CouponTypeValue = 'percentage' | 'fixed'

export interface CouponInput {
  code?: string
  type?: string
  value?: number
  active?: boolean
  minAmount?: number | null
  maxUses?: number | null
  expiresAt?: string | null
}

interface CouponRecord {
  id: string
  code: string
  type: string
  value: number
  active: boolean
  minAmount: number | null
  maxUses: number | null
  usedCount: number
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function serialize(coupon: CouponRecord) {
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type as CouponTypeValue,
    value: coupon.value,
    active: coupon.active,
    minAmount: coupon.minAmount,
    maxUses: coupon.maxUses,
    usedCount: coupon.usedCount,
    expiresAt: coupon.expiresAt?.toISOString() || null,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  }
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

function computeDiscount(coupon: { type: string; value: number }, amount: number) {
  if (coupon.type === 'percentage') {
    const pct = Math.min(Math.max(coupon.value, 0), 100)
    return Math.min(Math.floor((amount * pct) / 100), amount)
  }
  return Math.min(Math.max(coupon.value, 0), amount)
}

export async function listCoupons() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return coupons.map((c) => serialize(c as CouponRecord))
}

export async function createCoupon(input: CouponInput) {
  const code = normalizeCode(input.code || '')
  if (!code) return { error: 'Coupon code is required' }

  const type = input.type === 'fixed' ? 'fixed' : 'percentage'
  const value = Math.floor(Number(input.value))
  if (!Number.isFinite(value) || value <= 0) return { error: 'Coupon value must be greater than 0' }
  if (type === 'percentage' && value > 100) return { error: 'Percentage cannot exceed 100' }

  const existing = await prisma.coupon.findUnique({ where: { code } })
  if (existing) return { error: 'A coupon with this code already exists' }

  const coupon = await prisma.coupon.create({
    data: {
      id: createId('cpn'),
      code,
      type,
      value,
      active: input.active ?? true,
      minAmount: input.minAmount != null ? Math.max(0, Math.floor(Number(input.minAmount))) : null,
      maxUses: input.maxUses != null ? Math.max(1, Math.floor(Number(input.maxUses))) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  })

  return { coupon: serialize(coupon as CouponRecord) }
}

export async function updateCoupon(id: string, input: CouponInput) {
  const existing = await prisma.coupon.findUnique({ where: { id } })
  if (!existing) return { error: 'Coupon not found' }

  const data: Record<string, unknown> = {}

  if (input.code !== undefined) {
    const code = normalizeCode(input.code)
    if (!code) return { error: 'Coupon code cannot be empty' }
    const clash = await prisma.coupon.findUnique({ where: { code } })
    if (clash && clash.id !== id) return { error: 'A coupon with this code already exists' }
    data.code = code
  }

  if (input.type !== undefined) data.type = input.type === 'fixed' ? 'fixed' : 'percentage'

  if (input.value !== undefined) {
    const value = Math.floor(Number(input.value))
    if (!Number.isFinite(value) || value <= 0) return { error: 'Coupon value must be greater than 0' }
    const type = (data.type as string) || existing.type
    if (type === 'percentage' && value > 100) return { error: 'Percentage cannot exceed 100' }
    data.value = value
  }

  if (input.active !== undefined) data.active = Boolean(input.active)
  if (input.minAmount !== undefined) {
    data.minAmount = input.minAmount != null ? Math.max(0, Math.floor(Number(input.minAmount))) : null
  }
  if (input.maxUses !== undefined) {
    data.maxUses = input.maxUses != null ? Math.max(1, Math.floor(Number(input.maxUses))) : null
  }
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null

  const coupon = await prisma.coupon.update({ where: { id }, data })
  return { coupon: serialize(coupon as CouponRecord) }
}

export async function deleteCoupon(id: string) {
  const existing = await prisma.coupon.findUnique({ where: { id } })
  if (!existing) return { error: 'Coupon not found' }
  await prisma.coupon.delete({ where: { id } })
  return { message: 'Coupon deleted' }
}

export interface CouponEvaluation {
  valid: boolean
  code: string
  type?: CouponTypeValue
  value?: number
  discount: number
  message: string
}

export async function evaluateCoupon(code: string, amount: number): Promise<CouponEvaluation> {
  const normalized = normalizeCode(code)
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } })

  if (!coupon) return { valid: false, code: normalized, discount: 0, message: 'Invalid coupon code' }
  if (!coupon.active) return { valid: false, code: normalized, discount: 0, message: 'This coupon is no longer active' }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { valid: false, code: normalized, discount: 0, message: 'This coupon has expired' }
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, code: normalized, discount: 0, message: 'This coupon has reached its usage limit' }
  }
  if (coupon.minAmount != null && amount < coupon.minAmount) {
    return {
      valid: false,
      code: normalized,
      discount: 0,
      message: `This coupon requires a minimum order of ₦${coupon.minAmount.toLocaleString()}`,
    }
  }

  const discount = computeDiscount({ type: coupon.type, value: coupon.value }, amount)
  return {
    valid: true,
    code: normalized,
    type: coupon.type as CouponTypeValue,
    value: coupon.value,
    discount,
    message: `Coupon applied: ₦${discount.toLocaleString()} off`,
  }
}

export async function incrementCouponUsage(code: string) {
  const normalized = normalizeCode(code)
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } })
  if (!coupon) return
  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { increment: 1 } },
  })
}
