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
import { authRateLimiter, loginRateLimiter, otpRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimit.ts'

const router = Router()

router.post('/register', authRateLimiter, registerController)
router.post('/login', loginRateLimiter, loginController)
router.post('/forgot-password', passwordResetRateLimiter, forgotPasswordController)
router.post('/reset-password', passwordResetRateLimiter, resetPasswordController)
router.post('/send-otp', otpRateLimiter, sendOtpController)
router.post('/verify-email', otpRateLimiter, verifyEmailController)
router.get('/me', requireAuth, meController)
router.post('/logout', requireAuth, logoutController)

export default router
