import { Router } from 'express'
import {
  getDashboardController,
  getSubscriptionsController,
  requestSubscriptionController,
  updateSubscriptionStatusController,
} from '../controllers/subscription.controller.ts'
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.get('/dashboard', requireAuth, getDashboardController)
router.get('/subscriptions', requireAuth, getSubscriptionsController)
router.post('/subscriptions/request', requireAuth, requestSubscriptionController)
router.patch(
  '/subscriptions/:subscriptionId/status',
  requireAuth,
  requireAdmin,
  updateSubscriptionStatusController,
)

export default router
