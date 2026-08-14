import { Router } from 'express'
import { initializePaystackController, verifyPaystackController, paystackWebhookController } from '../controllers/payment.controller.ts'
import { requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.post('/payments/paystack/initialize', requireAuth, initializePaystackController)
router.get('/payments/paystack/verify/:reference', requireAuth, verifyPaystackController)
router.post('/payments/paystack/webhook', paystackWebhookController)

export default router
