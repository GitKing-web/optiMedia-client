import { Router } from 'express'
import {
  flutterwaveWebhookController,
  initializePaymentController,
  paystackWebhookController,
  verifyPaymentController,
} from '../controllers/payment.controller.ts'
import { requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

// Generic (provider-agnostic) endpoints — the active provider is chosen in admin settings.
router.post('/payments/initialize', requireAuth, initializePaymentController)
router.get('/payments/verify/:reference', requireAuth, verifyPaymentController)

// Provider webhooks (signatures validated per provider).
router.post('/payments/webhook/paystack', paystackWebhookController)
router.post('/payments/webhook/flutterwave', flutterwaveWebhookController)

// Back-compat aliases for the previous Paystack-specific routes.
router.post('/payments/paystack/initialize', requireAuth, initializePaymentController)
router.get('/payments/paystack/verify/:reference', requireAuth, verifyPaymentController)
router.post('/payments/paystack/webhook', paystackWebhookController)

export default router
