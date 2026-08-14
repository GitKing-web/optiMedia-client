import { Router } from 'express'
import {
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  registerController,
  resetPasswordController,
  sendOtpController,
  verifyEmailController,
} from '../controllers/auth.controller.ts'
import { requireAuth } from '../middleware/auth.middleware.ts'
import { authRateLimiter, loginRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimit.ts'

const router = Router()

router.post('/register', authRateLimiter, registerController)
router.post('/login', loginRateLimiter, loginController)
router.post('/forgot-password', passwordResetRateLimiter, forgotPasswordController)
router.post('/reset-password', passwordResetRateLimiter, resetPasswordController)
router.post('/send-otp', requireAuth, authRateLimiter, sendOtpController)
router.post('/verify-email', authRateLimiter, verifyEmailController)
router.get('/me', requireAuth, meController)
router.post('/logout', requireAuth, logoutController)

export default router
