import { Router } from 'express'
import {
  createCouponController,
  deleteCouponController,
  listCouponsController,
  updateCouponController,
  validateCouponController,
} from '../controllers/coupon.controller.ts'
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.post('/coupons/validate', requireAuth, validateCouponController)

router.get('/admin/coupons', requireAuth, requireAdmin, listCouponsController)
router.post('/admin/coupons', requireAuth, requireAdmin, createCouponController)
router.patch('/admin/coupons/:id', requireAuth, requireAdmin, updateCouponController)
router.delete('/admin/coupons/:id', requireAuth, requireAdmin, deleteCouponController)

export default router
