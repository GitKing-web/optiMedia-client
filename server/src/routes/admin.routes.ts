import { Router } from 'express'
import {
  activateAdminUserController,
  adminStatsController,
  adminUserController,
  adminUserDetailController,
  adminUsersController,
  bulkActivateController,
  exportCSVController,
  revenueStatsController,
  sendEmailController,
  subscriptionLogsController,
} from '../controllers/admin.controller.ts'
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.get('/stats', requireAuth, requireAdmin, adminStatsController)
router.get('/users', requireAuth, requireAdmin, adminUsersController)
router.get('/users/:userId', requireAuth, requireAdmin, adminUserController)
router.get('/users/:userId/detail', requireAuth, requireAdmin, adminUserDetailController)
router.post('/users/:userId/activate', requireAuth, requireAdmin, activateAdminUserController)
router.post('/users/bulk-activate', requireAuth, requireAdmin, bulkActivateController)
router.get('/revenue', requireAuth, requireAdmin, revenueStatsController)
router.get('/logs', requireAuth, requireAdmin, subscriptionLogsController)
router.get('/export/csv', requireAuth, requireAdmin, exportCSVController)
router.post('/send-email', requireAuth, requireAdmin, sendEmailController)

export default router
