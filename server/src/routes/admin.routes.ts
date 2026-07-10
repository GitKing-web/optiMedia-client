import { Router } from 'express'
import {
  activateAdminUserController,
  adminStatsController,
  adminUserController,
  adminUsersController,
} from '../controllers/admin.controller.ts'
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.get('/stats', requireAuth, requireAdmin, adminStatsController)
router.get('/users', requireAuth, requireAdmin, adminUsersController)
router.get('/users/:userId', requireAuth, requireAdmin, adminUserController)
router.post('/users/:userId/activate', requireAuth, requireAdmin, activateAdminUserController)

export default router
