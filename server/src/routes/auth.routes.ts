import { Router } from 'express'
import {
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  registerController,
  resetPasswordController,
} from '../controllers/auth.controller.ts'
import { requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.post('/register', registerController)
router.post('/login', loginController)
router.post('/forgot-password', forgotPasswordController)
router.post('/reset-password', resetPasswordController)
router.get('/me', requireAuth, meController)
router.post('/logout', requireAuth, logoutController)

export default router
