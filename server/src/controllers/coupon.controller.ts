import type { Response } from 'express'
import {
  createCoupon,
  deleteCoupon,
  evaluateCoupon,
  listCoupons,
  updateCoupon,
} from '../services/coupon.service.ts'
import { findService, normalizeMonths } from '../services/subscription.service.ts'
import { getPlatformFee } from '../services/settings.service.ts'
import type { AuthenticatedRequest } from '../types.ts'

export async function validateCouponController(req: AuthenticatedRequest, res: Response) {
  const code = typeof req.body?.code === 'string' ? req.body.code : ''
  if (!code.trim()) {
    res.status(400).json({ message: 'Coupon code is required' })
    return
  }

  let subtotal = 0
  const serviceValue = req.body?.serviceId || req.body?.slug
  if (serviceValue) {
    const service = await findService(serviceValue)
    if (!service) {
      res.status(404).json({ message: 'Service not found' })
      return
    }
    subtotal = service.price * normalizeMonths(req.body?.months)
  } else {
    subtotal = Math.max(0, Math.floor(Number(req.body?.amount) || 0))
  }

  const platformFee = await getPlatformFee()
  const evaluation = await evaluateCoupon(code, subtotal, req.auth?.sub)

  if (!evaluation.valid) {
    res.status(400).json({ ...evaluation, subtotal, platformFee, total: subtotal + platformFee })
    return
  }

  res.json({
    ...evaluation,
    subtotal,
    platformFee,
    total: Math.max(0, subtotal - evaluation.discount) + platformFee,
  })
}

export async function listCouponsController(_req: AuthenticatedRequest, res: Response) {
  const coupons = await listCoupons()
  res.json({ coupons })
}

export async function createCouponController(req: AuthenticatedRequest, res: Response) {
  const result = await createCoupon(req.body || {})
  if ('error' in result) {
    res.status(400).json({ message: result.error })
    return
  }
  res.status(201).json(result)
}

export async function updateCouponController(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id || '')
  const result = await updateCoupon(id, req.body || {})
  if ('error' in result) {
    res.status(400).json({ message: result.error })
    return
  }
  res.json(result)
}

export async function deleteCouponController(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id || '')
  const result = await deleteCoupon(id)
  if ('error' in result) {
    res.status(404).json({ message: result.error })
    return
  }
  res.json(result)
}
