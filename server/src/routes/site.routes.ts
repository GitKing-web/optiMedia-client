import { Router } from 'express'
import {
  adminSiteController,
  paymentWebhooksController,
  publicSiteController,
  updateAccountController,
  updateSiteController,
} from '../controllers/site.controller.ts'
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.get('/site', publicSiteController)

router.get('/admin/site', requireAuth, requireAdmin, adminSiteController)
router.put('/admin/site', requireAuth, requireAdmin, updateSiteController)
router.post('/admin/account', requireAuth, requireAdmin, updateAccountController)
router.get('/admin/payment-webhooks', requireAuth, requireAdmin, paymentWebhooksController)

export default router
