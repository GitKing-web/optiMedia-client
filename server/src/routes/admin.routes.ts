import { Router } from 'express'
import {
  activateAdminUserController,
  adminRecipientsController,
  adminStatsController,
  adminUserController,
  adminUserDetailController,
  adminUsersController,
  bulkActivateController,
  exportCSVController,
  getSettingsController,
  revenueStatsController,
  sendEmailController,
  subscriptionLogsController,
  updateSettingsController,
} from '../controllers/admin.controller.ts'
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.get('/stats', requireAuth, requireAdmin, adminStatsController)
router.get('/users', requireAuth, requireAdmin, adminUsersController)
router.get('/recipients', requireAuth, requireAdmin, adminRecipientsController)
router.get('/users/:userId', requireAuth, requireAdmin, adminUserController)
router.get('/users/:userId/detail', requireAuth, requireAdmin, adminUserDetailController)
router.post('/users/:userId/activate', requireAuth, requireAdmin, activateAdminUserController)
router.post('/users/bulk-activate', requireAuth, requireAdmin, bulkActivateController)
router.get('/revenue', requireAuth, requireAdmin, revenueStatsController)
router.get('/logs', requireAuth, requireAdmin, subscriptionLogsController)
router.get('/export/csv', requireAuth, requireAdmin, exportCSVController)
router.post('/send-email', requireAuth, requireAdmin, sendEmailController)
router.get('/settings', requireAuth, requireAdmin, getSettingsController)
router.put('/settings', requireAuth, requireAdmin, updateSettingsController)

export default router
